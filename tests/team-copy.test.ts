import { test } from "node:test";
import assert from "node:assert/strict";
import { BABS_COPY, involvesCopied, replyWithBabs } from "../src/lib/teamCopy";

test("Mide and Marcello's mail is copied to Babs, nobody else's", () => {
  assert.equal(involvesCopied("growthlynkpartner@gmail.com"), true);
  assert.equal(involvesCopied(["x@y.com", "Marcello@amilynnecarroll.com"]), true);
  assert.equal(involvesCopied("someone@else.com", undefined, null), false);
});

test("replies go to the sender and Babs, once", () => {
  assert.deepEqual(replyWithBabs("growthlynkpartner@gmail.com", true), ["growthlynkpartner@gmail.com", BABS_COPY]);
  assert.deepEqual(replyWithBabs(`growthlynkpartner@gmail.com, ${BABS_COPY}`, true), ["growthlynkpartner@gmail.com", BABS_COPY]);
  assert.equal(replyWithBabs("a@b.com", false), "a@b.com");
});
