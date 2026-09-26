import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// Turns a monthly income goal into the goals the Financial Pulse tracks: the
// monthly goal (an income budget), plus the weekly and yearly goals derived from
// it. The client confirms the number first; this only ever writes to their own plan.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const monthly = Math.round(Number(body.monthly));
  if (!Number.isFinite(monthly) || monthly <= 0 || monthly > 100_000_000) return NextResponse.json({ error: "Enter a valid monthly goal." }, { status: 400 });

  const db = createServerClient();
  const now = new Date().toISOString();

  // Monthly = the overall income budget row.
  const { data: existing } = await db.from("finance_budgets").select("id").eq("master_plan_id", planId).eq("type", "income").eq("category", "").maybeSingle();
  if (existing?.id) await db.from("finance_budgets").update({ amount: monthly, updated_at: now }).eq("id", existing.id);
  else await db.from("finance_budgets").insert({ master_plan_id: planId, type: "income", category: "", amount: monthly });

  const year = monthly * 12;
  const week = Math.round(year / 52);
  const { error } = await db.from("finance_goals").upsert(
    [
      { master_plan_id: planId, period: "year", amount: year, updated_at: now },
      { master_plan_id: planId, period: "week", amount: week, updated_at: now },
    ],
    { onConflict: "master_plan_id,period" }
  );
  if (error) return NextResponse.json({ error: "Couldn't save the goals." }, { status: 500 });
  return NextResponse.json({ ok: true, monthly, week, year });
}
