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
import { ALUMNI_PROMOTION_CODE_ID, FIRST_MONTH_FREE_COUPON_ID } from "@/lib/stripeCatalog";
import { TIERS, TIER_NAME, isSwitched, pricesFor, type Tier, type TierPrices } from "@/lib/pricing";
import { loadPricingSettings, todayMountain } from "@/lib/pricingServer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";


// Prices come from src/lib/pricing.ts: the founder list until the switch day (January 1, 2027), the new list after.
// A saved Stripe price id is used when there is one; otherwise the price is created inline at checkout.
const monthlyLine = (p: TierPrices, tier: Tier) =>
  p.monthlyPriceId
    ? { price: p.monthlyPriceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: { currency: "usd", unit_amount: p.monthlyCents, recurring: { interval: "month" as const }, product_data: { name: `LifeCharter Command Suite ${TIER_NAME[tier]} (monthly)` } },
      };
const implementationLine = (p: TierPrices, tier: Tier) =>
  p.implementationPriceId
    ? { price: p.implementationPriceId, quantity: 1 }
    : { quantity: 1, price_data: { currency: "usd", unit_amount: p.implementationCents, product_data: { name: `LifeCharter Command Suite ${TIER_NAME[tier]} - Implementation Fee` } } };
const ALUMNI_CREDIT_CENTS = 50000;

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const { tier, email, fullName, sessionSource, alumni, split, annual } = await req.json();
    if (!TIERS.includes(tier as Tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
    const tierKey = tier as Tier;
    const pricingSettings = await loadPricingSettings();
    const today = todayMountain();
    const prices = pricesFor(tierKey, today, pricingSettings);
    // After the switch day the new Stripe prices must exist (Alignment Architect: pricing step "create prices"). Without
    // them the free-month coupon matches nothing in the cart and Stripe refuses the session, so say so plainly.
    if (isSwitched(today, pricingSettings) && (!prices.monthlyPriceId || !prices.implementationPriceId)) {
      console.error("Combined checkout: the new price list is live but its Stripe price ids are not saved (pricing_2027_prices).");
      return NextResponse.json({ error: "The new Stripe prices have not been created yet. Run the pricing step in Alignment Architect first." }, { status: 503 });
    }
    // While founder pricing is open the buyer is told, in the checkout itself, that the monthly fee is locked (Terms 3.7).
    const submitMessage =
      `By completing this purchase you agree to the [Terms of Sale](${APP_URL}/legal/terms-of-sale) and the [Year-1 Commitment Acknowledgment](${APP_URL}/legal/year-1-agreement).` +
      (isSwitched(today, pricingSettings) ? "" : " Founder pricing: your monthly fee is locked for as long as your agreement stays in place (Terms of Sale 3.7).");
    if (email && (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email))) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const isAlumni = alumni === true;

    // 50/50 plan: half of the implementation fee today, the other half 30 days later (added by the webhook once the
    // checkout completes, so it lands on the invoice that also carries the first monthly charge). The alumni credit
    // simply comes off the total before it is halved.
    const isSplit = split === true;
    const totalImpl = prices.implementationCents - (isAlumni && isSplit ? ALUMNI_CREDIT_CENTS : 0);
    const firstHalf = Math.ceil(totalImpl / 2);
    const secondHalf = totalImpl - firstHalf;
    const tierName = TIER_NAME[tierKey];

    // Annual pay-in-full: one payment covers the Implementation Fee and the first 12 monthly fees. The monthly
    // subscription is set up with a 365-day trial, so monthly billing begins by itself in month 13 (Terms 4.3).
    const isAnnual = annual === true && !isSplit;
    if (isAnnual) {
      const annualTotal = prices.annualCents - (isAlumni ? ALUMNI_CREDIT_CENTS : 0);
      const annualSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        custom_text: { submit: { message: submitMessage } },
        customer_email: email || undefined,
        line_items: [
          monthlyLine(prices, tierKey),
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: annualTotal,
              product_data: { name: `LifeCharter Command Suite ${tierName} Annual (setup and first 12 months, paid in full)` },
            },
          },
        ],
        subscription_data: { trial_period_days: 365 },
        success_url: `${APP_URL}/checkout/thanks`,
        cancel_url: `${APP_URL}/checkout/thanks?status=cancelled`,
        metadata: {
          flow: "sales_combined_checkout",
          tier,
          fullName: fullName || "",
          sessionSource: sessionSource || "",
          alumni: isAlumni ? "true" : "false",
          affiliate: cookies().get(AFF_COOKIE)?.value || "",
          implPlan: "annual",
          // What counts as the implementation part for implementation-only affiliate links.
          implCents: String(Math.max(0, prices.implementationCents - (isAlumni ? ALUMNI_CREDIT_CENTS : 0))),
        },
      });
      return NextResponse.json({ url: annualSession.url });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      custom_text: { submit: { message: submitMessage } },
      customer_email: email || undefined,
      line_items: isSplit
        ? [
            monthlyLine(prices, tierKey),
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
            monthlyLine(prices, tierKey),
            implementationLine(prices, tierKey),
          ],
      // Alumni get the $500 implementation credit instead of the free month, never both (Terms of Sale 3.5).
      // Stripe checkout only accepts one `discounts` entry, so the paths are mutually exclusive here too. On the
      // 50/50 plan the credit is already taken off the total above, so only the standard path adds a discount.
      ...(isAlumni && isSplit ? {} : { discounts: [isAlumni ? { promotion_code: ALUMNI_PROMOTION_CODE_ID } : { coupon: FIRST_MONTH_FREE_COUPON_ID }] }),
      success_url: `${APP_URL}/checkout/thanks`,
      cancel_url: `${APP_URL}/checkout/thanks?status=cancelled`,
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
