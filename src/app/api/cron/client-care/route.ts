import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/housePlan";
import { DEMO_PLAN_NAME } from "@/lib/scoring/masterPlan";
import { enrolContact } from "@/lib/sequences/engine";
import { internalEmails, isInternalClient } from "@/lib/clientCare";
import { runClientCare, type CareRun } from "@/lib/clientCareAccounts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Client care (Babs, 2026-10-15). Once a day it starts the approved CLIENT CARE email series for the right clients:
//   - 30-day check-in, once, when an account turns 30 days old;
//   - quarterly pulse, every 90 days after that;
//   - exit survey, shortly after a client's subscription ends.
// The quiet-client series is NOT started here: the daily client-check-in job makes a task for Sumbal instead.
// A series that is switched OFF in Campaigns is skipped, so nothing is sent until it is switched ON. Add ?dry=1 to see
// who would be reached without enrolling anyone. Same CRON_SECRET convention as the other jobs; the path is listed in
// PUBLIC_APIS in the middleware.

const KEYS = {
  thirty: "client-30-day-check-in-email",
  pulse: "client-quarterly-pulse-email",
  exit: "client-exit-survey-email",
} as const;

const DAY = 86_400_000;
const CATCH_UP_DAYS = 7; // a missed run still catches the client within a week, never a backlog of old accounts

interface Client {
  planId: string;
  name: string;
  email: string;
  ageDays: number;
}

const first = (name: string) => name.trim().split(/\s+/)[0] || null;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const dry = new URL(request.url).searchParams.get("dry") === "1";
  const db = createServerClient();
  const house = await housePlanId(db);
  if (!house) return NextResponse.json({ ok: false, error: "no house account" }, { status: 500 });

  const { data: seqs } = await db.from("sequences").select("id, key, active").eq("master_plan_id", house).in("key", Object.values(KEYS));
  const live = new Map(((seqs ?? []) as { id: string; key: string; active: boolean }[]).map((s) => [s.key, s]));

  // Paying clients (same rules as the disengagement check): not the house account, the demo, a placeholder, the team
  // or a test persona (Eloise).
  const team = await internalEmails(db, house);
  const { data: plans } = await db
    .from("client_master_plans")
    .select("id, user_id, client_name, client_email, created_at, status")
    .not("user_id", "is", null)
    .eq("status", "active")
    .limit(1000);
  const clients: Client[] = ((plans ?? []) as { id: string; client_name: string | null; client_email: string | null; created_at: string }[])
    .filter((p) => p.id !== house && p.client_name !== DEMO_PLAN_NAME && p.client_name !== "Primary" && p.client_email && !isInternalClient({ name: p.client_name, email: p.client_email }, team))
    .map((p) => ({ planId: p.id, name: p.client_name || p.client_email!, email: p.client_email!, ageDays: Math.floor((Date.now() - new Date(p.created_at).getTime()) / DAY) }));

  const out: Record<string, { on: boolean; would: string[]; enrolled: string[]; skipped: string[] }> = {};
  const result = (k: string) => (out[k] ??= { on: Boolean(live.get(k)?.active), would: [], enrolled: [], skipped: [] });

  async function start(key: string, c: Client, source: string) {
    const r = result(key);
    r.would.push(c.email);
    if (dry || !live.get(key)?.active) return;
    const e = await enrolContact({ masterPlanId: house!, sequenceKey: key, email: c.email, firstName: first(c.name), source, tags: ["lccs-account"] });
    (e.enrollmentId ? r.enrolled : r.skipped).push(`${c.email}${e.reason ? ` (${e.reason})` : ""}`);
  }

  // 1. 30-day check-in: accounts 30 to 37 days old. Enrolment is once per person, so the window is safe to repeat.
  for (const c of clients) if (c.ageDays >= 30 && c.ageDays < 30 + CATCH_UP_DAYS) await start(KEYS.thirty, c, "client-care:30-day");

  // 2. Quarterly pulse: in the first week of every 90-day mark (day 90, 180, 270 …). A person already finished with the
  // pulse is re-enrolled for the new quarter once their last enrolment is over 60 days old.
  const pulse = live.get(KEYS.pulse);
  for (const c of clients) {
    const quarters = Math.floor(c.ageDays / 90);
    if (quarters < 1 || c.ageDays - quarters * 90 >= CATCH_UP_DAYS) continue;
    if (pulse && !dry && pulse.active) {
      const { data: contact } = await db.from("seq_contacts").select("id").eq("master_plan_id", house).eq("email", c.email.toLowerCase()).maybeSingle();
      if (contact?.id) {
        const { data: prev } = await db.from("sequence_enrollments").select("id, start_date").eq("sequence_id", pulse.id).eq("contact_id", contact.id).maybeSingle();
        if (prev && prev.start_date && Date.now() - new Date(prev.start_date as string).getTime() > 60 * DAY) {
          await db.from("sequence_enrollments").delete().eq("id", prev.id);
        }
      }
    }
    await start(KEYS.pulse, c, "client-care:quarterly");
  }

  // 3. Exit survey: a subscription that ended in the last three days. One survey per person, ever.
  const since = new Date(Date.now() - 3 * DAY).toISOString();
  const { data: ended } = await db.from("subscriptions").select("user_id").eq("status", "canceled").gte("updated_at", since).limit(200);
  const userIds = Array.from(new Set(((ended ?? []) as { user_id: string | null }[]).map((s) => s.user_id).filter(Boolean))) as string[];
  if (userIds.length) {
    const { data: gone } = await db.from("client_master_plans").select("id, client_name, client_email, created_at").in("user_id", userIds);
    for (const p of (gone ?? []) as { id: string; client_name: string | null; client_email: string | null; created_at: string }[]) {
      if (p.id === house || p.client_name === DEMO_PLAN_NAME || !p.client_email || isInternalClient({ name: p.client_name, email: p.client_email }, team)) continue;
      await start(KEYS.exit, { planId: p.id, name: p.client_name || p.client_email, email: p.client_email, ageDays: 0 }, "client-care:exit");
    }
  }

  // 4. Every other account's own Client Care (task 1148): only accounts that opened the Client Care page have a
  // settings row, and nothing runs for a piece they haven't switched on.
  const { data: accounts } = await db.from("client_care_settings").select("master_plan_id").neq("master_plan_id", house).limit(2000);
  const accountRuns: CareRun[] = [];
  for (const acc of (accounts ?? []) as { master_plan_id: string }[]) {
    try {
      const r = await runClientCare(db, acc.master_plan_id, dry);
      if (r.thirty.length || r.pulse.length || r.exit.length || r.quiet.length) accountRuns.push(r);
    } catch (e) {
      console.error("client care account run:", acc.master_plan_id, e instanceof Error ? e.message : e);
    }
  }

  return NextResponse.json({ ok: true, dry, checked: clients.length, series: out, accounts: accountRuns });
}
export const GET = run;
export const POST = run;
