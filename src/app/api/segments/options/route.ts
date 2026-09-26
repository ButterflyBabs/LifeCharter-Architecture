import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planBusinessIds } from "@/lib/planScope";

export const dynamic = "force-dynamic";

// A light list of this client's own segments for pickers (no scoring).
export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ segments: [] });
  const bizIds = await planBusinessIds(planId);
  if (!bizIds.length) return NextResponse.json({ segments: [] });
  const db = createServerClient();
  const [{ data: biz }, { data: segs }] = await Promise.all([
    db.from("businesses").select("id, name").in("id", bizIds).eq("active", true).order("sort_order"),
    db.from("segments").select("id, business_id, name").in("business_id", bizIds).eq("active", true).order("sort_order"),
  ]);
  const bizName = new Map(((biz ?? []) as { id: number; name: string }[]).map((b) => [b.id, b.name]));
  const multi = (biz ?? []).length > 1;
  return NextResponse.json({
    segments: ((segs ?? []) as { id: number; business_id: number; name: string }[]).map((s) => ({ id: s.id, name: s.name, business: bizName.get(s.business_id) ?? "", label: multi ? `${bizName.get(s.business_id) ?? ""} · ${s.name}` : s.name })),
  });
}
