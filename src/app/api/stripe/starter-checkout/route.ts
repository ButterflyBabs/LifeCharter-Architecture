/**
 * Public, unauthenticated checkout entry point for the self-serve Starter
 * sign-up page. Charges only the one-time implementation fee (the decided
 * model: monthly billing starts after implementation is complete, not at
 * signup) — so this is a one-time "payment" mode session, not the
 * subscription-mode flow in /api/stripe/checkout (which is built for an
 * already-authenticated user changing plans from Settings).
 *
 * Pricing is read from the `plans` table at request time, never hardcoded,
 * so it always matches whatever the Billing tab is currently showing.
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const { email, fullName } = await req.json();
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: plan.onboarding_fee,
            product_data: {
              name: `LifeCharter Command Suite — ${plan.name} Implementation`,
              description:
                "One-time implementation fee. Monthly billing begins once implementation is complete.",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/get-started/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/get-started`,
      metadata: {
        flow: "self_serve_starter",
        planId: plan.id,
        fullName: fullName || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Starter checkout error:", error);
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
  }
}
