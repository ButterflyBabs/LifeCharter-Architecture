// Run with: npm test   (node's built-in test runner through tsx)
import test from "node:test";
import assert from "node:assert/strict";

import { isUpgrade, planOfSubscription, PLAN_RANK } from "../src/lib/planUpgrade";
import { addMonths, trialEndTag } from "../src/lib/preFounderTrial";
import { offerRow } from "../src/lib/sales/offers";
import { dueKinds, formatEventDateTime } from "../src/lib/eventEmails";
import { sessionTag, scheduledSession } from "../src/lib/masterclass/followUp";
import { textToBlocks } from "../src/lib/plans/export/model";

test("plan order: starter < growth < vip, and only a move up is an upgrade", () => {
  assert.ok(PLAN_RANK.starter < PLAN_RANK.growth && PLAN_RANK.growth < PLAN_RANK.vip);
  assert.equal(isUpgrade("starter", "growth"), true);
  assert.equal(isUpgrade("growth", "vip"), true);
  assert.equal(isUpgrade("vip", "growth"), false);
  assert.equal(isUpgrade("growth", "growth"), false);
  assert.equal(isUpgrade(null, "vip"), false);
  assert.equal(isUpgrade("starter", "unknown"), false);
});

// A fake database with the plans table only.
const fakeDb = {
  from() {
    return {
      select: async () => ({
        data: [
          { id: "starter", price_monthly: 34700, price_yearly: 500000 },
          { id: "growth", price_monthly: 49700, price_yearly: 700000 },
          { id: "vip", price_monthly: 99700, price_yearly: 1350000 },
        ],
      }),
    };
  },
} as never;

test("the plan is read from metadata first, then from the recurring price", async () => {
  assert.equal(await planOfSubscription(fakeDb, { metadata: { planId: "vip" } }), "vip");
  const monthly = (amt: number) => ({ metadata: {}, items: { data: [{ price: { unit_amount: amt, recurring: { interval: "month" } } }] } });
  assert.equal(await planOfSubscription(fakeDb, monthly(49700)), "growth");
  assert.equal(await planOfSubscription(fakeDb, monthly(99700)), "vip");
  assert.equal(await planOfSubscription(fakeDb, monthly(12300)), null);
  const yearly = { metadata: {}, items: { data: [{ price: { unit_amount: 500000, recurring: { interval: "year" } } }] } };
  assert.equal(await planOfSubscription(fakeDb, yearly), "starter");
  // a bad planId in metadata falls back to the price
  assert.equal(await planOfSubscription(fakeDb, { metadata: { planId: "gold" }, items: { data: [{ price: { unit_amount: 34700, recurring: { interval: "month" } } }] } }), "starter");
});

test("Pre-Founder trial: six months out, tagged with the Mountain-time date", () => {
  const sent = new Date("2026-10-09T13:24:43Z");
  assert.equal(addMonths(sent, 6).toISOString().slice(0, 10), "2027-04-09");
  assert.equal(addMonths(sent, 5).toISOString().slice(0, 10), "2027-03-09");
  assert.equal(trialEndTag(sent), "pre-founder-trial-ends-2027-04-09");
});

test("offers: name required, price and payment count validated, link gets https", () => {
  assert.ok("error" in offerRow({ name: "  " }));
  assert.ok("error" in offerRow({ name: "X", price: "abc" }));
  const ok = offerRow({ name: "Program", price: 6000, billing: "payment_plan", paymentCount: 3, link: "example.com/x" });
  assert.ok("row" in ok);
  if ("row" in ok) {
    assert.equal(ok.row.price, 6000);
    assert.equal(ok.row.payment_count, 3);
    assert.equal(ok.row.link, "https://example.com/x");
  }
  const mon = offerRow({ name: "Suite", price: 347, billing: "monthly", paymentCount: 3 });
  if ("row" in mon) assert.equal(mon.row.payment_count, null); // a count only applies to payment plans
});

test("event emails: confirmation always due; day-before 24h to 2h; hour-before 60 min to +10", () => {
  const start = "2026-10-15T23:00:00Z";
  const at = (iso: string) => dueKinds(start, new Date(iso));
  assert.deepEqual(at("2026-10-10T00:00:00Z"), ["confirm"]);
  assert.deepEqual(at("2026-10-15T01:00:00Z"), ["confirm", "day_before"]);
  assert.deepEqual(at("2026-10-15T21:30:00Z"), ["confirm"]); // inside the 2 hour gap: neither reminder
  assert.deepEqual(at("2026-10-15T22:15:00Z"), ["confirm", "hour_before"]);
  assert.deepEqual(at("2026-10-16T00:00:00Z"), ["confirm"]); // an hour after the start
  assert.match(formatEventDateTime(start), /5:00 pm MT \/ 7:00 pm ET/);
});

test("session tags use Mountain-time dates and the event prefix", () => {
  assert.equal(sessionTag("2026-10-09T01:00:00Z", "attended", "masterclass"), "lcmc-oct-8-attended");
  assert.equal(sessionTag("2026-11-13T00:00:00Z", "registered", "incubator"), "lci-nov-12-registered");
  const occ = [{ start: "2026-10-08T23:00:00Z", duration: 90 }, { start: "2026-10-22T23:00:00Z", duration: 90 }];
  assert.equal(scheduledSession("2026-10-08T23:05:00Z", occ)?.occurrence.start, "2026-10-08T23:00:00Z");
  assert.equal(scheduledSession("2026-10-15T23:00:00Z", occ), null); // a tech check on another day never makes no-shows
  assert.equal(scheduledSession("2026-10-22T23:00:00Z", occ)?.previous?.start, "2026-10-08T23:00:00Z");
});

test("printable plan text becomes paragraphs, bullets and headings", () => {
  const b = textToBlocks("Our promise:\n\nWe help founders.\n\n- One\n- Two");
  assert.deepEqual(b.map((x) => x.t), ["h3", "p", "bullets"]);
});
