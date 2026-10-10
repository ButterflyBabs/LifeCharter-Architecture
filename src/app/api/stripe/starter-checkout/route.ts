/**
 * Public, unauthenticated checkout entry point for the self-serve Starter
 * sign-up page. Charges only the one-time implementation fee (the decided
 * model: monthly billing starts after implementation is complete, not at
 * signup) — so this is a one-time "payment" mode session, not the
 * subscription-mode flow in /api/stripe/checkout (which is built for an
 * already-authenticated user changing plans from Settings).
 *
 * Pricing is read from the `plans` table at request time, never hardcoded,
 * so it always matches whatever the Billing tab is currently showing —
 * EXCEPT on the alumni path (below), which must use the real catalog
 * Implementation Fee price so the LCALUMNI500 promotion code's product
 * restriction can match it.
 *
 * LifeCharter alumni get a $500 implementation credit (LCALUMNI500, Terms
 * of Sale 3.5), requested with { alumni: true } in the body (the
 * /get-started page sets this from ?alumni=1 or its own checkbox). The
 * catalog Implementation price here is billed at its list price, dynamic
 * per-cart pricing given up on the alumni path in exchange for the promo
 * code applying (Stripe restricts it by product, which price_data's inline,
 * ad-hoc product would never match) — so a graduate who's also a current
 * Collective Plus member won't get their Plus credit alongside the alumni
 * credit through this route. Flag that to Babs if it needs to be solved.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AFF_COOKIE } from "@/lib/affiliates";
import { stripe } from "@/lib/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { plusCreditFor } from "@/lib/community/plus";
import { ALUMNI_PROMOTION_CODE_ID } from "@/lib/stripeAlumni";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";
// The Starter Implementation Fee's real catalog price — same id as
// checkout-session's TIER_PRICES.starter.implementationPriceId (confirmed
// against the live Stripe dashboard, not generated dynamically). Used only
// on the alumni path so LCALUMNI500's product restriction can match it.
const STARTER_IMPLEMENTATION_PRICE_ID = "price_1UFx60LtotgP5J18Vih3WrJs";

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const { email, fullName, sessionSource, alumni } = await req.json();
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    const isAlumni = alumni === true;

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, onboarding_fee")
      .eq("id", "starter")
      .single();

    if (planError || !plan || !plan.onboarding_fee) {
      return NextResponse.json({ error: "Starter plan is not configured" }, { status: 500 });
    }

    // Collective Plus members get their last month of Plus credited — not
    // available on the alumni path (see the file header note above).
    const credit = isAlumni ? 0 : Math.min(await plusCreditFor(email).catch(() => 0), plan.onboarding_fee - 50);
    const amount = plan.onboarding_fee - Math.max(0, credit);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      custom_text: { submit: { message: `By completing this purchase you agree to the [Terms of Sale](${APP_URL}/legal/terms-of-sale) and the [Year-1 Commitment Acknowledgment](${APP_URL}/legal/year-1-agreement).` } },
      customer_email: email,
      line_items: isAlumni
        ? [{ price: STARTER_IMPLEMENTATION_PRICE_ID, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "usd",
                unit_amount: amount,
                product_data: {
                  name: `LifeCharter Command Suite — ${plan.name} Implementation`,
                  description:
                    "One-time implementation fee. Monthly billing begins once implementation is complete." +
                    (credit > 0 ? ` Includes a $${(credit / 100).toFixed(2)} credit for your last month of Collective Plus.` : ""),
                },
              },
              quantity: 1,
            },
          ],
      // Alumni get the $500 implementation credit instead of the free month
      // — never both (Terms of Sale 3.5).
      discounts: isAlumni ? [{ promotion_code: ALUMNI_PROMOTION_CODE_ID }] : undefined,
      success_url: `${APP_URL}/get-started/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/get-started`,
      metadata: {
        flow: "self_serve_starter",
        planId: plan.id,
        fullName: fullName || "",
        sessionSource: typeof sessionSource === "string" ? sessionSource : "",
        plusCredit: String(credit > 0 ? credit : 0),
        alumni: isAlumni ? "true" : "false",
        // An affiliate's link brought them here (credited when the payment completes).
        affiliate: cookies().get(AFF_COOKIE)?.value || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Starter checkout error:", error);
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
  }
}
