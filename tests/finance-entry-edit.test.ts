// Editing a saved income or expense. Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";

import { hasEntryEdit, parseEntryEdit } from "../src/lib/finance/entryEdit";

test("the tax-only change is not treated as an edit", () => {
  assert.equal(hasEntryEdit({ taxAmount: 5 }), false);
  assert.equal(hasEntryEdit({ category: "Software" }), true);
});

test("a saved entry takes a new category, amount, date, name and note", () => {
  assert.deepEqual(parseEntryEdit({ amount: "19.999", category: " Software ", occurredOn: "2026-10-01", vendor: "Acme", description: "" }, { synced: false }), {
    amount: 20,
    occurred_on: "2026-10-01",
    category: "Software",
    description: null,
    vendor: "Acme",
  });
});

test("a bad amount or date is refused", () => {
  assert.ok("error" in parseEntryEdit({ amount: 0 }, { synced: false }));
  assert.ok("error" in parseEntryEdit({ occurredOn: "yesterday" }, { synced: false }));
});

test("Stripe money keeps its amount and date, but its category can change", () => {
  assert.ok("error" in parseEntryEdit({ amount: 10 }, { synced: true }));
  assert.ok("error" in parseEntryEdit({ occurredOn: "2026-10-01" }, { synced: true }));
  assert.deepEqual(parseEntryEdit({ category: "Sales" }, { synced: true }), { category: "Sales" });
});
