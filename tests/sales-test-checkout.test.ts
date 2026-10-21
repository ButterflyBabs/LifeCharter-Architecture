import { test } from "node:test";
import assert from "node:assert/strict";
import { isSalesTestEmail } from "../src/lib/salesTestCheckout";

test("the sales checkout test switch matches only the one stored address", () => {
  assert.equal(isSalesTestEmail("msamilynne+eloise-practice@gmail.com", "MSAmilynne+Eloise-Practice@gmail.com "), true, "case and spaces are ignored");
  assert.equal(isSalesTestEmail("msamilynne+eloise-practice@gmail.com", "someone@example.com"), false);
  assert.equal(isSalesTestEmail("", "someone@example.com"), false, "an empty setting turns the switch off");
  assert.equal(isSalesTestEmail(null, ""), false, "no setting and no email never match");
  assert.equal(isSalesTestEmail("a@b.com", undefined), false);
});
