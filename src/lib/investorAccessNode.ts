import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alike characters

// A readable one-person code such as K7QM-X3PD-9WRA.
export function newCode(): string {
  const b = randomBytes(12);
  const chars = Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export function hashCode(code: string): { hash: string; salt: string; v: string } {
  const salt = randomBytes(16).toString("hex");
  return { hash: scryptSync(normalize(code), salt, 64).toString("hex"), salt, v: randomBytes(8).toString("hex") };
}

const normalize = (c: string) => c.trim().toUpperCase().replace(/\s+/g, "");

export function codeMatches(code: string, rec: { code_hash: string | null; code_salt: string | null }): boolean {
  if (!rec.code_hash || !rec.code_salt) return false;
  try {
    const got = scryptSync(normalize(code), rec.code_salt, 64);
    const want = Buffer.from(rec.code_hash, "hex");
    return got.length === want.length && timingSafeEqual(got, want);
  } catch {
    return false;
  }
}
