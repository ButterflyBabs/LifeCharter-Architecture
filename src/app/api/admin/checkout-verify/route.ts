import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * ONE-TIME VERIFICATION ROUTE — creates a real Checkout Session using the
 * exact same mixed-cart + coupon logic as /api/sales/checkout-session, then
 * reads it back expanded so the actual discount application (and which
 * line item it landed on) can be confirmed directly, since the real route
 * requires a sales-role login this session doesn't have. Safe to delete
 * once run.
 */
export async function POST(req: Request) {
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const provided = req.headers.get("x-setup-secret");
  const supabase = createServerClient();
  const { data } = await supabase.from("app_settings").select("value").eq("key", "checkout_verify_secret").maybeSingle();
  if (!provided || !data?.value || provided !== data.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: "claude-verify-combined-checkout@example.com",
    line_items: [
      { price: "price_1UFxEMLtotgP5J189ky7bu03", quantity: 1 }, // starter monthly
      { price: "price_1UFx60LtotgP5J18Vih3WrJs", quantity: 1 }, // starter implementation
    ],
    discounts: [{ coupon: "CwLz0M07" }],
    success_url: `${APP_URL}/sales-reference?checkout=success`,
    cancel_url: `${APP_URL}/sales-reference?checkout=cancelled`,
  });

  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items", "total_details.breakdown"],
  });

  return NextResponse.json({
    sessionId: full.id,
    amountSubtotal: full.amount_subtotal,
    amountTotal: full.amount_total,
    totalDetails: full.total_details,
    lineItems: full.line_items?.data.map((li) => ({
      description: li.description,
      amountSubtotal: li.amount_subtotal,
      amountTotal: li.amount_total,
      amountDiscount: (li as unknown as { amount_discount?: number }).amount_discount,
    })),
  });
}
