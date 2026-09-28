import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { OFFER_COLUMNS, offerRow, shapeOffer } from "@/lib/sales/offers";
import { ownBusinessId, planBusinesses, salesAccount } from "@/lib/sales/account";

export const dynamic = "force-dynamic";

// GET: the account's offers and packages (plus its businesses, for tagging).
export async function GET() {
  const a = await salesAccount();
  if (!a) return NextResponse.json({ offers: [], businesses: [] });
  const [{ data }, businesses] = await Promise.all([
    a.supabase.from("sales_offers").select(OFFER_COLUMNS).eq("master_plan_id", a.masterPlanId).order("sort_order").order("created_at"),
    planBusinesses(a.masterPlanId),
  ]);
  return NextResponse.json({ offers: ((data ?? []) as Record<string, unknown>[]).map(shapeOffer), businesses });
}

// POST: add an offer.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await salesAccount();
  if (!a) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const v = offerRow(body);
  if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });
  v.row.business_id = await ownBusinessId(a.masterPlanId, body.businessId);
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
