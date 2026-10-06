// Ortak hesabı açma: komut satırı (cli.js) ve yönetim sayfası (server.js) aynı kuralları kullanır.
import { pool, usernameCandidates } from "./db.js";
import { INITIAL_PASSWORD_DAYS, hashPassword } from "./auth.js";

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

// Gizli bilgi içermez; SMS, WhatsApp ya da sözlü olarak iletilebilir.
export function welcomeMessage(fullName, username) {
  return `Sayın ${fullName},
S.S. Finike Tarımsal Kalkınma Kooperatifi ortak panelindeki hesabınız açıldı.

Giriş adresi: https://finike.leykuph.com/giris
Kullanıcı adınız: ${username}
İlk şifreniz: TC kimlik numaranız ve cep telefonunuzun son 4 hanesi, boşluksuz yan yana (ör. 12345678950 ve 0532 111 4567 için 123456789504567)

İlk şifre ${INITIAL_PASSWORD_DAYS} gün geçerlidir. Girişte kendinize yeni bir şifre belirleyeceksiniz.`;
}
