import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// One-time setup (Alignment Architect only): creates The Life Shift product, its
// $25 price and a Stripe Payment Link in the business's Stripe account, so the
// 21-Day Challenge sells through one clean product. Safe to call again: it
// reuses what it already made (found by metadata lc_key=life-shift).
const KEY = "life-shift";

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!stripe) return NextResponse.json({ error: "Stripe isn't configured." }, { status: 500 });

  const account = await stripe.accounts.retrieveCurrent().catch(() => null);
  const found = await stripe.products.search({ query: `metadata['lc_key']:'${KEY}' AND active:'true'` });
  const product =
    found.data[0] ??
    (await stripe.products.create({
      name: "The Life Shift: A LifeCharter 21-Day Challenge",
      description: "21 days to let go, align, and design a life you love, with AmiLynne \"Babs\" Carroll.",
      metadata: { lc_key: KEY },
    }));

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
  const price =
    prices.data.find((p) => p.unit_amount === 2500 && p.currency === "usd" && !p.recurring) ??
    (await stripe.prices.create({ product: product.id, unit_amount: 2500, currency: "usd", metadata: { lc_key: KEY } }));

  const links = await stripe.paymentLinks.list({ active: true, limit: 100 });
  const existing = links.data.find((l) => l.metadata?.lc_key === KEY);
  const link =
    existing ??
    (await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { lc_key: KEY, flow: "life_shift" },
      customer_creation: "always",
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
      after_completion: {
        type: "redirect",
        redirect: { url: "https://www.amilynnecarroll.com/21-day-challenge/welcome?session_id={CHECKOUT_SESSION_ID}" },
      },
    }));

  return NextResponse.json({
    account: account ? { id: account.id, name: account.settings?.dashboard?.display_name || account.business_profile?.name || "" } : null,
    productId: product.id,
    priceId: price.id,
    url: link.url,
    reused: Boolean(found.data[0] && existing),
  });
}
