import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

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

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("segment_revenue")
    .select("revenue_actual, period_start");

  if (error) {
    console.error("GET /api/financial-pulse:", error.message);
    return NextResponse.json({ hasData: false, error: error.message }, { status: 200 });
  }

  const rows = (data ?? []) as RevenueRow[];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let thisMonth = 0;
  let lastMonth = 0;
  const weekly = [0, 0, 0, 0];
  for (const r of rows) {
    const amount = Number(r.revenue_actual ?? 0);
    const start = new Date(r.period_start);
    if (start >= monthStart) {
      thisMonth += amount;
      const week = Math.min(3, Math.floor((start.getDate() - 1) / 7));
      weekly[week] += amount;
    } else if (start >= prevMonthStart && start < monthStart) {
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
