// Ortak hesaplarını yönetme komutları. Sunucuda:
//   kubectl -n finike exec deploy/finike-api -- node src/cli.js <komut> ...
import { pool, migrate, normalizeMemberNo } from "./db.js";
import { hashPassword, temporaryPassword } from "./auth.js";

const USAGE = `Kullanım:
  node src/cli.js ekle <ortak-no> "<Ad Soyad>"   Yeni ortak hesabı açar, geçici şifre verir
  node src/cli.js sifirla <ortak-no>             Geçici şifre üretir, açık oturumları kapatır
  node src/cli.js pasif <ortak-no>               Hesabı kapatır (kayıt silinmez)
  node src/cli.js aktif <ortak-no>               Kapatılmış hesabı yeniden açar
  node src/cli.js liste                          Bütün ortak hesaplarını listeler`;

function fail(msg) {
  console.error(msg);
  process.exitCode = 1;
}

function printPassword(memberNo, password) {
  console.log(`\nOrtak no      : ${memberNo}\nGeçici şifre  : ${password}\n`);
  console.log("Bu şifre bir daha gösterilmez. Ortağa iletin; ilk girişte kendi şifresini belirleyecek.");
}

async function run([cmd, ...args]) {
  await migrate();
  const memberNo = normalizeMemberNo(args[0]);

  switch (cmd) {
    case "ekle": {
      const fullName = (args[1] || "").trim();
      if (!memberNo || !fullName) return fail(USAGE);
      const password = temporaryPassword();
      const { rowCount } = await pool.query(
        `INSERT INTO members (member_no, full_name, password_hash) VALUES ($1, $2, $3)
         ON CONFLICT (member_no) DO NOTHING`,
        [memberNo, fullName, await hashPassword(password)]
      );
      if (!rowCount) return fail(`${memberNo} numaralı ortak zaten kayıtlı. Şifre için "sifirla" komutunu kullanın.`);
      return printPassword(memberNo, password);
    }
    case "sifirla": {
      if (!memberNo) return fail(USAGE);
      const password = temporaryPassword();
      const { rows } = await pool.query(
        "UPDATE members SET password_hash = $1, must_change_password = true WHERE member_no = $2 RETURNING id",
        [await hashPassword(password), memberNo]
      );
      if (!rows[0]) return fail(`${memberNo} numaralı ortak bulunamadı.`);
      await pool.query("DELETE FROM sessions WHERE member_id = $1", [rows[0].id]);
      return printPassword(memberNo, password);
    }
    case "pasif":
    case "aktif": {
      if (!memberNo) return fail(USAGE);
      const active = cmd === "aktif";
      const { rows } = await pool.query("UPDATE members SET active = $1 WHERE member_no = $2 RETURNING id", [active, memberNo]);
      if (!rows[0]) return fail(`${memberNo} numaralı ortak bulunamadı.`);
      if (!active) await pool.query("DELETE FROM sessions WHERE member_id = $1", [rows[0].id]);
      return console.log(`${memberNo} ${active ? "yeniden açıldı" : "kapatıldı"}.`);
    }
    case "liste": {
      const { rows } = await pool.query(
        `SELECT member_no, full_name, active, must_change_password, last_login_at FROM members ORDER BY member_no`
      );
      if (!rows.length) return console.log("Kayıtlı ortak yok.");
      return console.table(rows.map((r) => ({
        "Ortak no": r.member_no,
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
