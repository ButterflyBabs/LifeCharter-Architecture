import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { logActivity } from "@/lib/activity";
import { formatMoney } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";
import { parseTax } from "@/lib/finance/gstReport";

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

// PATCH { taxAmount?, taxProvince? } — set the GST/HST on an entry (task 1520 follow-up). The amount stays the
// amount before tax, so totals do not change. Send taxProvince null to clear it.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const tax = parseTax(body);
  if ("error" in tax) return NextResponse.json({ error: tax.error }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if ("taxAmount" in body) patch.tax_amount = tax.taxAmount;
  if ("taxProvince" in body) patch.tax_province = tax.taxProvince;
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  const { data, error } = await supabase
    .from("finance_entries")
    .update(patch)
    .eq("id", params.id)
    .eq("master_plan_id", masterPlanId)
    .select("id, type, amount, currency, tax_amount, tax_province")
    .maybeSingle();
  if (error) {
    console.error("PATCH /api/finance/entries/[id]:", error.message);
    return NextResponse.json({ error: "Couldn't save the GST/HST." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "That entry wasn't found." }, { status: 404 });
  const home = await homeCurrency(masterPlanId, supabase);
  await logActivity({
    masterPlanId,
    action: "updated",
    entityType: data.type === "income" ? "income" : "expense",
    entityId: data.id as string,
    summary: `Set GST/HST to ${formatMoney(Number(data.tax_amount ?? 0), data.currency as string, { home, cents: true })} on ${formatMoney(Number(data.amount), data.currency as string, { home, cents: true })}`,
  });
  return NextResponse.json({ entry: { id: data.id, taxAmount: Number(data.tax_amount ?? 0) || 0, taxProvince: (data.tax_province as string) || null } });
}
