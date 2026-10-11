import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { housePlanId } from "@/lib/housePlan";
import { DEMO_PLAN_NAME } from "@/lib/scoring/masterPlan";
import { assessmentProgress, APPROX_TOTAL, type AssessmentProgress } from "@/lib/assessmentProgress";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// New Client Journey (Alignment Architect only, 2026-10-10): one row per client account showing where they are
// between "joined" and "on a Next Chapter Call with Babs": the three assessments, the invitation email, the
// booking, and her results review. Read-only; it only reads data the Suite already keeps.
const CALENDAR_SLUG = "next-chapter-call";
const MAX_CLIENTS = 120;

type Stage = "not_started" | "in_progress" | "assessments_done" | "invited" | "booked" | "held";

export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const db = createServerClient();
  const house = await housePlanId(db);
  if (!house) return NextResponse.json({ clients: [] });

  const { data: plans } = await db
    .from("client_master_plans")
    .select("id, user_id, client_name, client_email, created_at, domain_scores, profit_score")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(400);
  const { data: team } = await db.from("workspace_members").select("email").in("status", ["active", "pending"]);
  const teamEmails = new Set(((team ?? []) as { email: string | null }[]).map((m) => (m.email || "").toLowerCase()));
  type Plan = { id: string; user_id: string; client_name: string | null; client_email: string | null; created_at: string; domain_scores: unknown; profit_score: unknown };
  const clients = ((plans ?? []) as Plan[])
    .filter((p) => p.id !== house && p.client_name !== DEMO_PLAN_NAME && p.client_name !== "Primary" && !/^eloise\b/i.test(p.client_name || "") && p.client_email && !teamEmails.has(p.client_email.toLowerCase()))
    .slice(0, MAX_CLIENTS);

  // Assessments: per client, how many answers are saved (progress) and whether each one was finished. A saved
  // answer alone is progress, never "done": finished = Complete pressed on Brain and Soul, Profit scores saved.
  const prog = new Map<string, AssessmentProgress>();
  for (let i = 0; i < clients.length; i += 10) {
    await Promise.all(clients.slice(i, i + 10).map(async (c) => { prog.set(c.id, await assessmentProgress(db as never, c.id)); }));
  }

  const userIds = clients.map((c) => c.user_id);
  const { data: logs } = await db.from("lccs_welcome_log").select("user_id, sent_at").eq("email_key", "next_call").in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  const invited = new Map<string, string>();
  for (const l of (logs ?? []) as { user_id: string; sent_at: string | null }[]) if (l.sent_at) invited.set(l.user_id, l.sent_at);

  const { data: cal } = await db.from("booking_calendars").select("id").eq("master_plan_id", house).eq("slug", CALENDAR_SLUG).maybeSingle();
  const booking = new Map<string, { startAt: string; status: string }>();
  if (cal?.id) {
    const { data: rows } = await db
      .from("bookings")
      .select("invitee_email, start_at, status")
      .eq("master_plan_id", house)
      .eq("calendar_id", cal.id)
      .order("start_at", { ascending: false })
      .limit(500);
    for (const r of (rows ?? []) as { invitee_email: string | null; start_at: string; status: string }[]) {
      const k = (r.invitee_email || "").toLowerCase();
      if (!k) continue;
      const have = booking.get(k);
      const live = r.status !== "canceled" && r.status !== "cancelled";
      // Keep one booking per person: the latest one that is still on, otherwise the latest one at all.
      if (!have || (live && (have.status === "canceled" || have.status === "cancelled"))) booking.set(k, { startAt: r.start_at, status: r.status });
    }
  }

  const { data: taskRows } = await db.from("tasks").select("description, status").eq("master_plan_id", house).ilike("description", "%[new-client-review:%").limit(500);
  const review = new Map<string, "open" | "done">();
  for (const t of (taskRows ?? []) as { description: string | null; status: string }[]) {
    const m = (t.description || "").match(/\[new-client-review:([0-9a-f-]{36})\]/);
    if (m) review.set(m[1], t.status === "done" ? "done" : "open");
  }

  const now = Date.now();
  const out = clients.map((c) => {
    const ap = prog.get(c.id)!;
    const profit = ap.profit.status === "complete";
    const done = ap.allComplete;
    const bk = booking.get((c.client_email || "").toLowerCase()) ?? null;
    const live = bk && bk.status !== "canceled" && bk.status !== "cancelled";
    const inviteAt = invited.get(c.user_id) ?? null;
    let stage: Stage = "not_started";
    if (live && bk && (bk.status === "completed" || new Date(bk.startAt).getTime() < now)) stage = "held";
    else if (live) stage = "booked";
    else if (done && inviteAt) stage = "invited";
    else if (done) stage = "assessments_done";
    else if (ap.brain.status !== "not_started" || ap.soul.status !== "not_started" || ap.profit.status !== "not_started") stage = "in_progress";
    return {
      planId: c.id,
      name: c.client_name || c.client_email,
      email: c.client_email,
      joinedAt: c.created_at,
      brain: ap.brain.status === "complete",
      soul: ap.soul.status === "complete",
      profit,
      progress: (['brain', 'soul', 'profit'] as const).map((k) => ({ key: k, status: ap[k].status, answered: ap[k].answered, approxTotal: APPROX_TOTAL[k], lastAnsweredAt: ap[k].lastAnsweredAt, completedAt: ap[k].completedAt })),
      allDone: done,
      lastAnswered: ap.lastActivityAt,
      inviteSentAt: inviteAt,
      booking: bk,
      review: review.get(c.id) ?? null,
      stage,
    };
  });
  return NextResponse.json({ clients: out }, { headers: { "Cache-Control": "no-store" } });
}
