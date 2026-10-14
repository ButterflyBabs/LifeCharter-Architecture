import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { FOUNDER, FROM_2027, TIERS, TIER_NAME, type Tier } from "@/lib/pricing";
import { loadPricingSettings, todayMountain } from "@/lib/pricingServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// January 1, 2027 price change: one-time setup in the Suite's own Stripe account, run by the Alignment Architect only.
//   GET                      where things stand (switch day, saved price ids, whether the plans table has switched)
//   POST {action:"create-prices"}        six new Stripe prices attached to the EXISTING products (so the alumni promotion
//                                        code and reporting keep working); the founder prices stay active
//   POST {action:"create-portal-config"} a Billing Portal configuration that only lets 2027-price clients move between
//                                        the new monthly prices (founder clients keep the existing configuration)
// Nothing here changes what anyone pays before the switch day: new prices are only used from pricing_switch_day.

async function gate() {
  return (await isAlignmentArchitect()) ? null : NextResponse.json({ error: "not found" }, { status: 404 });
}

export async function GET() {
  const denied = await gate();
  if (denied) return denied;
  const db = createServerClient();
  const settings = await loadPricingSettings(db);
  const { data: rows } = await db.from("app_settings").select("key, value").in("key", ["pricing_2027_applied", "stripe_portal_configuration_id_2027"]);
  const flags = Object.fromEntries(((rows ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value]));
  return NextResponse.json({
    today: todayMountain(),
    switchDay: settings.switchDay,
    idsSaved: TIERS.every((t) => settings.ids[t]?.monthly && settings.ids[t]?.implementation),
    ids: settings.ids,
    plansTableSwitched: flags.pricing_2027_applied === "true",
    portalConfigSaved: Boolean(flags.stripe_portal_configuration_id_2027),
    newList: FROM_2027,
  });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const denied = await gate();
  if (denied) return denied;
  if (!stripe) return NextResponse.json({ error: "Stripe is not configured here." }, { status: 503 });
  const b = (await request.json().catch(() => ({}))) as { action?: string };
  const db = createServerClient();

  if (b.action === "create-prices") {
    const settings = await loadPricingSettings(db);
    const ids: Partial<Record<Tier, { monthly: string; implementation: string }>> = {};
    for (const t of TIERS) {
      const existing = settings.ids[t];
      if (existing?.monthly && existing?.implementation) {
        ids[t] = { monthly: existing.monthly, implementation: existing.implementation };
        continue; // already created: never make a second set
      }
      const oldMonthly = FOUNDER[t].monthlyPriceId!;
      const oldImpl = FOUNDER[t].implementationPriceId!;
      const [pm, pi] = await Promise.all([stripe.prices.retrieve(oldMonthly), stripe.prices.retrieve(oldImpl)]);
      const monthly = await stripe.prices.create({
        product: String(pm.product),
        unit_amount: FROM_2027[t].monthlyCents,
        currency: "usd",
        recurring: { interval: "month" },
        nickname: `${TIER_NAME[t]} monthly (from January 1, 2027)`,
        metadata: { priceList: "2027", tier: t },
      });
      const impl = await stripe.prices.create({
        product: String(pi.product),
        unit_amount: FROM_2027[t].implementationCents,
        currency: "usd",
        nickname: `${TIER_NAME[t]} implementation fee (from January 1, 2027)`,
        metadata: { priceList: "2027", tier: t },
      });
      ids[t] = { monthly: monthly.id, implementation: impl.id };
    }
    await db.from("app_settings").upsert({ key: "pricing_2027_prices", value: JSON.stringify(ids) }, { onConflict: "key" });
    return NextResponse.json({ ok: true, ids });
  }

  if (b.action === "create-portal-config") {
    const settings = await loadPricingSettings(db);
    const monthlyIds = TIERS.map((t) => settings.ids[t]?.monthly);
    if (monthlyIds.some((x) => !x)) return NextResponse.json({ error: "Create the prices first." }, { status: 400 });
    const products: { product: string; prices: string[] }[] = [];
    for (const id of monthlyIds as string[]) {
      const p = await stripe.prices.retrieve(id);
      products.push({ product: String(p.product), prices: [id] });
    }
    const config = await stripe.billingPortal.configurations.create({
      business_profile: { headline: "Manage your LifeCharter Command Suite billing" },
      features: {
        customer_update: { enabled: true, allowed_updates: ["email", "address", "phone", "name"] },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: false }, // Year-1 early-termination terms cannot be enforced by the portal
        subscription_update: { enabled: true, default_allowed_updates: ["price"], proration_behavior: "create_prorations", products },
      },
    });
    await db.from("app_settings").upsert({ key: "stripe_portal_configuration_id_2027", value: config.id }, { onConflict: "key" });
    return NextResponse.json({ ok: true, configuration: config.id });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
