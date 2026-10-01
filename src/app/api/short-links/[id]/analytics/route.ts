import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "@/app/api/crm/guard";

export const dynamic = "force-dynamic";

// One short link's click analytics: a 30-day trend and where clicks came from
// (referrer hostname). Read-only off the click log (short_link_clicks) — the
// link's own click_count stays the fast, authoritative total shown in the list.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();

  const { data: link } = await db
    .from("short_links")
    .select("id, code, click_count")
    .eq("id", params.id)
    .eq("master_plan_id", a.planId)
    .maybeSingle();
  if (!link) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const SAMPLE_LIMIT = 2000;
  const { data: rows } = await db
    .from("short_link_clicks")
    .select("referrer, created_at")
    .eq("short_link_id", link.id)
    .order("created_at", { ascending: false })
    .limit(SAMPLE_LIMIT);
  const clicks = (rows ?? []) as { referrer: string | null; created_at: string }[];

  // Last 30 days, UTC calendar days, zero-filled so the chart never has gaps.
  const byDay = new Map<string, number>();
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const c of clicks) {
    const day = c.created_at.slice(0, 10);
    if (byDay.has(day)) byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  // Where clicks came from — grouped by the referring page's domain.
  const refCounts = new Map<string, number>();
  for (const c of clicks) {
    let key = "Direct or unknown";
    if (c.referrer) {
      try {
        key = new URL(c.referrer).hostname.replace(/^www\./, "");
      } catch {
        key = c.referrer.slice(0, 60);
      }
    }
    refCounts.set(key, (refCounts.get(key) ?? 0) + 1);
  }
  const byReferrer = Array.from(refCounts.entries()).sort((x, y) => y[1] - x[1]).map(([referrer, count]) => ({ referrer, count }));

  return NextResponse.json({
    code: link.code,
    clickCount: link.click_count,
    byDay: Array.from(byDay.entries()).map(([date, count]) => ({ date, count })),
    byReferrer,
    sampleSize: clicks.length,
    sampled: clicks.length >= SAMPLE_LIMIT, // the trend/referrer split covers the most recent 2,000 clicks; the total count above is always exact
  });
}
