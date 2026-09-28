/**
 * Stripe Checkout API Route
 * Creates checkout sessions for plan subscriptions
 *
 * No caller in the app uses this route today (unlike
 * /api/sales/checkout-session and /api/stripe/starter-checkout) — grep finds
 * it referenced only in a comment. It also never puts an Implementation Fee
 * line item in the cart, only a dynamically-created monthly-subscription
 * price, so there's nothing here for the LCALUMNI500 alumni credit (which
 * Stripe restricts to the three Implementation Fee products) to discount.
 * An `alumni` flag is still accepted and recorded in metadata below, in case
 * this route is wired up later to also sell the implementation fee — but no
 * discount is applied here. Flag this to Babs if this route turns out to be
 * live somewhere this search didn't find.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: "2026-06-24.dahlia",
}) : null;

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 503 }
      );
    }
    const { planId, userId, userEmail, successUrl, cancelUrl, alumni } = await req.json();
    const isAlumni = alumni === true;

    if (!planId || !userId || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Check if user already has a Stripe customer ID
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    // Create new customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,
          planId,
        },
      });
      customerId = customer.id;
    }

    // Create Stripe price if it doesn't exist
    let stripePriceId = plan.stripe_price_id;
    
    if (!stripePriceId) {
      // Create product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          planId: plan.id,
        },
      });

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price_monthly,
        currency: "usd",
        recurring: {
          interval: "month",
        },
      });

      stripePriceId = price.id;

      // Update plan with Stripe IDs
      await supabase
        .from("plans")
        .update({
          stripe_product_id: product.id,
          stripe_price_id: price.id,
        })
        .eq("id", planId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout=success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout=canceled`,
      metadata: {
        userId,
        planId,
        onboardingFee: plan.onboarding_fee?.toString() || "0",
        alumni: isAlumni ? "true" : "false",
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
    });

    // Create pending subscription record
    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_id: planId,
      stripe_customer_id: customerId,
      status: "incomplete",
      onboarding_fee: plan.onboarding_fee,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
