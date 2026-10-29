import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { canManageAccount, isAlignmentArchitect } from "@/lib/authz";
import { isCurrency, MULTI_CURRENCY_OPEN_TO_ALL, toCurrency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";

export const dynamic = "force-dynamic";

/** Whether this account may pick a currency other than USD (Babs only until MULTI_CURRENCY_OPEN_TO_ALL). */
async function canChoose() {
  return MULTI_CURRENCY_OPEN_TO_ALL || (await isAlignmentArchitect());
}

// GET — the account's home currency, and whether the currency choices are shown.
export async function GET() {
  const planId = await resolveMasterPlanId();
  const currency = await homeCurrency(planId);
  return NextResponse.json({ currency, canChoose: await canChoose() });
}

// PATCH { currency } — owner or team admin sets the home currency. Only changes what new items start in;
// nothing already stored changes currency or value.
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await canChoose())) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!(await canManageAccount())) {
    return NextResponse.json({ error: "Only the account owner can change the currency." }, { status: 403 });
  }
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = (await request.json().catch(() => ({}))) as { currency?: unknown };
  if (!isCurrency(body.currency)) return NextResponse.json({ error: "Pick USD or CAD." }, { status: 400 });
  const currency = toCurrency(body.currency);
  const { error } = await createServerClient().from("client_master_plans").update({ default_currency: currency }).eq("id", planId);
  if (error) return NextResponse.json({ error: "Couldn't save the currency." }, { status: 500 });
  return NextResponse.json({ currency });
}
