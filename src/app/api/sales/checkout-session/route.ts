/**
 * Called from /sales-reference — creates a single Stripe Checkout Session
 * that bundles the one-time Implementation Fee and the monthly subscription
 * for the chosen tier into one cart (Stripe's "mixed cart" support: one
 * payment-mode line item + one recurring line item in a subscription-mode
 * session). The FIRSTMONTHFREE coupon is applied automatically — it's
 * scoped via applies_to.products to only the three monthly-subscription
 * products, so it can never accidentally discount the implementation fee
 * line item in the same cart.
 *
 * Replaces sending two separate links (implementation fee, then a monthly
 * link with a hand-typed coupon code) with one link that does both.
 *
 * Real, live Stripe price ids — same convention already used for the
 * Payment Links in page.tsx (confirmed against the live Billing tab /
 * Stripe dashboard directly, not generated dynamically).
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";

const FIRST_MONTH_FREE_COUPON_ID = "CwLz0M07"; // FIRSTMONTHFREE

const TIER_PRICES: Record<string, { monthlyPriceId: string; implementationPriceId: string }> = {
  starter: {
    monthlyPriceId: "price_1UFxEMLtotgP5J189ky7bu03",
    implementationPriceId: "price_1UFx60LtotgP5J18Vih3WrJs",
  },
  growth: {
    monthlyPriceId: "price_1UFxF1LtotgP5J18KeV9NI2y",
    implementationPriceId: "price_1UFx7VLtotgP5J18pOPwa8yO",
  },
  vip: {
    monthlyPriceId: "price_1UFxFuLtotgP5J188iWSSUg2",
    implementationPriceId: "price_1UFx9vLtotgP5J18LDbeFXIE",
  },
};

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const { tier, email, fullName, sessionSource } = await req.json();
    const prices = TIER_PRICES[tier as string];
    if (!prices) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
    if (email && (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email))) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email || undefined,
      line_items: [
        { price: prices.monthlyPriceId, quantity: 1 },
        { price: prices.implementationPriceId, quantity: 1 },
      ],
      discounts: [{ coupon: FIRST_MONTH_FREE_COUPON_ID }],
      success_url: `${APP_URL}/sales-reference?checkout=success`,
      cancel_url: `${APP_URL}/sales-reference?checkout=cancelled`,
      metadata: {
        flow: "sales_combined_checkout",
        tier,
        fullName: fullName || "",
        sessionSource: sessionSource || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Combined checkout session error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
