import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// GET — the categories this account already uses (budget categories, ledger entries and bills), one
// spelling each, so every Add form can suggest the same list and the reports don't split "Software"/"software".
export async function GET(request: Request) {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ expense: [], income: [] });
  const type = new URL(request.url).searchParams.get("type");
  const db = createServerClient();
  const [ent, bud, bills] = await Promise.all([
    db.from("finance_entries").select("type, category").eq("master_plan_id", masterPlanId).not("category", "is", null).limit(5000),
    db.from("finance_budgets").select("type, category").eq("master_plan_id", masterPlanId).not("category", "is", null),
    db.from("finance_bills").select("category").eq("master_plan_id", masterPlanId).eq("active", true).not("category", "is", null),
  ]);
  const seen: Record<"expense" | "income", Map<string, { name: string; n: number }>> = { expense: new Map(), income: new Map() };
  const add = (t: "expense" | "income", raw: string | null, w: number) => {
    const name = (raw || "").trim();
    if (!name) return;
    const k = name.toLowerCase();
    const cur = seen[t].get(k);
    // Keep the most common spelling.
    if (!cur) seen[t].set(k, { name, n: w });
    else {
      if (w > 0 && name !== cur.name && /[A-Z]/.test(name[0]) && !/[A-Z]/.test(cur.name[0])) cur.name = name;
      cur.n += w;
    }
  };
  for (const r of (ent.data || []) as { type: string; category: string | null }[]) add(r.type === "income" ? "income" : "expense", r.category, 1);
  for (const r of (bud.data || []) as { type: string; category: string | null }[]) add(r.type === "income" ? "income" : "expense", r.category, 5);
  for (const r of (bills.data || []) as { category: string | null }[]) add("expense", r.category, 2);
  const list = (t: "expense" | "income") =>
    Array.from(seen[t].values())
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))
      .map((c) => c.name)
      .slice(0, 80);
  if (type === "income") return NextResponse.json({ categories: list("income") });
  if (type === "expense") return NextResponse.json({ categories: list("expense") });
  return NextResponse.json({ expense: list("expense"), income: list("income") });
}
