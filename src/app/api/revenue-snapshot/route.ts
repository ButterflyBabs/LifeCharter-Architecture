import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { nowParts, MONTHS } from "@/lib/finance/period";

export const dynamic = "force-dynamic";

// The Revenue Snapshot card on Business Alignment, from THIS client's own Finance
// Center and Sales Activities — nothing is filled in for them.
//   • the last six months of income and expenses
//   • this month against the same stretch of last month
//   • what their won deals and outreach add up to
export async function GET(request: Request) {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ hasData: false, months: [], kpis: null });
  const tz = await resolveUserTimeZone(new URL(request.url).searchParams.get("tz"));
  const { year, month, day } = nowParts(tz);
  const db = createServerClient();

  const key = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
  const months: { key: string; label: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    months.push({ key: key(d.getUTCFullYear(), d.getUTCMonth() + 1), label: MONTHS[d.getUTCMonth()].slice(0, 3), income: 0, expense: 0 });
  }
  const since = `${months[0].key}-01`;
  const [{ data: entries }, { data: acts }] = await Promise.all([
    db.from("finance_entries").select("type, amount, occurred_on").eq("master_plan_id", planId).gte("occurred_on", since).limit(20000),
    db.from("sales_activities").select("outcome, estimated_value").eq("master_plan_id", planId),
  ]);

  const byKey = new Map(months.map((m) => [m.key, m]));
  const prevKey = months[months.length - 2].key;
  let prevSamePeriod = 0; // income in last month, up to the same day of the month as today
  for (const e of (entries ?? []) as { type: string; amount: number | string | null; occurred_on: string }[]) {
    const m = byKey.get(e.occurred_on.slice(0, 7));
    if (!m) continue;
    const a = Number(e.amount ?? 0);
    if (e.type === "income") {
      m.income += a;
      if (m.key === prevKey && Number(e.occurred_on.slice(8, 10)) <= day) prevSamePeriod += a;
    } else m.expense += a;
  }

  const cur = months[months.length - 1];
  const hasData = months.some((m) => m.income > 0 || m.expense > 0);
  const revChange = prevSamePeriod > 0 ? Math.round(((cur.income - prevSamePeriod) / prevSamePeriod) * 100) : null;
  const net = cur.income - cur.expense;

  let wonCount = 0, wonValue = 0, contacted = 0;
  for (const a of (acts ?? []) as { outcome: string | null; estimated_value: number | string | null }[]) {
    if (a.outcome && a.outcome !== "no_answer") contacted += 1;
    if (a.outcome === "won") {
      wonCount += 1;
      wonValue += Number(a.estimated_value ?? 0);
    }
  }

  return NextResponse.json({
    hasData,
    months: months.map((m) => ({ month: m.label, income: Math.round(m.income), expense: Math.round(m.expense) })),
    kpis: {
      monthIncome: Math.round(cur.income),
      monthIncomeChangePct: revChange, // vs the same days of last month; null when there's nothing to compare to
      monthNet: Math.round(net),
      monthMarginPct: cur.income > 0 ? Math.round((net / cur.income) * 100) : null,
      avgDealSize: wonCount > 0 && wonValue > 0 ? Math.round(wonValue / wonCount) : null,
      wonCount,
      conversionPct: contacted > 0 ? Math.round((wonCount / contacted) * 100) : null,
      contacted,
    },
  });
}
