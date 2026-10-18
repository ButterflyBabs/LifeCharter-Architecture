import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanReceiptRead, payeeKey, threshold1099 } from "../src/lib/finance/receipts";

test("a receipt read is made safe", () => {
  const r = cleanReceiptRead({ vendor: " Office Depot ", date: "2026-10-15", amount: "$42.19", category: "Supplies", description: "Printer paper", confident: true }, "2026-10-18");
  assert.deepEqual(r, { vendor: "Office Depot", date: "2026-10-15", amount: 42.19, category: "Supplies", description: "Printer paper", confident: true });
  const bad = cleanReceiptRead({ date: "2027-01-01", amount: "abc", confident: true }, "2026-10-18");
  assert.equal(bad.date, "2026-10-18");
  assert.equal(bad.amount, 0);
  assert.equal(bad.confident, false);
  assert.equal(cleanReceiptRead(null, "2026-10-18").vendor, "");
});

test("the same payee however it was typed", () => {
  assert.equal(payeeKey("Jane Doe Design, LLC"), payeeKey("jane doe design llc"));
  assert.notEqual(payeeKey("Jane Doe"), payeeKey("John Doe"));
});

test("1099 threshold by year", () => {
  assert.deepEqual(threshold1099(2025), { amount: 600, check: false });
  assert.deepEqual(threshold1099(2026), { amount: 2000, check: false });
  assert.deepEqual(threshold1099(2027), { amount: 2000, check: true });
});
