import { createHmac, timingSafeEqual } from "crypto";

// Instagram DMs through the "Instagram API with Instagram Login" (graph.instagram.com).
// Env: SPARK_IG_APP_ID, SPARK_IG_APP_SECRET (Instagram app id/secret from the Meta app),
// SPARK_IG_VERIFY_TOKEN (any string, also entered in the Meta webhook setup).

export const IG_GRAPH = "https://graph.instagram.com/v21.0";
export const IG_REDIRECT_URI = "https://lccommandsuite.com/api/spark/instagram/callback";
export const IG_SCOPES = "instagram_business_basic,instagram_business_manage_messages";

export const igConfigured = () => Boolean(process.env.SPARK_IG_APP_ID && process.env.SPARK_IG_APP_SECRET && process.env.SPARK_IG_VERIFY_TOKEN);

// ── Signed OAuth state: which account started the connect, 20 minutes ───────
const stateSecret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || "";

export function signIgState(planId: string): string {
  const payload = Buffer.from(JSON.stringify({ p: planId, t: Date.now() })).toString("base64url");
  return `sp.${payload}.${createHmac("sha256", stateSecret()).update(`sp.${payload}`).digest("base64url")}`;
}

export function verifyIgState(state: string | null): string | null {
  if (!state || !stateSecret()) return null;
  const [prefix, payload, sig] = state.split(".");
  if (prefix !== "sp" || !payload || !sig) return null;
  const want = createHmac("sha256", stateSecret()).update(`sp.${payload}`).digest("base64url");
  if (Buffer.from(sig).length !== Buffer.from(want).length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try {
    const o = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof o.p !== "string" || typeof o.t !== "number" || Date.now() - o.t > 20 * 60 * 1000) return null;
    return o.p;
  } catch {
    return null;
  }
}

// Meta signs each webhook POST: X-Hub-Signature-256: sha256=<hex HMAC of the raw body>.
export function validIgSignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.SPARK_IG_APP_SECRET;
  if (!secret || !header || !header.startsWith("sha256=")) return false;
  const got = Buffer.from(header.slice(7), "hex");
  const want = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  return got.length === want.length && timingSafeEqual(got, want);
}

// Instagram DMs are capped at 1,000 characters per message.
export async function sendIgMessage(token: string, recipientId: string, text: string): Promise<boolean> {
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length > 0 && chunks.length < 3) {
    let cutAt = rest.length <= 1000 ? rest.length : rest.lastIndexOf(" ", 1000);
    if (cutAt < 500) cutAt = Math.min(1000, rest.length);
    chunks.push(rest.slice(0, cutAt).trim());
    rest = rest.slice(cutAt).trim();
  }
  for (const c of chunks) {
    const res = await fetch(`${IG_GRAPH}/me/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text: c } }),
      signal: AbortSignal.timeout(10_000),
    }).catch((e) => {
      console.error("spark ig send:", e instanceof Error ? e.message : e);
      return null;
    });
    if (!res?.ok) {
      if (res) console.error("spark ig send:", res.status, (await res.text().catch(() => "")).slice(0, 300));
      return false;
    }
  }
  return true;
}

// Meta's signed_request (deauthorize + data deletion callbacks): "<sig>.<payload>",
// both base64url, sig = HMAC-SHA256(payload, app secret). Returns the payload or null.
export function parseSignedRequest(signed: string | null): { user_id?: string | number } | null {
  const secret = process.env.SPARK_IG_APP_SECRET;
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

// Someone removed the app or asked for their data: forget the Instagram connection
// for that account, and (for a DM sender) their LC Spark Instagram conversations.
export async function forgetInstagramUser(igUserId: string): Promise<void> {
  const { createServerClient } = await import("@/lib/supabase/server");
  const db = createServerClient();
  await db
    .from("spark_settings")
    .update({ ig_enabled: false, ig_user_id: null, ig_username: null, ig_access_token: null, ig_token_expires_at: null, updated_at: new Date().toISOString() })
    .eq("ig_user_id", igUserId);
  await db.from("spark_conversations").delete().eq("channel", "instagram").eq("visitor_key", igUserId);
}
