import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { FOUNDER_PAYMENT_LINK_URLS, FROM_2027, TIERS, TIER_NAME, isSwitched } from "@/lib/pricing";
import { stripe } from "@/lib/stripe";
import { loadPricingSettings, todayMountain } from "@/lib/pricingServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily, early morning: on and after the switch day (January 1, 2027 unless app_settings pricing_switch_day says
// otherwise) the plans table, which the Billing tab, the sign-up page and the Terms fee table read, is changed to the
// new price list ONCE. The cached Stripe price ids on the plan rows are cleared so no old price is reused. Clients
// already subscribed keep the Stripe prices they are on, so nothing changes for them. Same CRON_SECRET convention.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const settings = await loadPricingSettings(db);
  const today = todayMountain();
  if (!isSwitched(today, settings)) return NextResponse.json({ ok: true, switched: false, switchDay: settings.switchDay, today });
  const { data: done } = await db.from("app_settings").select("value").eq("key", "pricing_2027_applied").maybeSingle();
  if (String(done?.value ?? "") === "true") return NextResponse.json({ ok: true, switched: true, alreadyApplied: true });
  const now = new Date().toISOString();
  const updated: string[] = [];
  for (const t of TIERS) {
    const p = FROM_2027[t];
    const { error } = await db
      .from("plans")
      .update({ price_monthly: p.monthlyCents, onboarding_fee: p.implementationCents, price_yearly: p.annualCents, stripe_price_id: null, stripe_product_id: null })
      .eq("id", t);
    if (error) return NextResponse.json({ ok: false, error: error.message, updated }, { status: 500 });
    updated.push(t);
  }
  // The static Payment Links made at founder prices stop working: Stripe keeps them as inactive (nothing is deleted).
  const turnedOff: string[] = [];
  if (stripe) {
    try {
      const wanted = new Set(FOUNDER_PAYMENT_LINK_URLS);
      for await (const link of stripe.paymentLinks.list({ active: true, limit: 100 })) {
        if (wanted.has(link.url)) {
          await stripe.paymentLinks.update(link.id, { active: false });
          turnedOff.push(link.url);
        }
      }
    } catch (e) {
      console.error("[apply-pricing] could not turn off founder payment links:", e instanceof Error ? e.message : e);
    }
  }
  // Links & Forms offers for the three tiers: new monthly price, and no dead link.
  for (const t of TIERS) {
    await db
      .from("sales_offers")
      .update({ price: (FROM_2027[t].monthlyCents / 100).toFixed(2), link: "" })
      .eq("name", `LifeCharter Command Suite - ${TIER_NAME[t]}`)
      .in("link", FOUNDER_PAYMENT_LINK_URLS);
  }
  await db.from("app_settings").upsert({ key: "pricing_2027_applied", value: "true" }, { onConflict: "key" });
  console.log(`[apply-pricing] plans switched to the 2027 price list at ${now}`);
  return NextResponse.json({ ok: true, switched: true, applied: true, updated, paymentLinksTurnedOff: turnedOff.length });
}
