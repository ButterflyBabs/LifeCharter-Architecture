import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planSegmentIds } from "@/lib/planScope";

export const dynamic = "force-dynamic";

// Record a revenue entry for a segment/period (feeds Financial Pulse + this page).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const body = await request.json().catch(() => ({}));
  if (!body?.segmentId || !body?.periodStart || !body?.periodEnd) {
    return NextResponse.json({ error: "segmentId, periodStart, periodEnd required" }, { status: 400 });
  }
  const masterPlanId = await resolveMasterPlanId();
  const segmentIds = masterPlanId ? await planSegmentIds(masterPlanId) : [];
  if (!segmentIds.includes(Number(body.segmentId))) {
    return NextResponse.json({ error: "unknown segment" }, { status: 404 });
  }
  const { data, error } = await supabase
    .from("segment_revenue")
    .insert({
      segment_id: body.segmentId,
      period_start: body.periodStart,
      period_end: body.periodEnd,
      revenue_actual: body.revenueActual ?? null,
      revenue_target: body.revenueTarget ?? null,
    })
    .select("id")
    .single();
  if (error) {
    console.error("POST /api/revenue-by-segment:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data?.id, ok: true });
}

// Revenue drill-down: this-month actual vs target per business/segment,
// with last-month totals for the month-over-month comparison.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const segmentIds = masterPlanId ? await planSegmentIds(masterPlanId) : [];
  if (segmentIds.length === 0) {
    return NextResponse.json({ thisMonthTotal: 0, lastMonthTotal: 0, changePct: null, businesses: [] });
  }
  const { data, error } = await supabase
    .from("segment_revenue")
    .select(
      "revenue_actual, revenue_target, period_start, " +
        "segment:segments ( id, name, slug, color, business:businesses ( id, name, slug, color ) )"
    )
    .in("segment_id", segmentIds);

  if (error) {
    console.error("GET /api/revenue-by-segment:", error.message);
    return NextResponse.json({ businesses: [], error: error.message }, { status: 200 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  type BizAgg = {
    id: number; name: string; color: string | null;
    thisMonth: number; target: number;
    segments: Map<number, { id: number; name: string; color: string | null; thisMonth: number; target: number; lastMonth: number }>;
  };
  const businesses = new Map<number, BizAgg>();
  let thisMonthTotal = 0;
  let lastMonthTotal = 0;

  for (const row of (data ?? []) as unknown as Array<Record<string, unknown>>) {
    const seg = row.segment as Record<string, unknown> | null;
    if (!seg) continue;
    const biz = seg.business as Record<string, unknown> | null;
    if (!biz) continue;

    const actual = Number(row.revenue_actual ?? 0);
    const target = Number(row.revenue_target ?? 0);
    const start = new Date(String(row.period_start));
    const isThisMonth = start >= monthStart;
    const isLastMonth = start >= prevMonthStart && start < monthStart;

    const bizId = Number(biz.id);
    if (!businesses.has(bizId)) {
      businesses.set(bizId, {
        id: bizId, name: String(biz.name), color: (biz.color as string) ?? null,
        thisMonth: 0, target: 0, segments: new Map(),
      });
    }
    const b = businesses.get(bizId)!;
    const segId = Number(seg.id);
    if (!b.segments.has(segId)) {
      b.segments.set(segId, {
        id: segId, name: String(seg.name), color: (seg.color as string) ?? null,
        thisMonth: 0, target: 0, lastMonth: 0,
      });
    }
    const s = b.segments.get(segId)!;
    if (isThisMonth) {
      s.thisMonth += actual; s.target += target;
      b.thisMonth += actual; b.target += target;
      thisMonthTotal += actual;
    } else if (isLastMonth) {
      s.lastMonth += actual;
      lastMonthTotal += actual;
    }
  }

  const result = Array.from(businesses.values())
    .map((b) => ({ ...b, segments: Array.from(b.segments.values()).sort((a, c) => c.thisMonth - a.thisMonth) }))
    .sort((a, c) => c.thisMonth - a.thisMonth);

  const changePct =
    lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : null;

  return NextResponse.json({ thisMonthTotal, lastMonthTotal, changePct, businesses: result });
}
