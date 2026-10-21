import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { provisionAccountForEmail } from "@/lib/provisionAccount";
import { upsertContact, logEvent } from "@/lib/crm";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { approvedClientTemplate } from "@/lib/email/clientTemplate";
import { masterclassLinkForEmail } from "@/lib/affiliateStarter";
import { renderAccountEmail, sendRendered } from "@/lib/email/accountReadyEmail";
import { noSignInEmailReminder } from "@/lib/email/noSignInEmail";
import { accountEvidence, evidenceReady, missingPieces, missingText } from "@/lib/accountEvidence";
import { remindSigner } from "@/lib/starterSignup";

// The New Client Onboarding form on /sales-reference (Marcello, after a call he closed). Babs's rule (2026-10-17): no account
// is ever created without a payment AND the client's signature on the Year-1 Operating Agreement. So the form always SAVES the
// details, but the account is created only when both are in. If they are not yet, the details wait ("awaiting") and the
// two-minute job (processAwaitingOnboardings) creates the account and emails the client the moment both arrive. Nobody
// has to remember to come back.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";
const HOUR = 3_600_000;

export interface OnboardBody {
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  website?: string;
  industry?: string;
  yearsInBusiness?: string;
  tier: "starter" | "growth" | "vip";
  implementationAmountCents?: number;
  implementationDate?: string;
  monthlyRevenueRange?: string;
  teamSize?: string;
  primaryOffer?: string;
  biggestChallenge?: string;
  weakestDimension?: string;
  /** Which MasterClass/channel/referral this client came from, if known. */
  sessionSource?: string;
  loginEmail?: string;
  timezone?: string;
  preferredCallTime?: string;
  year1AgreementAccepted: boolean;
}

export interface OnboardResult {
  success: true;
  isNewAccount: boolean;
  contactSaved: boolean;
  loginUrl: string | null;
  emailed: boolean;
  standardEmailApproved?: boolean;
}

export interface WaitingResult {
  success: true;
  awaiting: true;
  waitingFor: string[];
}

const COLS = "id, full_name, email, phone, company_name, website, industry, years_in_business, tier, implementation_amount_cents, implementation_date, monthly_revenue_range, team_size, primary_offer, biggest_challenge, weakest_dimension, session_source, login_email, timezone, preferred_call_time, year1_agreement_accepted, requested_by, account_waiting_note, created_at";

type IntakeRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  website: string | null;
  industry: string | null;
  years_in_business: string | null;
  tier: string;
  implementation_amount_cents: number | null;
  implementation_date: string | null;
  monthly_revenue_range: string | null;
  team_size: string | null;
  primary_offer: string | null;
  biggest_challenge: string | null;
  weakest_dimension: string | null;
  session_source: string | null;
  login_email: string | null;
  timezone: string | null;
  preferred_call_time: string | null;
  year1_agreement_accepted: boolean;
  requested_by: string | null;
  account_waiting_note: string | null;
  created_at: string;
};

const bodyFromRow = (r: IntakeRow): OnboardBody => ({
  fullName: r.full_name,
  email: r.email,
  phone: r.phone || undefined,
  companyName: r.company_name || undefined,
  website: r.website || undefined,
  industry: r.industry || undefined,
  yearsInBusiness: r.years_in_business || undefined,
  tier: (["starter", "growth", "vip"].includes(r.tier) ? r.tier : "starter") as OnboardBody["tier"],
  implementationAmountCents: r.implementation_amount_cents ?? undefined,
  implementationDate: r.implementation_date || undefined,
  monthlyRevenueRange: r.monthly_revenue_range || undefined,
  teamSize: r.team_size || undefined,
  primaryOffer: r.primary_offer || undefined,
  biggestChallenge: r.biggest_challenge || undefined,
  weakestDimension: r.weakest_dimension || undefined,
  sessionSource: r.session_source || undefined,
  loginEmail: r.login_email || undefined,
  timezone: r.timezone || undefined,
  preferredCallTime: r.preferred_call_time || undefined,
  year1AgreementAccepted: r.year1_agreement_accepted,
});

const intakeFields = (b: OnboardBody) => ({
  full_name: b.fullName,
  email: b.email,
  phone: b.phone || null,
  company_name: b.companyName || null,
  website: b.website || null,
  industry: b.industry || null,
  years_in_business: b.yearsInBusiness || null,
  tier: b.tier,
  implementation_amount_cents: b.implementationAmountCents ?? null,
  implementation_date: b.implementationDate || null,
  monthly_revenue_range: b.monthlyRevenueRange || null,
  team_size: b.teamSize || null,
  primary_offer: b.primaryOffer || null,
  biggest_challenge: b.biggestChallenge || null,
  weakest_dimension: b.weakestDimension || null,
  session_source: b.sessionSource || null,
  login_email: b.loginEmail || b.email,
  timezone: b.timezone || null,
  preferred_call_time: b.preferredCallTime || null,
  year1_agreement_accepted: b.year1AgreementAccepted,
});

/**
 * Saves the form and creates the account only when the payment and the client's signature are both in. Otherwise the
 * details are kept as "awaiting" (one row per email) and the account opens by itself later.
 */
export async function submitOnboarding(body: OnboardBody, presser: string | null): Promise<OnboardResult | WaitingResult> {
  const ev = await accountEvidence(body.email);
  if (evidenceReady(ev)) return completeOnboarding(body, { presser });

  const db = createServerClient();
  const email = body.email.trim().toLowerCase();
  const { data: open } = await db.from("client_intake_submissions").select("id").ilike("email", email).eq("account_status", "awaiting").limit(1).maybeSingle();
  const row = { ...intakeFields({ ...body, email }), account_status: "awaiting", requested_by: presser, account_waiting_note: null, gc_tag_status: "not_used" };
  if (open) await db.from("client_intake_submissions").update(row).eq("id", open.id as string);
  else await db.from("client_intake_submissions").insert(row);

  const waitingFor = missingPieces(ev);
  const house = await ownerMasterPlanId().catch(() => null);
  if (house && ev.contactId) {
    await logEvent(house, ev.contactId, "note", `New client details saved. The account opens by itself once ${missingText(ev)} ${waitingFor.length > 1 ? "are" : "is"} in`, { waitingFor }, db).catch(() => {});
  }
  return { success: true, awaiting: true, waitingFor };
}

/** The account creation itself: only call this once accountEvidence says it is allowed (or from the cron, which checks). */
export async function completeOnboarding(body: OnboardBody, o: { presser: string | null; intakeId?: string | null }): Promise<OnboardResult> {
  const supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

  const houseId = await ownerMasterPlanId().catch(() => null);
  const tpl = houseId ? await approvedClientTemplate(supabase, houseId).catch(() => null) : null;
  const presser = o.presser;

  // 1. Provision the account first: we need the user id to link the intake row. Idempotent: an existing client (an upgrade,
  // or Marcello adding detail on a follow-up call) is updated in place rather than duplicated.
  const { userId, workspaceId, isNewAccount } = await provisionAccountForEmail(body.loginEmail || body.email, body.tier, body.fullName, { skipWelcome: Boolean(tpl) });
  // The New Client Setup Walkthrough (Email 1 of LCCS New Client Welcome) follows about 3 minutes after the account-ready email.

  // 2. Store (or finish) the intake record.
  const fields = { ...intakeFields(body), user_id: userId, gc_tag_status: "not_used", account_status: "created", account_created_at: new Date().toISOString() };
  const { error: insertError } = o.intakeId
    ? await supabase.from("client_intake_submissions").update(fields).eq("id", o.intakeId)
    : await supabase.from("client_intake_submissions").insert({ ...fields, requested_by: presser });
  if (insertError) console.error("client_intake_submissions save failed:", insertError.message); // not fatal: the account already exists

  // 2b. Sync the call's business details onto the real account (the intake row is only an audit log). Best-effort.
  if (workspaceId) {
    const workspaceUpdate: Record<string, unknown> = {};
    if (body.companyName) workspaceUpdate.name = body.companyName;
    if (body.website) workspaceUpdate.website = body.website;
    if (Object.keys(workspaceUpdate).length) await supabase.from("workspaces").update(workspaceUpdate).eq("id", workspaceId);

    const { data: existingPlan } = await supabase.from("client_master_plans").select("id, metadata").eq("user_id", userId).maybeSingle();
    const intakeMetadata: Record<string, unknown> = {};
    if (body.industry) intakeMetadata.industry = body.industry;
    if (body.yearsInBusiness) intakeMetadata.years_in_business = body.yearsInBusiness;
    if (body.monthlyRevenueRange) intakeMetadata.monthly_revenue_range = body.monthlyRevenueRange;
    if (body.teamSize) intakeMetadata.team_size = body.teamSize;
    if (body.primaryOffer) intakeMetadata.primary_offer = body.primaryOffer;
    if (body.biggestChallenge) intakeMetadata.biggest_challenge = body.biggestChallenge;
    if (body.weakestDimension) intakeMetadata.weakest_dimension = body.weakestDimension;
    if (body.sessionSource) intakeMetadata.session_source = body.sessionSource;
    if (body.timezone) intakeMetadata.timezone = body.timezone;
    if (body.preferredCallTime) intakeMetadata.preferred_call_time = body.preferredCallTime;
    if (existingPlan) {
      const mergedMetadata = { ...((existingPlan.metadata as object) || {}), ...intakeMetadata };
      await supabase.from("client_master_plans").update({ client_name: body.fullName, client_email: body.email, metadata: mergedMetadata }).eq("id", existingPlan.id);
    } else {
      await supabase.from("client_master_plans").insert({ workspace_id: workspaceId, user_id: userId, client_name: body.fullName, client_email: body.email, status: "active", metadata: intakeMetadata });
    }
  }

  // 3. Tag them in Babs's own Suite contacts (best-effort).
  let contactSaved = false;
  try {
    if (houseId) {
      const [firstName, ...rest] = body.fullName.trim().split(/\s+/);
      const c = await upsertContact({
        masterPlanId: houseId,
        email: body.email,
        firstName: firstName || null,
        lastName: rest.join(" ") || null,
        phone: body.phone || null,
        timezone: body.timezone || null,
        source: body.sessionSource || "sales-onboarding",
        tags: ["command-suite-customer", "lccs-paying-client"],
      });
      if (c) {
        await logEvent(houseId, c.id, "manual", `New LCCS paying client (${body.tier})`, { tier: body.tier, companyName: body.companyName || null, sessionSource: body.sessionSource || null });
        contactSaved = true;
      }
    }
  } catch (e) {
    console.error(`[onboard-client] contact save failed for ${body.email}:`, e);
  }

  // 4. A real sign-in link (the same recovery-link pattern as the self-serve flow).
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: body.loginEmail || body.email,
    options: { redirectTo: `${APP_URL}/auth/callback?next=/reset-password` },
  });
  if (linkError || !linkData?.properties?.action_link) {
    console.error("generateLink failed:", linkError?.message);
    if (isNewAccount && houseId) await alertNoSignInEmail(supabase, houseId, { name: body.fullName, email: (body.loginEmail || body.email).toLowerCase() }, "no-link");
    return { success: true, isNewAccount, contactSaved, loginUrl: null, emailed: false };
  }

  // 5. The approved standard email, to a new client only (an existing client already has a login).
  let emailed = false;
  if (tpl && isNewAccount) {
    const to = (body.loginEmail || body.email).toLowerCase();
    const rendered = renderAccountEmail(tpl.subject, tpl.body, {
      firstName: body.fullName.trim().split(/\s+/)[0] || "",
      loginUrl: linkData.properties.action_link,
      masterclassLink: houseId ? await masterclassLinkForEmail(supabase as never, houseId, to).catch(() => null) : null,
    });
    emailed = await sendRendered(to, rendered, { extraBcc: presser ? [presser] : [] });
    if (houseId && contactSaved) {
      const { data: cc } = await supabase.from("seq_contacts").select("id").eq("master_plan_id", houseId).eq("email", body.email.toLowerCase()).maybeSingle();
      if (cc) await logEvent(houseId, cc.id as string, "manual", emailed ? "Account-ready email sent (copies to AmiLynne" + (presser ? " and " + presser : "") + ")" : "Account-ready email did NOT send", {}).catch(() => {});
    }
  }

  // A new client whose sign-in email did not go out (standard email still a draft, or the send failed): tell Babs today.
  if (isNewAccount && !emailed && houseId) {
    await alertNoSignInEmail(supabase, houseId, { name: body.fullName, email: (body.loginEmail || body.email).toLowerCase() }, tpl ? "failed" : "draft");
  }

  return { success: true, isNewAccount, contactSaved, loginUrl: linkData.properties.action_link, emailed, standardEmailApproved: Boolean(tpl) };
}

// A reminder for Babs (bell card and email through the Reminders job) that a new client has an account but no sign-in
// email. Never throws: the account is already open either way.
async function alertNoSignInEmail(db: { from: (t: string) => any }, houseId: string, who: { name: string; email: string }, why: "draft" | "failed" | "no-link") { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const r = noSignInEmailReminder(who, why, APP_URL);
    await db.from("reminders").insert({ master_plan_id: houseId, title: r.title, notes: r.notes, remind_at: new Date().toISOString() });
  } catch (e) {
    console.error("[onboard-client] no-sign-in-email alert failed:", (e as Error).message);
  }
}

/**
 * Cron (every two minutes, with the Starter sign-ups): creates the account for every waiting New Client Onboarding the moment the
 * payment and the client's signature are both in, and sends signing reminders at about 1 and 3 days while they are unsigned.
 */
export async function processAwaitingOnboardings(): Promise<{ waiting: number; opened: number; reminded: number }> {
  const db = createServerClient();
  const { data } = await db.from("client_intake_submissions").select(COLS).eq("account_status", "awaiting").gte("created_at", new Date(Date.now() - 60 * 24 * HOUR).toISOString()).order("created_at").limit(30);
  let opened = 0;
  let reminded = 0;
  for (const row of (data ?? []) as IntakeRow[]) {
    const ev = await accountEvidence(row.email);
    if (evidenceReady(ev)) {
      // Claim the row first (compare-and-swap on its note) so two overlapping runs cannot both create the account. A claim
      // older than 10 minutes means that run died, so it may be taken again.
      const note = row.account_waiting_note;
      const busy = note?.startsWith("opening ") && Date.now() - new Date(note.slice(8)).getTime() < 10 * 60_000;
      if (busy) continue;
      const mine = `opening ${new Date().toISOString()}`;
      const q = db.from("client_intake_submissions").update({ account_waiting_note: mine }).eq("id", row.id).eq("account_status", "awaiting");
      const { data: claim } = await (note === null ? q.is("account_waiting_note", null) : q.eq("account_waiting_note", note)).select("id");
      if (!claim?.length) continue;
      try {
        await completeOnboarding(bodyFromRow(row), { presser: row.requested_by, intakeId: row.id });
        opened++;
      } catch (e) {
        console.error(`[onboarding cron] ${row.email}:`, (e as Error).message);
        await db.from("client_intake_submissions").update({ account_waiting_note: `failed: ${(e as Error).message}`.slice(0, 300) }).eq("id", row.id);
      }
      continue;
    }
    if (ev.paid && ev.unsignedDocumentId) {
      const age = Date.now() - new Date(row.created_at).getTime();
      const stage = [24 * HOUR, 72 * HOUR].filter((m) => age >= m).length;
      const done = row.account_waiting_note?.startsWith("reminded:") ? Number(row.account_waiting_note.split(":")[1]) : 0;
      if (stage > done) {
        await remindSigner(ev.unsignedDocumentId, row.email);
        await db.from("client_intake_submissions").update({ account_waiting_note: `reminded:${stage}` }).eq("id", row.id);
        reminded++;
      }
    }
  }
  return { waiting: data?.length ?? 0, opened, reminded };
}
