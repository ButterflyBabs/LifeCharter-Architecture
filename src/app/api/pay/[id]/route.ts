import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getConnection } from "@/lib/stripeConnect";
import { payLinkCheckout } from "@/lib/suitePayments";
import { chargesTax } from "@/lib/salesTaxServer";
import { isTaxPlace } from "@/lib/salesTax";
import { toCurrency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// An offer's public pay page (GST/HST accounts, task 1520 follow-up). The link id in the address is the key.
//   GET              -> { active: false } | { active: true, offer, seller, kind, amount, currency, home, count, tax }
//   POST { place }   -> { url } (Stripe Checkout on the seller's own account) | { error }
const UUID = /^[0-9a-f-]{36}$/i;
const OFF = { active: false };

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return NextResponse.json(OFF, { status: 404 });
  const db = createServerClient();
  const { data: l } = await db.from("offer_payment_links").select("id, offer_id, master_plan_id, kind, amount, currency, payment_count, active, livemode").eq("id", params.id).maybeSingle();
  if (!l || !l.active) return NextResponse.json(OFF, { status: 404 });
  const planId = l.master_plan_id as string;
  const [{ data: offer }, connection, tax, home] = await Promise.all([
    db.from("sales_offers").select("name").eq("id", l.offer_id).eq("master_plan_id", planId).maybeSingle(),
    getConnection(db, planId),
    chargesTax(planId, db),
    homeCurrency(planId, db),
  ]);
  if (!offer || !connection) return NextResponse.json(OFF, { status: 404 });
  return NextResponse.json(
    {
      active: true,
      offer: offer.name,
      seller: connection.name || null,
      kind: l.kind,
      amount: Number(l.amount),
      currency: toCurrency(l.currency as string | null),
      home,
      count: l.payment_count ?? null,
      tax,
      livemode: Boolean(l.livemode),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return NextResponse.json({ error: "This link is no longer active." }, { status: 404 });
  const b = (await request.json().catch(() => ({}))) as { place?: unknown };
  const place = isTaxPlace(b.place) ? b.place : null;
  try {
    const r = await payLinkCheckout(createServerClient(), params.id, place);
    if (!r) return NextResponse.json({ error: "This link is no longer active." }, { status: 404 });
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ url: r.url });
  } catch (e) {
    console.error("POST /api/pay:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Payment couldn't be started. Please try again in a moment." }, { status: 409 });
  }
}
