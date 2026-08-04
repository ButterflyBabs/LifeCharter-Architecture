import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

type Row = { id: string; type: string; category: string | null; amount: number | string | null };

function serialize(r: Row) {
  return {
    id: r.id,
    type: r.type === "income" ? "income" : "expense",
    category: r.category || "",
    amount: Number(r.amount ?? 0),
  };
}

// GET — all budget rows for this client.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const { data, error } = await supabase
    .from("finance_budgets")
    .select("id, type, category, amount")
    .eq("master_plan_id", masterPlanId)
    .order("type", { ascending: true })
    .order("category", { ascending: true });
  if (error) {
    console.error("GET /api/finance/budgets:", error.message);
    return NextResponse.json({ budgets: [] }, { status: 200 });
  }
  return NextResponse.json({ budgets: ((data || []) as Row[]).map(serialize) });
}

// POST — set a budget (upsert by type + category). category "" = overall.
// An amount of 0 clears that budget row.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));

  const type = body.type === "income" ? "income" : "expense";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const amount = Number(body.amount);
  if (!isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("finance_budgets")
    .select("id")
    .eq("master_plan_id", masterPlanId)
    .eq("type", type)
    .ilike("category", category || "")
    .maybeSingle();

  // Amount 0 → clear the budget.
  if (amount === 0) {
    if (existing?.id) await supabase.from("finance_budgets").delete().eq("id", existing.id);
    return NextResponse.json({ cleared: true });
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("finance_budgets")
      .update({ amount, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: "Couldn't save the budget." }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("finance_budgets")
      .insert({ master_plan_id: masterPlanId, type, category, amount });
    if (error) return NextResponse.json({ error: "Couldn't save the budget." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, type, category, amount });
}

// DELETE — remove a budget row by id.
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase
    .from("finance_budgets")
    .delete()
    .eq("id", id)
    .eq("master_plan_id", masterPlanId);
  if (error) return NextResponse.json({ error: "Couldn't delete." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
