import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// Bulk-insert reviewed transactions into the ledger (source = 'import').
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));
  const list = Array.isArray(body.entries) ? body.entries : [];

  const rows = list
    .map((e: Record<string, unknown>) => {
      const amount = Math.abs(Number(e.amount));
      if (!isFinite(amount) || amount <= 0) return null;
      const occurredOn =
        typeof e.occurredOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.occurredOn)
          ? e.occurredOn
          : typeof e.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date)
          ? e.date
          : new Date().toISOString().slice(0, 10);
      return {
        master_plan_id: masterPlanId,
        type: e.type === "income" ? "income" : "expense",
        amount,
        category: typeof e.category === "string" ? e.category.trim() || null : null,
        description: typeof e.description === "string" ? e.description.trim() || null : null,
        occurred_on: occurredOn,
        source: "import",
      };
    })
    .filter(Boolean)
    .slice(0, 500);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid transactions to import." }, { status: 400 });
  }

  const { error } = await supabase.from("finance_entries").insert(rows);
  if (error) {
    console.error("POST /api/finance/import/commit:", error.message);
    return NextResponse.json({ error: "Couldn't import — please try again." }, { status: 500 });
  }
  return NextResponse.json({ imported: rows.length });
}
