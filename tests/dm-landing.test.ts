import { test } from "node:test";
import assert from "node:assert/strict";
import { landingStage } from "../src/lib/dmLanding";

const stages = [{ key: "fb_approval" }, { key: "to_reach" }, { key: "sent" }];
const toReach = stages[1];

test("a Facebook person who would land in To reach out waits in the approval stage", () => {
  assert.equal(landingStage(stages, "FB", toReach)?.key, "fb_approval");
});

test("other platforms and deliberate stages are unchanged", () => {
  assert.equal(landingStage(stages, "LI", toReach)?.key, "to_reach");
  assert.equal(landingStage(stages, "FB", stages[2])?.key, "sent");
  assert.equal(landingStage(stages, null, toReach)?.key, "to_reach");
});

test("a board with no approval stage is unchanged", () => {
  const plain = [{ key: "to_reach" }, { key: "sent" }];
  assert.equal(landingStage(plain, "FB", plain[0])?.key, "to_reach");
  assert.equal(landingStage(plain, "FB", undefined), undefined);
});
