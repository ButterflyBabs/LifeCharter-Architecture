import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMoney, formatCents, formatTotals, sumByCurrency, toCurrency, isCurrency, otherCurrency } from "../src/lib/currency";

// Task 1520: an account works in USD and CAD; the two are never added together and never converted.

test("a USD account sees exactly what it saw before", () => {
  assert.equal(formatMoney(1200, "usd"), "$1,200");
  assert.equal(formatMoney(1200.5, "usd"), "$1,200.50");
  assert.equal(formatMoney(1200, "usd", { cents: true }), "$1,200.00");
  assert.equal(formatMoney(1200.4, "usd", { cents: false }), "$1,200");
  assert.equal(formatCents(4999, "usd"), "$49.99");
});

test("the other currency is always labelled, from either home", () => {
  assert.equal(formatMoney(300, "cad"), "CA$300");
  assert.equal(formatMoney(300, "cad", { home: "cad" }), "$300");
  assert.equal(formatMoney(300, "usd", { home: "cad" }), "US$300");
});

test("empty or broken amounts show nothing", () => {
  assert.equal(formatMoney(null, "usd"), "");
  assert.equal(formatMoney(undefined, "cad"), "");
  assert.equal(formatMoney(Number.NaN, "usd"), "");
});

test("totals stay per currency and are never one combined number", () => {
  const rows = [
    { a: 100, c: "usd" },
    { a: 50, c: "cad" },
    { a: 25, c: "USD" },
    { a: 10, c: null },
  ];
  const t = sumByCurrency(rows, (r) => r.a, (r) => r.c);
  assert.deepEqual(t, { usd: 135, cad: 50 });
  assert.equal(formatTotals(t, "usd"), "$135 + CA$50");
  assert.equal(formatTotals(t, "cad"), "$50 + US$135");
  assert.equal(formatTotals({ usd: 135 }, "usd"), "$135");
  assert.equal(formatTotals({}, "cad"), "$0");
});

test("currency values are read safely", () => {
  assert.equal(toCurrency("CAD"), "cad");
  assert.equal(toCurrency(" usd "), "usd");
  assert.equal(toCurrency("eur"), "usd");
  assert.equal(toCurrency(undefined, "cad"), "cad");
  assert.equal(isCurrency("cad"), true);
  assert.equal(isCurrency("eur"), false);
  assert.equal(otherCurrency("usd"), "cad");
});
