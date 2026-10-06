// Ortak hesaplarını yönetme komutları. Sunucuda:
//   kubectl -n finike exec deploy/finike-api -- node src/cli.js <komut> ...
import { pool, migrate, normalizeMemberNo, usernameCandidates } from "./db.js";
import { createInterface } from "node:readline/promises";
import { INITIAL_PASSWORD_DAYS, INITIAL_PASSWORD_MAX_FAILURES, hashPassword, initialPassword } from "./auth.js";

const USAGE = `Kullanım:
  node src/cli.js ekle "<Ad>" "<Soyad>"           Yeni ortak hesabı açar; TC ve telefonu sorar
  node src/cli.js sifirla <kullanıcı-adı>        İlk giriş şifresine döndürür; TC ve telefonu sorar, oturumları kapatır
  node src/cli.js pasif <kullanıcı-adı>          Hesabı kapatır (kayıt silinmez)
  node src/cli.js aktif <kullanıcı-adı>          Kapatılmış hesabı yeniden açar
  node src/cli.js yonetici <kullanıcı-adı> evet  Yönetim sayfasına erişim verir ("hayir" ile geri alır)
  node src/cli.js liste                          Bütün ortak hesaplarını listeler

İlk giriş şifresi: TC kimlik no + cep telefonunun son 4 hanesi. ${INITIAL_PASSWORD_DAYS} gün geçerlidir,
ilk girişte değiştirilir. TC ve telefon kaydedilmez. Sormak için "kubectl exec -it" ile çalıştırın.

Kullanıcı adı soyadı + adın ilk iki harfidir (Ahmet Yılmaz -> yilmazah). Doluysa adın ilk üç, dört...
harfi kullanılır (yilmazahm, yilmazahme); ad biterse sonuna 2, 3... eklenir.`;

function fail(msg) {
  console.error(msg);
  process.exitCode = 1;
}

// Mesajda gizli bilgi yoktur; ortağa SMS, WhatsApp ya da sözlü olarak iletilebilir.
function printWelcome(fullName, memberNo) {
  console.log(`
---------------------------------------------------------------
Sayın ${fullName},
S.S. Finike Tarımsal Kalkınma Kooperatifi ortak paneline
https://finike.leykuph.com/giris adresinden girebilirsiniz.

Kullanıcı adı : ${memberNo}
İlk şifre     : TC kimlik numaranız + cep telefonunuzun son 4 hanesi
                (boşluksuz, ör. 12345678950 ve 0532 111 4567 için 123456789504567)

İlk şifre ${INITIAL_PASSWORD_DAYS} gün geçerlidir. Girişte kendinize yeni bir şifre belirleyeceksiniz.
---------------------------------------------------------------`);
}

// TC ve telefon komut satırında verilmezse sorulur; böylece kabuk geçmişine yazılmaz.
async function askInitialPassword(tcArg, phoneArg) {
  let tc = tcArg, phone = phoneArg;
  if (!tc || !phone) {
    if (!process.stdin.isTTY) throw new Error('TC ve telefon için komutu "kubectl exec -it" ile çalıştırın.');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      if (!tc) tc = await rl.question("TC kimlik no : ");
      if (!phone) phone = await rl.question("Cep telefonu : ");
    } finally { rl.close(); }
  }
  return initialPassword(tc, phone);
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

async function run([cmd, ...args]) {
  await migrate();
  const memberNo = normalizeMemberNo(args[0]);

  switch (cmd) {
    case "ekle": {
      const firstName = (args[0] || "").trim(), lastName = (args[1] || "").trim();
      if (args.length < 2 || args.length > 4) return fail(USAGE);
      const free = await freeUsername(firstName, lastName);
      if (!free) return fail(USAGE);
      const password = await askInitialPassword(args[2], args[3]);
      const { username, base } = free;
      const fullName = `${firstName} ${lastName}`;
      await pool.query(
        `INSERT INTO members (member_no, full_name, password_hash, initial_password_expires_at)
         VALUES ($1, $2, $3, now() + make_interval(days => $4))`,
        [username, fullName, await hashPassword(password), INITIAL_PASSWORD_DAYS]
      );
      if (username !== base) console.log(`Not: "${base}" kullanımda olduğu için kullanıcı adı "${username}" verildi.`);
      return printWelcome(fullName, username);
    }
    case "sifirla": {
      if (!memberNo) return fail(USAGE);
      const { rows: found } = await pool.query("SELECT 1 FROM members WHERE member_no = $1", [memberNo]);
      if (!found[0]) return fail(`"${memberNo}" kullanıcı adlı ortak bulunamadı.`);
      const password = await askInitialPassword(args[1], args[2]);
      const { rows } = await pool.query(
        `UPDATE members SET password_hash = $1, must_change_password = true, failed_logins = 0,
                initial_password_expires_at = now() + make_interval(days => $3)
          WHERE member_no = $2 RETURNING id, full_name`,
        [await hashPassword(password), memberNo, INITIAL_PASSWORD_DAYS]
      );
      if (!rows[0]) return fail(`"${memberNo}" kullanıcı adlı ortak bulunamadı.`);
      await pool.query("DELETE FROM sessions WHERE member_id = $1", [rows[0].id]);
      return printWelcome(rows[0].full_name, memberNo);
    }
    case "pasif":
    case "aktif": {
      if (!memberNo) return fail(USAGE);
      const active = cmd === "aktif";
      const { rows } = await pool.query("UPDATE members SET active = $1 WHERE member_no = $2 RETURNING id", [active, memberNo]);
      if (!rows[0]) return fail(`"${memberNo}" kullanıcı adlı ortak bulunamadı.`);
      if (!active) await pool.query("DELETE FROM sessions WHERE member_id = $1", [rows[0].id]);
      return console.log(`${memberNo} ${active ? "yeniden açıldı" : "kapatıldı"}.`);
    }
    case "yonetici": {
      const flag = { evet: true, hayir: false, "hayır": false }[(args[1] || "").toLocaleLowerCase("tr-TR")];
      if (!memberNo || flag === undefined) return fail(USAGE);
      const { rowCount } = await pool.query("UPDATE members SET is_admin = $1 WHERE member_no = $2", [flag, memberNo]);
      if (!rowCount) return fail(`"${memberNo}" kullanıcı adlı ortak bulunamadı.`);
      return console.log(`${memberNo} ${flag ? "artık yönetim sayfasına erişebilir" : "için yönetim erişimi kaldırıldı"}.`);
    }
    case "liste": {
      const { rows } = await pool.query(
        `SELECT member_no, full_name, active, must_change_password, is_admin, last_login_at, failed_logins,
                initial_password_expires_at < now() AS initial_expired FROM members ORDER BY member_no`
      );
      if (!rows.length) return console.log("Kayıtlı ortak yok.");
      return console.table(rows.map((r) => ({
        "Kullanıcı adı": r.member_no,
        "Ad Soyad": r.full_name,
        Durum: !r.active ? "kapalı"
          : !r.must_change_password ? "aktif"
          : r.failed_logins >= INITIAL_PASSWORD_MAX_FAILURES ? "kilitli (sifirla)"
          : r.initial_expired ? "ilk şifre süresi doldu (sifirla)"
          : "ilk giriş bekliyor",
        "Yönetici": r.is_admin ? "evet" : "",
        "Son giriş": r.last_login_at ? r.last_login_at.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }) : "-",
      })));
    }
    default:
      return fail(USAGE);
  }
}

try {
  await run(process.argv.slice(2));
} catch (err) {
  fail(err.message);
} finally {
  await pool.end();
}
