import { readFile } from "node:fs/promises";
import pg from "pg";

// Bağlantı bilgileri standart PG* ortam değişkenlerinden ya da DATABASE_URL'den okunur.
export const pool = new pg.Pool(
  process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL, max: 10 } : { max: 10 }
);

export async function migrate() {
  const sql = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  await pool.query(sql);
}

// Kullanıcı adları Türkçe karakter ve boşluk içermez, küçük harftir: "Yılmaz" -> "yilmaz".
// Girişte de aynı dönüşüm uygulanır; ortak "YILMAZAH", "Yılmazah" ya da "yilmazah" yazabilir.
const ASCII = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
export function normalizeMemberNo(value) {
  return String(value ?? "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]/g, (c) => ASCII[c])
    .replace(/[^a-z0-9]/g, "");
}

// Soyadı + adın ilk iki harfi; doluysa ilk üç, dört... harfi, ad biterse sonuna 2, 3...
// Ahmet Yılmaz -> yilmazah, yilmazahm, yilmazahme, yilmazahmet, yilmazahmet2
export function* usernameCandidates(firstName, lastName) {
  const first = normalizeMemberNo(firstName), last = normalizeMemberNo(lastName);
  if (!first || !last) return;
  for (let n = Math.min(2, first.length); n <= first.length; n++) yield last + first.slice(0, n);
  for (let i = 2; ; i++) yield last + first + i;
}
