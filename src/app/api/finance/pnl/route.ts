import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { periodRange, type Period } from "@/lib/finance/period";
import { currentBusiness, businessMoneyFilter } from "@/lib/businessScope";
import { otherCurrency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";
import { inHome } from "@/lib/finance/money";

export const dynamic = "force-dynamic";

// A Profit & Loss statement for a week, month, quarter, or year: income by
// category, expenses by category, and net — computed from the finance ledger.
// Currency (task 1520): the statement is the home currency only; the other currency gets its own small statement
// in `other` (null when it has nothing in the period). The two are never added together.
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
    end: url.searchParams.get("end") || undefined,
  });

  const scope = masterPlanId ? await currentBusiness(masterPlanId) : null;
  let pnlQ = supabase
    .from("finance_entries")
    .select("type, amount, currency, category, vendor")
    .eq("master_plan_id", masterPlanId)
    .gte("occurred_on", range.startStr)
    .lt("occurred_on", range.endStr);
  if (scope) pnlQ = pnlQ.or(businessMoneyFilter(scope));
  const { data, error } = await pnlQ;

  if (error) {
    console.error("GET /api/finance/pnl:", error.message);
    return NextResponse.json({ error: "Couldn't build the P&L." }, { status: 200 });
  }

  type R = { type: string; amount: number | string | null; currency: string | null; category: string | null; vendor: string | null };
  const lines = (m: Record<string, number>) =>
    Object.entries(m)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  const sum = (m: Record<string, number>) => Object.values(m).reduce((s, n) => s + n, 0);
  const statement = (rows: R[]) => {
    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};
    const incomeFrom: Record<string, number> = {};
    const expenseTo: Record<string, number> = {};
    for (const r of rows) {
      const amt = Number(r.amount ?? 0);
      const cat = (r.category || "Uncategorized").trim() || "Uncategorized";
      const map = r.type === "income" ? incomeMap : expenseMap;
      map[cat] = (map[cat] || 0) + amt;
      const who = (r.vendor || "").trim();
      if (who) {
        const byWho = r.type === "income" ? incomeFrom : expenseTo;
        byWho[who] = (byWho[who] || 0) + amt;
      }
    }
    const incomeTotal = sum(incomeMap);
    const expenseTotal = sum(expenseMap);
    return {
      income: { total: incomeTotal, lines: lines(incomeMap) },
      expense: { total: expenseTotal, lines: lines(expenseMap) },
      net: incomeTotal - expenseTotal,
      parties: { income: lines(incomeFrom), expense: lines(expenseTo) },
    };
  };

  const home = await homeCurrency(masterPlanId, supabase);
  const all = (data || []) as R[];
  const mine = statement(all.filter((r) => inHome(r, home)));
  const otherRows = all.filter((r) => !inHome(r, home));

  return NextResponse.json({
    period: range.period,
    year: range.year,
    index: range.index,
    weekStart: range.weekStart,
    label: range.label,
    currency: home,
    income: mine.income,
    expense: mine.expense,
    net: mine.net,
    business: scope ? scope.name : null,
    // Who paid you / who you paid (only entries that have a name).
    parties: mine.parties,
    // The other currency's statement, same shape, kept apart.
    other: otherRows.length ? { currency: otherCurrency(home), ...statement(otherRows) } : null,
  });
}
