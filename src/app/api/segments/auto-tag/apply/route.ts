import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planSegmentIds } from "@/lib/planScope";

export const dynamic = "force-dynamic";

// Applies the tags the client approved. Every id is checked against THIS client's
// own account, the segment must be one of theirs, and only items that are still
// untagged are changed — an existing tag is never overwritten.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const list = (Array.isArray(body.assignments) ? body.assignments : []).slice(0, 400) as { kind?: string; ids?: unknown; segmentId?: unknown }[];
  const mySegs = new Set(await planSegmentIds(planId));
  const db = createServerClient();

  const { data: plans } = await db.from("client_plans").select("id").eq("master_plan_id", planId);
  const planIds = ((plans ?? []) as { id: string }[]).map((p) => p.id);

  const counts = { ledger: 0, task: 0, goal: 0, sales: 0 };
  for (const a of list) {
    const sid = Number(a.segmentId);
    const ids = (Array.isArray(a.ids) ? a.ids : []).map(String).slice(0, 500);
    if (!mySegs.has(sid) || !ids.length) continue;
    let res;
    if (a.kind === "ledger") res = await db.from("finance_entries").update({ segment_id: sid }).eq("master_plan_id", planId).is("segment_id", null).in("id", ids).select("id");
    else if (a.kind === "task") {
      const { data: seg } = await db.from("segments").select("business_id").eq("id", sid).maybeSingle();
      res = await db.from("tasks").update({ segment_id: sid, business_id: seg?.business_id ?? null }).eq("master_plan_id", planId).is("segment_id", null).in("id", ids).select("id");
    } else if (a.kind === "goal" && planIds.length) res = await db.from("client_plan_goals").update({ segment_id: sid }).in("plan_id", planIds).is("segment_id", null).in("id", ids).select("id");
    else if (a.kind === "sales") res = await db.from("sales_activities").update({ segment_id: sid }).eq("master_plan_id", planId).is("segment_id", null).in("id", ids).select("id");
    else continue;
    counts[a.kind as keyof typeof counts] += res?.data?.length ?? 0;
  }
  const total = counts.ledger + counts.task + counts.goal + counts.sales;
  return NextResponse.json({ ok: true, applied: total, counts });
}
