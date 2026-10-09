import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import { logActivity, q } from "@/lib/activity";
import { logEvent } from "@/lib/crm";
import { accountSender } from "@/lib/email/accountSender";
import { quickWinEmailFor, unfilledParts } from "@/lib/quickWinEmails";

export const dynamic = "force-dynamic";

// Quick Wins that send a ready-made email.
// GET  → { myName, canSend, reason?, templates }   (who the email signs as, whether this account can send right now, and the
//         account's own saved wording for any of the ready-made emails)
// POST { title, subject, body, mode: "save-template" }  saves the account's own wording (kept with {{first_name}} and {{my_name}})
// POST { title, mode: "reset-template" }                goes back to the starting wording
// POST { title, contactId, subject, body, mode: "send" | "done" }
//   send: emails the person from the account's own sender, then logs it
//   done: the client sent it themselves (copied it): only logs it
//   Logging = a task for today marked complete (counts toward the day's activity and the health score),
//   an Email on Sales Activities, and a note on the person's timeline.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

// Who the email signs as: the account's own owner (the client), never a team member who happens to be signing in.
async function owner(db: ReturnType<typeof createServerClient>, planId: string): Promise<{ first: string; email: string | null }> {
  const { data: plan } = await db.from("client_master_plans").select("user_id, client_name").eq("id", planId).maybeSingle();
  let first = "";
  let email: string | null = null;
  if (plan?.user_id) {
    const { data: p } = await db.from("profiles").select("full_name, email").eq("id", plan.user_id as string).maybeSingle();
    first = str(p?.full_name, 80).split(/\s+/)[0] || "";
    email = str(p?.email, 200) || null;
  }
  if (!first) {
    const full = str(plan?.client_name, 80);
    if (full && full.toLowerCase() !== "primary") first = full.split(/\s+/)[0];
  }
  return { first, email };
}
const myName = async (db: ReturnType<typeof createServerClient>, planId: string) => (await owner(db, planId)).first;

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const who = await accountSender(a.planId, { marketing: false }, db);
  const { data: rows } = await db.from("quick_win_email_templates").select("kind, subject, body").eq("master_plan_id", a.planId);
  const templates = Object.fromEntries(((rows ?? []) as { kind: string; subject: string; body: string }[]).map((r) => [r.kind, { subject: r.subject, body: r.body }]));
  return NextResponse.json({ myName: await myName(db, a.planId), canSend: who.ok, reason: who.ok ? null : who.reason, templates });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const tpl = quickWinEmailFor(str(b.title, 200));
  const subject = str(b.subject, 200);
  const body = str(b.body, 8000);
  const mode = b.mode === "done" ? "done" : "send";
  if (!tpl) return NextResponse.json({ error: "That Quick Win doesn't send an email." }, { status: 400 });
  if (b.mode === "reset-template" || b.mode === "save-template") {
    const dbt = createServerClient();
    if (b.mode === "reset-template") {
      await dbt.from("quick_win_email_templates").delete().eq("master_plan_id", a.planId).eq("kind", tpl.kind);
      return NextResponse.json({ ok: true, template: { subject: tpl.subject, body: tpl.body } });
    }
    if (!subject || !body) return NextResponse.json({ error: "Add a subject and a message." }, { status: 400 });
    const { error } = await dbt.from("quick_win_email_templates").upsert({ master_plan_id: a.planId, kind: tpl.kind, subject, body, updated_at: new Date().toISOString() }, { onConflict: "master_plan_id,kind" });
    if (error) return NextResponse.json({ error: "Couldn't save your wording." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (!subject || !body) return NextResponse.json({ error: "Add a subject and a message." }, { status: 400 });
  if (unfilledParts(subject + "\n" + body).length) return NextResponse.json({ error: "Fill in the [bracketed] parts first." }, { status: 400 });

  const db = createServerClient();
  const { data: c } = await db.from("seq_contacts").select("id, email, first_name, last_name, unsubscribed_at").eq("id", str(b.contactId, 60)).eq("master_plan_id", a.planId).maybeSingle();
  if (!c) return NextResponse.json({ error: "Pick the person first." }, { status: 400 });
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || (c.email as string);

  if (mode === "send") {
    if (c.unsubscribed_at) return NextResponse.json({ error: `${name} has unsubscribed, so the Suite won't email them.` }, { status: 400 });
    const who = await accountSender(a.planId, { marketing: false }, db);
    if (!who.ok) return NextResponse.json({ error: who.reason }, { status: 400 });
    const key = who.house ? process.env.RESEND_API_KEY : who.resendKey;
    if (!key) return NextResponse.json({ error: "Email sending isn't set up for your account yet." }, { status: 400 });
    const fromEmail = who.house ? "hello@lccommandsuite.com" : who.fromEmail;
    const fromName = (await myName(db, a.planId)) || (who.house ? "LifeCharter" : who.fromName);
    const replyTo = who.house ? (await owner(db, a.planId)).email || a.userEmail || "support@lccommandsuite.com" : who.replyTo;
    const html = body.split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `${fromName.replace(/[<>"]/g, "")} <${fromEmail}>`, to: [c.email], reply_to: replyTo, subject, html, text: body }),
    }).catch(() => null);
    if (!r || !r.ok) return NextResponse.json({ error: "The email couldn't be sent just now. Try again, or copy it and send it yourself." }, { status: 502 });
  }

  // Log it: a completed task for today, an Email activity, and a note on their timeline.
  const now = new Date().toISOString();
  const title = `${tpl.title}: ${name}`;
  const { data: task } = await db.from("tasks").insert({ master_plan_id: a.planId, title, status: "done", completed_at: now, priority: "medium", energy: "low" }).select("id").single();
  await db.from("sales_activities").insert({ master_plan_id: a.planId, type: "email", contact_name: name, title: subject, priority: "warm", status: "completed", outcome: "", estimated_value: 0, occurred_on: now.slice(0, 10), notes: mode === "send" ? "Sent from a Quick Win." : "Sent by the client (logged from a Quick Win)." });
  await logEvent(a.planId, c.id as string, "email", `${mode === "send" ? "Emailed" : "Logged an email"}: ${subject}`, { quick_win: tpl.kind }, db as never).catch(() => {});
  await logActivity({ masterPlanId: a.planId, action: "completed", entityType: "task", entityId: (task as { id?: number } | null)?.id, summary: `Completed Quick Win ${q(title)}` }).catch(() => {});
  return NextResponse.json({ ok: true, sent: mode === "send" });
}
