/**
 * The Pre-Founder card link. Public: the "Add my card" button in the month-5 notice points here.
 *
 * A Stripe Payment Link can only start billing a set number of days after the buyer signs up, so the first $497
 * charge would land on a different date for everyone. This route makes a Checkout Session instead, with the
 * subscription trial ending on the shared first-charge date (April 1, 2027, midnight Mountain), so the card is
 * saved when the client adds it and the first charge is always that day. Stripe needs the trial end to be at
 * least 48 hours away; after that the route simply charges at sign-up.
 */

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { FIRST_CHARGE_AT } from "@/lib/preFounderTrial";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";
const MONTHLY_CENTS = 49700;

export async function GET() {
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  const trialEnd = Math.floor(FIRST_CHARGE_AT.getTime() / 1000);
  const trialOk = trialEnd - Math.floor(Date.now() / 1000) > 49 * 3600;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: MONTHLY_CENTS,
            recurring: { interval: "month" },
            product_data: { name: "LifeCharter Command Suite VIP: Pre-Founder rate" },
          },
        },
      ],
      subscription_data: {
        ...(trialOk ? { trial_end: trialEnd } : {}),
        metadata: { source: "pre-founder-card" },
      },
      payment_method_collection: "always",
      custom_text: {
        submit: {
          message: trialOk
            ? "Your card is saved today. Your first $497 charge is April 1, 2027, and monthly after that."
            : "Your Pre-Founder rate is $497 a month.",
        },
      },
      success_url: `${APP_URL}/checkout/thanks`,
      cancel_url: `${APP_URL}/`,
    });
    if (!session.url) return NextResponse.json({ error: "No checkout address returned" }, { status: 502 });
    return NextResponse.redirect(session.url, 303);
  } catch (e) {
    console.error("pre-founder-card:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't open the card page. Please reply to your email and we will help." }, { status: 500 });
  }
}
