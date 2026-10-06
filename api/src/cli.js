// Ortak hesaplarını yönetme komutları. Sunucuda:
//   kubectl -n finike exec deploy/finike-api -- node src/cli.js <komut> ...
import { pool, migrate, normalizeMemberNo, usernameFor } from "./db.js";
import { hashPassword, temporaryPassword } from "./auth.js";

const USAGE = `Kullanım:
  node src/cli.js ekle "<Ad>" "<Soyad>"           Yeni ortak hesabı açar, kullanıcı adı ve geçici şifre verir
  node src/cli.js sifirla <kullanıcı-adı>        Geçici şifre üretir, açık oturumları kapatır
  node src/cli.js pasif <kullanıcı-adı>          Hesabı kapatır (kayıt silinmez)
  node src/cli.js aktif <kullanıcı-adı>          Kapatılmış hesabı yeniden açar
  node src/cli.js liste                          Bütün ortak hesaplarını listeler

Kullanıcı adı soyadı + adın ilk iki harfidir (Ahmet Yılmaz -> yilmazah). Aynısı varsa sonuna 2, 3... eklenir.`;

function fail(msg) {
  console.error(msg);
  process.exitCode = 1;
}

// Ortağa SMS ya da WhatsApp ile olduğu gibi gönderilebilecek mesaj.
function printPassword(fullName, memberNo, password) {
  console.log(`
---------------------------------------------------------------
Sayın ${fullName},
S.S. Finike Tarımsal Kalkınma Kooperatifi ortak paneline
https://finike.leykuph.com/giris adresinden girebilirsiniz.

Kullanıcı adı : ${memberNo}
Geçici şifre  : ${password}

İlk girişte kendinize yeni bir şifre belirlemeniz istenecek.
---------------------------------------------------------------`);
  console.log("Geçici şifre bir daha gösterilmez. Mesajı ortağa iletin.");
}

async function freeUsername(base) {
  const { rows } = await pool.query("SELECT member_no FROM members WHERE member_no LIKE $1 || '%'", [base]);
  const taken = new Set(rows.map((r) => r.member_no));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(base + i)) return base + i;
}

async function run([cmd, ...args]) {
  await migrate();
  const memberNo = normalizeMemberNo(args[0]);

  switch (cmd) {
    case "ekle": {
      const firstName = (args[0] || "").trim(), lastName = (args[1] || "").trim();
      const base = usernameFor(firstName, lastName);
      if (!firstName || !lastName || args.length > 2 || !base) return fail(USAGE);
      const username = await freeUsername(base);
      const fullName = `${firstName} ${lastName}`;
      const password = temporaryPassword();
      await pool.query("INSERT INTO members (member_no, full_name, password_hash) VALUES ($1, $2, $3)", [
        username, fullName, await hashPassword(password),
      ]);
      if (username !== base) console.log(`Not: "${base}" kullanımda olduğu için kullanıcı adı "${username}" verildi.`);
      return printPassword(fullName, username, password);
    }
    case "sifirla": {
      if (!memberNo) return fail(USAGE);
      const password = temporaryPassword();
      const { rows } = await pool.query(
        "UPDATE members SET password_hash = $1, must_change_password = true WHERE member_no = $2 RETURNING id, full_name",
        [await hashPassword(password), memberNo]
      );
      if (!rows[0]) return fail(`"${memberNo}" kullanıcı adlı ortak bulunamadı.`);
      await pool.query("DELETE FROM sessions WHERE member_id = $1", [rows[0].id]);
      return printPassword(rows[0].full_name, memberNo, password);
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
    case "liste": {
      const { rows } = await pool.query(
        `SELECT member_no, full_name, active, must_change_password, last_login_at FROM members ORDER BY member_no`
      );
      if (!rows.length) return console.log("Kayıtlı ortak yok.");
      return console.table(rows.map((r) => ({
        "Kullanıcı adı": r.member_no,
        "Ad Soyad": r.full_name,
        Durum: r.active ? (r.must_change_password ? "şifre bekliyor" : "aktif") : "kapalı",
        "Son giriş": r.last_login_at ? r.last_login_at.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }) : "-",
      })));
    }
    default:
      return fail(USAGE);
  }
}

try {
  await run(process.argv.slice(2));
} finally {
  await pool.end();
}
