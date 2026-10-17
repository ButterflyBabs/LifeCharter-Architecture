import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sparkAccount } from "@/lib/spark/guard";
import { ensureSettings } from "@/lib/spark/settings";
import { connectFbPage, fbConfigured, fbExchangeCode, verifyFbState } from "@/lib/spark/facebook";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Facebook's OAuth return. Trusts only its signed state (which account started the connect) AND the signed-in owner of that
// same account. One Page: connected at once. Several: the owner picks one on the LC Spark page (spark_fb_pending, 15 minutes).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = (status: string) => NextResponse.redirect(new URL(`/lc-spark?tab=facebook&fb=${status}`, request.url));
  if (!fbConfigured()) return back("not-set-up");
  const planId = verifyFbState(url.searchParams.get("state"));
  if (!planId) return back("expired");
  const a = await sparkAccount();
  if ("denied" in a || a.planId !== planId) return back("denied");
  if (url.searchParams.get("error")) return back("canceled");
  const code = url.searchParams.get("code");
  if (!code) return back("canceled");

  try {
    const { userId, pages, granted } = await fbExchangeCode(code);
    await ensureSettings(planId);
    if (!pages.length) return back(`no-pages&g=${encodeURIComponent(granted.join(",").slice(0, 300) || "none")}`);
    if (pages.length === 1) {
      const r = await connectFbPage(planId, userId, pages[0]);
      return back(!r.ok ? "failed" : r.webhook ? "connected" : "connected-no-webhook");
    }
    await createServerClient()
      .from("spark_fb_pending")
      .upsert({ master_plan_id: planId, fb_user_id: userId, pages, expires_at: new Date(Date.now() + 15 * 60_000).toISOString() }, { onConflict: "master_plan_id" });
    return back("choose");
  } catch (e) {
    console.error("spark fb callback:", e instanceof Error ? e.message : e);
    return back("failed");
  }
}
