// Affiliate crediting and refund rules. Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";

import { alreadyCredited, creditBasis, implementationFromLines, insideHold, invoiceCreditRef, mergeNote, refundDecision, uniqueRefs } from "../src/lib/affiliateRules";
import { applyRefundToSales, creditSale } from "../src/lib/affiliates";

const IMPL_PRICE = "price_1UFx60LtotgP5J18Vih3WrJs";

// ---- the link setting ------------------------------------------------------------------------

test("a link that earns on every payment credits the first and every later payment", () => {
  assert.deepEqual(creditBasis("all", 347, null), { credit: true, amount: 347 });
  assert.deepEqual(creditBasis("all", 347, 0), { credit: true, amount: 347 });
  assert.deepEqual(creditBasis(null, 99.5, null), { credit: true, amount: 99.5 }); // an old link with no setting behaves as "all"
});

test("an implementation-only link credits the fee and nothing on later subscription payments", () => {
  assert.deepEqual(creditBasis("implementation", 1497, 1000), { credit: true, amount: 1000 }); // first payment: fee + first month
  assert.equal(creditBasis("implementation", 347, null).credit, false); // month 2: no implementation fee on it
  assert.equal(creditBasis("implementation", 347, 0).credit, false);
  // never more than was actually paid (a part-refunded payment)
  assert.deepEqual(creditBasis("implementation", 600, 1000), { credit: true, amount: 600 });
});

test("the implementation fee is found by price id or by name, net of discounts", () => {
  const lines = [
    { amount: 100000, description: "Command Suite Implementation", pricing: { price_details: { price: IMPL_PRICE } }, discount_amounts: [{ amount: 20000 }] },
    { amount: 34700, description: "Command Suite monthly" },
  ];
  assert.equal(implementationFromLines(lines), 800);
  assert.equal(implementationFromLines([{ amount: 5000, description: "1 x Implementation fee (at $50.00)" }]), 50);
  assert.equal(implementationFromLines([{ amount_total: 90000, price: { id: IMPL_PRICE } }]), 900); // a Checkout line
  assert.equal(implementationFromLines([{ amount: 34700, description: "Command Suite monthly" }]), null);
  assert.equal(implementationFromLines([]), null);
  assert.equal(implementationFromLines(null), null);
});

// ---- dedupe ----------------------------------------------------------------------------------

test("one sale per payment: the first invoice shares the Checkout session id, later invoices use their own", () => {
  assert.equal(invoiceCreditRef("in_1", "subscription_create", "cs_1"), "cs_1");
  assert.equal(invoiceCreditRef("in_1", "subscription_create", null), "in_1"); // subscription made without Checkout
  assert.equal(invoiceCreditRef("in_2", "subscription_cycle", "cs_1"), "in_2");
  assert.equal(invoiceCreditRef("in_3", "manual", null), "in_3");

  const credited = new Set<string>();
  const credit = (ref: string) => {
    if (alreadyCredited([ref], credited)) return false;
    credited.add(ref);
    return true;
  };
  assert.equal(credit("cs_1"), true); // checkout.session.completed
  assert.equal(credit(invoiceCreditRef("in_1", "subscription_create", "cs_1")), false); // invoice.payment_succeeded for the same payment
  assert.equal(credit(invoiceCreditRef("in_2", "subscription_cycle", "cs_1")), true); // month 2
  assert.equal(credit(invoiceCreditRef("in_2", "subscription_cycle", "cs_1")), false); // Stripe retries the webhook
  assert.equal(credit(invoiceCreditRef("in_3", "subscription_cycle", "cs_1")), true); // month 3
  assert.equal(credited.size, 3);
});

test("a payment is recognised under any of its Stripe ids", () => {
  assert.equal(alreadyCredited(["ch_9", "pi_9", "in_9", "cs_9"], ["cs_9"]), true);
  assert.equal(alreadyCredited(["ch_9", "pi_9"], ["ch_1", "cs_9"]), false);
  assert.equal(alreadyCredited([], ["cs_9"]), false);
  assert.deepEqual(uniqueRefs(["a", "a", "", null, undefined, "b"]), ["a", "b"]);
});

// ---- refunds: hold / void decision ------------------------------------------------------------

const refund = (over: Partial<{ id: string; date: string; full: boolean; amount: number }> = {}) => ({ id: "re_1", date: "2026-10-12", full: true, amount: 347, ...over });

test("inside the hold means the refund came before the payable day", () => {
  assert.equal(insideHold("2026-11-08", "2026-10-12"), true);
  assert.equal(insideHold("2026-11-08", "2026-11-07"), true);
  assert.equal(insideHold("2026-11-08", "2026-11-08"), false); // the payable day itself: the hold is over
  assert.equal(insideHold(null, "2026-10-12"), false); // no hold set
});

test("a full refund inside the hold voids an unpaid sale", () => {
  const owed = refundDecision({ status: "owed", payable_on: "2026-11-08" }, refund());
  assert.equal(owed.action, "void");
  if (owed.action === "void") assert.match(owed.reason, /re_1/);
  assert.equal(refundDecision({ status: "review", payable_on: "2026-11-08" }, refund()).action, "void"); // waiting for a rate, still voided
});

test("a paid sale is never changed: it is flagged for review", () => {
  const d = refundDecision({ status: "paid", payable_on: "2026-11-08" }, refund());
  assert.equal(d.action, "flag");
  if (d.action === "flag") assert.match(d.note, /already paid|after this commission was paid/);
  assert.equal(refundDecision({ status: "paid", payable_on: null }, refund()).action, "flag");
});

test("past the hold, with no hold, or only partly refunded: flagged, not voided", () => {
  assert.equal(refundDecision({ status: "owed", payable_on: "2026-10-01" }, refund()).action, "flag"); // hold already over
  assert.equal(refundDecision({ status: "owed", payable_on: null }, refund()).action, "flag"); // no hold
  assert.equal(refundDecision({ status: "owed", payable_on: "2026-11-08" }, refund({ full: false, amount: 100 })).action, "flag"); // partial
});

test("handling the same refund again changes nothing", () => {
  assert.equal(refundDecision({ status: "void", payable_on: "2026-11-08", refund_ref: "re_1" }, refund()).action, "none");
  assert.equal(refundDecision({ status: "owed", payable_on: "2026-11-08", refund_ref: "re_1" }, refund()).action, "none");
  assert.equal(refundDecision({ status: "paid", payable_on: null, refund_note: "Refunded ... (Stripe refund re_1)." }, refund()).action, "none");
  assert.equal(refundDecision({ status: "void", payable_on: null }, refund({ id: "re_2" })).action, "none"); // already void: nothing to subtract twice
  assert.equal(mergeNote(null, "a"), "a");
  assert.equal(mergeNote("a", "b"), "a | b");
});

// ---- end to end against an in-memory database -------------------------------------------------

type Row = Record<string, unknown>;
function fakeDb(tables: Record<string, Row[]>) {
  const q = (table: string) => {
    let op: "select" | "insert" | "update" = "select";
    const filters: ((r: Row) => boolean)[] = [];
    let patch: Row = {};
    let inserted: Row | null = null;
    const rows = () => (tables[table] ??= []);
    const run = () => {
      if (op === "insert") {
        const row: Row = { id: `id${rows().length + 1}`, ...inserted };
        if (row.stripe_ref && rows().some((r) => r.stripe_ref === row.stripe_ref)) return [];
        rows().push(row);
        return [row];
      }
      const hit = rows().filter((r) => filters.every((f) => f(r)));
      if (op === "update") hit.forEach((r) => Object.assign(r, patch));
      return hit;
    };
    const b: Record<string, unknown> = {
      select: () => b,
      insert: (row: Row) => ((op = "insert"), (inserted = row), b),
      update: (p: Row) => ((op = "update"), (patch = p), b),
      eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), b),
      in: (c: string, v: unknown[]) => (filters.push((r) => v.includes(r[c])), b),
      limit: () => b,
      maybeSingle: async () => ({ data: run()[0] ?? null }),
      single: async () => ({ data: run()[0] ?? null }),
      then: (res: (v: unknown) => unknown) => Promise.resolve({ data: run() }).then(res),
    };
    return b;
  };
  return { from: q } as never;
}

const setup = (commissionOn: string, payoutDelay: number | null = 30) => {
  const tables: Record<string, Row[]> = {
    affiliates: [{ id: "aff1", default_rate: 20, payout_delay_days: payoutDelay }],
    affiliate_links: [{ id: "lnk1", commission_on: commissionOn, rate: null }],
    seq_contacts: [{ id: "c1", master_plan_id: "plan1", referred_by_affiliate_id: "aff1", referred_by_link_id: "lnk1" }],
    sales_offers: [],
    affiliate_sales: [],
  };
  return { tables, db: fakeDb(tables) };
};

test("recurring payments: every payment credited once on an 'all' link", async () => {
  const { tables, db } = setup("all");
  const pay = (ref: string, date: string) => creditSale(db, "plan1", { contactId: "c1", description: "Subscription payment", amount: 347, saleDate: date, stripeRef: ref, source: "stripe" });
  await pay("cs_1", "2026-10-01");
  await pay("in_2", "2026-11-01");
  await pay("in_2", "2026-11-01"); // retried event
  await pay("in_3", "2026-12-01");
  assert.equal(tables.affiliate_sales.length, 3);
  assert.equal(tables.affiliate_sales[1].commission, 69.4);
  assert.equal(tables.affiliate_sales[0].payable_on, "2026-10-31");
});

test("recurring payments: an implementation-only link credits the fee once and never the monthly payments", async () => {
  const { tables, db } = setup("implementation");
  await creditSale(db, "plan1", { contactId: "c1", description: "Suite", amount: 1347, implementationAmount: 1000, saleDate: "2026-10-01", stripeRef: "cs_1", source: "stripe" });
  await creditSale(db, "plan1", { contactId: "c1", description: "Subscription payment", amount: 347, implementationAmount: null, saleDate: "2026-11-01", stripeRef: "in_2", source: "stripe" });
  let asked = 0;
  await creditSale(db, "plan1", { contactId: "c1", description: "Stripe payment", amount: 347, implementationAmount: async () => (asked++, null), saleDate: "2026-12-01", stripeRef: "ch_3", source: "stripe" });
  assert.equal(tables.affiliate_sales.length, 1);
  assert.equal(tables.affiliate_sales[0].amount, 1000);
  assert.equal(asked, 1); // the lookup runs only for an implementation-only link
});

test("a refund voids an unpaid sale inside the hold, flags a paid one, and is safe to repeat", async () => {
  const { tables, db } = setup("all");
  await creditSale(db, "plan1", { contactId: "c1", description: "Month 1", amount: 347, saleDate: "2026-10-10", stripeRef: "cs_1", source: "stripe" });
  await creditSale(db, "plan1", { contactId: "c1", description: "Month 2", amount: 347, saleDate: "2026-11-10", stripeRef: "in_2", source: "stripe" });
  tables.affiliate_sales[1].status = "paid";
  tables.affiliate_sales[1].payable_on = "2026-12-10";

  const r1 = { id: "re_a", date: "2026-10-20", full: true, amount: 347 };
  assert.deepEqual(await applyRefundToSales(db, "plan1", ["ch_x", "cs_1"], r1), { voided: 1, flagged: 0 });
  assert.equal(tables.affiliate_sales[0].status, "void");
  assert.equal(tables.affiliate_sales[0].refund_ref, "re_a");
  assert.match(String(tables.affiliate_sales[0].void_reason), /re_a/);
  assert.deepEqual(await applyRefundToSales(db, "plan1", ["ch_x", "cs_1"], r1), { voided: 0, flagged: 0 }); // again: nothing changes

  const r2 = { id: "re_b", date: "2026-12-20", full: true, amount: 347 };
  assert.deepEqual(await applyRefundToSales(db, "plan1", ["in_2"], r2), { voided: 0, flagged: 1 });
  assert.equal(tables.affiliate_sales[1].status, "paid"); // untouched
  assert.equal(tables.affiliate_sales[1].refund_flag, true);
  assert.match(String(tables.affiliate_sales[1].refund_note), /re_b/);
  assert.deepEqual(await applyRefundToSales(db, "plan1", ["in_2"], r2), { voided: 0, flagged: 0 }); // again: not flagged twice
  assert.equal(String(tables.affiliate_sales[1].refund_note).split("re_b").length, 2);

  // another account's sale with the same ref is never touched
  assert.deepEqual(await applyRefundToSales(db, "other-plan", ["in_2"], r2), { voided: 0, flagged: 0 });
});
