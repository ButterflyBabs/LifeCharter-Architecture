import { createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { logEvent, upsertContact } from "@/lib/crm";
import { sendYear1Agreement } from "@/lib/year1Agreement";
import { provisionAccountForEmail } from "@/lib/provisionAccount";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { renderAccountEmail, sendRendered } from "@/lib/email/accountReadyEmail";

// Self-serve Starter sign-up: pay -> sign the Year-1 Operating Agreement -> the account opens.
// The account (and any access to the Suite) is created ONLY after the client has signed, so nobody is ever chased for paperwork.
// One starter_signups row per paid checkout session: "pending" (agreement sent, waiting for the signature), then "provisioned".
// Three things move a row forward, whichever comes first: the success page (polls while the client waits), the webhook
// (starts it), and the every-two-minutes job (finishes it if the client signed after closing the page, and sends reminders).

const API_BASE = (process.env.BOLDSIGN_API_BASE || "https://api.boldsign.com").replace(/\/$/, "");
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

// BoldSign: has the client (not AmiLynne's countersignature) finished signing?
export async function clientHasSigned(documentId: string, clientEmail: string): Promise<boolean> {
  const key = process.env.BOLDSIGN_API_KEY;
  if (!key) return false;
  const res = await fetch(`${API_BASE}/v1/document/properties?documentId=${encodeURIComponent(documentId)}`, { headers: { "X-API-KEY": key, Accept: "application/json" } }).catch(() => null);
  if (!res?.ok) return false;
  const doc = (await res.json().catch(() => null)) as { status?: string; signerDetails?: { signerEmail?: string; status?: string }[] } | null;
  if (!doc) return false;
  const mine = (doc.signerDetails ?? []).find((s) => (s.signerEmail ?? "").toLowerCase() === clientEmail.toLowerCase());
  return (mine?.status ?? "").toLowerCase() === "completed" || (doc.status ?? "").toLowerCase() === "completed";
}

async function remindSigner(documentId: string, clientEmail: string): Promise<void> {
  const key = process.env.BOLDSIGN_API_KEY;
  if (!key) return;
  await fetch(`${API_BASE}/v1/document/remind?documentId=${encodeURIComponent(documentId)}`, {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ receiverEmails: [clientEmail], message: "A quick reminder: your LifeCharter Command Suite account opens the moment you sign your Year-1 Operating Agreement. It takes about two minutes. Head up - Wings out. Babs" }),
  }).catch(() => null);
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
    welcomeCallLink: true,
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

async function emailAccountOpen(row: StarterRow): Promise<void> {
  const link = (await passwordLinkFor(row.email)) || `${APP_URL}/forgot-password`;
  const first = (row.full_name || "").trim().split(/\s+/)[0] || "";
  const welcome = `${APP_URL}/book/new-client-welcome-call?name=${encodeURIComponent(row.full_name || "")}&email=${encodeURIComponent(row.email)}`;
  const body = [
    "{{greeting}}",
    "Thank you for signing your Year-1 Operating Agreement. Your LifeCharter Command Suite account is now open.",
    "{{password_link}}",
    `That button signs you in so you can choose your password. If it has expired, go to ${APP_URL}/forgot-password and enter this email address.`,
    `If you have not yet chosen a time for your 1:1 Welcome Call with me, you can do that here: ${welcome}`,
    "Head up - Wings out\nBabs 🦋",
  ].join("\n\n");
  const ok = await sendRendered(row.email, renderAccountEmail("Your LifeCharter Command Suite account is open", body, { firstName: first, loginUrl: link, masterclassLink: null }));
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
        await emailAccountOpen(row);
        opened++;
      }
      continue;
    }
    // Not signed yet: a nudge from BoldSign at about 1 day and 3 days (once each).
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
