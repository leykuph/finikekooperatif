// Ortak hesaplarını yönetme komutları. Sunucuda:
//   kubectl -n finike exec deploy/finike-api -- node src/cli.js <komut> ...
import { pool, migrate, normalizeMemberNo } from "./db.js";
import { createMember, isValidName, resetMember, setMemberActive, welcomeMessage } from "./members.js";
import {
  INITIAL_PASSWORD_DAYS, INITIAL_PASSWORD_MAX_FAILURES, initialPassword, isValidTc, mobileDigits,
} from "./auth.js";

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

function printWelcome(fullName, memberNo, options) {
  const line = "-".repeat(63);
  console.log(`\n${line}\n${welcomeMessage(fullName, memberNo, options)}\n${line}`);
}

// Yalnızca rakam kabul eden, en fazla `max` hane yazdıran alan: "TC kimlik no : 1234567____  7/11"
function readDigits(label, max) {
  return new Promise((resolve) => {
    let value = "";
    const draw = () => process.stdout.write(`\r\x1b[2K${label}${value}${"_".repeat(max - value.length)}  ${value.length}/${max}`);
    const done = (result) => {
      process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.off("data", onData);
      process.stdout.write("\n"); resolve(result);
    };
    const onData = (buf) => {
      for (const ch of buf.toString("utf8")) {
        if (ch === "\u0003") { done(null); process.exit(130); }        // Ctrl+C
        if (ch === "\r" || ch === "\n") { if (value) return done(value); continue; }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);   // Backspace
        else if (/[0-9]/.test(ch) && value.length < max) value += ch;    // harf, boşluk ve fazla hane yok sayılır
      }
      draw();
    };
    process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.on("data", onData);
    draw();
  });
}

async function askUntilValid(label, max, check, error) {
  for (let i = 0; i < 3; i++) {
    const v = await readDigits(label, max);
    if (check(v)) return v;
    console.log(`  ${error}`);
  }
  throw new Error("Üç kez hatalı girildi, işlem iptal edildi.");
}

// TC ve telefon komut satırında verilmezse sorulur; böylece kabuk geçmişine yazılmaz.
async function askInitialPassword(tcArg, phoneArg) {
  let tc = tcArg, phone = phoneArg;
  if (!tc || !phone) {
    if (!process.stdin.isTTY) throw new Error('TC ve telefon için komutu "kubectl exec -it" ile çalıştırın.');
    if (!tc) tc = await askUntilValid("TC kimlik no : ", 11, isValidTc,
      "Geçersiz TC kimlik numarası (11 hane olmalı ve son iki hane kontrol hanesiyle uyuşmalı). Tekrar yazın.");
    if (!phone) phone = await askUntilValid("Cep telefonu : ", 11, (v) => mobileDigits(v) !== null,
      "Cep telefonu 05xx xxx xx xx ya da 5xx xxx xx xx olmalı. Tekrar yazın.");
  }
  return initialPassword(tc, phone);
}

async function run([cmd, ...args]) {
  await migrate();
  const memberNo = normalizeMemberNo(args[0]);

  switch (cmd) {
    case "ekle": {
      const firstName = (args[0] || "").trim(), lastName = (args[1] || "").trim();
      if (args.length < 2 || args.length > 4) return fail(USAGE);
      if (!isValidName(firstName) || !isValidName(lastName)) {
        return fail(`Ad ve soyad yalnızca harflerden oluşmalı: ekle "Ahmet" "Yılmaz"\n\n${USAGE}`);
      }
      const password = await askInitialPassword(args[2], args[3]);
      const { username, base, fullName } = await createMember({ firstName, lastName, password });
      if (username !== base) console.log(`Not: "${base}" kullanımda olduğu için kullanıcı adı "${username}" verildi.`);
      return printWelcome(fullName, username);
    }
    case "sifirla": {
      if (!memberNo) return fail(USAGE);
      const { rows: found } = await pool.query("SELECT 1 FROM members WHERE member_no = $1", [memberNo]);
      if (!found[0]) return fail(`"${memberNo}" kullanıcı adlı ortak bulunamadı.`);
      const password = await askInitialPassword(args[1], args[2]);
      const m = await resetMember(memberNo, password);
      if (!m) return fail(`"${memberNo}" kullanıcı adlı ortak bulunamadı.`);
      return printWelcome(m.fullName, memberNo, { reset: true });
    }
    case "pasif":
    case "aktif": {
      if (!memberNo) return fail(USAGE);
      const active = cmd === "aktif";
      if (!(await setMemberActive(memberNo, active))) return fail(`"${memberNo}" kullanıcı adlı ortak bulunamadı.`);
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
