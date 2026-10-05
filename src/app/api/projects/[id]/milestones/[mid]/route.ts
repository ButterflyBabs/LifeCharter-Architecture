import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { clean, isDay } from "@/lib/projects/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string; mid: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const u: Record<string, unknown> = {};
  if (typeof b.title === "string" && clean(b.title, 160)) u.title = clean(b.title, 160);
  if (typeof b.done === "boolean") u.done = b.done;
  if (b.dueDay === null || b.dueDay === "") u.due_date = null;
  else if (isDay(b.dueDay)) u.due_date = b.dueDay;
  if (!Object.keys(u).length) return NextResponse.json({ ok: true });
  const { error } = await createServerClient().from("project_milestones").update(u).eq("id", params.mid).eq("project_id", params.id).eq("master_plan_id", planId);
  return error ? NextResponse.json({ error: "Couldn't save." }, { status: 500 }) : NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: { id: string; mid: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await createServerClient().from("project_milestones").delete().eq("id", params.mid).eq("project_id", params.id).eq("master_plan_id", planId);
  return NextResponse.json({ ok: true });
}
