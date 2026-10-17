import { createServerClient } from "@/lib/supabase/server";
import { chunkText, parseMetaSignedRequest, signState, validHubSignature, verifyState } from "./messaging";
import type { SendResult } from "./instagram";

// Facebook Page messages (Messenger) for LC Spark. Same idea as the Instagram channel: Meta posts each message to a
// webhook, LC Spark answers (or the owner does from the Suite), and the reply goes back through the Page.
// Env (a Facebook app in the Suite's Meta developer account with the Messenger product and Facebook Login):
//   SPARK_FB_APP_ID, SPARK_FB_APP_SECRET, SPARK_FB_VERIFY_TOKEN (any string, also entered in the Meta webhook setup).

export const FB_GRAPH = "https://graph.facebook.com/v21.0";
export const FB_REDIRECT_URI = "https://lccommandsuite.com/api/spark/facebook/callback";
export const FB_SCOPES = "pages_show_list,pages_messaging,pages_manage_metadata";

export const fbConfigured = () => Boolean(process.env.SPARK_FB_APP_ID && process.env.SPARK_FB_APP_SECRET && process.env.SPARK_FB_VERIFY_TOKEN);

const stateSecret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || "";
export const signFbState = (planId: string): string => signState("fb", stateSecret(), planId);
export const verifyFbState = (state: string | null): string | null => verifyState("fb", stateSecret(), state);

export const validFbSignature = (rawBody: string, header: string | null): boolean => validHubSignature(process.env.SPARK_FB_APP_SECRET, rawBody, header);
export const parseFbSignedRequest = (signed: string | null): { user_id?: string | number } | null => parseMetaSignedRequest(process.env.SPARK_FB_APP_SECRET, signed);

// Messenger text messages are capped at 2,000 characters.
export async function sendFbMessage(pageToken: string, recipientId: string, text: string): Promise<SendResult> {
  for (const c of chunkText(text, 1900)) {
    const res = await fetch(`${FB_GRAPH}/me/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pageToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: recipientId }, messaging_type: "RESPONSE", message: { text: c } }),
      signal: AbortSignal.timeout(10_000),
    }).catch((e) => {
      console.error("spark fb send:", e instanceof Error ? e.message : e);
      return null;
    });
    if (!res?.ok) {
      const detail = res ? (await res.text().catch(() => "")).slice(0, 300) : "no response";
      if (res) console.error("spark fb send:", res.status, detail);
      return { ok: false, error: detail };
    }
  }
  return { ok: true };
}

/** Best effort: the person's name, for the conversation list (Messenger shares first and last name). */
export async function fetchFbProfile(pageToken: string, psid: string): Promise<{ first: string | null; full: string | null }> {
  const res = await fetch(`${FB_GRAPH}/${encodeURIComponent(psid)}?fields=first_name,name`, { headers: { Authorization: `Bearer ${pageToken}` }, signal: AbortSignal.timeout(8_000) }).catch(() => null);
  if (!res?.ok) return { first: null, full: null };
  const j = (await res.json().catch(() => ({}))) as { first_name?: string; name?: string };
  return { first: j.first_name?.trim() || null, full: j.name?.trim() || null };
}

export interface FbPage {
  id: string;
  name: string;
  token: string;
}

/** Everything needed after "Continue with Facebook": who they are and which Pages they manage. Throws on a Meta error. */
export async function fbExchangeCode(code: string): Promise<{ userId: string; pages: FbPage[] }> {
  const id = process.env.SPARK_FB_APP_ID!;
  const secret = process.env.SPARK_FB_APP_SECRET!;
  const get = async (path: string, q: Record<string, string>) => {
    const res = await fetch(`${FB_GRAPH}${path}?${new URLSearchParams(q).toString()}`, { signal: AbortSignal.timeout(10_000) });
    const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error(`facebook ${path} ${res.status}`);
    return j;
  };
  const short = await get("/oauth/access_token", { client_id: id, client_secret: secret, redirect_uri: FB_REDIRECT_URI, code });
  const long = await get("/oauth/access_token", { grant_type: "fb_exchange_token", client_id: id, client_secret: secret, fb_exchange_token: String(short.access_token) });
  const userToken = String(long.access_token);
  const me = await get("/me", { fields: "id", access_token: userToken });
  const accounts = (await get("/me/accounts", { fields: "id,name,access_token", limit: "50", access_token: userToken })) as { data?: { id: string; name: string; access_token?: string }[] };
  const pages = (accounts.data ?? []).filter((p) => p.id && p.access_token).map((p) => ({ id: String(p.id), name: String(p.name || p.id), token: String(p.access_token) }));
  return { userId: String(me.id), pages };
}

/** Saves the chosen Page on the account and subscribes it to message events. */
export async function connectFbPage(planId: string, fbUserId: string, page: FbPage): Promise<{ ok: boolean; webhook: boolean }> {
  const sub = await fetch(`${FB_GRAPH}/${encodeURIComponent(page.id)}/subscribed_apps?subscribed_fields=messages`, { method: "POST", headers: { Authorization: `Bearer ${page.token}` }, signal: AbortSignal.timeout(10_000) }).catch(() => null);
  if (!sub?.ok) console.error("spark fb subscribe:", sub?.status, sub ? (await sub.text().catch(() => "")).slice(0, 300) : "no response");
  const db = createServerClient();
  const { error } = await db
    .from("spark_settings")
    .update({ fb_page_id: page.id, fb_page_name: page.name, fb_user_id: fbUserId, fb_access_token: page.token, fb_enabled: true, updated_at: new Date().toISOString() })
    .eq("master_plan_id", planId);
  if (error) console.error("spark fb save:", error.message);
  return { ok: !error, webhook: Boolean(sub?.ok) };
}

// Someone removed the app or asked for their data: forget the Facebook connection for that person's accounts,
// and (for a Messenger sender) their LC Spark Facebook conversations.
export async function forgetFacebookUser(fbUserId: string): Promise<void> {
  const db = createServerClient();
  await db
    .from("spark_settings")
    .update({ fb_enabled: false, fb_page_id: null, fb_page_name: null, fb_user_id: null, fb_access_token: null, updated_at: new Date().toISOString() })
    .eq("fb_user_id", fbUserId);
  await db.from("spark_conversations").delete().eq("channel", "facebook").eq("visitor_key", fbUserId);
}
