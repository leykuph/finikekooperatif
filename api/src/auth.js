import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";
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

// Karışabilecek karakterler (0/O, 1/l/I) olmadan, telefonda kolay yazılan geçici şifre: xxxx-xxxx-xxxx
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export function temporaryPassword() {
  const groups = [];
  for (let g = 0; g < 3; g++) {
    let s = "";
    for (let i = 0; i < 4; i++) s += ALPHABET[randomInt(ALPHABET.length)];
    groups.push(s);
  }
  return groups.join("-");
}
