import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { provisionAccountForEmail } from "@/lib/provisionAccount";
import { logEvent } from "@/lib/crm";
import { WELCOME_EMAILS } from "@/lib/email/welcomeContent";
import { PRE_FOUNDER_TAG, trialEndTag } from "@/lib/preFounderTrial";
import { ensureClientAffiliate } from "@/lib/affiliateStarter";
import { DEFAULT_SUBJECT, bodyFor, type EmailKind, renderAccountEmail, sendRendered, ACCOUNT_EMAIL_COPY_TO } from "@/lib/email/accountReadyEmail";
import { ensureClientTemplate, STANDARD_CLIENT } from "@/lib/email/clientTemplate";
import { crmAccount } from "../crm/guard";

export const dynamic = "force-dynamic";

// New Client Accounts (Babs only): the "your account is ready" email for each person is written, edited and
// approved on /new-clients, and only then is their stand-alone VIP account created and the email sent (hidden
// copy to AmiLynne). Day 1 of First 30 Days is the day the account is created, so send when they should start.
// The automatic welcome series is held for these people (its Day 1 email says to start the Brain assessment
// today); its six keys are recorded as claimed so none go out.
//   GET                                   → the people and their emails, each with their MasterClass link
//   POST { action: "add", email, kind?, when? }    → a person from Contacts, with the starting email for their kind:
//        "pre-founder" (waits for the 1:1), "client" (waits for the New Client Implementation Call) or "team"
//        (a LifeCharter team member exploring their own account: no assessments, the setup gate is switched off)
//   POST { action: "save", id, subject, body, oneToOne? } → saves an edit (back to Draft: approve again)
//   POST { action: "approve", id }                 → approved (needs {{password_link}} in the text)
//   POST { action: "preview", id }                 → the email as it will look (nothing created or sent)
//   POST { action: "test", id }                    → a preview emailed to AmiLynne only, link not real
//   POST { action: "send", id }                    → approved only: create the account, email them
//   POST { action: "resend", id }                  → an already-sent email goes out again with a fresh password link
//   POST { action: "remove", id }                  → drops a draft
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const pretty = (s: string) => s.replace(/\r/g, "").slice(0, 20000);

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  if (!a.isArchitect) return NextResponse.json({ error: "This is private." }, { status: 403 });
  const db = createServerClient();
  await ensureClientTemplate(db, a.planId);
  const { data: rows } = await db.from("new_client_emails").select("*").eq("master_plan_id", a.planId).order("created_at");
  const out = [];
  for (const r of [...(rows ?? [])].sort((x, y) => Number(y.email === STANDARD_CLIENT) - Number(x.email === STANDARD_CLIENT))) {
    if (r.email === STANDARD_CLIENT) {
      out.push({ ...r, masterclassLink: null, hasAccount: false, template: true });
      continue;
    }
    const link = await mcLink(db, a.planId, r.contact_id as string | null);
    const { data: plan } = await db.from("client_master_plans").select("id").eq("client_email", r.email).limit(1).maybeSingle();
    out.push({ ...r, masterclassLink: link, hasAccount: Boolean(plan) });
  }
  return NextResponse.json({ people: out, copyTo: ACCOUNT_EMAIL_COPY_TO });
}

async function mcLink(db: ReturnType<typeof createServerClient>, planId: string, contactId: string | null) {
  if (!contactId) return null;
  const { data: aff } = await db.from("affiliates").select("id").eq("master_plan_id", planId).eq("contact_id", contactId).maybeSingle();
  if (!aff) return null;
  const { data: link } = await db.from("affiliate_links").select("code").eq("affiliate_id", aff.id as string).eq("status", "active").order("created_at").limit(1).maybeSingle();
  return link ? `${APP_URL}/r/${link.code}` : null;
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  if (!a.isArchitect) return NextResponse.json({ error: "This is private." }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const db = createServerClient();
  const row = async () => {
    const { data } = await db.from("new_client_emails").select("*").eq("id", str(b.id, 40)).eq("master_plan_id", a.planId).maybeSingle();
    return data as { id: string; contact_id: string | null; email: string; name: string | null; subject: string; body: string; one_to_one: string | null; status: string; sent_result: string | null; skip_setup_gate: boolean } | null;
  };
  const firstOf = (name: string | null, email: string) => (name || "").trim().split(/\s+/)[0] || email.split("@")[0];

  switch (b.action) {
    case "add": {
      const email = str(b.email, 200).toLowerCase();
      const { data: c } = await db.from("seq_contacts").select("id, first_name, last_name").eq("master_plan_id", a.planId).eq("email", email).maybeSingle();
      if (!c) return NextResponse.json({ error: "That email isn't in your Contacts." }, { status: 404 });
      const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || null;
      const kind: EmailKind = b.kind === "client" || b.kind === "team" ? b.kind : "pre-founder";
      const oneToOne = str(b.when ?? b.oneToOne, 120) || null;
      const { data, error } = await db.from("new_client_emails").upsert({ master_plan_id: a.planId, contact_id: c.id, email, name, subject: DEFAULT_SUBJECT, body: bodyFor(kind, oneToOne), one_to_one: oneToOne, kind, skip_setup_gate: kind === "team" }, { onConflict: "master_plan_id,email", ignoreDuplicates: true }).select("id").maybeSingle();
      if (error) return NextResponse.json({ error: "Couldn't add them." }, { status: 500 });
      return NextResponse.json({ ok: true, id: data?.id ?? null });
    }
    case "save": {
      const r = await row();
      if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
      if (r.status === "sent") return NextResponse.json({ error: "This one has already been sent." }, { status: 409 });
      const subject = str(b.subject, 200);
      const body = pretty(String(b.body ?? ""));
      if (!subject || !body.trim()) return NextResponse.json({ error: "The subject and the email can't be empty." }, { status: 400 });
      await db.from("new_client_emails").update({ subject, body, one_to_one: str(b.oneToOne, 120) || r.one_to_one, status: "draft", approved_at: null, updated_at: new Date().toISOString() }).eq("id", r.id);
      return NextResponse.json({ ok: true });
    }
    case "approve": {
      const r = await row();
      if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
      if (r.status === "sent") return NextResponse.json({ error: "This one has already been sent." }, { status: 409 });
      if (!r.body.includes("{{password_link}}")) return NextResponse.json({ error: "The email needs {{password_link}} on a line of its own, so they can choose their password." }, { status: 400 });
      await db.from("new_client_emails").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", r.id);
      return NextResponse.json({ ok: true });
    }
    case "unapprove": {
      const r = await row();
      if (!r || r.status !== "approved") return NextResponse.json({ error: "Not found." }, { status: 404 });
      await db.from("new_client_emails").update({ status: "draft", approved_at: null }).eq("id", r.id);
      return NextResponse.json({ ok: true });
    }
    case "preview":
    case "test": {
      const r = await row();
      if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const m = { firstName: r.email === STANDARD_CLIENT ? "Sample" : firstOf(r.name, r.email), loginUrl: `${APP_URL}/login`, masterclassLink: await mcLink(db, a.planId, r.contact_id) };
      const out = renderAccountEmail(r.subject, r.body, m);
      if (b.action === "preview") return NextResponse.json({ ...out, to: r.email, copyTo: ACCOUNT_EMAIL_COPY_TO });
      const ok = await sendRendered(a.userEmail || ACCOUNT_EMAIL_COPY_TO, { ...out, subject: `TEST (not sent to ${r.name || r.email}) · ${out.subject}`, html: `<p style="font-family:Arial;color:#8a2f2f"><b>This is a test for you only. The password button below is a stand-in and does nothing.</b></p>${out.html}` }, { bcc: false });
      return NextResponse.json({ ok, sentTo: a.userEmail || ACCOUNT_EMAIL_COPY_TO });
    }
    case "send": {
      const r = await row();
      if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
      if (r.email === STANDARD_CLIENT) return NextResponse.json({ error: "This is the standard email. It goes out by itself from the Sales Reference button." }, { status: 400 });
      if (r.status !== "approved") return NextResponse.json({ error: "Approve it first." }, { status: 409 });
      const { data: have } = await db.from("client_master_plans").select("id").eq("client_email", r.email).limit(1).maybeSingle();
      // A retry after the account was made but the email failed only resends the email.
      const retry = Boolean(have) && Boolean(r.sent_result?.includes("did NOT"));
      if (have && !retry) return NextResponse.json({ error: "This email already has an account. Nothing was changed." }, { status: 409 });
      if (!retry) {
        let userId: string;
        try {
          ({ userId } = await provisionAccountForEmail(r.email, "vip", r.name, { skipWelcome: true }));
        } catch (e) {
          console.error("[new-accounts] provision failed:", e);
          return NextResponse.json({ error: "The account couldn't be created. Nothing was emailed." }, { status: 500 });
        }
        await db.from("lccs_welcome_log").upsert(WELCOME_EMAILS.map((w) => ({ user_id: userId, email_key: w.key })), { onConflict: "user_id,email_key", ignoreDuplicates: true });
        // A ready affiliate page with a link per LifeCharter product (clients; team members already have theirs).
        if ((r as { kind?: string }).kind !== "team") await ensureClientAffiliate({ email: r.email, name: r.name });
      }
      const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      // Team members who only explore their own account: switch the Getting Started gate off for this account.
      if (r.skip_setup_gate) {
        const { data: prof } = await db.from("profiles").select("preferences").eq("email", r.email).maybeSingle();
        await db.from("profiles").update({ preferences: { ...((prof?.preferences as Record<string, unknown>) ?? {}), setupBypass: true } }).eq("email", r.email);
      }
      const { data: gen } = await admin.auth.admin.generateLink({ type: "recovery", email: r.email, options: { redirectTo: `${APP_URL}/auth/callback?next=/reset-password` } });
      const loginUrl = gen?.properties?.action_link ?? null;
      const emailed = loginUrl ? await sendRendered(r.email, renderAccountEmail(r.subject, r.body, { firstName: firstOf(r.name, r.email), loginUrl, masterclassLink: await mcLink(db, a.planId, r.contact_id) })) : false;
      await db.from("new_client_emails").update({ status: emailed ? "sent" : "approved", sent_at: emailed ? new Date().toISOString() : null, sent_result: emailed ? "sent" : "account created; email did NOT send" }).eq("id", r.id);
      if (r.contact_id) {
        const { data: c } = await db.from("seq_contacts").select("tags").eq("id", r.contact_id).maybeSingle();
        const isPreFounder = (r as { kind?: string }).kind === "pre-founder";
        const trialTags = isPreFounder && emailed ? [PRE_FOUNDER_TAG, trialEndTag(new Date())] : [];
        await db.from("seq_contacts").update({ tags: Array.from(new Set([...((c?.tags as string[]) ?? []), "lccs-account", "vip-account", ...trialTags])), tag_source: "new-accounts" }).eq("id", r.contact_id);
        await logEvent(a.planId, r.contact_id, "manual", `Command Suite VIP account created${emailed ? "; password email sent (copy to AmiLynne)" : "; the password email did NOT send"}`, { holdAssessments: true }, db).catch(() => {});
      }
      return NextResponse.json({ ok: true, emailed, loginUrl: emailed ? undefined : loginUrl });
    }
    case "resend": {
      const r = await row();
      if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
      if (r.email === STANDARD_CLIENT) return NextResponse.json({ error: "This is the standard email. It goes out by itself from the Sales Reference button." }, { status: 400 });
      if (r.status !== "sent") return NextResponse.json({ error: "Only an email that has already been sent can be resent." }, { status: 409 });
      // Their address today (it may have changed since the first email went out).
      let to = r.email;
      if (r.contact_id) {
        const { data: c } = await db.from("seq_contacts").select("email").eq("id", r.contact_id).maybeSingle();
        if (c?.email) to = String(c.email).trim().toLowerCase();
      }
      const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      // The first password link is single-use and expires, so a resend carries a fresh one.
      const { data: gen, error: genErr } = await admin.auth.admin.generateLink({ type: "recovery", email: to, options: { redirectTo: `${APP_URL}/auth/callback?next=/reset-password` } });
      const loginUrl = gen?.properties?.action_link ?? null;
      if (!loginUrl) {
        console.error("[new-accounts] resend link:", genErr?.message);
        return NextResponse.json({ error: `There's no sign-in for ${to}, so a fresh link couldn't be made. Nothing was sent.` }, { status: 409 });
      }
      const emailed = await sendRendered(to, renderAccountEmail(r.subject, r.body, { firstName: firstOf(r.name, to), loginUrl, masterclassLink: await mcLink(db, a.planId, r.contact_id) }));
      if (!emailed) return NextResponse.json({ error: "The email didn't send. Please try again." }, { status: 502 });
      const { data: cur } = await db.from("new_client_emails").select("resend_count").eq("id", r.id).maybeSingle();
      await db.from("new_client_emails").update({ resend_count: Number(cur?.resend_count ?? 0) + 1, last_resent_at: new Date().toISOString() }).eq("id", r.id);
      if (r.contact_id) await logEvent(a.planId, r.contact_id, "manual", "Account-ready email sent again (fresh password link; copy to AmiLynne)", {}, db).catch(() => {});
      return NextResponse.json({ ok: true, to });
    }
    case "remove": {
      const r = await row();
      if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
      if (r.status === "sent" || r.email === STANDARD_CLIENT) return NextResponse.json({ error: "This one can't be removed." }, { status: 409 });
      await db.from("new_client_emails").delete().eq("id", r.id);
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
