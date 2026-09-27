import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { WEBSITE_BUILD } from "@/lib/websiteBuild";

// Called from /sales-reference (owner and owner's team only; middleware guards /api/sales/*).
// Creates a Stripe Checkout for the Website Alignment Build: pay in full, or 2 monthly payments
// (the webhook ends the 2-payment subscription after the second payment).
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  const { plan, email, fullName, sessionSource } = await req.json().catch(() => ({}));
  if (plan !== "full" && plan !== "two_pay") return NextResponse.json({ error: "Choose pay in full or 2 payments." }, { status: 400 });
  if (email && (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email))) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const metadata = { flow: WEBSITE_BUILD.flow, plan, fullName: String(fullName || "").slice(0, 120), sessionSource: String(sessionSource || "").slice(0, 120) };
  const product_data = { name: WEBSITE_BUILD.productName, description: WEBSITE_BUILD.description };
  try {
    const session = await stripe.checkout.sessions.create(
      plan === "full"
        ? {
            mode: "payment",
            customer_email: email || undefined,
            customer_creation: "always",
            line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: WEBSITE_BUILD.foundingFullCents, product_data } }],
            payment_intent_data: { metadata },
            metadata,
            success_url: `${APP_URL}/sales-reference?checkout=success`,
            cancel_url: `${APP_URL}/sales-reference?checkout=cancelled`,
          }
        : {
            mode: "subscription",
            customer_email: email || undefined,
            line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: WEBSITE_BUILD.foundingInstallmentCents, recurring: { interval: "month" }, product_data } }],
            subscription_data: { metadata, description: "Website Alignment Build · 2 monthly payments" },
            metadata,
            success_url: `${APP_URL}/sales-reference?checkout=success`,
            cancel_url: `${APP_URL}/sales-reference?checkout=cancelled`,
          }
    );
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("website build checkout:", (e as Error).message);
    return NextResponse.json({ error: "Couldn't create the checkout. Please try again." }, { status: 500 });
  }
}
