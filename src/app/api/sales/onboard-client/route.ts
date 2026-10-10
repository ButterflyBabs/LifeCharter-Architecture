import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { provisionAccountForEmail } from "@/lib/provisionAccount";
import { upsertContact, logEvent } from "@/lib/crm";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { sessionUser } from "@/lib/authz";
import { approvedClientTemplate } from "@/lib/email/clientTemplate";
import { renderAccountEmail, sendRendered } from "@/lib/email/accountReadyEmail";

/**
 * Called from the New Client form on /sales-reference after Marcello closes
 * a call (any tier — this is the manual counterpart to the automated
 * self-serve Starter flow in /api/stripe/starter-checkout). Three things
 * happen, in order, each best-effort past the point the record is saved:
 *
 * 1. Store the full intake submission (audit record, survives even if the
 *    later steps fail).
 * 2. Provision their Command Suite account — same provisionAccountForEmail
 *    helper the self-serve flow uses, so this is idempotent and safe even
 *    if they already have an account (e.g. a Starter customer upgrading).
 * 3. Save them in Babs's own Suite contacts, tagged command-suite-customer and
 *    lccs-paying-client, with "New LCCS paying client" on their timeline.
 * 4. Once Babs has approved the standard client email (New Client Accounts page),
 *    email it to a NEW client with their one-time password link, copies to Babs and to
 *    whoever pressed the button. That email replaces the automatic welcome email 1, and
 *    the welcome series' Day 1 email ("start the Brain assessment today") is held, because
 *    new clients wait for their New Client Implementation Call. Until it is approved,
 *    nothing changes: the login link is shown on screen, as before.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";

interface OnboardBody {
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

export async function POST(req: NextRequest) {
  try {
    const body: OnboardBody = await req.json();

    if (!body.fullName || !body.email || !body.tier || !body.year1AgreementAccepted) {
      return NextResponse.json(
        { error: "Missing required fields (name, email, tier, and agreement acknowledgment)" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const houseId = await ownerMasterPlanId().catch(() => null);
    const tpl = houseId ? await approvedClientTemplate(supabase, houseId).catch(() => null) : null;
    const presser = (await sessionUser().catch(() => null))?.email?.toLowerCase() || null;

    // 1. Provision the account first — need the user id before we can link the
    // submission row to it. Idempotent: an existing client (e.g. upgrading, or
    // Marcello correcting/adding detail on a follow-up call) gets updated in
    // place rather than a duplicate account.
    const { userId, workspaceId, isNewAccount } = await provisionAccountForEmail(
      body.loginEmail || body.email,
      body.tier,
      body.fullName,
      { skipWelcome: Boolean(tpl) }
    );
    // The New Client Setup Walkthrough (Email 1 of LCCS New Client Welcome) follows about 3 minutes after the account-ready email.

    // 2. Store the full intake record.
    const { error: insertError } = await supabase.from("client_intake_submissions").insert({
      full_name: body.fullName,
      email: body.email,
      phone: body.phone || null,
      company_name: body.companyName || null,
      website: body.website || null,
      industry: body.industry || null,
      years_in_business: body.yearsInBusiness || null,
      tier: body.tier,
      implementation_amount_cents: body.implementationAmountCents ?? null,
      implementation_date: body.implementationDate || null,
      monthly_revenue_range: body.monthlyRevenueRange || null,
      team_size: body.teamSize || null,
      primary_offer: body.primaryOffer || null,
      biggest_challenge: body.biggestChallenge || null,
      weakest_dimension: body.weakestDimension || null,
      session_source: body.sessionSource || null,
      login_email: body.loginEmail || body.email,
      timezone: body.timezone || null,
      preferred_call_time: body.preferredCallTime || null,
      year1_agreement_accepted: body.year1AgreementAccepted,
      user_id: userId,
      gc_tag_status: "not_used", // column left from a retired integration
    });

    if (insertError) {
      console.error("client_intake_submissions insert failed:", insertError.message);
      // Not fatal — the account already exists. Keep going so Marcello still
      // gets a working login link.
    }

    // 2b. Sync the call's business details onto the real account. The intake
    // row above is just an audit log — this is what the client's workspace
    // and plan actually show, for a brand-new account and an existing one
    // being updated alike. Best-effort past this point too.
    if (workspaceId) {
      const workspaceUpdate: Record<string, unknown> = {};
      if (body.companyName) workspaceUpdate.name = body.companyName;
      if (body.website) workspaceUpdate.website = body.website;
      if (Object.keys(workspaceUpdate).length) {
        await supabase.from("workspaces").update(workspaceUpdate).eq("id", workspaceId);
      }

      const { data: existingPlan } = await supabase
        .from("client_master_plans")
        .select("id, metadata")
        .eq("user_id", userId)
        .maybeSingle();

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
        await supabase
          .from("client_master_plans")
          .update({ client_name: body.fullName, client_email: body.email, metadata: mergedMetadata })
          .eq("id", existingPlan.id);
      } else {
        await supabase.from("client_master_plans").insert({
          workspace_id: workspaceId,
          user_id: userId,
          client_name: body.fullName,
          client_email: body.email,
          status: "active",
          metadata: intakeMetadata,
        });
      }
    }

    // 3. Tag them in Babs's own Suite contacts (best-effort).
    let contactSaved = false;
    try {
      const planId = await ownerMasterPlanId();
      if (planId) {
        const [firstName, ...rest] = body.fullName.trim().split(/\s+/);
        const c = await upsertContact({
          masterPlanId: planId,
          email: body.email,
          firstName: firstName || null,
          lastName: rest.join(" ") || null,
          phone: body.phone || null,
          timezone: body.timezone || null,
          source: body.sessionSource || "sales-onboarding",
          tags: ["command-suite-customer", "lccs-paying-client"],
        });
        if (c) {
          await logEvent(planId, c.id, "manual", `New LCCS paying client (${body.tier})`, {
            tier: body.tier,
            companyName: body.companyName || null,
            sessionSource: body.sessionSource || null,
          });
          contactSaved = true;
        }
      }
    } catch (e) {
      console.error(`[onboard-client] contact save failed for ${body.email}:`, e);
    }

    // 4. Generate a real login link to hand to the client — same recovery-link
    // pattern as the self-serve flow, since production SMTP still isn't wired
    // up to send this automatically.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: body.loginEmail || body.email,
      options: { redirectTo: `${APP_URL}/auth/callback?next=/reset-password` },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("generateLink failed:", linkError?.message);
      return NextResponse.json({ success: true, isNewAccount, contactSaved, loginUrl: null, emailed: false });
    }

    // 5. The approved standard email, to a new client only (an existing client already has a login).
    let emailed = false;
    if (tpl && isNewAccount) {
      const to = (body.loginEmail || body.email).toLowerCase();
      const rendered = renderAccountEmail(tpl.subject, tpl.body, { firstName: body.fullName.trim().split(/\s+/)[0] || "", loginUrl: linkData.properties.action_link, masterclassLink: null });
      emailed = await sendRendered(to, rendered, { extraBcc: presser ? [presser] : [] });
      if (houseId && contactSaved) {
        const { data: cc } = await supabase.from("seq_contacts").select("id").eq("master_plan_id", houseId).eq("email", body.email.toLowerCase()).maybeSingle();
        if (cc) await logEvent(houseId, cc.id as string, "manual", emailed ? "Account-ready email sent (copies to AmiLynne" + (presser ? " and " + presser : "") + ")" : "Account-ready email did NOT send", {}).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      isNewAccount,
      contactSaved,
      loginUrl: linkData.properties.action_link,
      emailed,
      standardEmailApproved: Boolean(tpl),
    });
  } catch (error) {
    console.error("Onboard client error:", error);
    return NextResponse.json({ error: "Failed to onboard client" }, { status: 500 });
  }
}
