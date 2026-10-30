import { test } from "node:test";
import assert from "node:assert/strict";
import { claimsDone, NOT_YET_SENT } from "../src/lib/ai/approvalClaim";

test("a false 'submitted' claim is caught", () => {
  assert.equal(claimsDone("I've submitted the report to LifeCharter support regarding the microphone issue."), true);
  assert.equal(claimsDone("I have sent it to support."), true);
  assert.equal(claimsDone("The report has been filed."), true);
});

test("ordinary replies are left alone", () => {
  assert.equal(claimsDone("I've prepared the report for your approval. Press Approve to send it."), false);
  assert.equal(claimsDone("Here is what I would do. Review it and press Approve."), false);
});

test("the correction says nothing was sent", () => {
  assert.match(NOT_YET_SENT("CuJo"), /Nothing has been sent yet/);
});
