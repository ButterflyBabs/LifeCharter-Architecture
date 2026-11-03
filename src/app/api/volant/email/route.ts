import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { volantAccount } from "@/lib/volantServer";
import { sessionUser } from "@/lib/authz";
import { openMailboxes } from "@/lib/mailboxes";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import { logEvent, EMAIL_RE } from "@/lib/crm";
import { HOUSE_PORTAL_LOGO, HOUSE_PORTAL_NAME, brandFor, defaultLook, newPortalToken, portalUrl } from "@/lib/portal";
import { isHousePlan } from "@/lib/housePlan";
import { buildClientEmail, buildClientEmailHtml, buildCoachCopy, buildCoachCopyHtml, defaultClientMessage, templateByKey, type EmailBrand, type ReportEmail, type VolantReport } from "@/lib/volant";

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
  // A report with no client yet can still be previewed (so the owner sees the email first), but cannot be sent.
  const noClient = !row.contact_id || !c;
  if (noClient && b.preview !== true) return NextResponse.json({ error: "This report is not saved on a contact, so there is no one to email. Pick the person it was with first." }, { status: 400 });
  const to = (c?.email || "").trim();
  if (!noClient && !EMAIL_RE.test(to)) return NextResponse.json({ error: "This contact has no email address yet. Add one on their record." }, { status: 400 });

  const boxes = await openMailboxes();
  const box = boxes.find((x) => x.provider === "microsoft") ?? boxes[0] ?? null;
  // The name the email closes with: the signed-in person's own name (the account's own name can be a placeholder such as "Primary").
  const me = await sessionUser().catch(() => null);
  const { data: prof } = me?.id ? await db.from("profiles").select("full_name").eq("id", me.id).maybeSingle() : { data: null };
  const { data: plan } = await db.from("client_master_plans").select("client_name").eq("id", a.planId).maybeSingle();
  const coachFirst = first(prof?.full_name) || (["primary", "demo"].includes(first(plan?.client_name).toLowerCase()) ? "" : first(plan?.client_name));
  // The brand on the email: LifeCharter Command Suite and its logo for the owner's own account, the account's own name and logo for a client account.
  const origin = new URL(request.url).origin;
  const house = await isHousePlan(a.planId, db);
  const b0 = house ? null : await brandFor(db, a.planId).catch(() => null);
  const brand: EmailBrand = house ? { name: HOUSE_PORTAL_NAME, logoUrl: `${origin}${HOUSE_PORTAL_LOGO}` } : { name: b0?.name || "Your coach", logoUrl: b0?.logo ? (b0.logo.startsWith("http") ? b0.logo : `${origin}${b0.logo}`) : null };
  const t = templateByKey(row.template_key as string);
  const date = fmtDate(row.session_date as string);
  const message = str(b.message, 6000) || defaultClientMessage(report, t, { clientFirst: first(c?.first_name), coachFirst, date });
  const wantPortal = b.addToPortal !== false && b.clientItems !== false && report.action_items.some((i) => i.for === "client");
  // The client's private page: their next steps go there as homework they tick off, and the email links to it. Preview only looks; sending creates.
  let portalLink: string | undefined;
  let portalAdded = 0;
  let portalNote = "";
  let report2: VolantReport = report;
  if (wantPortal && noClient) {
    portalLink = `${origin}/portal/(their private link)`;
  } else if (wantPortal) {
    const { data: existing } = await db.from("client_portals").select("id, token, active").eq("contact_id", row.contact_id as string).eq("master_plan_id", a.planId).maybeSingle();
    if (existing && !existing.active) {
      portalNote = "This client's portal is switched off, so their steps stay in the email only.";
    } else if (b.preview === true) {
      portalLink = existing ? portalUrl(existing.token as string) : `${new URL(request.url).origin}/portal/(their private link)`;
    } else {
      let token = existing?.token as string | undefined;
      let portalId = existing?.id as string | undefined;
      if (!token) {
        const made = await db.from("client_portals").insert({ master_plan_id: a.planId, contact_id: row.contact_id, token: newPortalToken(), look: await defaultLook(db, a.planId) }).select("id, token").single();
        token = made.data?.token as string | undefined;
        portalId = made.data?.id as string | undefined;
      }
      if (token && portalId) {
        portalLink = portalUrl(token);
        const todo = report.action_items.filter((i) => i.for === "client" && !i.portal);
        const { count } = await db.from("portal_items").select("id", { count: "exact", head: true }).eq("contact_id", row.contact_id as string).eq("kind", "homework");
        const ids = new Map<string, string>();
        let pos = count ?? 0;
        for (const it of todo) {
          const { data: made } = await db.from("portal_items").insert({ master_plan_id: a.planId, contact_id: row.contact_id, kind: "homework", title: it.text.slice(0, 200), body: `From our session: ${row.title as string} (${date}).`, due_on: it.due || null, position: pos++ }).select("id").single();
          if (made?.id) ids.set(it.id, made.id as string);
        }
        portalAdded = ids.size;
        if (ids.size) report2 = { ...report, action_items: report.action_items.map((i) => (ids.has(i.id) ? { ...i, portal: ids.get(i.id)! } : i)) };
      } else {
        portalNote = "Couldn't set up their private page, so their steps are in the email only.";
      }
    }
  }
  const opts = { message, summary: b.summary !== false, clientItems: b.clientItems !== false, coachItems: b.coachItems === true, portalUrl: portalLink };
  const built = buildClientEmail(report, opts, { title: row.title as string, date, contactName: [c?.first_name, c?.last_name].filter(Boolean).join(" ") });
  const subject = str(b.subject, 200) || built.subject;
  const ctx = { title: row.title as string, date, contactName: [c?.first_name, c?.last_name].filter(Boolean).join(" ") };
  const html = buildClientEmailHtml(report, opts, ctx, brand);

  if (b.preview === true) return NextResponse.json({ needsClient: noClient, to: to || null, from: box?.label ?? null, subject, text: built.text, message, canSend: Boolean(box), portalNote, portalLink: portalLink ?? null, brand, alreadyCopied: report.copied?.status === "sent", portalItems: report.action_items.filter((i) => i.for === "client" && !i.portal).length });
  if (!box) return NextResponse.json({ error: "Connect Gmail or Microsoft 365 in Settings, Integrations, so the email comes from your own address." }, { status: 400 });

  let status: ReportEmail["status"] = "sent";
  let error: string | null = null;
  try {
    if (box.provider === "microsoft") await microsoft.sendEmail(box.token, { to, subject, body: built.text, html });
    else await google.sendEmail(box.token, { to, subject, body: built.text, html });
  } catch (e) {
    status = "failed";
    error = (e instanceof Error ? e.message : "The mail service refused it.").replace(/\s+/g, " ").slice(0, 300);
    console.error("POST /api/volant/email:", error);
  }
  // The coach's own full copy (private notes and both task lists, with a link back), to their own inbox. Only after the client's email went.
  let copy: ReportEmail["copy"] = "off";
  if (status === "sent" && b.copyToMe !== false && box.email) {
    const copyCtx = { title: row.title as string, date, contactName: [c?.first_name, c?.last_name].filter(Boolean).join(" "), link: `${origin}/volant?report=${row.id}`, sentTo: to };
    const mine = buildCoachCopy(report, copyCtx);
    const mineHtml = buildCoachCopyHtml(report, copyCtx, brand);
    try {
      if (box.provider === "microsoft") await microsoft.sendEmail(box.token, { to: box.email, subject: mine.subject, body: mine.text, html: mineHtml });
      else await google.sendEmail(box.token, { to: box.email, subject: mine.subject, body: mine.text, html: mineHtml });
      copy = "sent";
    } catch (e) {
      copy = "failed";
      console.error("POST /api/volant/email copy:", e instanceof Error ? e.message : e);
    }
  }
  const entry: ReportEmail = { at: new Date().toISOString(), to, subject, status, error, from: box.label, copy };
  const next: VolantReport = { ...report2, emailed: [...(report.emailed ?? []), entry].slice(-20) };
  await db.from("volant_reports").update({ report: next, updated_at: entry.at }).eq("id", row.id).eq("master_plan_id", a.planId);
  if (status === "sent") await logEvent(a.planId, row.contact_id as string, "email", `Emailed the report: ${row.title}`, { volant_report_id: row.id, subject }, db).catch(() => {});
  return status === "sent"
    ? NextResponse.json({ ok: true, emailStatus: status, to, from: box.label, portalAdded, portalNote, copy, copyTo: copy === "sent" ? box.email : null, report: next })
    : NextResponse.json({ ok: false, emailStatus: status, error: `The email did not send: ${error}`, report: next }, { status: 502 });
}
