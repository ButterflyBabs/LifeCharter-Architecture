#!/usr/bin/env node
// Builds the Stripe TEST-MODE objects the Suite's checkouts rely on, so a test copy of the Suite can be pointed
// at Stripe's sandbox. Run it once, in your own terminal, with a TEST key (the script refuses a live key):
//
//   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-test-setup.mjs --webhook-url https://<test-copy>/api/stripe/webhook
//
// It prints: STRIPE_CATALOG_JSON (the ids the Suite should use), the Billing Portal configuration id, the
// webhook signing secret, and the test Payment Links. Nothing is written to the Suite and nothing touches live.
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY || "";
if (!/^(sk|rk)_test_/.test(key)) {
  console.error("Refusing to run: STRIPE_SECRET_KEY must be a TEST-mode key (sk_test_... or rk_test_...).");
  process.exit(1);
}
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : ""; };
const webhookUrl = arg("--webhook-url");
const stripe = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });

const TIERS = [
  { id: "starter", name: "Starter", monthly: 34700, implementation: 249700 },
  { id: "growth", name: "Growth", monthly: 49700, implementation: 299700 },
  { id: "vip", name: "VIP", monthly: 99700, implementation: 499700 },
];

async function product(slug, name) {
  const found = await stripe.products.search({ query: `metadata['lccs_test']:'${slug}'`, limit: 1 });
  if (found.data[0]) return found.data[0];
  return stripe.products.create({ name, metadata: { lccs_test: slug } });
}
async function price(slug, productId, params) {
  const found = await stripe.prices.list({ lookup_keys: [slug], limit: 1 });
  if (found.data[0]) return found.data[0];
  return stripe.prices.create({ product: productId, currency: "usd", lookup_key: slug, ...params });
}
async function link(label, lineItem, extra = {}) {
  const l = await stripe.paymentLinks.create({ line_items: [lineItem], metadata: { lccs_test: label }, ...extra });
  return { label, url: l.url };
}

const out = { catalog: { tiers: {} }, links: [] };
const monthlyProducts = [];
const implementationProducts = [];
const monthlyPrices = [];

for (const t of TIERS) {
  const mp = await product(`${t.id}-monthly`, `LifeCharter Command Suite ${t.name} - Monthly`);
  const ip = await product(`${t.id}-implementation`, `LifeCharter Command Suite ${t.name} - Implementation Fee`);
  const mpr = await price(`lccs-${t.id}-monthly`, mp.id, { unit_amount: t.monthly, recurring: { interval: "month" } });
  const ipr = await price(`lccs-${t.id}-implementation`, ip.id, { unit_amount: t.implementation });
  out.catalog.tiers[t.id] = { monthlyPriceId: mpr.id, implementationPriceId: ipr.id };
  monthlyProducts.push(mp.id); implementationProducts.push(ip.id); monthlyPrices.push({ product: mp.id, prices: [mpr.id] });
  out.links.push(await link(`${t.name} implementation fee`, { price: ipr.id, quantity: 1 }));
  out.links.push(await link(`${t.name} monthly`, { price: mpr.id, quantity: 1 }));
}

// FIRSTMONTHFREE: only the three monthly products. LCALUMNI500: $500 off only the three implementation fees.
const first = await stripe.coupons.create({ name: "FIRSTMONTHFREE", percent_off: 100, duration: "once", applies_to: { products: monthlyProducts } });
const alumniCoupon = await stripe.coupons.create({ name: "LCALUMNI500", amount_off: 50000, currency: "usd", duration: "once", applies_to: { products: implementationProducts } });
let alumniPromo;
try {
  alumniPromo = await stripe.promotionCodes.create({ coupon: alumniCoupon.id, code: "LCALUMNI500" });
} catch (e) {
  alumniPromo = (await stripe.promotionCodes.list({ code: "LCALUMNI500", limit: 1 })).data[0];
}
out.catalog.firstMonthFreeCouponId = first.id;
out.catalog.alumniPromotionCodeId = alumniPromo.id;

// Pre-Founder: $497 a month, 30 days free, card required.
const pf = await product("pre-founder", "LifeCharter Command Suite VIP - Pre-Founder");
const pfPrice = await price("lccs-pre-founder-monthly", pf.id, { unit_amount: 49700, recurring: { interval: "month" } });
out.links.push(await link("Pre-Founder ($497/month, 30 days free)", { price: pfPrice.id, quantity: 1 }, { subscription_data: { trial_period_days: 30 }, payment_method_collection: "always" }));

// Coaching gift link: pay what you choose, $40 suggested.
const gift = await product("coaching-gift", "Complimentary coaching session gift");
const giftPrice = await price("lccs-coaching-gift", gift.id, { custom_unit_amount: { enabled: true, preset: 4000, minimum: 500 } });
out.links.push(await link("Coaching gift (pay what you choose, $40 suggested)", { price: giftPrice.id, quantity: 1 }));

// Billing Portal: update card, invoices, switch between the three monthly plans. No self-serve cancel (by design).
const portal = await stripe.billingPortal.configurations.create({
  business_profile: { headline: "LifeCharter Command Suite billing (TEST)" },
  features: {
    customer_update: { enabled: true, allowed_updates: ["email", "name", "address", "phone"] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: { enabled: false },
    subscription_update: { enabled: true, default_allowed_updates: ["price"], proration_behavior: "create_prorations", products: monthlyPrices },
  },
});
out.portalConfigurationId = portal.id;

if (webhookUrl) {
  const hook = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: ["checkout.session.completed", "invoice.payment_succeeded", "invoice.payment_failed", "charge.refunded", "refund.created", "refund.updated", "customer.subscription.updated", "customer.subscription.deleted"],
    description: "LCCS test copy",
  });
  out.webhookEndpointId = hook.id;
  out.webhookSecret = hook.secret; // shown only when the endpoint is created
}

console.log("\n=== Put these on the test copy (Vercel Preview environment) ===");
console.log("STRIPE_CATALOG_JSON=" + JSON.stringify(out.catalog));
if (out.webhookSecret) console.log("STRIPE_WEBHOOK_SECRET=" + out.webhookSecret);
console.log("\n=== Put this in the test database (app_settings key stripe_portal_configuration_id) ===");
console.log(out.portalConfigurationId);
console.log("\n=== Test Payment Links ===");
for (const l of out.links) console.log(`${l.label}: ${l.url}`);
