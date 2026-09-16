import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" }) : null;

/**
 * ONE-TIME SETUP ROUTE — creates the live-mode Stripe Billing Portal
 * configuration so /api/billing/portal can actually open a session. Gated on
 * a secret stored in app_settings (service-role only, not a Vercel env var —
 * generated and stored directly, no manual dashboard step needed).
 *
 * Deliberately conservative: payment method update, invoice history, and
 * contact-detail updates are enabled; self-serve cancellation and plan
 * switching are NOT — cancelling within the Year-1 term carries a real
 * early-termination fee per the Terms of Sale, which Stripe's own portal
 * has no way to enforce, and tier changes should go through a sales
 * conversation, not a self-serve toggle.
 *
 * Safe to delete this file once it's been run successfully once.
 */
export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const providedSecret = req.headers.get("x-setup-secret");
  const supabase = createServerClient();
  const { data: secretRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "stripe_portal_setup_secret")
    .maybeSingle();

  if (!providedSecret || !secretRow?.value || providedSecret !== secretRow.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "LifeCharter Command Suite billing",
        privacy_policy_url: "https://lccommandsuite.com/legal/privacy-policy",
        terms_of_service_url: "https://lccommandsuite.com/legal/terms-of-sale",
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ["email", "address", "phone"],
        },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: false },
        subscription_update: { enabled: false },
      },
    });

    await supabase
      .from("app_settings")
      .upsert({ key: "stripe_portal_configuration_id", value: configuration.id, updated_at: new Date().toISOString() });

    return NextResponse.json({ ok: true, configurationId: configuration.id });
  } catch (err) {
    console.error("[stripe-portal-setup] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create portal configuration" },
      { status: 502 }
    );
  }
}
