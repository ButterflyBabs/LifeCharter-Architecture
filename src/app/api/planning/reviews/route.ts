import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

const SECTIONS = ["business", "marketing", "sales", "forecasting", "finance", "general"];

interface Row {
  id: string;
  title: string;
  section_key: string | null;
  scheduled_for: string | null;
  status: string | null;
  notes: string | null;
  completed_at: string | null;
}

function shape(r: Row) {
  return {
    id: r.id,
    title: r.title,
    sectionKey: r.section_key || "general",
    scheduledFor: r.scheduled_for,
    status: r.status || "upcoming",
    notes: r.notes || "",
    completedAt: r.completed_at,
  };
}

// GET — upcoming (soonest first) and completed (most recent first).
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ upcoming: [], history: [] });

  const { data } = await supabase
    .from("planning_reviews")
    .select("id, title, section_key, scheduled_for, status, notes, completed_at")
    .eq("master_plan_id", masterPlanId);

  const rows = ((data || []) as Row[]).map(shape);
  const upcoming = rows
    .filter((r) => r.status !== "completed")
    .sort((a, b) => (a.scheduledFor || "9999").localeCompare(b.scheduledFor || "9999"));
  const history = rows
    .filter((r) => r.status === "completed")
    .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));

  return NextResponse.json({ upcoming, history });
}

// POST — schedule a new review / planning session.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No workspace." }, { status: 400 });
  const body = await request.json().catch(() => ({}));

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Give the session a title." }, { status: 400 });

  const { data, error } = await supabase
    .from("planning_reviews")
    .insert({
      master_plan_id: masterPlanId,
      title,
      section_key: SECTIONS.includes(body.sectionKey) ? body.sectionKey : "general",
      scheduled_for:
        typeof body.scheduledFor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.scheduledFor)
          ? body.scheduledFor
          : null,
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
    })
    .select("id, title, section_key, scheduled_for, status, notes, completed_at")
    .single();
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ review: shape(data as Row) });
}

// PATCH — mark complete, reopen, or edit.
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.action === "complete") {
    update.status = "completed";
    update.completed_at = new Date().toISOString();
  } else if (body.action === "reopen") {
    update.status = "upcoming";
    update.completed_at = null;
  } else {
    if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
    if (SECTIONS.includes(body.sectionKey)) update.section_key = body.sectionKey;
    if (typeof body.scheduledFor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.scheduledFor))
      update.scheduled_for = body.scheduledFor;
    if (typeof body.notes === "string") update.notes = body.notes.trim();
  }

  const { error } = await supabase
    .from("planning_reviews")
    .update(update)
    .eq("id", id)
    .eq("master_plan_id", masterPlanId);
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a review (?id=...).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const { error } = await supabase
    .from("planning_reviews")
    .delete()
    .eq("id", id)
    .eq("master_plan_id", masterPlanId);
  if (error) return NextResponse.json({ error: "Couldn't delete." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
