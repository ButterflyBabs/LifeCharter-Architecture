import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { efGate, clean, isDay } from "@/lib/ef/server";

export const dynamic = "force-dynamic";

const ok = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

export async function PATCH(request: Request, { params }: { params: { id: string; mid: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await efGate();
  if ("error" in g) return g.error;
  if (!ok(params.mid)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof b.title === "string" && clean(b.title, 200)) patch.title = clean(b.title, 200);
  if (typeof b.done === "boolean") patch.done = b.done;
  if (b.dueDay === null || b.dueDay === "") patch.due_date = null;
  else if (isDay(b.dueDay)) patch.due_date = b.dueDay;
  if (!Object.keys(patch).length) return NextResponse.json({ ok: true });
  const { error } = await createServerClient().from("ef_milestones").update(patch).eq("id", params.mid).eq("project_id", params.id).eq("master_plan_id", g.planId);
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: { id: string; mid: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await efGate();
  if ("error" in g) return g.error;
  if (!ok(params.mid)) return NextResponse.json({ error: "not found" }, { status: 404 });
  await createServerClient().from("ef_milestones").delete().eq("id", params.mid).eq("project_id", params.id).eq("master_plan_id", g.planId);
  return NextResponse.json({ ok: true });
}
