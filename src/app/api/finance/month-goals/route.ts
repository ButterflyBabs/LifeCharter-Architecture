import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// Month-by-month income goals (a ramp). Months with no goal use the general monthly goal.
//   GET                          → { goals: [{ month: "YYYY-MM", amount }] } (all of them, oldest first)
//   POST { goals: [{ month, amount }] }  → set many at once (amount 0 or blank clears that month)
//   DELETE                       → clear every month goal (back to the one monthly goal)
export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ goals: [] });
  const { data } = await createServerClient().from("finance_month_goals").select("month, amount").eq("master_plan_id", planId).order("month");
  return NextResponse.json({ goals: ((data ?? []) as { month: string; amount: number | string }[]).map((g) => ({ month: g.month, amount: Number(g.amount) })) });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const list = (Array.isArray(b.goals) ? b.goals : []).slice(0, 120) as { month?: unknown; amount?: unknown }[];
  const db = createServerClient();
  const set: { master_plan_id: string; month: string; amount: number; updated_at: string }[] = [];
  const clear: string[] = [];
  for (const g of list) {
    const month = typeof g.month === "string" ? g.month : "";
    const amount = Number(g.amount);
    if (!MONTH_RE.test(month)) return NextResponse.json({ error: "Each goal needs a month like 2026-10." }, { status: 400 });
    if (!isFinite(amount) || amount < 0) return NextResponse.json({ error: "Enter valid amounts." }, { status: 400 });
    if (amount > 0) set.push({ master_plan_id: planId, month, amount, updated_at: new Date().toISOString() });
    else clear.push(month);
  }
  if (set.length) {
    const { error } = await db.from("finance_month_goals").upsert(set, { onConflict: "master_plan_id,month" });
    if (error) return NextResponse.json({ error: "Couldn't save the goals." }, { status: 500 });
  }
  if (clear.length) await db.from("finance_month_goals").delete().eq("master_plan_id", planId).in("month", clear);
  return NextResponse.json({ ok: true, saved: set.length, cleared: clear.length });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await createServerClient().from("finance_month_goals").delete().eq("master_plan_id", planId);
  return NextResponse.json({ ok: true });
}
