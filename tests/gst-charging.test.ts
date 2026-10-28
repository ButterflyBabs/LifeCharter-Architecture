import { test } from "node:test";
import assert from "node:assert/strict";

process.env.STRIPE_CONNECT_SECRET_KEY = "sk_test_unit";
process.env.STRIPE_CONNECT_CLIENT_ID = "ca_unit";

// Charging GST/HST (task 1520 follow-up): invoices, the offer pay page, and keeping the tax apart in the books.

test("an invoice adds GST/HST for where the customer is; the amount typed is before tax", async () => {
  const { invoicePlan } = await import("../src/lib/suitePayments");
  const base = { email: "eloise@example.com", description: "Strategy day", amount: 1500, currency: "cad" as const, home: "cad" as const };
  const on = invoicePlan({ ...base, chargeTax: true, taxPlace: "ON" });
  assert.equal(on.ok, true);
  if (!on.ok) return;
  assert.equal(on.cents, 150000, "the invoice amount stays before tax");
  assert.deepEqual(on.tax && { place: on.tax.place, rate: on.tax.rate, cents: on.tax.cents }, { place: "ON", rate: 13, cents: 19500 });
  assert.equal(on.note, "$1,500.00 + HST 13% ($195.00) = $1,695.00, due in 7 days");

  const ab = invoicePlan({ ...base, chargeTax: true, taxPlace: "AB" });
  assert.match(ab.ok ? ab.note : "", /\+ GST 5% \(\$75\.00\) = \$1,575\.00/);

  const out = invoicePlan({ ...base, chargeTax: true, taxPlace: "OUTSIDE" });
  assert.equal(out.ok && out.tax?.cents, 0);
  assert.equal(out.ok && out.note, "$1,500.00, no GST/HST (customer outside Canada), due in 7 days");

  // Registered but nobody said where the customer is: it can't go out.
  const missing = invoicePlan({ ...base, chargeTax: true });
  assert.equal(missing.ok, false);
  assert.match(missing.ok ? "" : missing.reason, /where the customer is/);

  // Not registered: exactly as before, a place is ignored.
  const off = invoicePlan({ ...base, taxPlace: "ON" });
  assert.equal(off.ok && off.tax, null);
  assert.equal(off.ok && off.note, "$1,500.00, due in 7 days");
});

test("a payment plan's tax is on each monthly payment; the smallest-payment check is before tax", async () => {
  const { invoicePlan } = await import("../src/lib/suitePayments");
  const p = invoicePlan({ email: "eloise@example.com", description: "Coaching", amount: 3000, paymentCount: 3, chargeTax: true, taxPlace: "ON", currency: "cad", home: "cad" });
  assert.equal(p.ok, true);
  if (!p.ok) return;
  assert.equal(p.per, 100000);
  assert.equal(p.tax?.perCents, 13000);
  assert.equal(p.tax?.cents, 39000);
  assert.match(p.note, /^3 monthly payments of \$1,000\.00 \+ HST 13% \(\$130\.00\) = \$1,130\.00 each \(\$3,390\.00 in all, tax included\)/);
  // $1.20 over 3 payments is $0.40 each before tax: too small, even though the tax would lift it over $0.50.
  assert.equal(invoicePlan({ email: "e@x.co", description: "x", amount: 1.2, paymentCount: 3, chargeTax: true, taxPlace: "NB" }).ok, false);
});

test("the pay page's Checkout: the fixed rate on the line, the province in the metadata, back to the pay page", async () => {
  const { paySessionParams } = await import("../src/lib/suitePayments");
  const link = { id: "11111111-1111-1111-1111-111111111111", offer_id: "offer-1", master_plan_id: "plan-1", kind: "one_time", price_id: "price_1", payment_count: null };
  const one = paySessionParams(link, { place: "ON", rateId: "txr_on", site: "https://lccommandsuite.com" });
  assert.equal(one.mode, "payment");
  assert.equal(one.customer_creation, "always");
  assert.equal(one.invoice_creation?.enabled, true);
  assert.deepEqual(one.line_items, [{ price: "price_1", quantity: 1, tax_rates: ["txr_on"] }]);
  assert.deepEqual(one.metadata, { lccs_offer_id: "offer-1", lccs_plan_id: "plan-1", lccs_kind: "one_time", lccs_tax_province: "ON" });
  assert.equal(one.success_url, "https://lccommandsuite.com/pay/11111111-1111-1111-1111-111111111111?paid=1");
  assert.equal(one.cancel_url, "https://lccommandsuite.com/pay/11111111-1111-1111-1111-111111111111?cancelled=1");

  const outside = paySessionParams(link, { place: "OUTSIDE", rateId: null, site: "https://x.co" });
  assert.deepEqual(outside.line_items, [{ price: "price_1", quantity: 1 }], "no tax outside Canada");
  assert.equal(outside.metadata?.lccs_tax_province, "OUTSIDE");

  const plan = paySessionParams({ ...link, kind: "payment_plan", payment_count: 6 }, { place: "NS", rateId: "txr_ns", site: "https://x.co" });
  assert.equal(plan.mode, "subscription");
  assert.equal(plan.customer_creation, undefined, "subscriptions always make a customer; Stripe refuses the flag");
  assert.deepEqual(plan.subscription_data?.metadata, { lccs_offer_id: "offer-1", lccs_plan_id: "plan-1", lccs_plan_payments: "6", lccs_tax_province: "NS" });
  assert.deepEqual(plan.line_items, [{ price: "price_1", quantity: 1, tax_rates: ["txr_ns"] }]);

  const monthly = paySessionParams({ ...link, kind: "monthly" }, { place: null, rateId: null, site: "https://x.co" });
  assert.deepEqual(monthly.subscription_data?.metadata, { lccs_offer_id: "offer-1", lccs_plan_id: "plan-1" }, "exactly what the payment link sets when there's no tax");
});

test("the books: income filed before tax, a refund's tax in proportion, an invoice's tax summed", async () => {
  const { splitGross, refundTaxPart } = await import("../src/lib/stripeSync");
  const { invoiceTaxCents } = await import("../src/lib/suitePayments");
  assert.deepEqual(splitGross(1695, 195), { amount: 1500, tax_amount: 195, prov_tax_amount: 0 });
  assert.deepEqual(splitGross(1575, 75), { amount: 1500, tax_amount: 75, prov_tax_amount: 0 });
  assert.deepEqual(splitGross(10, 50), { amount: 0, tax_amount: 10, prov_tax_amount: 0 }, "tax is never more than the gross");
  assert.deepEqual(splitGross(100, -5), { amount: 100, tax_amount: 0, prov_tax_amount: 0 });
  // Half of a $1,695 payment refunded: half its $195 tax comes back.
  assert.equal(refundTaxPart(847.5, 1695, 195), 97.5);
  assert.equal(refundTaxPart(1695, 1695, 195), 195);
  assert.equal(refundTaxPart(5000, 1695, 195), 195, "never more than the payment's tax");
  assert.equal(refundTaxPart(100, 1695, 0), 0);
  assert.equal(invoiceTaxCents({ total_taxes: [{ amount: 13000 }, { amount: 500 }] }), 13500);
  assert.equal(invoiceTaxCents({ total_taxes: null }), 0);
});

// Provincial sales tax (QST, BC/SK PST, MB RST): its own line next to the GST/HST, kept apart in the books.

const QC = { QC: { registered: true, number: "1234567890TQ0001", frequency: "quarterly" as const } };
const BC = { BC: { registered: true, number: "PST-1234-5678", frequency: "quarterly" as const } };

test("a Quebec customer gets GST and QST, each its own line", async () => {
  const { invoicePlan } = await import("../src/lib/suitePayments");
  const p = invoicePlan({ email: "eloise@example.com", description: "Strategy day", amount: 1000, currency: "cad", home: "cad", chargeTax: true, taxPlace: "QC", provincial: QC });
  assert.equal(p.ok, true);
  if (!p.ok) return;
  assert.equal(p.tax?.cents, 5000, "GST 5% stays in tax");
  assert.deepEqual(p.tax?.prov && { kind: p.tax.prov.kind, rate: p.tax.prov.rate, cents: p.tax.prov.cents }, { kind: "QST", rate: 9.975, cents: 9975 });
  assert.equal(p.note, "$1,000.00 + GST 5% ($50.00) + QST 9.975% ($99.75) = $1,149.75, due in 7 days");
  // QST follows GST on everything: the PST tick doesn't matter.
  const ticked = invoicePlan({ email: "eloise@example.com", description: "x", amount: 1000, currency: "cad", home: "cad", chargeTax: true, taxPlace: "QC", provincial: QC, pstApplies: false });
  assert.equal(ticked.ok && ticked.tax?.prov?.cents, 9975);
  // Registered for QST but the customer is in Ontario: HST only.
  const on = invoicePlan({ email: "eloise@example.com", description: "x", amount: 1000, currency: "cad", home: "cad", chargeTax: true, taxPlace: "ON", provincial: QC });
  assert.equal(on.ok && on.tax?.prov, null);
  assert.equal(on.ok && on.tax?.cents, 13000);
});

test("a BC customer pays PST only on an offer ticked for it", async () => {
  const { invoicePlan } = await import("../src/lib/suitePayments");
  const base = { email: "eloise@example.com", description: "Software setup", amount: 1000, currency: "cad" as const, home: "cad" as const, chargeTax: true, taxPlace: "BC", provincial: BC };
  const ticked = invoicePlan({ ...base, pstApplies: true });
  assert.equal(ticked.ok, true);
  if (!ticked.ok) return;
  assert.equal(ticked.tax?.cents, 5000);
  assert.equal(ticked.tax?.prov?.kind, "PST");
  assert.equal(ticked.tax?.prov?.cents, 7000);
  assert.equal(ticked.note, "$1,000.00 + GST 5% ($50.00) + PST 7% ($70.00) = $1,120.00, due in 7 days");
  const unticked = invoicePlan({ ...base, pstApplies: false });
  assert.equal(unticked.ok && unticked.tax?.prov, null);
  assert.equal(unticked.ok && unticked.note, "$1,000.00 + GST 5% ($50.00) = $1,050.00, due in 7 days");
  // A plan: each monthly payment carries both taxes.
  const plan = invoicePlan({ ...base, pstApplies: true, paymentCount: 2 });
  assert.equal(plan.ok && plan.tax?.prov?.perCents, 3500);
  assert.match(plan.ok ? plan.note : "", /^2 monthly payments of \$500\.00 \+ GST 5% \(\$25\.00\) \+ PST 7% \(\$35\.00\) = \$560\.00 each \(\$1,120\.00 in all, tax included\)/);
});

test("registered provincially without GST/HST: only the provincial tax, and the place is still asked", async () => {
  const { invoicePlan } = await import("../src/lib/suitePayments");
  const base = { email: "eloise@example.com", description: "Workbook", amount: 100, currency: "cad" as const, home: "cad" as const, provincial: BC, pstApplies: true };
  const missing = invoicePlan(base);
  assert.equal(missing.ok, false);
  assert.match(missing.ok ? "" : missing.reason, /sales tax/);
  const bc = invoicePlan({ ...base, taxPlace: "BC" });
  assert.equal(bc.ok, true);
  if (!bc.ok) return;
  assert.equal(bc.tax?.cents, 0, "no GST/HST");
  assert.equal(bc.tax?.prov?.cents, 700);
  assert.equal(bc.note, "$100.00 + PST 7% ($7.00) = $107.00, due in 7 days");
  const ab = invoicePlan({ ...base, taxPlace: "AB" });
  assert.equal(ab.ok && ab.note, "$100.00, due in 7 days");
  const out = invoicePlan({ ...base, taxPlace: "OUTSIDE" });
  assert.equal(out.ok && out.note, "$100.00, no sales tax (customer outside Canada), due in 7 days");
});

test("the pay page's Checkout carries both rates on the line", async () => {
  const { paySessionParams } = await import("../src/lib/suitePayments");
  const link = { id: "22222222-2222-2222-2222-222222222222", offer_id: "offer-1", master_plan_id: "plan-1", kind: "one_time", price_id: "price_1", payment_count: null };
  const p = paySessionParams(link, { place: "QC", rateIds: ["txr_gst", "txr_qst"], site: "https://x.co" });
  assert.deepEqual(p.line_items, [{ price: "price_1", quantity: 1, tax_rates: ["txr_gst", "txr_qst"] }]);
  const none = paySessionParams(link, { place: "AB", rateIds: [], site: "https://x.co" });
  assert.deepEqual(none.line_items, [{ price: "price_1", quantity: 1 }]);
});

test("posting: each Stripe tax line is matched to GST/HST or provincial by its rate", async () => {
  const { splitTaxLines, invoiceTaxLines } = await import("../src/lib/suitePayments");
  const prov = new Set(["txr_qst"]);
  assert.deepEqual(splitTaxLines([{ rateId: "txr_gst", amount: 5000 }, { rateId: "txr_qst", amount: 9975 }], prov), { gst: 5000, prov: 9975 });
  // A rate the cache doesn't know is placed by its name.
  assert.deepEqual(splitTaxLines([{ rateId: "txr_x", amount: 700, name: "PST" }, { rateId: "txr_y", amount: 500, name: "GST" }], prov), { gst: 500, prov: 700 });
  // Couldn't read the lines: all of it is GST/HST, as before.
  assert.deepEqual(splitTaxLines([{ rateId: null, amount: 1300 }], prov), { gst: 1300, prov: 0 });
  assert.deepEqual(
    invoiceTaxLines({ total_taxes: [{ amount: 5000, tax_rate_details: { tax_rate: "txr_gst" } }, { amount: 9975, tax_rate_details: { tax_rate: "txr_qst" } }, { amount: 0, tax_rate_details: null }] }),
    [{ rateId: "txr_gst", amount: 5000 }, { rateId: "txr_qst", amount: 9975 }],
  );
});

test("the books with both taxes: income before tax, each refund's taxes in proportion", async () => {
  const { splitGross, refundTaxPart } = await import("../src/lib/stripeSync");
  // $1,149.75 from a Quebec customer: $1,000 + $50 GST + $99.75 QST.
  assert.deepEqual(splitGross(1149.75, 50, 99.75), { amount: 1000, tax_amount: 50, prov_tax_amount: 99.75 });
  // Provincial only: BC PST on $100.
  assert.deepEqual(splitGross(107, 0, 7), { amount: 100, tax_amount: 0, prov_tax_amount: 7 });
  // The taxes never add up to more than the gross.
  assert.deepEqual(splitGross(10, 8, 5), { amount: 0, tax_amount: 8, prov_tax_amount: 2 });
  // Half the Quebec payment refunded: half of each tax comes back.
  assert.equal(refundTaxPart(574.875, 1149.75, 50), 25);
  assert.equal(refundTaxPart(574.875, 1149.75, 99.75), 49.88);
  assert.deepEqual(splitGross(574.88, 25, 49.88), { amount: 500, tax_amount: 25, prov_tax_amount: 49.88 });
});
