import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { periodRange, type Period } from "@/lib/finance/period";

export const dynamic = "force-dynamic";

// A Profit & Loss statement for a week, month, quarter, or year: income by
// category, expenses by category, and net — computed from the finance ledger.
export async function GET(request: Request) {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const url = new URL(request.url);
  const tz = url.searchParams.get("tz") || "UTC";
  const period = (url.searchParams.get("period") || "month") as Period;

  const range = periodRange(period, {
    tz,
    year: Number(url.searchParams.get("year")) || undefined,
    index: Number(url.searchParams.get("index")) || undefined,
    start: url.searchParams.get("start") || undefined,
  });

  const { data, error } = await supabase
    .from("finance_entries")
    .select("type, amount, category")
    .eq("master_plan_id", masterPlanId)
    .gte("occurred_on", range.startStr)
    .lt("occurred_on", range.endStr);

  if (error) {
    console.error("GET /api/finance/pnl:", error.message);
    return NextResponse.json({ error: "Couldn't build the P&L." }, { status: 200 });
  }

  const incomeMap: Record<string, number> = {};
  const expenseMap: Record<string, number> = {};
  for (const r of (data || []) as { type: string; amount: number | string | null; category: string | null }[]) {
    const amt = Number(r.amount ?? 0);
    const cat = (r.category || "Uncategorized").trim() || "Uncategorized";
    const map = r.type === "income" ? incomeMap : expenseMap;
    map[cat] = (map[cat] || 0) + amt;
  }
  const lines = (m: Record<string, number>) =>
    Object.entries(m)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  const sum = (m: Record<string, number>) => Object.values(m).reduce((s, n) => s + n, 0);

  const incomeTotal = sum(incomeMap);
  const expenseTotal = sum(expenseMap);

  return NextResponse.json({
    period: range.period,
    year: range.year,
    index: range.index,
    weekStart: range.weekStart,
    label: range.label,
    income: { total: incomeTotal, lines: lines(incomeMap) },
    expense: { total: expenseTotal, lines: lines(expenseMap) },
    net: incomeTotal - expenseTotal,
  });
}
