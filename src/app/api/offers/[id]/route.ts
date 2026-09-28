import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { OFFER_COLUMNS, offerRow, shapeOffer } from "@/lib/sales/offers";
import { ownBusinessId, salesAccount } from "@/lib/sales/account";

export const dynamic = "force-dynamic";

// PATCH: save an offer (the whole form).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await salesAccount();
  if (!a) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const v = offerRow(body);
  if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });
  v.row.business_id = await ownBusinessId(a.masterPlanId, body.businessId);
  const { data, error } = await a.supabase
    .from("sales_offers")
    .update(v.row)
    .eq("id", params.id)
    .eq("master_plan_id", a.masterPlanId)
    .select(OFFER_COLUMNS)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Couldn't save the offer." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
  return NextResponse.json({ offer: shapeOffer(data as Record<string, unknown>) });
}

// DELETE: remove an offer. Deals that pointed to it keep their value and lose the link.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await salesAccount();
  if (!a) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const { error } = await a.supabase.from("sales_offers").delete().eq("id", params.id).eq("master_plan_id", a.masterPlanId);
  if (error) return NextResponse.json({ error: "Couldn't delete the offer." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
