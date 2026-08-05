import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Update a task's status/priority (used by the Tasks board).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const body = await request.json().catch(() => ({}));

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.status === "string") {
    update.status = body.status;
    update.completed_at = body.status === "done" ? new Date().toISOString() : null;
  }
  if (typeof body.priority === "string") update.priority = body.priority;

  const { data, error } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", params.id)
    .select("id, title, status, priority")
    .single();

  if (error) {
    console.error("PATCH /api/tasks/[id]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ task: data });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const { error } = await supabase.from("tasks").delete().eq("id", params.id);
  if (error) {
    console.error("DELETE /api/tasks/[id]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
