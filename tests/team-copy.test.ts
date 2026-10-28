import { test } from "node:test";
import assert from "node:assert/strict";
import { BABS_COPY, involvesCopied, replyWithBabs } from "../src/lib/teamCopy";

test("Marcello's mail is copied to Babs, nobody else's", () => {
  assert.equal(involvesCopied("marcello@amilynnecarroll.com"), true);
  assert.equal(involvesCopied(["x@y.com", "Marcello@amilynnecarroll.com"]), true);
  assert.equal(involvesCopied("someone@else.com", undefined, null), false);
});

test("replies go to the sender and Babs, once", () => {
  assert.deepEqual(replyWithBabs("marcello@amilynnecarroll.com", true), ["marcello@amilynnecarroll.com", BABS_COPY]);
  assert.deepEqual(replyWithBabs(`marcello@amilynnecarroll.com, ${BABS_COPY}`, true), ["marcello@amilynnecarroll.com", BABS_COPY]);
  assert.equal(replyWithBabs("a@b.com", false), "a@b.com");
});
