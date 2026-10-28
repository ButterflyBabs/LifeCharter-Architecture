import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { logActivity } from "@/lib/activity";
import { formatMoney } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";

export const dynamic = "force-dynamic";

// Delete a finance entry (scoped to the client's master plan).
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const { data: gone, error } = await supabase
    .from("finance_entries")
    .delete()
    .eq("id", params.id)
    .eq("master_plan_id", masterPlanId)
    .select("id, type, amount, currency, category");
  if (error) {
    console.error("DELETE /api/finance/entries/[id]:", error.message);
    return NextResponse.json({ error: "Couldn't delete the entry." }, { status: 500 });
  }
  const row = gone?.[0];
  if (row) {
    const type = row.type === "income" ? "income" : "expense";
    await logActivity({ masterPlanId, action: "deleted", entityType: type, entityId: row.id as string, summary: `Deleted ${type} ${formatMoney(Number(row.amount), row.currency as string, { home: await homeCurrency(masterPlanId, supabase), cents: true })}${row.category ? ` (${row.category})` : ""}` });
  }
  return NextResponse.json({ ok: true });
}
