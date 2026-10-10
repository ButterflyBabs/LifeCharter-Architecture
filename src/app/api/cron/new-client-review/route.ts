import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/housePlan";
import { DEMO_PLAN_NAME } from "@/lib/scoring/masterPlan";
import { clientSetupState } from "@/lib/email/welcomeSequence";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The coach review step of new-client onboarding (2026-10-10, item 27). When a client has finished all three
// assessments, a task lands on Babs's list: "Review <name>'s assessment results" with a pointer to View as Client.
// One task per client, ever (marked inside the task text). Team members are skipped. Nothing is sent to the client.
// Runs daily; the path is listed in PUBLIC_APIS in the middleware and secured by CRON_SECRET like the other jobs.

const WINDOW_DAYS = 60;
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

  let created = 0;
  for (const c of candidates) {
    const { data: already } = await db.from("tasks").select("id").eq("master_plan_id", house).ilike("description", `%${marker(c.id)}%`).limit(1).maybeSingle();
    if (already) continue;
    const state = await clientSetupState(db as never, c.user_id, c.id).catch(() => null);
    if (!state?.assessments) continue;
    const name = c.client_name || c.client_email!;
    const due = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    const { error } = await db.from("tasks").insert({
      master_plan_id: house,
      title: `Review ${name}'s assessment results and invite them to their kickoff`,
      description: `${name} (${c.client_email}) has finished all three assessments. Open their account read-only from Alignment Architect > View as Client, read the results, and reach out personally. ${marker(c.id)}`,
      status: "backlog",
      priority: "high",
      owner_action: true,
      due_date: due,
    });
    if (!error) created++;
    else console.error("new-client-review insert:", error.message);
  }
  return NextResponse.json({ ok: true, checked: candidates.length, created });
}
export const GET = run;
export const POST = run;
