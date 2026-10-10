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
 * A LifeCharter graduate gets the $500 alumni implementation credit
 * (LCALUMNI500) INSTEAD of FIRSTMONTHFREE — Terms of Sale 3.5: alumni get
 * this credit, never both. LCALUMNI500 is scoped via applies_to.products to
 * only the three Implementation Fee products, so it only ever discounts
 * that line item. Checkout requests this with { alumni: true } in the body.
 *
 * Replaces sending two separate links (implementation fee, then a monthly
 * link with a hand-typed coupon code) with one link that does both.
 *
 * Real, live Stripe price ids — same convention already used for the
 * Payment Links in page.tsx (confirmed against the live Billing tab /
 * Stripe dashboard directly, not generated dynamically).
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AFF_COOKIE } from "@/lib/affiliates";
import { stripe } from "@/lib/stripe";
import { ALUMNI_PROMOTION_CODE_ID, FIRST_MONTH_FREE_COUPON_ID, TIER_PRICES } from "@/lib/stripeCatalog";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";

// Implementation fee by tier, in cents (matches the live Implementation Fee prices and the plans table).
const IMPLEMENTATION_CENTS: Record<string, number> = { starter: 249700, growth: 299700, vip: 499700 };
const TIER_NAME: Record<string, string> = { starter: "Starter", growth: "Growth", vip: "VIP" };
const ALUMNI_CREDIT_CENTS = 50000;

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const { tier, email, fullName, sessionSource, alumni, split } = await req.json();
    const prices = TIER_PRICES[tier as string];
    if (!prices) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
    if (email && (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email))) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const isAlumni = alumni === true;

    // 50/50 plan: half of the implementation fee today, the other half 30 days later (added by the webhook once the
    // checkout completes, so it lands on the invoice that also carries the first monthly charge). The alumni credit
    // simply comes off the total before it is halved.
    const isSplit = split === true;
    const totalImpl = (IMPLEMENTATION_CENTS[tier as string] ?? 0) - (isAlumni && isSplit ? ALUMNI_CREDIT_CENTS : 0);
    const firstHalf = Math.ceil(totalImpl / 2);
    const secondHalf = totalImpl - firstHalf;
    const tierName = TIER_NAME[tier as string] ?? String(tier);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email || undefined,
      line_items: isSplit
        ? [
            { price: prices.monthlyPriceId, quantity: 1 },
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: firstHalf,
                product_data: { name: `LifeCharter Command Suite ${tierName} - Implementation Fee (payment 1 of 2)` },
              },
            },
          ]
        : [
            { price: prices.monthlyPriceId, quantity: 1 },
            { price: prices.implementationPriceId, quantity: 1 },
          ],
      // Alumni get the $500 implementation credit instead of the free month, never both (Terms of Sale 3.5).
      // Stripe checkout only accepts one `discounts` entry, so the paths are mutually exclusive here too. On the
      // 50/50 plan the credit is already taken off the total above, so only the standard path adds a discount.
      ...(isAlumni && isSplit ? {} : { discounts: [isAlumni ? { promotion_code: ALUMNI_PROMOTION_CODE_ID } : { coupon: FIRST_MONTH_FREE_COUPON_ID }] }),
      success_url: `${APP_URL}/sales-reference?checkout=success`,
      cancel_url: `${APP_URL}/sales-reference?checkout=cancelled`,
      metadata: {
        flow: "sales_combined_checkout",
        tier,
        fullName: fullName || "",
        sessionSource: sessionSource || "",
        alumni: isAlumni ? "true" : "false",
        affiliate: cookies().get(AFF_COOKIE)?.value || "",
        ...(isSplit ? { implPlan: "split", implSecondHalfCents: String(secondHalf) } : {}),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Combined checkout session error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
