import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sparkAccount } from "@/lib/spark/guard";
import { ensureSettings } from "@/lib/spark/settings";
import { IG_GRAPH, IG_REDIRECT_URI, igConfigured, verifyIgState } from "@/lib/spark/instagram";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Instagram's OAuth return. Trusts only its signed state (which account started the
// connect) AND the signed-in owner of that same account.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = (status: string) => NextResponse.redirect(new URL(`/lc-spark?tab=instagram&ig=${status}`, request.url));
  if (!igConfigured()) return back("not-set-up");
  const planId = verifyIgState(url.searchParams.get("state"));
  if (!planId) return back("expired");
  const a = await sparkAccount();
  if ("denied" in a || a.planId !== planId) return back("denied");
  if (url.searchParams.get("error")) return back("canceled");
  const code = (url.searchParams.get("code") || "").replace(/#_$/, "");
  if (!code) return back("canceled");

  try {
    const form = new URLSearchParams({
      client_id: process.env.SPARK_IG_APP_ID!,
      client_secret: process.env.SPARK_IG_APP_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: IG_REDIRECT_URI,
      code,
    });
    const shortRes = await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body: form, signal: AbortSignal.timeout(10_000) });
    const short = (await shortRes.json().catch(() => ({}))) as { access_token?: string };
    if (!shortRes.ok || !short.access_token) {
      console.error("spark ig token:", shortRes.status);
      return back("failed");
    }

    const lp = new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: process.env.SPARK_IG_APP_SECRET!, access_token: short.access_token });
    const longRes = await fetch(`https://graph.instagram.com/access_token?${lp.toString()}`, { signal: AbortSignal.timeout(10_000) });
    const long = (await longRes.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
    if (!longRes.ok || !long.access_token) {
      console.error("spark ig long token:", longRes.status);
      return back("failed");
    }
    const token = long.access_token;

    const meRes = await fetch(`${IG_GRAPH}/me?fields=user_id,username&access_token=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(10_000) });
    const me = (await meRes.json().catch(() => ({}))) as { user_id?: string | number; username?: string };
    if (!meRes.ok || !me.user_id) {
      console.error("spark ig me:", meRes.status);
      return back("failed");
    }

    const subRes = await fetch(`${IG_GRAPH}/me/subscribed_apps?subscribed_fields=messages&access_token=${encodeURIComponent(token)}`, { method: "POST", signal: AbortSignal.timeout(10_000) });
    if (!subRes.ok) console.error("spark ig subscribe:", subRes.status, (await subRes.text().catch(() => "")).slice(0, 300));

    await ensureSettings(planId);
    const { error } = await createServerClient()
      .from("spark_settings")
      .update({
        ig_user_id: String(me.user_id),
        ig_username: me.username ?? null,
        ig_access_token: token,
        ig_token_expires_at: new Date(Date.now() + (long.expires_in ?? 60 * 86400) * 1000).toISOString(),
        ig_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("master_plan_id", planId);
    if (error) {
      console.error("spark ig save:", error.message);
      return back("failed");
    }
    return back(subRes.ok ? "connected" : "connected-no-webhook");
  } catch (e) {
    console.error("spark ig callback:", e instanceof Error ? e.message : e);
    return back("failed");
  }
}
