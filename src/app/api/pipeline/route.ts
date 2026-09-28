import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { DEAL_COLUMNS, ensureStages, shapeDeal } from "@/lib/sales/pipeline";
import { dealRow } from "@/lib/sales/dealRow";
import { ownBusinessId, planBusinesses, salesAccount } from "@/lib/sales/account";

export const dynamic = "force-dynamic";

// GET: the account's deals board: stages, deals, and its offers and businesses for the pickers.
export async function GET() {
  const a = await salesAccount();
  if (!a) return NextResponse.json({ stages: [], deals: [], offers: [], businesses: [] });
  const stages = await ensureStages(a.supabase, a.masterPlanId);
  const smap = new Map(stages.map((s) => [s.id, s]));
  let dq = a.supabase.from("pipeline_deals").select(DEAL_COLUMNS).eq("master_plan_id", a.masterPlanId);
  let oq = a.supabase.from("sales_offers").select("id, name, price, status").eq("master_plan_id", a.masterPlanId);
  if (a.businessId) {
    dq = dq.eq("business_id", a.businessId);
    oq = oq.or(`business_id.eq.${a.businessId},business_id.is.null`);
  }
  const [{ data: deals }, { data: offers }, businesses] = await Promise.all([dq.order("sort_order").order("created_at"), oq.order("sort_order"), planBusinesses(a.masterPlanId)]);
  return NextResponse.json({
    stages,
    deals: ((deals ?? []) as Record<string, unknown>[]).map((r) => shapeDeal(r, smap)),
    offers: ((offers ?? []) as { id: string; name: string; price: number | string | null; status: string }[]).map((o) => ({ id: o.id, name: o.name, price: o.price === null ? null : Number(o.price), status: o.status })),
    businesses,
    currentBusinessId: a.businessId,
  });
}

// POST: add a deal. Value fills in from the chosen offer's price when none is given.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await salesAccount();
  if (!a) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const v = dealRow(body, { partial: false });
  if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });
  const stages = await ensureStages(a.supabase, a.masterPlanId);
  const stage = stages.find((s) => s.id === body.stageId) ?? stages.find((s) => s.kind === "open") ?? stages[0];
  if (!stage) return NextResponse.json({ error: "No pipeline stages." }, { status: 400 });
  const row: Record<string, unknown> = { ...v.row, master_plan_id: a.masterPlanId, stage_id: stage.id };
  if (typeof body.offerId === "string" && body.offerId) {
    const { data: offer } = await a.supabase.from("sales_offers").select("id, price").eq("id", body.offerId).eq("master_plan_id", a.masterPlanId).maybeSingle();
    if (offer) {
      row.offer_id = offer.id;
      if (row.value === undefined || row.value === null) row.value = offer.price;
    }
  }
  row.business_id = "businessId" in body ? await ownBusinessId(a.masterPlanId, body.businessId) : a.businessId;
  if (stage.kind !== "open") row.closed_at = new Date().toISOString();
  const { count } = await a.supabase.from("pipeline_deals").select("id", { count: "exact", head: true }).eq("master_plan_id", a.masterPlanId);
  if ((count ?? 0) >= 5000) return NextResponse.json({ error: "That's the most deals one account can hold." }, { status: 400 });
  const { data, error } = await a.supabase.from("pipeline_deals").insert(row).select(DEAL_COLUMNS).single();
  if (error) return NextResponse.json({ error: "Couldn't save the deal." }, { status: 500 });
  return NextResponse.json({ deal: shapeDeal(data as Record<string, unknown>, new Map(stages.map((s) => [s.id, s]))) });
}
