import { createHmac, timingSafeEqual } from "crypto";

// Small helpers shared by the Instagram and Facebook channels (and tested on their own).

/** Splits a reply into chunks a platform will accept (a space near the limit when there is one), at most `maxChunks`. */
export function chunkText(text: string, limit: number, maxChunks = 3): string[] {
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length > 0 && chunks.length < maxChunks) {
    let cutAt = rest.length <= limit ? rest.length : rest.lastIndexOf(" ", limit);
    if (cutAt < limit / 2) cutAt = Math.min(limit, rest.length);
    chunks.push(rest.slice(0, cutAt).trim());
    rest = rest.slice(cutAt).trim();
  }
  return chunks;
}

/** Meta signs each webhook POST: X-Hub-Signature-256: sha256=<hex HMAC of the raw body>. */
export function validHubSignature(secret: string | undefined, rawBody: string, header: string | null): boolean {
  if (!secret || !header || !header.startsWith("sha256=")) return false;
  const got = Buffer.from(header.slice(7), "hex");
  const want = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  return got.length === want.length && timingSafeEqual(got, want);
}

/** Meta's signed_request ("<sig>.<payload>", both base64url, sig = HMAC-SHA256(payload, app secret)). Returns the payload or null. */
export function parseMetaSignedRequest(secret: string | undefined, signed: string | null): { user_id?: string | number } | null {
  if (!secret || !signed || !signed.includes(".")) return null;
  const [sig, payload] = signed.split(".", 2);
  const got = Buffer.from(sig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const want = createHmac("sha256", secret).update(payload).digest();
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    return JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  } catch {
    return null;
  }
}

/** Signed, 20-minute OAuth state that says which account started a connect. `prefix` keeps Instagram and Facebook states apart. */
export function signState(prefix: string, secret: string, planId: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ p: planId, t: now })).toString("base64url");
  return `${prefix}.${payload}.${createHmac("sha256", secret).update(`${prefix}.${payload}`).digest("base64url")}`;
}

export function verifyState(prefix: string, secret: string, state: string | null, now = Date.now()): string | null {
  if (!state || !secret) return null;
  const [pre, payload, sig] = state.split(".");
  if (pre !== prefix || !payload || !sig) return null;
  const want = createHmac("sha256", secret).update(`${prefix}.${payload}`).digest("base64url");
  if (Buffer.from(sig).length !== Buffer.from(want).length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try {
    const o = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof o.p !== "string" || typeof o.t !== "number" || now - o.t > 20 * 60 * 1000) return null;
    return o.p;
  } catch {
    return null;
  }
}

/** Instagram and Messenger only let a business answer within 24 hours of the person's last message. */
export const REPLY_WINDOW_MS = 24 * 3_600_000;
export const withinReplyWindow = (lastVisitorAt: string | null | undefined, now = Date.now()): boolean => Boolean(lastVisitorAt) && now - Date.parse(lastVisitorAt as string) < REPLY_WINDOW_MS;
