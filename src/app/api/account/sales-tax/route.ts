import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { canManageAccount } from "@/lib/authz";
import { loadTaxSettings } from "@/lib/salesTaxServer";
import { cleanProvRegs, isTaxPlace, PROVINCIAL_TAXES } from "@/lib/salesTax";

export const dynamic = "force-dynamic";

// GET — the account's GST/HST registration.
export async function GET() {
  const planId = await resolveMasterPlanId();
  return NextResponse.json(await loadTaxSettings(planId));
}

// PATCH { registered, businessNumber, province, frequency, registeredFrom, provincial } — owner or team admin.
// provincial: { QC|BC|SK|MB: { registered, number, frequency } }, each on its own.
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await canManageAccount())) {
    return NextResponse.json({ error: "Only the account owner can change GST/HST settings." }, { status: 403 });
  }
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const registered = b.registered === true;
  const bn = typeof b.businessNumber === "string" ? b.businessNumber.replace(/\s+/g, " ").trim().toUpperCase().slice(0, 30) : "";
  const province = typeof b.province === "string" && isTaxPlace(b.province) && b.province !== "OUTSIDE" ? b.province : null;
  const frequency = ["monthly", "quarterly", "annual"].includes(b.frequency as string) ? (b.frequency as string) : "quarterly";
  const from = typeof b.registeredFrom === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.registeredFrom) ? b.registeredFrom : null;
  const provincial = cleanProvRegs(b.provincial);
  for (const p of PROVINCIAL_TAXES) {
    const r = provincial[p.code];
    if (r?.registered && r.number.replace(/\s/g, "").length < 6) return NextResponse.json({ error: `Enter your ${p.title} registration number.` }, { status: 400 });
  }
  if (registered) {
    // A GST/HST account number is the 9-digit business number + RT + 4 digits (e.g. 123456789 RT0001).
    if (!/^\d{9}\s?RT\s?\d{4}$/.test(bn)) return NextResponse.json({ error: "Enter your GST/HST number like 123456789 RT0001." }, { status: 400 });
    if (!province) return NextResponse.json({ error: "Choose the province your business is in." }, { status: 400 });
  }
  const { error } = await createServerClient()
    .from("sales_tax_settings")
    .upsert({ master_plan_id: planId, registered, business_number: bn || null, province, filing_frequency: frequency, registered_from: from, provincial, updated_at: new Date().toISOString() }, { onConflict: "master_plan_id" });
  if (error) return NextResponse.json({ error: "Couldn't save the GST/HST settings." }, { status: 500 });
  return NextResponse.json(await loadTaxSettings(planId));
}
