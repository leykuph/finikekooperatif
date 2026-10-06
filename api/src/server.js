import http from "node:http";
import { pool, migrate, normalizeMemberNo } from "./db.js";
import { TkgmError, mahalleler, parsel as tkgmParsel } from "./tkgm.js";
import { createMember, isValidName, resetMember, setMemberActive, welcomeMessage } from "./members.js";
import {
  DUMMY_HASH, INITIAL_PASSWORD_MAX_FAILURES, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, initialPassword,
  hashPassword, hashToken, newSessionToken, verifyPassword,
} from "./auth.js";

const PORT = Number(process.env.PORT || 8787);
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || "https://finikekooperatifi.com").split(",").map((s) => s.trim()).filter(Boolean)
);
// Cloudflare Tunnel arkasında gerçek istemci IP'si "cf-connecting-ip" başlığındadır.
// Başlık yalnızca bu değişken ayarlıysa dikkate alınır; doğrudan erişimde taklit edilebilir.
const CLIENT_IP_HEADER = (process.env.CLIENT_IP_HEADER || "").toLowerCase();
const COOKIE_NAME = "finike_oturum";
const COOKIE_SECURE = process.env.COOKIE_SECURE !== "false";
const SESSION_DAYS = 30;
const MAX_BODY = 10 * 1024;
const TKGM_LOOKUPS_PER_HOUR = 60;
const MAX_PARCELS_PER_MEMBER = 200;
const MAX_TREE_GROUPS_PER_PARCEL = 50;
const CONTACT_PER_IP_PER_HOUR = 5;
const CONTACT_PER_DAY = 300;
// iletisim.html'deki konu seçenekleriyle aynı olmalı
const CONTACT_TOPICS = [
  "Sipariş ve kargo", "Toplu / Kurumsal alım", "Ağaç sahiplenme", "Hasat gönüllülüğü",
  "Tarif gönderme", 'Sahte "Finike" ürünü bildirimi', "Basın", "Diğer",
];

// ---------- Deneme sınırı (bellek içi; tek kopya çalıştığı için yeterli) ----------
const WINDOW_MS = 15 * 60 * 1000;
const LIMITS = { ip: 20, member: 8 };
const failures = new Map();

function tooManyAttempts(kind, key) {
  const e = failures.get(`${kind}:${key}`);
  return e && e.resetAt > Date.now() && e.count >= LIMITS[kind];
}
function recordFailure(kind, key) {
  const k = `${kind}:${key}`, now = Date.now();
  const e = failures.get(k);
  if (!e || e.resetAt <= now) failures.set(k, { count: 1, resetAt: now + WINDOW_MS });
  else e.count++;
}
// TKGM'ye ortak başına saatlik sorgu sınırı (servisi yormamak ve engellenmemek için)
const lookups = new Map();
function countLookup(memberId) {
  const now = Date.now(), e = lookups.get(memberId);
  if (!e || e.resetAt <= now) { lookups.set(memberId, { count: 1, resetAt: now + 60 * 60 * 1000 }); return; }
  if (++e.count > TKGM_LOOKUPS_PER_HOUR) throw new HttpError(429, "Bir saat içinde çok fazla parsel sorguladınız. Biraz sonra tekrar deneyin.");
}

// İletişim formu: IP başına saatlik ve toplam günlük sınır (istenmeyen mesaj seline karşı)
const contactHits = new Map();
let contactDay = { count: 0, resetAt: 0 };
function countContact(ip) {
  const now = Date.now();
  if (contactDay.resetAt <= now) contactDay = { count: 0, resetAt: now + 24 * 60 * 60 * 1000 };
  const e = contactHits.get(ip);
  if (e && e.resetAt > now && e.count >= CONTACT_PER_IP_PER_HOUR) {
    throw new HttpError(429, "Kısa sürede çok fazla mesaj gönderildi. Biraz sonra tekrar deneyin ya da e-posta ile yazın.");
  }
  if (contactDay.count >= CONTACT_PER_DAY) throw new HttpError(429, "Şu anda mesaj alınamıyor. Lütfen e-posta ile yazın.");
  if (!e || e.resetAt <= now) contactHits.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
  else e.count++;
  contactDay.count++;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, e] of contactHits) if (e.resetAt <= now) contactHits.delete(k);
  for (const [k, e] of lookups) if (e.resetAt <= now) lookups.delete(k);
  for (const [k, e] of failures) if (e.resetAt <= now) failures.delete(k);
}, 60 * 1000).unref();

setInterval(() => {
  pool.query("DELETE FROM sessions WHERE expires_at < now()").catch((err) => console.error("oturum temizliği:", err.message));
}, 60 * 60 * 1000).unref();

// ---------- Yardımcılar ----------
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function clientIp(req) {
  const h = CLIENT_IP_HEADER && req.headers[CLIENT_IP_HEADER];
  return (typeof h === "string" && h) || req.socket.remoteAddress || "?";
}

function parseCookies(header = "") {
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function sessionCookie(token, maxAge) {
  return [
    `${COOKIE_NAME}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`,
    ...(COOKIE_SECURE ? ["Secure"] : []),
  ].join("; ");
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

async function readJson(req) {
  if (!String(req.headers["content-type"] || "").startsWith("application/json")) {
    throw new HttpError(415, "İstek JSON olmalı.");
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new HttpError(413, "İstek çok büyük.");
    chunks.push(chunk);
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (data && typeof data === "object") return data;
  } catch {}
  throw new HttpError(400, "İstek okunamadı.");
}

async function currentSession(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return null;
  const tokenHash = hashToken(token);
  const { rows } = await pool.query(
    `SELECT m.id, m.member_no, m.full_name, m.must_change_password, m.is_admin, m.password_hash
       FROM sessions s JOIN members m ON m.id = s.member_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND m.active`,
    [tokenHash]
  );
  return rows[0] ? { member: rows[0], tokenHash } : null;
}

function publicMember(m) {
  return { memberNo: m.member_no, fullName: m.full_name, mustChangePassword: m.must_change_password, isAdmin: m.is_admin };
}

// Geçici şifreyle yalnızca şifre değiştirilebilir; diğer işlemler için yeni şifre gerekir.
async function requireMember(req, { admin = false } = {}) {
  const session = await currentSession(req);
  if (!session) throw new HttpError(401, "Oturumunuz kapanmış. Lütfen yeniden giriş yapın.");
  if (session.member.must_change_password) throw new HttpError(403, "Önce geçici şifrenizi değiştirin.");
  if (admin && !session.member.is_admin) throw new HttpError(403, "Bu sayfa yalnızca kooperatif yönetimi içindir.");
  return session.member;
}

function parcelRow(r) {
  return {
    id: Number(r.id), mahalleId: r.mahalle_id, mahalle: r.mahalle_name, ada: r.ada, parsel: r.parsel,
    nitelik: r.nitelik, areaM2: r.area_m2 === null ? null : Number(r.area_m2), mevkii: r.mevkii, pafta: r.pafta,
    geometry: r.geometry, addedAt: r.created_at,
  };
}

function treeRow(r) {
  return { id: Number(r.id), species: r.species, ageYears: r.age_years, count: r.tree_count, tons: Number(r.est_tons) };
}

function treeInput(o) {
  const species = String(o.species ?? "").trim().replace(/\s+/g, " ");
  const ageYears = Number(o.ageYears), count = Number(o.count), tons = Number(o.tons);
  if (!species || species.length > 40) throw new HttpError(400, "Ağaç cinsini yazın (en fazla 40 karakter).");
  if (!Number.isInteger(ageYears) || ageYears < 0 || ageYears > 150) throw new HttpError(400, "Ağaç yaşını yıl olarak yazın.");
  if (!Number.isInteger(count) || count < 1 || count > 100000) throw new HttpError(400, "Ağaç sayısını yazın.");
  if (!Number.isFinite(tons) || tons < 0 || tons > 100000) throw new HttpError(400, "Tahmini tonajı ton olarak yazın (ör. 2,5).");
  return { species, ageYears, count, tons: Math.round(tons * 100) / 100 };
}

function parcelQuery(url) {
  const q = new URL(url, "http://x").searchParams;
  return parcelInput({ mahalleId: q.get("mahalle"), ada: q.get("ada"), parsel: q.get("parsel") });
}

function parcelInput(o) {
  const mahalleId = Number(o.mahalleId), ada = String(o.ada ?? "").trim(), parsel = String(o.parsel ?? "").trim();
  if (!Number.isInteger(mahalleId) || mahalleId <= 0) throw new HttpError(400, "Mahalle seçin.");
  if (!/^\d{1,6}$/.test(ada) || !/^\d{1,6}$/.test(parsel)) throw new HttpError(400, "Ada ve parsel numarası yalnızca rakamdan oluşmalı.");
  return { mahalleId, ada: String(Number(ada)), parsel: String(Number(parsel)) };
}

// ---------- Uç noktalar ----------
async function login(req, res) {
  const body = await readJson(req);
  const memberNo = normalizeMemberNo(body.memberNo);
  const password = typeof body.password === "string" ? body.password : "";
  const ip = clientIp(req);

  if (tooManyAttempts("ip", ip) || (memberNo && tooManyAttempts("member", memberNo))) {
    throw new HttpError(429, "Çok fazla hatalı deneme yapıldı. 15 dakika sonra tekrar deneyin.");
  }
  if (!memberNo || !password || password.length > MAX_PASSWORD_LENGTH) {
    throw new HttpError(400, "Kullanıcı adınızı ve şifrenizi yazın.");
  }

  const { rows } = await pool.query(
    `SELECT id, member_no, full_name, must_change_password, is_admin, password_hash, failed_logins,
            initial_password_expires_at < now() AS initial_expired
       FROM members WHERE member_no = $1 AND active`,
    [memberNo]
  );
  const member = rows[0];
  // İlk şifre (TC + telefon) tahmin edilebilir bilgilerden oluştuğu için süreli ve deneme sayısı sınırlıdır.
  // Kalıcı şifresi olan hesaplar kilitlenmez; aksi hâlde başkası hatalı deneyerek ortağı dışarıda bırakabilirdi.
  const initial = member?.must_change_password;
  if (initial && member.failed_logins >= INITIAL_PASSWORD_MAX_FAILURES) {
    throw new HttpError(423, "Çok fazla hatalı deneme yapıldığı için hesabınız kilitlendi. Kooperatifi arayın.");
  }
  const ok = await verifyPassword(initial ? password.replace(/\s/g, "") : password, member ? member.password_hash : DUMMY_HASH);
  if (!member || !ok) {
    recordFailure("ip", ip);
    recordFailure("member", memberNo);
    if (member) await pool.query("UPDATE members SET failed_logins = failed_logins + 1 WHERE id = $1", [member.id]);
    console.warn(`giriş başarısız: ortak=${memberNo} ip=${ip}`);
    throw new HttpError(401, "Kullanıcı adı veya şifre hatalı.");
  }
  if (initial && member.initial_expired) {
    throw new HttpError(401, "İlk giriş şifrenizin süresi doldu. Yenilemesi için kooperatifi arayın.");
  }

  failures.delete(`member:${memberNo}`);
  const token = newSessionToken();
  await pool.query(
    `INSERT INTO sessions (token_hash, member_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))`,
    [hashToken(token), member.id, SESSION_DAYS]
  );
  await pool.query("UPDATE members SET last_login_at = now(), failed_logins = 0 WHERE id = $1", [member.id]);
  console.info(`giriş: ortak=${memberNo} ip=${ip}`);
  send(res, 200, { member: publicMember(member) }, { "Set-Cookie": sessionCookie(token, SESSION_DAYS * 86400) });
}

async function logout(req, res) {
  const session = await currentSession(req);
  if (session) await pool.query("DELETE FROM sessions WHERE token_hash = $1", [session.tokenHash]);
  send(res, 200, { ok: true }, { "Set-Cookie": sessionCookie("", 0) });
}

async function me(req, res) {
  const session = await currentSession(req);
  if (!session) throw new HttpError(401, "Oturum açık değil.");
  send(res, 200, { member: publicMember(session.member) });
}

async function changePassword(req, res) {
  const session = await currentSession(req);
  if (!session) throw new HttpError(401, "Oturumunuz kapanmış. Lütfen yeniden giriş yapın.");
  const body = await readJson(req);
  let current = typeof body.currentPassword === "string" ? body.currentPassword : "";
  if (session.member.must_change_password) current = current.replace(/\s/g, "");
  const next = typeof body.newPassword === "string" ? body.newPassword : "";

  if (next.length < MIN_PASSWORD_LENGTH || next.length > MAX_PASSWORD_LENGTH) {
    throw new HttpError(400, `Yeni şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`);
  }
  if (current.length > MAX_PASSWORD_LENGTH || !(await verifyPassword(current, session.member.password_hash))) {
    recordFailure("member", session.member.member_no);
    throw new HttpError(400, "Mevcut şifreniz hatalı.");
  }
  if (next === current) throw new HttpError(400, "Yeni şifre mevcut şifrenizden farklı olmalı.");

  await pool.query(
    `UPDATE members SET password_hash = $1, must_change_password = false, initial_password_expires_at = NULL, failed_logins = 0
      WHERE id = $2`,
    [await hashPassword(next), session.member.id]
  );
  // Başka cihazlarda açık kalan oturumlar kapatılır.
  await pool.query("DELETE FROM sessions WHERE member_id = $1 AND token_hash <> $2", [session.member.id, session.tokenHash]);
  console.info(`şifre değişti: ortak=${session.member.member_no}`);
  send(res, 200, { ok: true });
}

// ---------- Parseller ----------
async function listMahalleler(req, res) {
  await requireMember(req);
  send(res, 200, { mahalleler: await mahalleler() });
}

async function lookupParcel(req, res) {
  const member = await requireMember(req);
  const { mahalleId, ada, parsel } = parcelQuery(req.url);
  countLookup(member.id);
  send(res, 200, { parcel: await tkgmParsel(mahalleId, ada, parsel) });
}

async function myParcels(req, res) {
  const member = await requireMember(req);
  const { rows } = await pool.query("SELECT * FROM parcels WHERE member_id = $1 ORDER BY mahalle_name, ada::int, parsel::int", [member.id]);
  const { rows: trees } = await pool.query(
    "SELECT t.* FROM trees t JOIN parcels p ON p.id = t.parcel_id WHERE p.member_id = $1 ORDER BY t.id", [member.id]
  );
  send(res, 200, {
    parcels: rows.map((r) => ({
      ...parcelRow(r), trees: trees.filter((t) => t.parcel_id === r.id).map(treeRow),
    })),
  });
}

async function addParcel(req, res) {
  const member = await requireMember(req);
  const { mahalleId, ada, parsel } = parcelInput(await readJson(req));
  const { rows: [{ count }] } = await pool.query("SELECT count(*)::int AS count FROM parcels WHERE member_id = $1", [member.id]);
  if (count >= MAX_PARCELS_PER_MEMBER) throw new HttpError(400, `En fazla ${MAX_PARCELS_PER_MEMBER} parsel eklenebilir.`);
  countLookup(member.id);
  // Bilgiler istemciden değil, doğrudan TKGM'den alınır.
  const p = await tkgmParsel(mahalleId, ada, parsel);
  const { rows } = await pool.query(
    `INSERT INTO parcels (member_id, mahalle_id, mahalle_name, ada, parsel, nitelik, area_m2, mevkii, pafta, geometry)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (member_id, mahalle_id, ada, parsel) DO NOTHING RETURNING *`,
    [member.id, mahalleId, p.mahalle, ada, parsel, p.nitelik, p.areaM2, p.mevkii, p.pafta, JSON.stringify(p.geometry)]
  );
  if (!rows[0]) throw new HttpError(409, "Bu parsel zaten listenizde.");
  send(res, 201, { parcel: { ...parcelRow(rows[0]), trees: [] } });
}

async function removeParcel(req, res, id) {
  const member = await requireMember(req);
  const { rowCount } = await pool.query("DELETE FROM parcels WHERE id = $1 AND member_id = $2", [id, member.id]);
  if (!rowCount) throw new HttpError(404, "Parsel bulunamadı.");
  send(res, 200, { ok: true });
}

async function addTrees(req, res, parcelId) {
  const member = await requireMember(req);
  const t = treeInput(await readJson(req));
  const { rows: [p] } = await pool.query(
    `SELECT (SELECT count(*)::int FROM trees WHERE parcel_id = p.id) AS groups FROM parcels p WHERE p.id = $1 AND p.member_id = $2`,
    [parcelId, member.id]
  );
  if (!p) throw new HttpError(404, "Parsel bulunamadı.");
  if (p.groups >= MAX_TREE_GROUPS_PER_PARCEL) throw new HttpError(400, `Bir parsele en fazla ${MAX_TREE_GROUPS_PER_PARCEL} ağaç grubu eklenebilir.`);
  const { rows } = await pool.query(
    `INSERT INTO trees (parcel_id, species, age_years, tree_count, est_tons) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [parcelId, t.species, t.ageYears, t.count, t.tons]
  );
  send(res, 201, { tree: treeRow(rows[0]) });
}

async function removeTrees(req, res, id) {
  const member = await requireMember(req);
  const { rowCount } = await pool.query(
    "DELETE FROM trees t USING parcels p WHERE t.id = $1 AND p.id = t.parcel_id AND p.member_id = $2", [id, member.id]
  );
  if (!rowCount) throw new HttpError(404, "Kayıt bulunamadı.");
  send(res, 200, { ok: true });
}

async function allParcels(req, res) {
  await requireMember(req, { admin: true });
  const { rows } = await pool.query(
    `SELECT m.member_no, m.full_name, m.active, m.must_change_password, p.*,
            count(*) OVER (PARTITION BY p.mahalle_id, p.ada, p.parsel) AS owners
       FROM members m LEFT JOIN parcels p ON p.member_id = m.id
      ORDER BY m.full_name, p.mahalle_name, p.ada::int, p.parsel::int`
  );
  const { rows: trees } = await pool.query("SELECT * FROM trees ORDER BY id");
  const members = new Map();
  for (const r of rows) {
    if (!members.has(r.member_no)) members.set(r.member_no, {
      memberNo: r.member_no, fullName: r.full_name, active: r.active, pendingFirstLogin: r.must_change_password, parcels: [],
    });
    if (r.id !== null) members.get(r.member_no).parcels.push({
      ...parcelRow(r), shared: Number(r.owners) > 1, trees: trees.filter((t) => t.parcel_id === r.id).map(treeRow),
    });
  }
  send(res, 200, { members: [...members.values()] });
}

// Ortak listesi (yönetim > Ortaklar). Durum: aktif | ilk-giris | kilitli | suresi-doldu | kapali
async function listMembers(req, res) {
  await requireMember(req, { admin: true });
  const { rows } = await pool.query(
    `SELECT m.member_no, m.full_name, m.active, m.is_admin, m.created_at, m.last_login_at, c.full_name AS created_by,
            CASE WHEN NOT m.active THEN 'kapali'
                 WHEN NOT m.must_change_password THEN 'aktif'
                 WHEN m.failed_logins >= $1 THEN 'kilitli'
                 WHEN m.initial_password_expires_at < now() THEN 'suresi-doldu'
                 ELSE 'ilk-giris' END AS status,
            m.initial_password_expires_at,
            COALESCE((SELECT json_agg(json_build_object('mahalle', p.mahalle_name, 'ada', p.ada, 'parsel', p.parsel,
                        'nitelik', p.nitelik, 'mevkii', p.mevkii, 'areaM2', p.area_m2,
                        'trees', COALESCE((SELECT json_agg(json_build_object('id', t.id, 'species', t.species, 'ageYears', t.age_years,
                                    'count', t.tree_count, 'tons', t.est_tons) ORDER BY t.id) FROM trees t WHERE t.parcel_id = p.id), '[]'))
                        ORDER BY p.mahalle_name, p.ada::int, p.parsel::int)
                      FROM parcels p WHERE p.member_id = m.id), '[]') AS parcels
       FROM members m LEFT JOIN members c ON c.id = m.created_by
      ORDER BY m.full_name`,
    [INITIAL_PASSWORD_MAX_FAILURES]
  );
  send(res, 200, {
    members: rows.map((r) => ({
      memberNo: r.member_no, fullName: r.full_name, status: r.status, isAdmin: r.is_admin,
      createdAt: r.created_at, createdBy: r.created_by, lastLoginAt: r.last_login_at,
      initialPasswordExpiresAt: r.status === "ilk-giris" ? r.initial_password_expires_at : null,
      parcels: r.parcels.map((p) => ({
        ...p, areaM2: p.areaM2 === null ? null : Number(p.areaM2), trees: p.trees.map((t) => ({ ...t, tons: Number(t.tons) })),
      })),
    })),
  });
}

// Yönetim sayfasından ortak kaydı. TC ve telefon yalnızca ilk şifreyi üretmek için kullanılır; kaydedilmez, loglanmaz.
async function addMember(req, res) {
  const admin = await requireMember(req, { admin: true });
  const body = await readJson(req);
  const firstName = String(body.firstName ?? "").trim().replace(/\s+/g, " ");
  const lastName = String(body.lastName ?? "").trim().replace(/\s+/g, " ");
  if (!isValidName(firstName) || !isValidName(lastName)) throw new HttpError(400, "Ad ve soyad yalnızca harflerden oluşmalı.");
  let password;
  try {
    password = initialPassword(body.tc, body.phone);
  } catch (err) {
    throw new HttpError(400, err.message);
  }
  const m = await createMember({ firstName, lastName, password, createdBy: admin.id });
  console.info(`ortak eklendi: ${m.username} (yönetici=${admin.member_no})`);
  send(res, 201, {
    member: { memberNo: m.username, fullName: m.fullName, pendingFirstLogin: true, active: true, parcels: [] },
    usernameTaken: m.username !== m.base ? m.base : null,
    message: welcomeMessage(m.fullName, m.username),
  });
}

// Yönetimden şifre sıfırlama: yeni ilk şifre yine TC + telefonun son 4 hanesi (kaydedilmez, loglanmaz).
async function resetMemberPassword(req, res, username) {
  const admin = await requireMember(req, { admin: true });
  const body = await readJson(req);
  let password;
  try {
    password = initialPassword(body.tc, body.phone);
  } catch (err) {
    throw new HttpError(400, err.message);
  }
  const m = await resetMember(username, password);
  if (!m) throw new HttpError(404, "Ortak bulunamadı.");
  console.info(`şifre sıfırlandı: ${username} (yönetici=${admin.member_no})`);
  send(res, 200, { ok: true, message: welcomeMessage(m.fullName, username, { reset: true }) });
}

async function setActive(req, res, username) {
  const admin = await requireMember(req, { admin: true });
  const { active } = await readJson(req);
  if (typeof active !== "boolean") throw new HttpError(400, "İstek okunamadı.");
  if (!active && username === admin.member_no) throw new HttpError(400, "Kendi hesabınızı kapatamazsınız.");
  if (!(await setMemberActive(username, active))) throw new HttpError(404, "Ortak bulunamadı.");
  console.info(`hesap ${active ? "açıldı" : "kapatıldı"}: ${username} (yönetici=${admin.member_no})`);
  send(res, 200, { ok: true });
}

// ---------- İletişim formu ----------
function contactInput(o) {
  const str = (v) => (typeof v === "string" ? v.trim() : "");
  const name = str(o.ad).replace(/\s+/g, " "), email = str(o.eposta), phone = str(o.telefon), topic = str(o.konu);
  const message = str(o.mesaj).replace(/\r\n/g, "\n");
  const digits = phone.replace(/\D/g, "");
  if (name.split(" ").length < 2 || name.length > 80) throw new HttpError(400, "Adınızı ve soyadınızı yazın.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) throw new HttpError(400, "Geçerli bir e-posta adresi yazın.");
  if (phone && !(digits.length === 10 || digits.length === 11 || (digits.length === 12 && digits.startsWith("90")))) {
    throw new HttpError(400, "Telefon numarası 10 veya 11 haneli olmalı.");
  }
  if (!CONTACT_TOPICS.includes(topic)) throw new HttpError(400, "Mesajınızın konusunu seçin.");
  if (message.length < 20 || message.length > 1500) throw new HttpError(400, "Mesajınız 20 ile 1500 karakter arasında olmalı.");
  if (o.kvkk !== "on" && o.kvkk !== true) throw new HttpError(400, "Devam etmek için aydınlatma metnini onaylayın.");
  return { name, email, phone: phone || null, topic, message };
}

async function contact(req, res) {
  const body = await readJson(req);
  // Gizli "web" alanını yalnızca botlar doldurur; başarılı görünür ama kaydedilmez.
  if (typeof body.web === "string" && body.web.trim()) return send(res, 201, { ok: true });
  const m = contactInput(body);
  countContact(clientIp(req));
  await pool.query(
    "INSERT INTO contact_messages (name, email, phone, topic, message) VALUES ($1, $2, $3, $4, $5)",
    [m.name, m.email, m.phone, m.topic, m.message]
  );
  console.info(`iletişim mesajı: konu=${m.topic}`);
  send(res, 201, { ok: true });
}

async function listMessages(req, res) {
  await requireMember(req, { admin: true });
  const { rows } = await pool.query(
    `SELECT c.*, m.full_name AS read_by_name FROM contact_messages c LEFT JOIN members m ON m.id = c.read_by
      ORDER BY c.created_at DESC LIMIT 1000`
  );
  send(res, 200, {
    messages: rows.map((r) => ({
      id: Number(r.id), name: r.name, email: r.email, phone: r.phone, topic: r.topic, message: r.message,
      createdAt: r.created_at, readAt: r.read_at, readBy: r.read_by_name,
    })),
  });
}

async function unreadMessages(req, res) {
  await requireMember(req, { admin: true });
  const { rows: [{ count }] } = await pool.query("SELECT count(*)::int AS count FROM contact_messages WHERE read_at IS NULL");
  send(res, 200, { count });
}

async function markMessage(req, res, id) {
  const member = await requireMember(req, { admin: true });
  const read = (await readJson(req)).read !== false;
  const { rowCount } = read
    ? await pool.query("UPDATE contact_messages SET read_at = now(), read_by = $2 WHERE id = $1", [id, member.id])
    : await pool.query("UPDATE contact_messages SET read_at = NULL, read_by = NULL WHERE id = $1", [id]);
  if (!rowCount) throw new HttpError(404, "Mesaj bulunamadı.");
  send(res, 200, { ok: true });
}

async function deleteMessage(req, res, id) {
  await requireMember(req, { admin: true });
  const { rowCount } = await pool.query("DELETE FROM contact_messages WHERE id = $1", [id]);
  if (!rowCount) throw new HttpError(404, "Mesaj bulunamadı.");
  send(res, 200, { ok: true });
}

async function health(req, res) {
  await pool.query("SELECT 1");
  send(res, 200, { ok: true });
}

const routes = {
  "GET /health": health,
  "GET /tkgm/mahalleler": listMahalleler,
  "GET /tkgm/parsel": lookupParcel,
  "GET /parcels": myParcels,
  "POST /parcels": addParcel,
  "GET /admin/parcels": allParcels,
  "GET /admin/members": listMembers,
  "GET /admin/messages": listMessages,
  "GET /admin/messages/unread": unreadMessages,
  "POST /contact": contact,
  "POST /admin/members": addMember,
  "GET /auth/me": me,
  "POST /auth/login": login,
  "POST /auth/logout": logout,
  "POST /auth/password": changePassword,
};

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const allowed = origin && ALLOWED_ORIGINS.has(origin);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Vary", "Origin");
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  const path = new URL(req.url, "http://x").pathname;
  if (req.method === "OPTIONS") {
    if (!allowed) return send(res, 403);
    return send(res, 204, undefined, {
      "Access-Control-Allow-Methods": "GET, POST, DELETE",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
    });
  }
  // Durum değiştiren istekler yalnızca sitemizden gelebilir (CSRF koruması).
  if (req.method !== "GET" && !allowed) return send(res, 403, { error: "İzin verilmeyen kaynak." });

  const del = req.method === "DELETE" && path.match(/^\/(parcels|trees)\/(\d+)$/);
  const addT = req.method === "POST" && path.match(/^\/parcels\/(\d+)\/trees$/);
  const act = req.method === "POST" && path.match(/^\/admin\/members\/([a-z0-9]+)\/(reset|active)$/);
  const msg = path.match(/^\/admin\/messages\/(\d+)(\/read)?$/);
  const msgHandler = msg && (req.method === "POST" && msg[2] ? markMessage : req.method === "DELETE" && !msg[2] ? deleteMessage : null);
  const handler = del ? (rq, rs) => (del[1] === "parcels" ? removeParcel : removeTrees)(rq, rs, Number(del[2]))
    : addT ? (rq, rs) => addTrees(rq, rs, Number(addT[1]))
    : msgHandler ? (rq, rs) => msgHandler(rq, rs, Number(msg[1]))
    : act ? (rq, rs) => (act[2] === "reset" ? resetMemberPassword : setActive)(rq, rs, act[1])
    : routes[`${req.method} ${path}`];
  if (!handler) return send(res, 404, { error: "Bulunamadı." });
  try {
    await handler(req, res);
  } catch (err) {
    if (err instanceof HttpError || err instanceof TkgmError) return send(res, err.status, { error: err.message });
    console.error(err);
    send(res, 500, { error: "Sunucuda bir sorun oluştu. Biraz sonra tekrar deneyin." });
  }
});

await migrate();
server.listen(PORT, () => console.info(`finike-api ${PORT} portunda; izinli kaynaklar: ${[...ALLOWED_ORIGINS].join(", ")}`));

function shutdown() {
  server.close(() => pool.end().finally(() => process.exit(0)));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
