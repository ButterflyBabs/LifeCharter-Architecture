import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { nowParts } from "@/lib/finance/period";
import { validateRecurring } from "@/lib/recurring";

export const dynamic = "force-dynamic";

// Confirms the task belongs to the caller's own plan before touching it.
async function owned(id: string) {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return false;
  const { data } = await createServerClient()
    .from("recurring_tasks")
    .select("id")
    .eq("id", id)
    .eq("master_plan_id", masterPlanId)
    .maybeSingle();
  return Boolean(data);
}

// PATCH { done: boolean, tz? } — check off (or un-check) today's occurrence.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  if (!(await owned(params.id))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const tz = await resolveUserTimeZone(typeof body.tz === "string" ? body.tz : null);
  const { year, month, day } = nowParts(tz);
  const today = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const supabase = createServerClient();
  if (body.done) {
    const { error } = await supabase
      .from("recurring_task_completions")
      .upsert({ recurring_task_id: params.id, done_on: today }, { onConflict: "recurring_task_id,done_on" });
    if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  } else {
    await supabase.from("recurring_task_completions").delete().eq("recurring_task_id", params.id).eq("done_on", today);
  }
  return NextResponse.json({ ok: true, done: Boolean(body.done), today });
}

// PUT — edit a recurring task (same fields as adding one). Past check-offs are kept.
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  if (!(await owned(params.id))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const v = validateRecurring(await request.json().catch(() => ({})));
  if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });
  const { error } = await createServerClient().from("recurring_tasks").update(v.row).eq("id", params.id);
  if (error) return NextResponse.json({ error: "Couldn't save the changes." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a recurring task (its check-off history goes with it).
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  if (!(await owned(params.id))) return NextResponse.json({ error: "not found" }, { status: 404 });
  await createServerClient().from("recurring_tasks").delete().eq("id", params.id);
  return NextResponse.json({ ok: true });
}
