import { test } from "node:test";
import assert from "node:assert/strict";
import { FOUNDER, FROM_2027, isFounderMonthly, isSwitched, parsePricingSettings, pricesFor, pricesForChange, tierOfFounderMonthly } from "../src/lib/pricing";

const s = parsePricingSettings({});

test("before January 1, 2027 everyone pays founder prices; from that day new buyers pay the new list", () => {
  assert.equal(isSwitched("2026-12-31", s), false);
  assert.equal(pricesFor("starter", "2026-12-31", s).monthlyCents, 34700);
  assert.equal(isSwitched("2027-01-01", s), true);
  const p = pricesFor("growth", "2027-01-01", s);
  assert.equal(p.monthlyCents, 89700);
  assert.equal(p.implementationCents, 399700);
  assert.equal(p.monthlyPriceId, null); // no ids yet: the checkout creates the price inline
  assert.equal(FROM_2027.vip.implementationCents, 749700);
});

test("new Stripe price ids are used once they are saved", () => {
  const withIds = parsePricingSettings({ pricing_2027_prices: JSON.stringify({ starter: { monthly: "price_new_m", implementation: "price_new_i" } }) });
  const p = pricesFor("starter", "2027-02-01", withIds);
  assert.equal(p.monthlyPriceId, "price_new_m");
  assert.equal(p.implementationPriceId, "price_new_i");
  assert.equal(pricesFor("growth", "2027-02-01", withIds).monthlyPriceId, null);
});

test("founder lock: a founder client who moves tier pays the founder fee for the new tier; a returning client pays the new list", () => {
  assert.equal(isFounderMonthly(34700), true);
  assert.equal(isFounderMonthly(59700), false);
  assert.equal(tierOfFounderMonthly(49700), "growth");
  assert.equal(pricesForChange("vip", 34700, "2027-03-01", s).monthlyCents, FOUNDER.vip.monthlyCents); // upgrade keeps the founder rate
  assert.equal(pricesForChange("vip", null, "2027-03-01", s).monthlyCents, 199700); // cancelled and came back
  assert.equal(pricesForChange("growth", 59700, "2027-03-01", s).monthlyCents, 89700); // a 2027 buyer
});

test("a bad switch day or unreadable ids fall back safely", () => {
  const bad = parsePricingSettings({ pricing_switch_day: "soon", pricing_2027_prices: "{oops" });
  assert.equal(bad.switchDay, "2027-01-01");
  assert.deepEqual(bad.ids, {});
});
