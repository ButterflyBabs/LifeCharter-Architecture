import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { volantAccount } from "@/lib/volantServer";
import { sessionUser } from "@/lib/authz";
import { openMailboxes } from "@/lib/mailboxes";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import { logEvent, EMAIL_RE } from "@/lib/crm";
import { buildClientEmail, buildCoachCopy, defaultClientMessage, templateByKey, type ReportEmail, type VolantReport } from "@/lib/volant";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const first = (full: unknown) => {
  const f = (typeof full === "string" ? full : "").trim().split(/\s+/)[0] || "";
  return /@/.test(f) ? "" : f;
};

// Email an LC Volant report to the client it was made for, from the signed-in person's own connected mailbox (so it comes from their
// own address, shows in their Sent folder and replies come back to them).
//   POST { id, preview: true, message?, summary?, clientItems?, coachItems? }  -> { to, from, subject, text, message } (nothing sent)
//   POST { id, message, subject?, summary, clientItems, coachItems }           -> sends; the result is saved on the report either way
export async function POST(request: Request) {
  const a = await volantAccount(request);
  if ("denied" in a) return a.denied;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const db = createServerClient();
  const { data: row } = await db.from("volant_reports").select("id, title, session_date, template_key, contact_id, report, seq_contacts(first_name, last_name, email)").eq("id", str(b.id, 60)).eq("master_plan_id", a.planId).maybeSingle();
  if (!row) return NextResponse.json({ error: "That report could not be found." }, { status: 404 });
  const report = (row.report as VolantReport | null) ?? null;
  if (!report) return NextResponse.json({ error: "This report is empty." }, { status: 400 });
  const c = row.seq_contacts as unknown as { first_name: string | null; last_name: string | null; email: string | null } | null;
  if (!row.contact_id || !c) return NextResponse.json({ error: "This report is not saved on a contact, so there is no one to email. Pick the person it was with first." }, { status: 400 });
  const to = (c.email || "").trim();
  if (!EMAIL_RE.test(to)) return NextResponse.json({ error: "This contact has no email address yet. Add one on their record." }, { status: 400 });

  const boxes = await openMailboxes();
  const box = boxes.find((x) => x.provider === "microsoft") ?? boxes[0] ?? null;
  // The name the email closes with: the signed-in person's own name (the account's own name can be a placeholder such as "Primary").
  const me = await sessionUser().catch(() => null);
  const { data: prof } = me?.id ? await db.from("profiles").select("full_name").eq("id", me.id).maybeSingle() : { data: null };
  const { data: plan } = await db.from("client_master_plans").select("client_name").eq("id", a.planId).maybeSingle();
  const coachFirst = first(prof?.full_name) || (["primary", "demo"].includes(first(plan?.client_name).toLowerCase()) ? "" : first(plan?.client_name));
  const t = templateByKey(row.template_key as string);
  const date = fmtDate(row.session_date as string);
  const message = str(b.message, 6000) || defaultClientMessage(report, t, { clientFirst: first(c.first_name), coachFirst, date });
  const opts = { message, summary: b.summary !== false, clientItems: b.clientItems !== false, coachItems: b.coachItems === true };
  const built = buildClientEmail(report, opts, { title: row.title as string, date, contactName: [c.first_name, c.last_name].filter(Boolean).join(" ") });
  const subject = str(b.subject, 200) || built.subject;

  if (b.preview === true) return NextResponse.json({ to, from: box?.label ?? null, subject, text: built.text, message, canSend: Boolean(box) });
  if (!box) return NextResponse.json({ error: "Connect Gmail or Microsoft 365 in Settings, Integrations, so the email comes from your own address." }, { status: 400 });

  let status: ReportEmail["status"] = "sent";
  let error: string | null = null;
  try {
    if (box.provider === "microsoft") await microsoft.sendEmail(box.token, { to, subject, body: built.text });
    else await google.sendEmail(box.token, { to, subject, body: built.text });
  } catch (e) {
    status = "failed";
    error = (e instanceof Error ? e.message : "The mail service refused it.").replace(/\s+/g, " ").slice(0, 300);
    console.error("POST /api/volant/email:", error);
  }
  // The coach's own full copy (private notes and both task lists, with a link back), to their own inbox. Only after the client's email went.
  let copy: ReportEmail["copy"] = "off";
  if (status === "sent" && b.copyToMe !== false && box.email) {
    const mine = buildCoachCopy(report, { title: row.title as string, date, contactName: [c.first_name, c.last_name].filter(Boolean).join(" "), link: `${new URL(request.url).origin}/volant?report=${row.id}`, sentTo: to });
    try {
      if (box.provider === "microsoft") await microsoft.sendEmail(box.token, { to: box.email, subject: mine.subject, body: mine.text });
      else await google.sendEmail(box.token, { to: box.email, subject: mine.subject, body: mine.text });
      copy = "sent";
    } catch (e) {
      copy = "failed";
      console.error("POST /api/volant/email copy:", e instanceof Error ? e.message : e);
    }
  }
  const entry: ReportEmail = { at: new Date().toISOString(), to, subject, status, error, from: box.label, copy };
  const next: VolantReport = { ...report, emailed: [...(report.emailed ?? []), entry].slice(-20) };
  await db.from("volant_reports").update({ report: next, updated_at: entry.at }).eq("id", row.id).eq("master_plan_id", a.planId);
  if (status === "sent") await logEvent(a.planId, row.contact_id as string, "email", `Emailed the report: ${row.title}`, { volant_report_id: row.id, subject }, db).catch(() => {});
  return status === "sent"
    ? NextResponse.json({ ok: true, emailStatus: status, to, from: box.label, copy, copyTo: copy === "sent" ? box.email : null, report: next })
    : NextResponse.json({ ok: false, emailStatus: status, error: `The email did not send: ${error}`, report: next }, { status: 502 });
}
