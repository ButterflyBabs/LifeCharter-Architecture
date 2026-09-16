import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { provisionAccountForEmail } from "@/lib/provisionAccount";

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
 * 3. Tag their EXISTING Global Control contact (from MasterClass/Challenge
 *    registration) as a paying client — uses the tag-form-submission
 *    endpoint, the one proven to upsert-by-email in production (see
 *    commandsuite-landing-page/app/api/register/route.ts). Missing
 *    GC_CLIENT_TAG_ID is a configuration gap, not a reason to fail the
 *    whole request — the account still gets created either way.
 */

const GC_FORM_BASE =
  process.env.GC_FORM_BASE || "https://api.globalcontrol.io/api/tag-form-submission";

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
  loginEmail?: string;
  timezone?: string;
  preferredCallTime?: string;
  year1AgreementAccepted: boolean;
}

async function fireClientTag(email: string, fullName: string, phone?: string): Promise<string> {
  const tagId = process.env.GC_CLIENT_TAG_ID;
  if (!tagId) {
    console.error(`[onboard-client] NOT CONFIGURED — no GC_CLIENT_TAG_ID set. Contact not tagged: ${email}`);
    return "skipped_no_tag_id";
  }

  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.GLOBAL_CONTROL_API_KEY) {
    headers["X-API-KEY"] = process.env.GLOBAL_CONTROL_API_KEY;
  }

  try {
    const res = await fetch(`${GC_FORM_BASE}/${encodeURIComponent(tagId)}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        firstName: firstName || "",
        lastName: rest.join(" ") || "",
        ...(phone ? { phone } : {}),
      }),
    });
    const payload = await res.json().catch(() => null);
    // GC returns HTTP 200 even on failure — success must be checked explicitly.
    const succeeded = res.ok && payload?.data?.success === true;
    if (!succeeded) {
      console.error(`[onboard-client] TAG SUBMIT FAILED for ${email}: ${JSON.stringify(payload)}`);
      return "failed";
    }
    return "tagged";
  } catch (err) {
    console.error(`[onboard-client] TAG SUBMIT ERROR for ${email}:`, err);
    return "error";
  }
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

    // 1. Provision the account first — need the user id before we can link the
    // submission row to it. Idempotent: an existing client (e.g. upgrading, or
    // Marcello correcting/adding detail on a follow-up call) gets updated in
    // place rather than a duplicate account.
    const { userId, workspaceId, isNewAccount } = await provisionAccountForEmail(
      body.loginEmail || body.email,
      body.tier,
      body.fullName
    );

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
      login_email: body.loginEmail || body.email,
      timezone: body.timezone || null,
      preferred_call_time: body.preferredCallTime || null,
      year1_agreement_accepted: body.year1AgreementAccepted,
      user_id: userId,
      gc_tag_status: "pending",
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

    // 3. Tag their existing Global Control contact (best-effort).
    const tagStatus = await fireClientTag(body.email, body.fullName, body.phone);
    await supabase
      .from("client_intake_submissions")
      .update({ gc_tag_status: tagStatus })
      .eq("email", body.email)
      .eq("user_id", userId);

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
      return NextResponse.json({ success: true, isNewAccount, gcTagStatus: tagStatus, loginUrl: null });
    }

    return NextResponse.json({
      success: true,
      isNewAccount,
      gcTagStatus: tagStatus,
      loginUrl: linkData.properties.action_link,
    });
  } catch (error) {
    console.error("Onboard client error:", error);
    return NextResponse.json({ error: "Failed to onboard client" }, { status: 500 });
  }
}
