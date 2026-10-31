import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { logActivity } from "@/lib/activity";
import { formatMoney } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";
import { parseProvTax, parseTax } from "@/lib/finance/gstReport";
import { hasEntryEdit, parseEntryEdit } from "@/lib/finance/entryEdit";

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

// PATCH { taxAmount?, taxProvince?, provTaxAmount? } — set the GST/HST (and QST / PST) on an entry (task 1520 follow-up). The amount stays the
// amount before tax, so totals do not change. Send taxProvince null to clear it.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  // Editing the entry itself: amount, category, date, name and note.
  if (hasEntryEdit(body)) {
    const { data: cur } = await supabase.from("finance_entries").select("id, external_id").eq("id", params.id).eq("master_plan_id", masterPlanId).maybeSingle();
    if (!cur) return NextResponse.json({ error: "That entry wasn't found." }, { status: 404 });
    const edit = parseEntryEdit(body, { synced: Boolean(cur.external_id) });
    if ("error" in edit) return NextResponse.json({ error: edit.error }, { status: 400 });
    const { data: saved, error: saveError } = await supabase
      .from("finance_entries")
      .update(edit)
      .eq("id", params.id)
      .eq("master_plan_id", masterPlanId)
      .select("id, type, amount, currency, category")
      .maybeSingle();
    if (saveError || !saved) {
      console.error("PATCH /api/finance/entries/[id]:", saveError?.message);
      return NextResponse.json({ error: "Couldn't save your changes." }, { status: 500 });
    }
    const kind = saved.type === "income" ? "income" : "expense";
    await logActivity({ masterPlanId, action: "updated", entityType: kind, entityId: saved.id as string, summary: `Edited ${kind} ${formatMoney(Number(saved.amount), saved.currency as string, { home: await homeCurrency(masterPlanId, supabase), cents: true })}` });
    return NextResponse.json({ ok: true });
  }
  const tax = parseTax(body);
  if ("error" in tax) return NextResponse.json({ error: tax.error }, { status: 400 });
  const prov = parseProvTax(body);
  if ("error" in prov) return NextResponse.json({ error: prov.error }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if ("provTaxAmount" in body) patch.prov_tax_amount = prov.provTaxAmount;
  if ("taxAmount" in body) patch.tax_amount = tax.taxAmount;
  if ("taxProvince" in body) patch.tax_province = tax.taxProvince;
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  const { data, error } = await supabase
    .from("finance_entries")
    .update(patch)
    .eq("id", params.id)
    .eq("master_plan_id", masterPlanId)
    .select("id, type, amount, currency, tax_amount, tax_province, prov_tax_amount")
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
    summary: `Set ${"provTaxAmount" in body && !("taxAmount" in body) ? `QST / PST to ${formatMoney(Number(data.prov_tax_amount ?? 0), data.currency as string, { home, cents: true })}` : `GST/HST to ${formatMoney(Number(data.tax_amount ?? 0), data.currency as string, { home, cents: true })}`} on ${formatMoney(Number(data.amount), data.currency as string, { home, cents: true })}`,
  });
  return NextResponse.json({ entry: { id: data.id, taxAmount: Number(data.tax_amount ?? 0) || 0, taxProvince: (data.tax_province as string) || null, provTaxAmount: Number(data.prov_tax_amount ?? 0) || 0 } });
}
