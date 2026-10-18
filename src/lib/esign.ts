import { createHash, randomBytes, randomInt } from "crypto";

// E-signature (task 1072), the pure parts: placeholders, tokens and codes, the consent wording and signer order.
// Legal basics (US ESIGN Act / UETA): the signer shows intent to sign, agrees to do business electronically, the
// signature is tied to the record, and every signer can keep a copy. The consent and certificate wording below are
// DRAFTS for Babs's attorney to approve before real use.

export const CONSENT_VERSION = "2026-10-18-draft";
export const consentText = (business: string) =>
  `I agree to use electronic records and signatures for this document with ${business}. I understand that my electronic signature is as legally binding as a handwritten one, that I can download a copy of the signed document, and that I may ask ${business} for a paper copy or to sign on paper instead.`;
export const SIGN_AGREE = "By pressing Sign, I adopt the signature above as my own and agree to sign this document electronically.";

export const CODE_MINUTES = 15;
export const CODE_MAX_TRIES = 5;

/** A private link token (sent by email) and the hash kept in the database. */
export function newToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashToken(token) };
}
export const hashToken = (t: string) => createHash("sha256").update(`sign:${t}`).digest("hex");

/** A 6-digit code and its hash (tied to the signer, so a code for one signer never works for another). */
export function newCode(signerId: string): { code: string; hash: string } {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  return { code, hash: hashCode(signerId, code) };
}
export const hashCode = (signerId: string, code: string) => createHash("sha256").update(`code:${signerId}:${code.replace(/\D/g, "")}`).digest("hex");

export const sha256 = (bytes: Uint8Array | Buffer | string) => createHash("sha256").update(bytes).digest("hex");

/** {{Placeholder}} names in a document, in order, without repeats. */
export function placeholders(body: string): string[] {
  const out: string[] = [];
  const re = /\{\{\s*([^{}]{1,60}?)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}

/** Fill {{Placeholders}} from the values given (case-insensitive names); unknown ones stay as they are. */
export function fillPlaceholders(body: string, values: Record<string, string>): string {
  const lower = new Map(Object.entries(values).map(([k, v]) => [k.toLowerCase().trim(), v]));
  return body.replace(/\{\{\s*([^{}]{1,60}?)\s*\}\}/g, (all, name: string) => {
    const v = lower.get(name.toLowerCase().trim());
    return v && v.trim() ? v.trim() : all;
  });
}

export interface SignerLike { order_no: number; status: string }
/** Who signs now: everyone in the lowest order number that isn't finished (same number = sign in any order). */
export function currentRound<T extends SignerLike>(signers: T[]): T[] {
  const open = signers.filter((s) => s.status !== "signed");
  if (!open.length) return [];
  const n = Math.min(...open.map((s) => s.order_no));
  return open.filter((s) => s.order_no === n);
}
export const allSigned = (signers: SignerLike[]) => signers.length > 0 && signers.every((s) => s.status === "signed");

/** A typed signature must look like a name. */
export const validTypedSignature = (s: string) => /[A-Za-z\u00C0-\u024F]/.test(s) && s.trim().length >= 2 && s.trim().length <= 80;

/** A drawn signature arrives as a small PNG data URL. */
export const validDrawnSignature = (s: string) => /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s) && s.length > 200 && s.length < 400_000;

/** Characters the standard PDF fonts can print (others become "?"), so the sealed PDF never fails to build. */
export const pdfSafe = (s: string) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "?") // an emoji counts once, not twice
    .replace(/[^\x09\x0A\x0D\x20-\x7E¡-ÿ]/g, "?");

export const STATUS_LABEL: Record<string, string> = { draft: "Draft", sent: "Out for signature", completed: "Signed by everyone", declined: "Declined", voided: "Voided", expired: "Expired" };
