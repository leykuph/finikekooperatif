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

export function normalizeMemberNo(value) {
  return String(value ?? "").trim().toUpperCase();
}
