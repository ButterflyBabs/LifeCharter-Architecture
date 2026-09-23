import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/authz";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { FOUNDING_ANNUAL_PRICE, FOUNDING_MONTHLY_PRICE, FOUNDING_SPOTS, PLUS_ANNUAL_PRICE, PLUS_MONTHLY_PRICE, isPlusMember } from "@/lib/community/ai";
import { PLUS_FLOW } from "@/lib/community/plus";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";

// Starts a Collective Plus subscription in Stripe Checkout. The first 100
// members lock in the founding price for as long as they stay subscribed.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!stripe) return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
  const user = await sessionUser();
  if (!user?.email) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (await isPlusMember(user.id)) return NextResponse.json({ error: "You already have Collective Plus." }, { status: 409 });

  const body = await request.json().catch(() => ({}));
  const plan: "monthly" | "annual" = body.plan === "annual" ? "annual" : "monthly";

  const supabase = createServerClient();
  const [{ data: taken }, { data: existing }] = await Promise.all([
    supabase.rpc("cm_plus_founding_taken"),
    supabase.from("cm_plus_subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle(),
  ]);
  const founding = (typeof taken === "number" ? taken : FOUNDING_SPOTS) < FOUNDING_SPOTS;
  const amount = plan === "annual" ? (founding ? FOUNDING_ANNUAL_PRICE : PLUS_ANNUAL_PRICE) : founding ? FOUNDING_MONTHLY_PRICE : PLUS_MONTHLY_PRICE;
  const metadata = { flow: PLUS_FLOW, cmUserId: user.id, cmEmail: user.email, plan, founding: String(founding) };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(existing?.stripe_customer_id ? { customer: existing.stripe_customer_id as string } : { customer_email: user.email }),
      client_reference_id: user.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            recurring: { interval: plan === "annual" ? "year" : "month" },
            product_data: {
              name: `The LifeCharter Collective — Plus${founding ? " (Founding Member)" : ""}`,
              description: "Mariposa, your LifeCharter AI coach, plus your weekly review, monthly alignment report, Ask the Library, 90-day focus and journal export.",
            },
          },
        },
      ],
      subscription_data: { metadata },
      metadata,
      allow_promotion_codes: true,
      success_url: `${APP_URL}/community/plus?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/community/plus`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("plus checkout:", e);
    return NextResponse.json({ error: "Couldn't start checkout — please try again." }, { status: 500 });
  }
}
