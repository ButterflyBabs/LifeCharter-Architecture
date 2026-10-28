import { test } from "node:test";
import assert from "node:assert/strict";
import { addFlow, inHome, otherBlock, zeroFlow } from "../src/lib/finance/money";
import { formatTotals, sumByCurrency } from "../src/lib/currency";

// Task 1520 (Franc Godri): Finance totals count the home currency only; the other currency is totalled on its own.
const rows = [
  { type: "income", amount: 1000, currency: "cad" },
  { type: "income", amount: 400, currency: "usd" },
  { type: "expense", amount: 150, currency: "cad" },
  { type: "expense", amount: 50, currency: "usd" },
];

test("a CAD account's totals are CAD only, with USD kept apart", () => {
  const home = zeroFlow();
  const other = zeroFlow();
  for (const r of rows) addFlow(inHome(r, "cad") ? home : other, r.type, r.amount);
  assert.deepEqual(home, { income: 1000, expense: 150, net: 850 });
  assert.deepEqual(other, { income: 400, expense: 50, net: 350 });
  assert.deepEqual(otherBlock("cad", { mtd: other }), { currency: "usd", mtd: { income: 400, expense: 50, net: 350 } });
});

test("a USD-only account has no other block and nothing changes", () => {
  const usdOnly = rows.filter((r) => r.currency === "usd");
  const other = zeroFlow();
  for (const r of usdOnly) if (!inHome(r, "usd")) addFlow(other, r.type, r.amount);
  assert.equal(otherBlock("usd", { mtd: other }), null);
});

test("income shown together is listed per currency, never summed", () => {
  const income = rows.filter((r) => r.type === "income");
  assert.equal(formatTotals(sumByCurrency(income, (r) => r.amount, (r) => r.currency), "cad"), "$1,000 + US$400");
});
