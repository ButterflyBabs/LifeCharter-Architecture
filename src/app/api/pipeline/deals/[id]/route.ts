import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { DEAL_COLUMNS, ensureStages, shapeDeal } from "@/lib/sales/pipeline";
import { dealRow } from "@/lib/sales/dealRow";
import { ownBusinessId, salesAccount } from "@/lib/sales/account";

export const dynamic = "force-dynamic";

// PATCH: edit a deal and/or move it to another stage ({ stageId }).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await salesAccount();
  if (!a) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const { data: current } = await a.supabase.from("pipeline_deals").select("id, stage_id").eq("id", params.id).eq("master_plan_id", a.masterPlanId).maybeSingle();
  if (!current) return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  const v = dealRow(body, { partial: true });
  if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });
  const row = v.row;
  const stages = await ensureStages(a.supabase, a.masterPlanId);
  if (typeof body.stageId === "string" && body.stageId !== current.stage_id) {
    const stage = stages.find((s) => s.id === body.stageId);
    if (!stage) return NextResponse.json({ error: "That stage doesn't exist." }, { status: 400 });
    row.stage_id = stage.id;
    row.stage_changed_at = new Date().toISOString();
    row.closed_at = stage.kind === "open" ? null : new Date().toISOString();
  }
  if (typeof body.sortOrder === "number") row.sort_order = Math.max(0, Math.floor(body.sortOrder));
  if ("offerId" in body) {
    if (!body.offerId) row.offer_id = null;
    else {
      const { data: offer } = await a.supabase.from("sales_offers").select("id").eq("id", body.offerId).eq("master_plan_id", a.masterPlanId).maybeSingle();
      row.offer_id = offer ? offer.id : null;
    }
  }
  if ("businessId" in body) row.business_id = await ownBusinessId(a.masterPlanId, body.businessId);
  const { data, error } = await a.supabase.from("pipeline_deals").update(row).eq("id", params.id).eq("master_plan_id", a.masterPlanId).select(DEAL_COLUMNS).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Couldn't save the deal." }, { status: 500 });
  return NextResponse.json({ deal: shapeDeal(data as Record<string, unknown>, new Map(stages.map((s) => [s.id, s]))) });
}

// DELETE: remove a deal (its logged calls stay in Daily Compass, unlinked).
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await salesAccount();
  if (!a) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const { error } = await a.supabase.from("pipeline_deals").delete().eq("id", params.id).eq("master_plan_id", a.masterPlanId);
  if (error) return NextResponse.json({ error: "Couldn't delete the deal." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
