import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function nowParts(tz: string): { year: number; month: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit" }).formatToParts(
      new Date()
    );
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    return { year: get("year"), month: get("month") };
  } catch {
    const d = new Date();
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  }
}

// A Profit & Loss statement for a month, quarter, or year: income by category,
// expenses by category, and net — computed from the finance ledger.
export async function GET(request: Request) {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const url = new URL(request.url);
  const tz = url.searchParams.get("tz") || "UTC";
  const period = (url.searchParams.get("period") || "month") as "month" | "quarter" | "year";

  const cur = nowParts(tz);
  const year = Number(url.searchParams.get("year")) || cur.year;
  const defaultIndex = period === "quarter" ? Math.ceil(cur.month / 3) : cur.month;
  const index = Number(url.searchParams.get("index")) || defaultIndex;

  let start: Date;
  let end: Date;
  let label: string;
  if (period === "quarter") {
    const sm = (index - 1) * 3;
    start = new Date(Date.UTC(year, sm, 1));
    end = new Date(Date.UTC(year, sm + 3, 1));
    label = `Q${index} ${year}`;
  } else if (period === "year") {
    start = new Date(Date.UTC(year, 0, 1));
    end = new Date(Date.UTC(year + 1, 0, 1));
    label = `${year}`;
  } else {
    start = new Date(Date.UTC(year, index - 1, 1));
    end = new Date(Date.UTC(year, index, 1));
    label = `${MONTHS[index - 1]} ${year}`;
  }
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const startStr = fmt(start);
  const endStr = fmt(end);

  const { data, error } = await supabase
    .from("finance_entries")
    .select("type, amount, category")
    .eq("master_plan_id", masterPlanId)
    .gte("occurred_on", startStr)
    .lt("occurred_on", endStr);

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
    period,
    year,
    index,
    label,
    income: { total: incomeTotal, lines: lines(incomeMap) },
    expense: { total: expenseTotal, lines: lines(expenseMap) },
    net: incomeTotal - expenseTotal,
  });
}
