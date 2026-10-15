import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/housePlan";
import { DEMO_PLAN_NAME } from "@/lib/scoring/masterPlan";
import { emailOwner } from "@/lib/ai/redFlags";
import { notifyAssignee } from "@/lib/taskAssignees";
import { internalEmails, isInternalClient } from "@/lib/clientCare";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Disengagement check (Babs, 2026-10-10: "no logins for two weeks ... flag for outreach"). Once a day it finds paying
// clients whose account is at least two weeks old and who have not signed in for two weeks, records one flag per
// client per fortnight, makes a task "Quiet for 2 weeks: [name]" for Sumbal (2026-10-15, Babs), and sends ONE short
// digest to the account owner as her copy. Nothing goes to the clients: Sumbal decides whether to start the
// CLIENT CARE quiet-client notes or to reach out personally.
// Same CRON_SECRET convention as the other jobs; the path is listed in PUBLIC_APIS in the middleware.

const DAYS = 14;
const TASK_OWNER_EMAIL = "sumbal@amilynnecarroll.com";

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const house = await housePlanId(db);
  const team = house ? await internalEmails(db, house) : new Set<string>();
  const cutoff = new Date(Date.now() - DAYS * 86_400_000);
  const { data: plans } = await db
    .from("client_master_plans")
    .select("id, user_id, client_name, client_email, created_at, status")
    .not("user_id", "is", null)
    .eq("status", "active")
    .lte("created_at", cutoff.toISOString())
    .limit(500);
  const candidates = ((plans ?? []) as { id: string; user_id: string; client_name: string | null; client_email: string | null; created_at: string }[]).filter(
    (p) => p.id !== house && p.client_name !== DEMO_PLAN_NAME && p.client_name !== "Primary" && p.client_email && !isInternalClient({ name: p.client_name, email: p.client_email }, team)
  );
  if (!candidates.length) return NextResponse.json({ ok: true, checked: 0, flagged: 0 });

  const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
  const { data: recent } = await db.from("assistant_red_flags").select("master_plan_id").eq("kind", "disengaged").gte("created_at", since);
  const already = new Set(((recent ?? []) as { master_plan_id: string }[]).map((r) => r.master_plan_id));

  const quiet: { id: string; name: string; email: string; days: number }[] = [];
  for (const c of candidates) {
    if (already.has(c.id)) continue;
    const { data } = await db.auth.admin.getUserById(c.user_id);
    const last = data?.user?.last_sign_in_at ? new Date(data.user.last_sign_in_at) : null;
    if (last && last >= cutoff) continue;
    const ref = last ?? new Date(c.created_at);
    quiet.push({ id: c.id, name: c.client_name || c.client_email!, email: c.client_email!, days: Math.floor((Date.now() - ref.getTime()) / 86_400_000) });
  }
  if (!quiet.length) return NextResponse.json({ ok: true, checked: candidates.length, flagged: 0 });

  await db.from("assistant_red_flags").insert(quiet.map((q) => ({ master_plan_id: q.id, kind: "disengaged", note: `${q.days} days` })));

  // One task per quiet client for Sumbal (left unassigned, so it stays with the owner, if she is not on the team).
  const { data: ws } = house ? await db.from("workspaces").select("id").eq("master_plan_id", house) : { data: [] as { id: string }[] };
  const { data: member } = (ws ?? []).length
    ? await db.from("workspace_members").select("id, name, email, role").in("workspace_id", (ws ?? []).map((w) => w.id as string)).ilike("email", TASK_OWNER_EMAIL).limit(1).maybeSingle()
    : { data: null };
  let tasks = 0;
  if (house) {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Denver" });
    for (const q of quiet) {
      const description =
        `${q.name} (${q.email}) has not signed in to the Command Suite for ${q.days} days.\n\n` +
        `Next: look at how they are doing, then either (a) start the three CLIENT CARE quiet-client notes (a hello now, a follow-up a week later, then the call invite with the Client Check-In Call booking link): ask the assistant "enrol ${q.email} in the quiet client campaign", or (b) reach out to them personally. ` +
        `Babs is copied on this task. Mark it done when the client has been contacted.`;
      const { data: t, error } = await db
        .from("tasks")
        .insert({
          master_plan_id: house,
          title: `Quiet for 2 weeks: ${q.name}`,
          description,
          status: "today",
          priority: "medium",
          energy: "low",
          due_date: today,
          ...(member?.id ? { assignee_member_id: member.id } : {}),
        })
        .select("id, title")
        .maybeSingle();
      if (error || !t) continue;
      tasks++;
      if (member) await notifyAssignee(member as { id: string; name: string; email: string; role: string }, { title: t.title as string }, "the Command Suite").catch(() => {});
    }
  }
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const ok = await emailOwner(
    `${quiet.length} client${quiet.length === 1 ? "" : "s"} to reach out to`,
    `<p>These clients haven't signed in for two weeks or more. A short personal note usually helps.${tasks ? ` A task was made for Sumbal for each one, and you are copied here.` : ""}</p><ul>${quiet
      .map((q) => `<li><strong>${esc(q.name)}</strong> (${esc(q.email)}): ${q.days} days since they last signed in</li>`)
      .join("")}</ul>`
  );
  if (ok) await db.from("assistant_red_flags").update({ notified_at: new Date().toISOString() }).eq("kind", "disengaged").in("master_plan_id", quiet.map((q) => q.id)).gte("created_at", since);
  return NextResponse.json({ ok: true, checked: candidates.length, flagged: quiet.length, emailed: ok });
}
export const GET = run;
export const POST = run;
