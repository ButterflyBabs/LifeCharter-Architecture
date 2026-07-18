/**
 * Stripe Checkout API Route
 * Creates checkout sessions for plan subscriptions
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  try {
    const { planId, userId, userEmail, successUrl, cancelUrl } = await req.json();

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
