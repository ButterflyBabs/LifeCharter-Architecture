import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { housePlanId } from "@/lib/housePlan";
import { DEMO_PLAN_NAME } from "@/lib/scoring/masterPlan";

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
    .filter((p) => p.id !== house && p.client_name !== DEMO_PLAN_NAME && p.client_name !== "Primary" && p.client_email && !teamEmails.has(p.client_email.toLowerCase()))
    .slice(0, MAX_CLIENTS);

  // Assessments: Brain and Soul by saved answers, Profit by its score (the same rules the setup checklist uses).
  const answers = async (planId: string, type: "brain" | "soul") => {
    const [{ count }, { data: last }] = await Promise.all([
      db.from("unified_client_responses").select("id", { count: "exact", head: true }).eq("master_plan_id", planId).eq("assessment_type", type),
      db.from("unified_client_responses").select("created_at").eq("master_plan_id", planId).eq("assessment_type", type).order("created_at", { ascending: false }).limit(1),
    ]);
    return { has: (count ?? 0) > 0, last: ((last ?? [])[0]?.created_at as string | undefined) ?? null };
  };
  const state = new Map<string, { brain: boolean; soul: boolean; lastAnswered: string | null }>();
  for (let i = 0; i < clients.length; i += 10) {
    await Promise.all(
      clients.slice(i, i + 10).map(async (c) => {
        const [b, s] = await Promise.all([answers(c.id, "brain"), answers(c.id, "soul")]);
        const times = [b.last, s.last].filter(Boolean) as string[];
        state.set(c.id, { brain: b.has, soul: s.has, lastAnswered: times.sort().slice(-1)[0] ?? null });
      })
    );
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
    const st = state.get(c.id) ?? { brain: false, soul: false, lastAnswered: null };
    const ds = c.domain_scores as Record<string, unknown> | null;
    const profit = Boolean((ds && typeof ds === "object" && Object.keys(ds).length) || c.profit_score);
    const done = st.brain && st.soul && profit;
    const bk = booking.get((c.client_email || "").toLowerCase()) ?? null;
    const live = bk && bk.status !== "canceled" && bk.status !== "cancelled";
    const inviteAt = invited.get(c.user_id) ?? null;
    let stage: Stage = "not_started";
    if (live && bk && (bk.status === "completed" || new Date(bk.startAt).getTime() < now)) stage = "held";
    else if (live) stage = "booked";
    else if (done && inviteAt) stage = "invited";
    else if (done) stage = "assessments_done";
    else if (st.brain || st.soul || profit) stage = "in_progress";
    return {
      planId: c.id,
      name: c.client_name || c.client_email,
      email: c.client_email,
      joinedAt: c.created_at,
      brain: st.brain,
      soul: st.soul,
      profit,
      allDone: done,
      lastAnswered: st.lastAnswered,
      inviteSentAt: inviteAt,
      booking: bk,
      review: review.get(c.id) ?? null,
      stage,
    };
  });
  return NextResponse.json({ clients: out }, { headers: { "Cache-Control": "no-store" } });
}
