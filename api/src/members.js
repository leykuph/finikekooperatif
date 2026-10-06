// Ortak hesabı açma: komut satırı (cli.js) ve yönetim sayfası (server.js) aynı kuralları kullanır.
import { pool, usernameCandidates } from "./db.js";
import { INITIAL_PASSWORD_DAYS, hashPassword } from "./auth.js";

const SITE_URL = (process.env.SITE_URL || "https://finikekooperatifi.com").replace(/\/$/, "");

export function isValidName(n) {
  return /^[\p{L}][\p{L} .'-]*$/u.test(n) && n.length <= 60;
}

async function freeUsername(firstName, lastName) {
  const candidates = usernameCandidates(firstName, lastName);
  const first = candidates.next().value;
  if (!first) return null;
  const { rows } = await pool.query("SELECT member_no FROM members WHERE member_no LIKE $1 || '%'", [first]);
  const taken = new Set(rows.map((r) => r.member_no));
  if (!taken.has(first)) return { username: first, base: first };
  for (const c of candidates) if (!taken.has(c)) return { username: c, base: first };
}

// password: initialPassword(tc, telefon) ile üretilmiş ilk giriş şifresi
export async function createMember({ firstName, lastName, password, createdBy = null }) {
  const fullName = `${firstName} ${lastName}`;
  const hash = await hashPassword(password);
  // Aynı anda iki kayıt aynı kullanıcı adını seçerse benzersizlik hatası alınır; yeniden denenir.
  for (let attempt = 0; attempt < 3; attempt++) {
    const free = await freeUsername(firstName, lastName);
    try {
      await pool.query(
        `INSERT INTO members (member_no, full_name, password_hash, initial_password_expires_at, created_by)
         VALUES ($1, $2, $3, now() + make_interval(days => $4), $5)`,
        [free.username, fullName, hash, INITIAL_PASSWORD_DAYS, createdBy]
      );
      return { ...free, fullName };
    } catch (err) {
      if (err.code !== "23505") throw err;
    }
  }
  throw new Error("Kullanıcı adı ayrılamadı, tekrar deneyin.");
}

// İlk giriş şifresine döndürür ve açık oturumları kapatır. Ortak yoksa null.
export async function resetMember(username, password) {
  const { rows } = await pool.query(
    `UPDATE members SET password_hash = $1, must_change_password = true, failed_logins = 0,
            initial_password_expires_at = now() + make_interval(days => $3)
      WHERE member_no = $2 RETURNING id, full_name`,
    [await hashPassword(password), username, INITIAL_PASSWORD_DAYS]
  );
  if (!rows[0]) return null;
  await pool.query("DELETE FROM sessions WHERE member_id = $1", [rows[0].id]);
  return { fullName: rows[0].full_name };
}

// Hesabı kapatır/açar; kapatılan hesabın oturumları sonlanır. Ortak yoksa false.
export async function setMemberActive(username, active) {
  const { rows } = await pool.query("UPDATE members SET active = $1 WHERE member_no = $2 RETURNING id", [active, username]);
  if (!rows[0]) return false;
  if (!active) await pool.query("DELETE FROM sessions WHERE member_id = $1", [rows[0].id]);
  return true;
}

// Gizli bilgi içermez; SMS, WhatsApp ya da sözlü olarak iletilebilir.
export function welcomeMessage(fullName, username, { reset = false } = {}) {
  return `Sayın ${fullName},
S.S. Finike Tarımsal Kalkınma Kooperatifi ortak panelindeki ${reset ? "şifreniz sıfırlandı" : "hesabınız açıldı"}.

Giriş adresi: ${SITE_URL}/giris
Kullanıcı adınız: ${username}
İlk şifreniz: TC kimlik numaranız ve cep telefonunuzun son 4 hanesi, boşluksuz yan yana (ör. 12345678950 ve 0532 111 4567 için 123456789504567)

İlk şifre ${INITIAL_PASSWORD_DAYS} gün geçerlidir. Girişte kendinize yeni bir şifre belirleyeceksiniz.`;
}
