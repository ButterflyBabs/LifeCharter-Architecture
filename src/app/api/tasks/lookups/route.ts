import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { salesMemberId } from "@/lib/taskAssignees";

export const dynamic = "force-dynamic";

// The projects (Projects) and programs (Offers & Packages) a task can be filed under, for the two drop-downs on a
// task. Name and id only. A Sales member sees neither.
export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId || (await salesMemberId())) return NextResponse.json({ projects: [], offers: [] });
  const db = createServerClient();
  const [p, o] = await Promise.all([
    db.from("projects").select("id, name, status").eq("master_plan_id", planId).order("sort_order", { ascending: true }).order("name"),
    db.from("sales_offers").select("id, name, status").eq("master_plan_id", planId).order("sort_order", { ascending: true }).order("name"),
  ]);
  const open = (s: string | null) => !["archived", "done", "complete", "completed"].includes((s || "").toLowerCase());
  return NextResponse.json({
    projects: ((p.data ?? []) as { id: string; name: string; status: string | null }[]).filter((x) => open(x.status)).map((x) => ({ id: x.id, name: x.name })),
    offers: ((o.data ?? []) as { id: string; name: string; status: string | null }[]).filter((x) => open(x.status)).map((x) => ({ id: x.id, name: x.name })),
  });
}
