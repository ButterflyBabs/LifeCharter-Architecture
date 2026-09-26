import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";

// Always query live data per request (never prerender/cache the aggregate).
export const dynamic = "force-dynamic";

// Financial Pulse data for the Executive Home.
// Aggregates the segment_revenue table (introduced in the multi_business_model
// migration) into this-month vs last-month actuals plus a weekly mini-series.
//
// Revenue is not yet recorded, so this returns hasData:false and the card shows
// an honest empty state rather than fabricated numbers. Once revenue rows exist
// (entered in Finance, or synced from Stripe), the card populates automatically.

type RevenueRow = { revenue_actual: number | string | null; period_start: string };

export async function GET(request: Request) {
  const supabase = createServerClient();
  // Revenue = income entries from the finance ledger, so the Home card and
  // Morning Brief agree with the Financial Pulse dashboard.
  // Scoped to the signed-in client's own plan (or the demo plan under /demo) —
  // never every account's income added together.
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ hasData: false });
  const { data, error } = await supabase
    .from("finance_entries")
    .select("amount, occurred_on")
    .eq("type", "income")
    .eq("master_plan_id", masterPlanId);

  if (error) {
    console.error("GET /api/financial-pulse:", error.message);
    return NextResponse.json({ hasData: false, error: error.message }, { status: 200 });
  }

  const rows = ((data ?? []) as { amount: number | string | null; occurred_on: string }[]).map(
    (r) => ({ revenue_actual: r.amount, period_start: r.occurred_on })
  ) as RevenueRow[];
  // "This month" and the week buckets follow the viewer's own time zone, so an
  // entry dated the last evening of a month never lands in the wrong one.
  // occurred_on is a plain date, so compare it as text rather than as a Date.
  const tz = await resolveUserTimeZone(new URL(request.url).searchParams.get("tz"));
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const key = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
  const thisKey = key(year, month);
  const prevKey = month === 1 ? key(year - 1, 12) : key(year, month - 1);

  let thisMonth = 0;
  let lastMonth = 0;
  const weekly = [0, 0, 0, 0];
  for (const r of rows) {
    const amount = Number(r.revenue_actual ?? 0);
    const day = String(r.period_start);
    if (day.slice(0, 7) === thisKey) {
      thisMonth += amount;
      const week = Math.min(3, Math.floor((Number(day.slice(8, 10)) - 1) / 7));
      weekly[week] += amount;
    } else if (day.slice(0, 7) === prevKey) {
      lastMonth += amount;
    }
  }

  const changePct =
    lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  return NextResponse.json({
    hasData: rows.length > 0,
    thisMonth,
    lastMonth,
    changePct,
    weekly,
  });
}
