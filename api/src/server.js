import http from "node:http";
import { pool, migrate, normalizeMemberNo } from "./db.js";
import {
  DUMMY_HASH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH,
  hashPassword, hashToken, newSessionToken, verifyPassword,
} from "./auth.js";

const PORT = Number(process.env.PORT || 8787);
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || "https://finike.leykuph.com").split(",").map((s) => s.trim()).filter(Boolean)
);
// Cloudflare Tunnel arkasında gerçek istemci IP'si "cf-connecting-ip" başlığındadır.
// Başlık yalnızca bu değişken ayarlıysa dikkate alınır; doğrudan erişimde taklit edilebilir.
const CLIENT_IP_HEADER = (process.env.CLIENT_IP_HEADER || "").toLowerCase();
const COOKIE_NAME = "finike_oturum";
const COOKIE_SECURE = process.env.COOKIE_SECURE !== "false";
const SESSION_DAYS = 30;
const MAX_BODY = 10 * 1024;

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
setInterval(() => {
  const now = Date.now();
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
    `SELECT m.id, m.member_no, m.full_name, m.must_change_password, m.password_hash
       FROM sessions s JOIN members m ON m.id = s.member_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND m.active`,
    [tokenHash]
  );
  return rows[0] ? { member: rows[0], tokenHash } : null;
}

function publicMember(m) {
  return { memberNo: m.member_no, fullName: m.full_name, mustChangePassword: m.must_change_password };
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
    "SELECT id, member_no, full_name, must_change_password, password_hash FROM members WHERE member_no = $1 AND active",
    [memberNo]
  );
  const member = rows[0];
  const ok = await verifyPassword(password, member ? member.password_hash : DUMMY_HASH);
  if (!member || !ok) {
    recordFailure("ip", ip);
    recordFailure("member", memberNo);
    console.warn(`giriş başarısız: ortak=${memberNo} ip=${ip}`);
    throw new HttpError(401, "Kullanıcı adı veya şifre hatalı.");
  }

  failures.delete(`member:${memberNo}`);
  const token = newSessionToken();
  await pool.query(
    `INSERT INTO sessions (token_hash, member_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))`,
    [hashToken(token), member.id, SESSION_DAYS]
  );
  await pool.query("UPDATE members SET last_login_at = now() WHERE id = $1", [member.id]);
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
  const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const next = typeof body.newPassword === "string" ? body.newPassword : "";

  if (next.length < MIN_PASSWORD_LENGTH || next.length > MAX_PASSWORD_LENGTH) {
    throw new HttpError(400, `Yeni şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`);
  }
  if (current.length > MAX_PASSWORD_LENGTH || !(await verifyPassword(current, session.member.password_hash))) {
    recordFailure("member", session.member.member_no);
    throw new HttpError(400, "Mevcut şifreniz hatalı.");
  }
  if (next === current) throw new HttpError(400, "Yeni şifre mevcut şifrenizden farklı olmalı.");

  await pool.query("UPDATE members SET password_hash = $1, must_change_password = false WHERE id = $2", [
    await hashPassword(next), session.member.id,
  ]);
  // Başka cihazlarda açık kalan oturumlar kapatılır.
  await pool.query("DELETE FROM sessions WHERE member_id = $1 AND token_hash <> $2", [session.member.id, session.tokenHash]);
  console.info(`şifre değişti: ortak=${session.member.member_no}`);
  send(res, 200, { ok: true });
}

async function health(req, res) {
  await pool.query("SELECT 1");
  send(res, 200, { ok: true });
}

const routes = {
  "GET /health": health,
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
      "Access-Control-Allow-Methods": "GET, POST",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
    });
  }
  // Durum değiştiren istekler yalnızca sitemizden gelebilir (CSRF koruması).
  if (req.method === "POST" && !allowed) return send(res, 403, { error: "İzin verilmeyen kaynak." });

  const handler = routes[`${req.method} ${path}`];
  if (!handler) return send(res, 404, { error: "Bulunamadı." });
  try {
    await handler(req, res);
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message });
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
