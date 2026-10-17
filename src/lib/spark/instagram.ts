import { chunkText, parseMetaSignedRequest, signState, validHubSignature, verifyState } from "./messaging";

// Instagram DMs through the "Instagram API with Instagram Login" (graph.instagram.com).
// Env: SPARK_IG_APP_ID, SPARK_IG_APP_SECRET (Instagram app id/secret from the Meta app),
// SPARK_IG_VERIFY_TOKEN (any string, also entered in the Meta webhook setup).

export const IG_GRAPH = "https://graph.instagram.com/v21.0";
export const IG_REDIRECT_URI = "https://lccommandsuite.com/api/spark/instagram/callback";
export const IG_SCOPES = "instagram_business_basic,instagram_business_manage_messages";

export const igConfigured = () => Boolean(process.env.SPARK_IG_APP_ID && process.env.SPARK_IG_APP_SECRET && process.env.SPARK_IG_VERIFY_TOKEN);

// ── Signed OAuth state: which account started the connect, 20 minutes ───────
const stateSecret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || "";
export const signIgState = (planId: string): string => signState("sp", stateSecret(), planId);
export const verifyIgState = (state: string | null): string | null => verifyState("sp", stateSecret(), state);

// Meta signs each webhook POST: X-Hub-Signature-256: sha256=<hex HMAC of the raw body>.
export const validIgSignature = (rawBody: string, header: string | null): boolean => validHubSignature(process.env.SPARK_IG_APP_SECRET, rawBody, header);

export type SendResult = { ok: true } | { ok: false; error: string };

// Instagram DMs are capped at 1,000 characters per message.
export async function sendIgDm(token: string, recipientId: string, text: string): Promise<SendResult> {
  for (const c of chunkText(text, 1000)) {
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
      const detail = res ? (await res.text().catch(() => "")).slice(0, 300) : "no response";
      if (res) console.error("spark ig send:", res.status, detail);
      return { ok: false, error: detail };
    }
  }
  return { ok: true };
}

export async function sendIgMessage(token: string, recipientId: string, text: string): Promise<boolean> {
  return (await sendIgDm(token, recipientId, text)).ok;
}

/** Best effort: the person's Instagram name and @handle, for the conversation list. */
export async function fetchIgProfile(token: string, igsid: string): Promise<{ name: string | null; username: string | null }> {
  const res = await fetch(`${IG_GRAPH}/${encodeURIComponent(igsid)}?fields=name,username`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8_000) }).catch(() => null);
  if (!res?.ok) return { name: null, username: null };
  const j = (await res.json().catch(() => ({}))) as { name?: string; username?: string };
  return { name: j.name?.trim() || null, username: j.username?.trim() || null };
}

// Meta's signed_request (deauthorize + data deletion callbacks): "<sig>.<payload>".
export const parseSignedRequest = (signed: string | null): { user_id?: string | number } | null => parseMetaSignedRequest(process.env.SPARK_IG_APP_SECRET, signed);

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
