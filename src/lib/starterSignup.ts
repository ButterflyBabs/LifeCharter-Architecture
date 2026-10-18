import { createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { logEvent, upsertContact } from "@/lib/crm";
import { sendYear1Agreement } from "@/lib/year1Agreement";
import { provisionAccountForEmail } from "@/lib/provisionAccount";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { sendRendered } from "@/lib/email/accountReadyEmail";

// Self-serve Starter sign-up: pay -> sign the Year-1 Operating Agreement -> the account opens.
// The account (and any access to the Suite) is created ONLY after the client has signed, so nobody is ever chased for paperwork.
// One starter_signups row per paid checkout session: "pending" (agreement sent, waiting for the signature), then "provisioned".
// Three things move a row forward, whichever comes first: the success page (polls while the client waits), the webhook
// (starts it), and the every-two-minutes job (finishes it if the client signed after closing the page, and sends reminders).

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com").replace(/\/$/, "");
const HOUR = 3_600_000;

export interface StarterRow {
  stripe_session_id: string;
  email: string;
  full_name: string | null;
  plan_id: string;
  is_test: boolean;
  agreement_document_id: string | null;
  status: "pending" | "provisioned";
  signed_at: string | null;
  provisioned_at: string | null;
  emailed_at: string | null;
  last_error: string | null;
  created_at: string;
}

const COLS = "stripe_session_id, email, full_name, plan_id, is_test, agreement_document_id, status, signed_at, provisioned_at, emailed_at, last_error, created_at";

const authDb = () => createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

export async function getSignup(sessionId: string): Promise<StarterRow | null> {
  const { data } = await createServerClient().from("starter_signups").select(COLS).eq("stripe_session_id", sessionId).maybeSingle();
  return (data as StarterRow | null) ?? null;
}

// Has the client (not AmiLynne's countersignature) finished signing the Year-1 Operating Agreement the Suite sent?
export async function clientHasSigned(documentId: string, clientEmail: string): Promise<boolean> {
  const suite = await suiteSignerStatus(documentId, clientEmail);
  return suite?.status === "signed";
}

async function suiteSignerStatus(documentId: string, clientEmail: string): Promise<{ id: string; status: string; token: string | null; name: string } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(documentId)) return null;
  const db = createServerClient();
  const { data: doc } = await db.from("sign_documents").select("id").eq("id", documentId).maybeSingle();
  if (!doc) return null;
  const { data } = await db.from("sign_signers").select("id, status, token, name").eq("document_id", documentId).ilike("email", clientEmail.trim()).maybeSingle();
  return (data as { id: string; status: string; token: string | null; name: string } | null) ?? { id: "", status: "missing", token: null, name: "" };
}

export async function remindSigner(documentId: string, clientEmail: string): Promise<void> {
  const suite = await suiteSignerStatus(documentId, clientEmail);
  if (!suite || suite.status === "signed" || !suite.token) return;
  const db = createServerClient();
  const { data: doc } = await db.from("sign_documents").select("master_plan_id, status").eq("id", documentId).maybeSingle();
  if (!doc || doc.status !== "sent") return;
  const { signMail, signerUrl, audit } = await import("@/lib/esignServer");
  const ok = await signMail(db, doc.master_plan_id as string, { to: clientEmail, subject: "Reminder: your Year-1 Operating Agreement", heading: "A quick reminder", lines: [`Hi ${suite.name.split(" ")[0] || "there"}, your LifeCharter Command Suite account opens the moment you sign your Year-1 Operating Agreement. It takes about two minutes.`, "Head up - Wings out. Babs"], button: { label: "Review and sign", url: signerUrl(suite.token) } });
  await db.from("sign_signers").update({ last_reminded_at: new Date().toISOString() }).eq("id", suite.id);
  await audit(db, documentId, ok ? "Reminder sent" : "Reminder failed", { signerId: suite.id });
}

/**
 * Starts the sign-up for a paid checkout session: records it and sends the agreement. Safe to call from the webhook and the
 * success page at the same time: only the caller that inserts the row sends the agreement.
 */
export async function startStarterSignup(session: Stripe.Checkout.Session, opts: { contactId?: string | null } = {}): Promise<StarterRow | null> {
  const email = (session.customer_details?.email || session.customer_email || "").trim().toLowerCase();
  if (!email) return null;
  const db = createServerClient();
  const fullName = (session.customer_details?.name || session.metadata?.fullName || "").trim();
  const { data: claimed } = await db
    .from("starter_signups")
    .upsert({ stripe_session_id: session.id, email, full_name: fullName || null, plan_id: session.metadata?.planId || "starter", is_test: session.metadata?.test === "true" }, { onConflict: "stripe_session_id", ignoreDuplicates: true })
    .select(COLS);
  if (claimed?.length) await sendAgreementFor(claimed[0] as StarterRow, session.customer_details?.phone || "", opts.contactId ?? null);
  return getSignup(session.id);
}

async function sendAgreementFor(row: StarterRow, phone: string, contactId: string | null): Promise<void> {
  const db = createServerClient();
  const housePlan = await ownerMasterPlanId().catch(() => null);
  if (!housePlan) {
    await db.from("starter_signups").update({ last_error: "no house account" }).eq("stripe_session_id", row.stripe_session_id);
    return;
  }
  let cid = contactId;
  if (!cid) {
    const [first, ...rest] = (row.full_name || "").split(/\s+/);
    cid = (await upsertContact({ masterPlanId: housePlan, email: row.email, firstName: first || null, lastName: rest.join(" ") || null, source: "stripe:command-suite", tags: [...(row.is_test ? ["test"] : []), "command-suite-customer", `plan-${row.plan_id}`] }, db).catch(() => null))?.id ?? null;
  }
  const r = await sendYear1Agreement({
    masterPlanId: housePlan,
    contactId: cid,
    name: row.full_name || row.email.split("@")[0],
    email: row.email,
    phone,
    tier: "Starter",
    payment: "full",
    by: "self-serve sign-up",
    redirectUrl: `${APP_URL}/get-started/success?session_id=${encodeURIComponent(row.stripe_session_id)}`,
    accountOpensOnSigning: true,
  });
  await db
    .from("starter_signups")
    .update(r.ok ? { agreement_document_id: r.documentId, last_error: null } : { last_error: r.error.slice(0, 300) })
    .eq("stripe_session_id", row.stripe_session_id);
}

/** Creates the account for a signed row. Returns true only for the caller that actually flipped it (so it happens, and is logged, once). */
export async function openAccount(row: StarterRow): Promise<boolean> {
  await provisionAccountForEmail(row.email, row.plan_id, row.full_name || undefined);
  const db = createServerClient();
  const now = new Date().toISOString();
  const { data: won } = await db.from("starter_signups").update({ status: "provisioned", signed_at: row.signed_at ?? now, provisioned_at: now, last_error: null }).eq("stripe_session_id", row.stripe_session_id).eq("status", "pending").select("stripe_session_id");
  if (!won?.length) return false;
  const housePlan = await ownerMasterPlanId().catch(() => null);
  if (housePlan) {
    const { data: c } = await db.from("seq_contacts").select("id, tags").eq("master_plan_id", housePlan).eq("email", row.email).maybeSingle();
    if (c) {
      await logEvent(housePlan, c.id as string, "note", "Signed the Year-1 Operating Agreement; Command Suite account created", { stripeSession: row.stripe_session_id, documentId: row.agreement_document_id }, db).catch(() => {});
      const tags = new Set(((c.tags as string[]) ?? []).map((t) => t.toLowerCase()));
      tags.add("agreement-signed");
      await db.from("seq_contacts").update({ tags: Array.from(tags), updated_at: now }).eq("id", c.id as string);
    }
  }
  return true;
}

/** A sign-in link that lets them choose a password. */
export async function passwordLinkFor(email: string): Promise<string | null> {
  const { data, error } = await authDb().auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: `${APP_URL}/auth/callback?next=/reset-password` } });
  if (error || !data?.properties?.action_link) {
    console.error("generateLink failed:", error?.message);
    return null;
  }
  return data.properties.action_link;
}

const escHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The branded email that goes out the moment they sign: a big button to book the 1:1 Welcome Call with Babs. When they
// left the page before the account opened (the two-minute job opened it), it also carries the "choose my password and
// sign in" button. Sent once, by whichever path opened the account.
export async function emailAfterSigning(row: StarterRow, opts: { signIn: boolean }): Promise<void> {
  const first = (row.full_name || "").trim().split(/\s+/)[0] || "";
  const welcome = `${APP_URL}/book/new-client-welcome-call?name=${encodeURIComponent(row.full_name || "")}&email=${encodeURIComponent(row.email)}`;
  const signInLink = opts.signIn ? (await passwordLinkFor(row.email)) || `${APP_URL}/forgot-password` : null;
  const p = 'style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#2E3A46"';
  const btn = (href: string, label: string, primary: boolean) =>
    `<p style="margin:22px 0"><a href="${escHtml(href)}" style="display:inline-block;${primary ? "background:#0F1A38;color:#E9D7A9" : "background:#E9D7A9;color:#0F1A38"};font-weight:bold;font-size:16px;padding:14px 26px;border-radius:999px;text-decoration:none">${escHtml(label)}</a></p>`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#0F1A38">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#B8923A;font-weight:bold">LifeCharter Command Suite</p>
<h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;color:#0F1A38">Thank you for signing, ${escHtml(first || "welcome")}. Next: book your Welcome Call.</h1>
<p ${p}>Your Year-1 Operating Agreement is signed${opts.signIn ? ", and your Command Suite account is now open" : ""}. The next step is your 1:1 Welcome Call with me. It is 30 minutes, just the two of us, before your implementation begins.</p>
${btn(welcome, "Choose a time for my Welcome Call", true)}
${signInLink ? `<p ${p}>Your account is open. This button signs you in so you can choose your password. If it has expired, go to ${escHtml(APP_URL)}/forgot-password and enter this email address.</p>${btn(signInLink, "Choose my password and sign in", false)}` : ""}
<p ${p}>Questions? Just reply to this email or write to support@lccommandsuite.com.</p>
<p ${p}>Head up - Wings out<br>Babs 🦋</p></div>`;
  const text = [
    `Thank you for signing, ${first || "welcome"}. Next: book your Welcome Call.`,
    `Your Year-1 Operating Agreement is signed${opts.signIn ? ", and your Command Suite account is now open" : ""}. The next step is your 1:1 Welcome Call with me: 30 minutes, just the two of us, before your implementation begins.`,
    `Choose a time for my Welcome Call: ${welcome}`,
    ...(signInLink ? [`Your account is open. Choose your password and sign in: ${signInLink} (if it has expired, go to ${APP_URL}/forgot-password and enter this email address).`] : []),
    "Questions? Reply to this email or write to support@lccommandsuite.com.",
    "Head up - Wings out\nBabs 🦋",
  ].join("\n\n");
  const ok = await sendRendered(row.email, { subject: "Next step: book your Welcome Call with Babs", html, text });
  if (ok) await createServerClient().from("starter_signups").update({ emailed_at: new Date().toISOString() }).eq("stripe_session_id", row.stripe_session_id);
}

/** Cron: finish signed sign-ups the client left the page on, retry unsent agreements, remind people who have not signed. */
export async function processPendingSignups(): Promise<{ checked: number; opened: number; reminded: number; retried: number }> {
  const db = createServerClient();
  const { data } = await db.from("starter_signups").select(COLS).eq("status", "pending").gte("created_at", new Date(Date.now() - 45 * 24 * HOUR).toISOString()).order("created_at").limit(50);
  let opened = 0;
  let reminded = 0;
  let retried = 0;
  for (const row of (data ?? []) as StarterRow[]) {
    const age = Date.now() - new Date(row.created_at).getTime();
    if (!row.agreement_document_id) {
      // The first send failed (or never ran): try again after a few minutes.
      if (age > 3 * 60_000) {
        const { data: claim } = await db.from("starter_signups").update({ last_error: `retrying ${new Date().toISOString()}` }).eq("stripe_session_id", row.stripe_session_id).is("agreement_document_id", null).lt("created_at", new Date(Date.now() - 3 * 60_000).toISOString()).select("stripe_session_id");
        if (claim?.length) {
          await sendAgreementFor(row, "", null);
          retried++;
        }
      }
      continue;
    }
    if (await clientHasSigned(row.agreement_document_id, row.email)) {
      if (await openAccount(row)) {
        await emailAfterSigning(row, { signIn: true });
        opened++;
      }
      continue;
    }
    // Not signed yet: a reminder email at about 1 day and 3 days (once each).
    const marks = [24 * HOUR, 72 * HOUR];
    const stage = marks.filter((m) => age >= m).length;
    const done = row.last_error?.startsWith("reminded:") ? Number(row.last_error.split(":")[1]) : 0;
    if (stage > done) {
      await remindSigner(row.agreement_document_id, row.email);
      await db.from("starter_signups").update({ last_error: `reminded:${stage}` }).eq("stripe_session_id", row.stripe_session_id);
      reminded++;
    }
  }
  return { checked: data?.length ?? 0, opened, reminded, retried };
}
