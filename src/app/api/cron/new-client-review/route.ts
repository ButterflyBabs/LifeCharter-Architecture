import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/housePlan";
import { DEMO_PLAN_NAME } from "@/lib/scoring/masterPlan";
import { clientSetupState, sendWelcomeEmail, welcomeSeriesPaused } from "@/lib/email/welcomeSequence";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The coach review step of new-client onboarding (2026-10-10, item 27). When a client has finished all three
// assessments, a task lands on Babs's list: "Review <name>'s assessment results" with a pointer to View as Client.
// One task per client, ever (marked inside the task text). Team members are skipped.
// The same pass sends the client the Next Chapter Call invitation (welcome email key next_call) while
// app_settings welcome_next_call_on = "true"; the welcome log makes a second send impossible.
// Runs every 3 minutes, so the invitation goes out within about 3 minutes of the third assessment being finished; the path is listed in PUBLIC_APIS in the middleware and secured by CRON_SECRET like the other jobs.

const WINDOW_DAYS = 60;
// The Next Chapter Call invitation only goes to people who joined recently, so switching it on never emails old accounts.
const INVITE_WINDOW_DAYS = 30;
const marker = (planId: string) => `[new-client-review:${planId}]`;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const house = await housePlanId(db);
  if (!house) return NextResponse.json({ skipped: "no house account" });

  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
  const { data: plans } = await db
    .from("client_master_plans")
    .select("id, user_id, client_name, client_email, created_at")
    .not("user_id", "is", null)
    .gte("created_at", since)
    .limit(300);
  const { data: team } = await db.from("workspace_members").select("email").in("status", ["active", "pending"]);
  const teamEmails = new Set(((team ?? []) as { email: string | null }[]).map((m) => (m.email || "").toLowerCase()));
  const candidates = ((plans ?? []) as { id: string; user_id: string; client_name: string | null; client_email: string | null; created_at: string }[]).filter(
    (p) => p.id !== house && p.client_name !== DEMO_PLAN_NAME && p.client_name !== "Primary" && p.client_email && !teamEmails.has(p.client_email.toLowerCase())
  );

  const { data: sw } = await db.from("app_settings").select("value").eq("key", "welcome_next_call_on").maybeSingle();
  const inviteOn = String(sw?.value ?? "").trim().toLowerCase() === "true" && !(await welcomeSeriesPaused(db as never));
  const inviteSince = Date.now() - INVITE_WINDOW_DAYS * 86_400_000;

  // Everyone already invited: skipped before the (heavier) setup-state check, so this can run every 3 minutes.
  const { data: sentLogs } = await db.from("lccs_welcome_log").select("user_id").eq("email_key", "next_call").in("user_id", candidates.map((c) => c.user_id).concat(["00000000-0000-0000-0000-000000000000"]));
  const invitedAlready = new Set(((sentLogs ?? []) as { user_id: string }[]).map((r) => r.user_id));

  let created = 0;
  let invited = 0;
  for (const c of candidates) {
    const { data: already } = await db.from("tasks").select("id").eq("master_plan_id", house).ilike("description", `%${marker(c.id)}%`).limit(1).maybeSingle();
    const wantInvite = inviteOn && new Date(c.created_at).getTime() >= inviteSince && !invitedAlready.has(c.user_id);
    if (already && !wantInvite) continue;
    const state = await clientSetupState(db as never, c.user_id, c.id).catch(() => null);
    if (!state?.assessments) continue;
    const name = c.client_name || c.client_email!;
    if (!already) {
      const due = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
      const { error } = await db.from("tasks").insert({
        master_plan_id: house,
        title: `Review ${name}'s assessment results before their Next Chapter Call`,
        description: `${name} (${c.client_email}) has finished all three assessments. Open their account read-only from Alignment Architect > View as Client and read the results. They are invited to book their Next Chapter Call with you (the invitation email goes automatically once it is switched on). ${marker(c.id)}`,
        status: "backlog",
        priority: "high",
        owner_action: true,
        due_date: due,
      });
      if (!error) created++;
      else console.error("new-client-review insert:", error.message);
    }
    if (wantInvite) {
      const { data: prof } = await db.from("profiles").select("current_plan_id, full_name").eq("id", c.user_id).maybeSingle();
      const ok = await sendWelcomeEmail(
        db as never,
        { userId: c.user_id, email: c.client_email!, name: c.client_name || (prof?.full_name as string | null) || null, planId: (prof?.current_plan_id as string | null) ?? null, enrolledAt: c.created_at },
        "next_call",
        { ignoreEnvSwitch: true }
      );
      if (ok) invited++;
    }
  }
  return NextResponse.json({ ok: true, checked: candidates.length, created, invited, inviteOn });
}
export const GET = run;
export const POST = run;
