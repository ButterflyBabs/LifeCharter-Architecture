import { test } from "node:test";
import assert from "node:assert/strict";
import { balanceIsLow, textsAtWarning, usageCrossing } from "../src/lib/sms";

test("the owner is told once at 80% and once when all texts are used", () => {
  assert.equal(textsAtWarning(500), 400);
  assert.equal(usageCrossing(398, 500), null);
  assert.equal(usageCrossing(399, 500), "warn"); // the 400th text
  assert.equal(usageCrossing(400, 500), null);
  assert.equal(usageCrossing(499, 500), "full"); // the 500th text
  assert.equal(usageCrossing(500, 500), null);
  assert.equal(usageCrossing(0, 1), "full");
});

test("a low Twilio balance is flagged only when it can be read and is under the line", () => {
  assert.equal(balanceIsLow(9.99), true);
  assert.equal(balanceIsLow(10), false);
  assert.equal(balanceIsLow(null), false);
});
