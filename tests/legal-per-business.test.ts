import { test } from "node:test";
import assert from "node:assert/strict";
import { legalPlanCompletion, legalCompletion, LEGAL_ITEMS } from "../src/lib/legalChecklist";

const row = (item_key: string, status: string, business_id: number | null = null) => ({ item_key, status, due_date: null, notes: null, doc_link: null, custom_title: null, custom_group: null, business_id }) as never;

test("an account with one checklist gets exactly the figure it always had", () => {
  const rows = [row(LEGAL_ITEMS[0].key, "done"), row(LEGAL_ITEMS[1].key, "in_progress")];
  assert.equal(legalPlanCompletion(rows), legalCompletion(rows));
});

test("each business's checklist counts equally in the account figure", () => {
  const a = Array.from({ length: LEGAL_ITEMS.length }, (_, i) => row(LEGAL_ITEMS[i].key, "done", 14));
  const b = [row(LEGAL_ITEMS[0].key, "not_started", 15)];
  const pa = legalCompletion(a as never)!;
  const pb = legalCompletion(b as never)!;
  assert.equal(legalPlanCompletion([...a, ...b]), Math.round((pa + pb) / 2));
});

test("no rows, no figure", () => {
  assert.equal(legalPlanCompletion([]), null);
});
