// Access to the investor page (/investor-brief and its PDFs) ONLY. Each approved person has their own access code
// (stored as a scrypt hash in investor_access). This file runs on the Edge (middleware) and in Node: REST for the
// record, WebCrypto for the signed cookie. Hashing and checking live in src/lib/investorAccessNode.ts.
export const IB_COOKIE = "ib_access";
export const IB_COOKIE_DAYS = 30;
export const IB_FORM_ID = "44e8b40e-5f19-4d83-aa2c-f49c374fec92"; // the Suite CRM form "Investor access request"

export type IbRecord = { status: string; code_v: string | null };

function rest(): { url: string; svc: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && svc ? { url, svc } : null;
}

export async function readIbRecord(email: string): Promise<IbRecord | null> {
  const r = rest();
  if (!r) return null;
  try {
    const res = await fetch(`${r.url}/rest/v1/investor_access?select=status,code_v&email=eq.${encodeURIComponent(email.toLowerCase())}`, {
      headers: { apikey: r.svc, Authorization: `Bearer ${r.svc}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as IbRecord[];
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

function secret(): string | null {
  return process.env.INVESTOR_ACCESS_SECRET || process.env.CRON_SECRET || null;
}
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
const b64u = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));

async function hmac(message: string): Promise<string | null> {
  const s = secret();
  if (!s) return null;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(s), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function signAccessToken(email: string, v: string): Promise<string | null> {
  const exp = Date.now() + IB_COOKIE_DAYS * 86_400_000;
  const e = b64u(email.toLowerCase());
  const sig = await hmac(`${exp}.${e}.${v}`);
  return sig ? `${exp}.${e}.${v}.${sig}` : null;
}

// Valid only while that person is still approved, their code has not been re-issued, and the cookie has not expired.
export async function accessTokenValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [exp, e, v, sig] = parts;
  if (!(Number(exp) > Date.now())) return false;
  const want = await hmac(`${exp}.${e}.${v}`);
  if (!want || !same(want, sig)) return false;
  let email = "";
  try {
    email = unb64u(e);
  } catch {
    return false;
  }
  const rec = await readIbRecord(email);
  return Boolean(rec && rec.status === "approved" && rec.code_v === v);
}
