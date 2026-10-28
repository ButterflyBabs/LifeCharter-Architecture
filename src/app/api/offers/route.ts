import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { OFFER_COLUMNS, offerRow, shapeOffer } from "@/lib/sales/offers";
import { ownBusinessId, planBusinesses, salesAccount } from "@/lib/sales/account";
import { homeCurrency } from "@/lib/currencyServer";
import { loadTaxSettings } from "@/lib/salesTaxServer";

export const dynamic = "force-dynamic";

// GET: the account's offers and packages (plus its businesses, for tagging). pstTick: the account has a BC, SK or MB
// sales tax registration, so the offer form shows "Provincial sales tax applies" (offer.pstApplies).
export async function GET() {
  const a = await salesAccount();
  if (!a) return NextResponse.json({ offers: [], businesses: [] });
  let q = a.supabase.from("sales_offers").select(OFFER_COLUMNS).eq("master_plan_id", a.masterPlanId);
  if (a.businessId) q = q.or(`business_id.eq.${a.businessId},business_id.is.null`);
  const [{ data }, businesses, tax] = await Promise.all([q.order("sort_order").order("created_at"), planBusinesses(a.masterPlanId), loadTaxSettings(a.masterPlanId).catch(() => null)]);
  const pstTick = (["BC", "SK", "MB"] as const).some((c) => tax?.provincial[c]?.registered);
  return NextResponse.json({ offers: ((data ?? []) as Record<string, unknown>[]).map(shapeOffer), businesses, currentBusinessId: a.businessId, pstTick });
}

// POST: add an offer.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await salesAccount();
  if (!a) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const v = offerRow(body);
  if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });
  v.row.business_id = body.businessId ? await ownBusinessId(a.masterPlanId, body.businessId) : null;
  // A new offer is in the posted currency, else the account's home currency.
  if (!v.row.currency) v.row.currency = await homeCurrency(a.masterPlanId);
  const { count } = await a.supabase.from("sales_offers").select("id", { count: "exact", head: true }).eq("master_plan_id", a.masterPlanId);
  if ((count ?? 0) >= 200) return NextResponse.json({ error: "That's the most offers one account can hold." }, { status: 400 });
  const { data, error } = await a.supabase
    .from("sales_offers")
    .insert({ ...v.row, master_plan_id: a.masterPlanId, sort_order: count ?? 0 })
    .select(OFFER_COLUMNS)
    .single();
  if (error) return NextResponse.json({ error: "Couldn't save the offer." }, { status: 500 });
  return NextResponse.json({ offer: shapeOffer(data as Record<string, unknown>) });
}
