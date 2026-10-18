import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { paymentsAccount } from "@/lib/payments";
import { createOfferLink, deactivateOfferLink, getConnection, linkPlan, type OfferForLink } from "@/lib/stripeConnect";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Payment links for Offers & Packages, made on the client's OWN connected Stripe account.
//   GET                                   -> { connected, links: { [offerId]: link }, plans: { [offerId]: note | reason } }
//   POST { offerId }                      -> creates (or replaces) the offer's link
//   POST { offerId, action: "off" }       -> turns the link off
export async function GET() {
  const a = await paymentsAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const [connection, { data: links }, { data: offers }] = await Promise.all([
    getConnection(db, a.planId),
    db.from("offer_payment_links").select("offer_id, url, kind, amount, livemode, created_at").eq("master_plan_id", a.planId).eq("active", true),
    db.from("sales_offers").select("id, name, price, billing, payment_count").eq("master_plan_id", a.planId),
  ]);
  const plans: Record<string, { ok: boolean; text: string }> = {};
  for (const o of (offers ?? []) as OfferForLink[]) {
    const p = linkPlan({ ...o, price: o.price === null ? null : Number(o.price) });
    plans[o.id] = p.ok ? { ok: true, text: p.note } : { ok: false, text: p.reason };
  }
  return NextResponse.json(
    { connected: Boolean(connection), livemode: connection?.livemode ?? null, links: Object.fromEntries((links ?? []).map((l) => [l.offer_id, l])), plans },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const a = await paymentsAccount(request);
  if ("denied" in a) return a.denied;
  const b = (await request.json().catch(() => ({}))) as { offerId?: string; action?: string };
  const db = createServerClient();
  const offerId = typeof b.offerId === "string" ? b.offerId : "";
  const { data: offer } = await db.from("sales_offers").select("id, name, price, billing, payment_count").eq("id", offerId).eq("master_plan_id", a.planId).maybeSingle();
  if (!offer) return NextResponse.json({ error: "That offer could not be found." }, { status: 404 });
  if (b.action === "off") {
    await deactivateOfferLink(db, a.planId, offer.id as string);
    return NextResponse.json({ ok: true });
  }
  const connection = await getConnection(db, a.planId);
  if (!connection) return NextResponse.json({ error: "Connect your Stripe account first (Settings › Integrations)." }, { status: 400 });
  try {
    const link = await createOfferLink(db, a.planId, connection, { ...(offer as OfferForLink), price: offer.price === null ? null : Number(offer.price) });
    return NextResponse.json({ ok: true, link });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    console.error("POST /api/offers/payment-links:", msg);
    return NextResponse.json({ error: /price|payment-plan|smallest/i.test(msg) ? msg : "Stripe didn't create the link. Try again, or check your Stripe account is fully set up to take payments." }, { status: 400 });
  }
}
