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

// Soyadı + adın ilk iki harfi: Ahmet Yılmaz -> yilmazah
export function usernameFor(firstName, lastName) {
  return normalizeMemberNo(lastName) + normalizeMemberNo(firstName).slice(0, 2);
}
