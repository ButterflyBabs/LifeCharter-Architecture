import { test } from "node:test";
import assert from "node:assert/strict";
import { marginOf, monthOf, parseReceipt, perClientCents, summarizeMonths, looksLikeReceipt, type Entry } from "../src/lib/platformCosts";

// The receipt reader must read real vendor emails (these are shaped like the ones in the house mailbox).
test("reads the paid amount from vendor receipts", () => {
  assert.equal(parseReceipt("Payment received for Supabase Pte. Ltd. invoice (#IRQHUO-00007)", "<p>Your invoice has been paid. $61.88 has been charged to your payment method.</p>")?.amountCents, 6188);
  assert.equal(parseReceipt("Your receipt from Vercel Inc. #2583-0488", "<td>Receipt from Vercel Inc. </td><td>$20.00 </td><td>Paid September 30, 2026</td> Pro $20.00 Observability Plus $0.00 Total $20.00 Amount paid $20.00")?.amountCents, 2000);
  assert.equal(parseReceipt("Your receipt from Anthropic, PBC #2591-4783-0559", "Receipt from Anthropic, PBC   $100.00   Paid October 3, 2026")?.amountCents, 10000);
});

test("a refund is negative and a receipt with no dollar figure is skipped", () => {
  assert.equal(parseReceipt("Your Modal Labs, Inc refund [#3182-5361]", "Refund from Modal Labs, Inc Refunded $0.50 Date issued Oct 14, 2026")?.amountCents, -50);
  assert.equal(parseReceipt("Your invoice", "Thanks for being a customer."), null);
  assert.equal(looksLikeReceipt("Welcome to Modal 🎉"), false);
  assert.equal(looksLikeReceipt("Your receipt from Vercel Inc. #2583-0488"), true);
});

test("months, totals and per-client maths", () => {
  assert.equal(monthOf("2026-09-30T21:39:03Z"), "2026-09-01");
  assert.equal(monthOf("2026-10-01T03:00:00Z"), "2026-09-01"); // 9 PM Sep 30 in Denver
  const e = (o: Partial<Entry>): Entry => ({ id: "x", month: "2026-09-01", vendor: "vercel", label: null, amountCents: 0, counts: true, status: "confirmed", source: "manual", receiptSubject: null, note: null, ...o });
  const m = summarizeMonths([
    e({ amountCents: 2000 }),
    e({ vendor: "supabase", amountCents: 6188 }),
    e({ vendor: "anthropic", amountCents: 10000, counts: false }),
    e({ vendor: "modal", amountCents: 500, status: "proposed" }),
  ]);
  assert.equal(m[0].platformCents, 8188);
  assert.equal(m[0].proposedCount, 1);
  assert.equal(perClientCents(8188, 3), 2729);
  assert.equal(perClientCents(8188, 0), null);
  assert.ok(Math.abs((marginOf(34700, 2729) ?? 0) - 0.9214) < 0.001);
});
