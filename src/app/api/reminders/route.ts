import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { sessionUser } from "@/lib/authz";
import { REMINDER_SELECT } from "@/lib/reminders";

export const dynamic = "force-dynamic";

// Reminders for the signed-in account.
//   GET                                   -> { reminders, now }   (open ones soonest first, then the 20 most recent done)
//   POST   { title, notes?, remindAt }    -> create
//   PATCH  { id, done?: boolean, snoozeMinutes?, remindAt?, title?, notes? }
//   DELETE { id }
const MAX_OPEN = 300;
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const validIso = (v: unknown) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ reminders: [], now: new Date().toISOString() });
  const db = createServerClient();
  const [{ data: open }, { data: done }] = await Promise.all([
    db.from("reminders").select(REMINDER_SELECT).eq("master_plan_id", planId).eq("status", "open").order("remind_at").limit(MAX_OPEN),
    db.from("reminders").select(REMINDER_SELECT).eq("master_plan_id", planId).eq("status", "done").order("done_at", { ascending: false }).limit(20),
  ]);
  return NextResponse.json({ reminders: [...(open ?? []), ...(done ?? [])], now: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const title = str(b.title, 200);
  const at = validIso(b.remindAt);
  if (!title) return NextResponse.json({ error: "What should the reminder say?" }, { status: 400 });
  if (!at) return NextResponse.json({ error: "Choose when to be reminded." }, { status: 400 });
  const db = createServerClient();
  const { count } = await db.from("reminders").select("id", { count: "exact", head: true }).eq("master_plan_id", planId).eq("status", "open");
  if ((count ?? 0) >= MAX_OPEN) return NextResponse.json({ error: "You have a lot of open reminders. Clear a few first." }, { status: 400 });
  const who = await sessionUser().catch(() => null);
  const { data, error } = await db
    .from("reminders")
    .insert({ master_plan_id: planId, title, notes: str(b.notes, 1000) || null, remind_at: at, created_by: who?.id ?? null })
    .select(REMINDER_SELECT)
    .single();
  if (error) {
    console.error("POST /api/reminders:", error.message);
    return NextResponse.json({ error: "Couldn't save the reminder." }, { status: 500 });
  }
  return NextResponse.json({ reminder: data });
}

export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (!planId || typeof b.id !== "string") return NextResponse.json({ error: "Missing reminder." }, { status: 400 });
  const now = new Date();
  const patch: Record<string, unknown> = { updated_at: now.toISOString() };
  if (typeof b.done === "boolean") {
    patch.status = b.done ? "done" : "open";
    patch.done_at = b.done ? now.toISOString() : null;
    if (!b.done) patch.notified_at = null;
  }
  if (typeof b.snoozeMinutes === "number" && b.snoozeMinutes > 0 && b.snoozeMinutes <= 60 * 24 * 60) {
    patch.remind_at = new Date(now.getTime() + Math.round(b.snoozeMinutes) * 60_000).toISOString();
    patch.status = "open";
    patch.done_at = null;
    patch.notified_at = null;
  }
  const at = validIso(b.remindAt);
  if (at) {
    patch.remind_at = at;
    patch.notified_at = null;
  }
  if (typeof b.title === "string" && str(b.title, 200)) patch.title = str(b.title, 200);
  if (typeof b.notes === "string") patch.notes = str(b.notes, 1000) || null;
  const { data, error } = await createServerClient().from("reminders").update(patch).eq("id", b.id).eq("master_plan_id", planId).select(REMINDER_SELECT).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  return NextResponse.json({ reminder: data });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (!planId || typeof b.id !== "string") return NextResponse.json({ error: "Missing reminder." }, { status: 400 });
  await createServerClient().from("reminders").delete().eq("id", b.id).eq("master_plan_id", planId);
  return NextResponse.json({ ok: true });
}
