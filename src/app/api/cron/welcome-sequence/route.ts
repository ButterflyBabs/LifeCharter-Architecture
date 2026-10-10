import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { WELCOME_EMAILS } from "@/lib/email/welcomeContent";
import { clientSetupState, sendWelcomeEmail, welcomeEmailsEnabled, welcomeSeriesPaused } from "@/lib/email/welcomeSequence";
import { superAdminEmails } from "@/lib/authz";
import { DEMO_PLAN_NAME } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

/**
 * Daily, 9 AM Mountain (vercel.json): the Command Suite welcome sequence after Email 1.
 * Day 1, 3, 5, 10 and 14 after enrolling, counted in Mountain-time days. At most one email per
 * client per run; an email is still sent if a run was missed (up to 2 days late), never twice.
 * Day 1 is skipped once setup is complete; Day 3 once setup is complete and the website is in.
 * Off until WELCOME_EMAILS_ENABLED=true (Babs approves the copy first).
 */
const denverDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Denver" });
const dayNumber = (iso: string) => Math.round(new Date(iso + "T00:00:00Z").getTime() / 86400_000);

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!welcomeEmailsEnabled()) return NextResponse.json({ ok: true, enabled: false, sent: 0 });

  const supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  if (await welcomeSeriesPaused(supabase)) return NextResponse.json({ ok: true, enabled: true, paused: true, sent: 0 });
  const since = new Date(Date.now() - 18 * 86400_000).toISOString();
  const { data: plans } = await supabase
    .from("client_master_plans")
    .select("id, user_id, client_name, client_email, created_at")
    .not("user_id", "is", null)
    .gte("created_at", since);
  const admins = superAdminEmails();
  const clients = ((plans ?? []) as { id: string; user_id: string; client_name: string | null; client_email: string | null; created_at: string }[]).filter(
    (p) => p.client_email && p.client_name !== DEMO_PLAN_NAME && p.client_name !== "Primary" && !admins.includes(p.client_email.toLowerCase())
  );
  if (!clients.length) return NextResponse.json({ ok: true, enabled: true, sent: 0 });

  const [{ data: logs }, { data: profiles }] = await Promise.all([
    supabase.from("lccs_welcome_log").select("user_id, email_key").in("user_id", clients.map((c) => c.user_id)),
    supabase.from("profiles").select("id, current_plan_id").in("id", clients.map((c) => c.user_id)),
  ]);
  const sentKeys = new Set(((logs ?? []) as { user_id: string; email_key: string }[]).map((l) => `${l.user_id}:${l.email_key}`));
  const planOf = new Map(((profiles ?? []) as { id: string; current_plan_id: string | null }[]).map((p) => [p.id, p.current_plan_id]));
  const today = dayNumber(denverDay(new Date()));

  const results: { client: string; email: string; sent: boolean }[] = [];
  for (const c of clients) {
    const offset = today - dayNumber(denverDay(new Date(c.created_at)));
    const due = WELCOME_EMAILS.filter((e) => e.day <= offset && offset <= e.day + 2 && !sentKeys.has(`${c.user_id}:${e.key}`));
    if (!due.length) continue;
    let state: Awaited<ReturnType<typeof clientSetupState>> | null = null;
    for (const e of due) {
      if (e.key === "day1" || e.key === "day3") {
        state = state ?? (await clientSetupState(supabase, c.user_id, c.id));
        if (state.setupComplete && (e.key === "day1" || state.website)) continue;
      }
      const sent = await sendWelcomeEmail(
        supabase,
        { userId: c.user_id, email: c.client_email!, name: c.client_name, planId: planOf.get(c.user_id) ?? null, enrolledAt: c.created_at },
        e.key
      );
      results.push({ client: c.id, email: e.key, sent });
      if (sent) break; // one email per client per run
    }
  }
  return NextResponse.json({ ok: true, enabled: true, sent: results.filter((r) => r.sent).length, results });
}
