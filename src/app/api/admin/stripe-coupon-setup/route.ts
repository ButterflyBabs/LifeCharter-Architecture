import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * ONE-TIME SETUP ROUTE — the 30-day-delay coupon for the monthly billing
 * link (100% off the first invoice, so the real first charge lands ~30
 * days after the implementation fee, once implementation is actually
 * done). Gated on a secret in app_settings (service-role only, not a
 * Vercel env var — same pattern as the Stripe portal setup route).
 *
 * GET  — read-only: lists real Stripe products/prices so the coupon can be
 *        scoped to the actual monthly subscription products, never the
 *        one-time implementation-fee products, without guessing IDs.
 * POST — creates the coupon + a human-typeable promotion code, restricted
 *        to the product ids passed in (from a prior GET).
 *
 * Safe to delete this file once it's been run successfully.
 */

async function checkSecret(req: Request): Promise<boolean> {
  const provided = req.headers.get("x-setup-secret");
  const supabase = createServerClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "stripe_coupon_setup_secret")
    .maybeSingle();
  return Boolean(provided && data?.value && provided === data.value);
}

export async function GET(req: Request) {
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  if (!(await checkSecret(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prices = await stripe.prices.list({ limit: 100, expand: ["data.product"] });
  const rows = prices.data.map((p) => ({
    priceId: p.id,
    nickname: p.nickname,
    productId: typeof p.product === "string" ? p.product : p.product?.id,
    productName: typeof p.product === "string" ? null : (p.product as { name?: string })?.name,
    unitAmount: p.unit_amount,
    recurring: p.recurring ? p.recurring.interval : null,
    active: p.active,
  }));

  return NextResponse.json({ prices: rows });
}

export async function POST(req: Request) {
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  if (!(await checkSecret(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const productIds: string[] = Array.isArray(body.productIds) ? body.productIds : [];
  if (!productIds.length) {
    return NextResponse.json({ error: "productIds is required (from GET)" }, { status: 400 });
  }
  const code: string = typeof body.code === "string" && body.code ? body.code : "FIRSTMONTHFREE";

  try {
    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: "once",
      name: "First month free — implementation clients",
      applies_to: { products: productIds },
    });

    const promotionCode = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code,
    });

    return NextResponse.json({
      ok: true,
      couponId: coupon.id,
      promotionCodeId: promotionCode.id,
      code: promotionCode.code,
      appliesToProducts: productIds,
    });
  } catch (err) {
    console.error("[stripe-coupon-setup] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create coupon" },
      { status: 502 }
    );
  }
}
