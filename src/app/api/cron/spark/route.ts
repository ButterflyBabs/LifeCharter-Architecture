import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily: refresh LC Spark's long-lived Instagram tokens (60-day life) that expire
// within 10 days, so connected accounts keep answering DMs.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const soon = new Date(Date.now() + 10 * 86_400_000).toISOString();
  const { data: rows } = await db
    .from("spark_settings")
    .select("master_plan_id, ig_access_token, ig_token_expires_at")
    .not("ig_access_token", "is", null)
    .lte("ig_token_expires_at", soon)
    .limit(200);
  let refreshed = 0;
  let failed = 0;
  for (const r of rows ?? []) {
    try {
      const p = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: r.ig_access_token as string });
      const res = await fetch(`https://graph.instagram.com/refresh_access_token?${p.toString()}`, { signal: AbortSignal.timeout(10_000) });
      const j = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
      if (!res.ok || !j.access_token) {
        failed++;
        console.error("spark ig refresh:", r.master_plan_id, res.status);
        continue;
      }
      await db
        .from("spark_settings")
        .update({ ig_access_token: j.access_token, ig_token_expires_at: new Date(Date.now() + (j.expires_in ?? 60 * 86400) * 1000).toISOString(), updated_at: new Date().toISOString() })
        .eq("master_plan_id", r.master_plan_id);
      refreshed++;
    } catch (e) {
      failed++;
      console.error("spark ig refresh:", e instanceof Error ? e.message : e);
    }
  }
  return NextResponse.json({ refreshed, failed });
}
export const GET = run;
export const POST = run;
