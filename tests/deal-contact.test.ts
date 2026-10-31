// A person added to the Pipeline also lands in Contacts. Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";

import { splitDealName } from "../src/lib/sales/dealContact";

test("a deal's name splits into first and last", () => {
  assert.deepEqual(splitDealName(" Jo Ann Lee "), { firstName: "Jo", lastName: "Ann Lee" });
  assert.deepEqual(splitDealName("Cher"), { firstName: "Cher", lastName: null });
  assert.deepEqual(splitDealName(""), { firstName: null, lastName: null });
});
