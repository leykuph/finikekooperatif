import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

// scrypt: N=2^15, r=8, p=1 (OWASP önerisi). Parametreler özetin içinde saklanır,
// ileride artırılırsa eski özetler doğrulanmaya devam eder.
const N = 2 ** 15, R = 8, P = 1, KEYLEN = 32;
const MAXMEM = 128 * N * R * 2;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize("NFC"), salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password, stored) {
  const [alg, n, r, p, saltB64, keyB64] = String(stored).split("$");
  if (alg !== "scrypt") return false;
  const expected = Buffer.from(keyB64, "base64");
  const key = await scryptAsync(password.normalize("NFC"), Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: 128 * Number(n) * Number(r) * 2,
  });
  return timingSafeEqual(key, expected);
}

// Bilinmeyen kullanıcı adında da aynı süre harcansın diye kullanılan sahte özet.
export const DUMMY_HASH = await hashPassword(randomBytes(16).toString("hex"));

export function newSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

// İlk şifre: TC kimlik numarası + cep telefonunun son 4 hanesi (ör. 12345678950 + 4567).
// TC ve telefon hiçbir yerde saklanmaz; yalnızca bu şifrenin özeti tutulur.
export const INITIAL_PASSWORD_DAYS = 30;
export const INITIAL_PASSWORD_MAX_FAILURES = 10;

export function isValidTc(tc) {
  if (!/^[1-9]\d{10}$/.test(tc)) return false;
  const d = [...tc].map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8], even = d[1] + d[3] + d[5] + d[7];
  if ((((odd * 7 - even) % 10) + 10) % 10 !== d[9]) return false;
  return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];
}

export function initialPassword(tc, phone) {
  tc = String(tc ?? "").replace(/\s/g, "");
  const digits = String(phone ?? "").replace(/\D/g, "").replace(/^(90|0)/, "");
  if (!isValidTc(tc)) throw new Error("TC kimlik numarası geçersiz. 11 haneyi kontrol edin.");
  if (!/^5\d{9}$/.test(digits)) throw new Error("Cep telefonu 5xx xxx xx xx biçiminde olmalı.");
  return tc + digits.slice(-4);
}
