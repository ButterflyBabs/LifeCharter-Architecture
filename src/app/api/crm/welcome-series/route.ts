import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { WELCOME_EMAILS } from "@/lib/email/welcomeContent";
import { clientSetupState, sendWelcomeOneOff, welcomeEmailsEnabled, welcomeSeriesPaused } from "@/lib/email/welcomeSequence";
import { crossOriginBlocked } from "@/lib/security";
import { superAdminEmails } from "@/lib/authz";
import { DEMO_PLAN_NAME } from "@/lib/scoring/masterPlan";
import { crmAccount } from "../guard";

export const dynamic = "force-dynamic";

// Monitoring for the Command Suite new-client welcome series, shown on Campaigns & Broadcasts
// (owner's account only). Read-only: it mirrors the daily cron's rules (Day 1, 3, 5, 10 and 14
// after joining, counted in Mountain-time days; Day 1 skipped once setup is complete; Day 3
// skipped once setup is complete and the website is in) and reports, per recent client, what
// went out, what is waiting, and what was skipped and why.
const denverDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Denver" });
const dayNumber = (iso: string) => Math.round(new Date(iso + "T00:00:00Z").getTime() / 86400_000);

type Cell = { state: "sent" | "due" | "skipped" | "waiting" | "missed"; at?: string; note?: string };

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  if (!a.house) return NextResponse.json({ error: "This is on the owner's account only." }, { status: 403 });
  const db = createServerClient();

  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  const { data: plans } = await db.from("client_master_plans").select("id, user_id, client_name, client_email, created_at").not("user_id", "is", null).gte("created_at", since).order("created_at", { ascending: false });
  const admins = superAdminEmails();
  const clients = ((plans ?? []) as { id: string; user_id: string; client_name: string | null; client_email: string | null; created_at: string }[]).filter(
    (p) => p.client_email && p.client_name !== DEMO_PLAN_NAME && p.client_name !== "Primary" && !admins.includes(p.client_email.toLowerCase())
  );

  const { data: allLogs } = await db.from("lccs_welcome_log").select("user_id, email_key, sent_at, stopped").order("sent_at", { ascending: false }).limit(2000);
  const allRows = (allLogs ?? []) as { user_id: string; email_key: string; sent_at: string; stopped?: boolean }[];
  const stoppedKeys = new Set(allRows.filter((l) => l.stopped).map((l) => `${l.user_id}:${l.email_key}`));
  const stoppedUsers = new Set(allRows.filter((l) => l.stopped).map((l) => l.user_id));
  const logs = allRows.filter((l) => !l.stopped);
  const sentAt = new Map(logs.map((l) => [`${l.user_id}:${l.email_key}`, l.sent_at]));
  const counts = new Map<string, number>();
  for (const l of logs) counts.set(l.email_key, (counts.get(l.email_key) ?? 0) + 1);

  const today = dayNumber(denverDay(new Date()));
  const rows = [];
  for (const c of clients) {
    const offset = today - dayNumber(denverDay(new Date(c.created_at)));
    const state = await clientSetupState(db, c.user_id, c.id).catch(() => null);
    const cells: Record<string, Cell> = {};
    for (const e of WELCOME_EMAILS) {
      const at = sentAt.get(`${c.user_id}:${e.key}`);
      if (at) cells[e.key] = { state: "sent", at };
      else if (stoppedKeys.has(`${c.user_id}:${e.key}`)) cells[e.key] = { state: "skipped", note: e.key === "assessments" && state?.assessments ? "Assessments already complete" : "Stopped by you" };
      else if (e.key === "assessments") cells[e.key] = { state: offset > 0 ? "missed" : "due", note: "About 1 hour after the account is created" };
      else if (e.key === "welcome") cells[e.key] = { state: offset > 1 ? "missed" : "due", note: "About 3 minutes after the account is created" };
      else if (offset < e.day) cells[e.key] = { state: "waiting", note: `Day ${e.day}` };
      else if (offset > e.day + 2) cells[e.key] = { state: "missed", note: "Window passed" };
      else if (state && (e.key === "day1" ? state.setupComplete : e.key === "day3" ? state.setupComplete && state.website : false)) cells[e.key] = { state: "skipped", note: e.key === "day1" ? "Setup already complete" : "Setup and website already done" };
      else cells[e.key] = { state: "due", note: "Goes out at the next 9 am run" };
    }
    rows.push({
      id: c.id,
      userId: c.user_id,
      stopped: stoppedUsers.has(c.user_id),
      name: c.client_name || c.client_email,
      email: c.client_email,
      joined: c.created_at,
      day: offset,
      setup: state ? { ai: state.ai, assessments: state.assessments, tools: state.tools, website: state.website } : null,
      cells,
    });
  }

  return NextResponse.json({
    enabled: welcomeEmailsEnabled(),
    paused: await welcomeSeriesPaused(db),
    emails: WELCOME_EMAILS.map((e) => ({ key: e.key, day: e.day, subject: e.subject, sent: counts.get(e.key) ?? 0, rule: e.key === "welcome" ? "About 3 minutes after the account is created" : e.key === "assessments" ? "About 1 hour after the account is created; skipped once all three assessments are done" : e.key === "day1" ? "Skipped once setup is complete" : e.key === "day3" ? "Skipped once setup is complete and the website is in" : "Always sent" })),
    clients: rows,
    recent: logs.slice(0, 25).map((l) => ({ userId: l.user_id, key: l.email_key, at: l.sent_at, name: clients.find((c) => c.user_id === l.user_id)?.client_name ?? null, email: clients.find((c) => c.user_id === l.user_id)?.client_email ?? null })),
  });
}

// POST { action: "resend", key, userId? | email? }: send one of the welcome emails to one client right now,
// as a one-off (owner's account only). The schedule is untouched; a person can get any email again.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  if (!a.house) return NextResponse.json({ error: "This is on the owner's account only." }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const db0 = createServerClient();
  if (b.action === "pause") {
    const paused = b.paused === true;
    await db0.from("app_settings").upsert({ key: "welcome_series_paused", value: paused ? "true" : "false" }, { onConflict: "key" });
    return NextResponse.json({ ok: true, paused });
  }
  if (b.action === "stop-client" || b.action === "resume-client") {
    const uid = typeof b.userId === "string" ? b.userId.trim() : "";
    if (!uid) return NextResponse.json({ error: "Choose a client." }, { status: 400 });
    if (b.action === "resume-client") {
      await db0.from("lccs_welcome_log").delete().eq("user_id", uid).eq("stopped", true);
      return NextResponse.json({ ok: true });
    }
    // Hold back every email they have not been sent yet; the ones already sent stay as they are.
    const { data: have } = await db0.from("lccs_welcome_log").select("email_key").eq("user_id", uid);
    const got = new Set(((have ?? []) as { email_key: string }[]).map((x) => x.email_key));
    const rows = WELCOME_EMAILS.filter((e) => !got.has(e.key)).map((e) => ({ user_id: uid, email_key: e.key, stopped: true }));
    if (rows.length) await db0.from("lccs_welcome_log").upsert(rows, { onConflict: "user_id,email_key", ignoreDuplicates: true });
    return NextResponse.json({ ok: true, held: rows.length });
  }
  if (b.action !== "resend") return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const key = typeof b.key === "string" ? b.key.trim() : "";
  if (!WELCOME_EMAILS.some((e) => e.key === key)) return NextResponse.json({ error: "Unknown email." }, { status: 404 });
  const db = createServerClient();
  const userId = typeof b.userId === "string" ? b.userId.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!userId && !email) return NextResponse.json({ error: "Choose a client." }, { status: 400 });
  const q = db.from("profiles").select("id, email, full_name, current_plan_id");
  const { data: prof } = userId ? await q.eq("id", userId).maybeSingle() : await q.eq("email", email).maybeSingle();
  if (!prof?.email) return NextResponse.json({ error: userId ? "That client wasn't found." : `There's no client account for ${email}.` }, { status: 404 });
  const { data: plan } = await db.from("client_master_plans").select("created_at, client_name").eq("user_id", prof.id as string).order("created_at").limit(1).maybeSingle();
  const ok = await sendWelcomeOneOff(db as never, {
    userId: prof.id as string,
    email: prof.email as string,
    name: (plan?.client_name as string | null) || (prof.full_name as string | null),
    planId: (prof.current_plan_id as string | null) ?? null,
    enrolledAt: (plan?.created_at as string | undefined) || new Date().toISOString(),
  }, key);
  if (!ok) return NextResponse.json({ error: "The email didn't send. Please try again." }, { status: 502 });
  return NextResponse.json({ ok: true, to: prof.email, key });
}
