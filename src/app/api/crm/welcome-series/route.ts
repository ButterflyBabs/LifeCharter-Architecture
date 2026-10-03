import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { WELCOME_EMAILS } from "@/lib/email/welcomeContent";
import { clientSetupState, welcomeEmailsEnabled } from "@/lib/email/welcomeSequence";
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

  const { data: allLogs } = await db.from("lccs_welcome_log").select("user_id, email_key, sent_at").order("sent_at", { ascending: false }).limit(2000);
  const logs = (allLogs ?? []) as { user_id: string; email_key: string; sent_at: string }[];
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
      else if (offset < e.day) cells[e.key] = { state: "waiting", note: `Day ${e.day}` };
      else if (offset > e.day + 2) cells[e.key] = { state: "missed", note: "Window passed" };
      else if (state && (e.key === "day1" ? state.setupComplete : e.key === "day3" ? state.setupComplete && state.website : false)) cells[e.key] = { state: "skipped", note: e.key === "day1" ? "Setup already complete" : "Setup and website already done" };
      else cells[e.key] = { state: "due", note: "Goes out at the next 9 am run" };
    }
    rows.push({
      id: c.id,
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
    emails: WELCOME_EMAILS.map((e) => ({ key: e.key, day: e.day, subject: e.subject, sent: counts.get(e.key) ?? 0, rule: e.key === "day1" ? "Skipped once setup is complete" : e.key === "day3" ? "Skipped once setup is complete and the website is in" : "Always sent" })),
    clients: rows,
    recent: logs.slice(0, 25).map((l) => ({ userId: l.user_id, key: l.email_key, at: l.sent_at, name: clients.find((c) => c.user_id === l.user_id)?.client_name ?? null, email: clients.find((c) => c.user_id === l.user_id)?.client_email ?? null })),
  });
}
