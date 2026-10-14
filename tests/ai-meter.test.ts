import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateCostCents } from "../src/lib/ai/meter";

test("estimated AI cost uses the model's rate, longest model name first", () => {
  // gpt-4o-mini: $0.15 in / $0.60 out per million tokens -> 1M in + 1M out = 75 cents
  assert.equal(Math.round(estimateCostCents("gpt-4o-mini-2024-07-18", 1_000_000, 1_000_000)), 75);
  // gpt-4o must not be read as gpt-4o-mini's rate
  assert.equal(Math.round(estimateCostCents("gpt-4o-2024-08-06", 1_000_000, 0)), 250);
  // the proof clip job: 7.3k in / 3.5k out on claude-haiku-5-5 is about 2.5 cents
  assert.ok(Math.abs(estimateCostCents("claude-haiku-5-5", 7300, 3500) - 2.48) < 0.05);
  // an unknown model falls back to the default row instead of costing nothing
  assert.ok(estimateCostCents("some-new-model", 1_000_000, 0) > 0);
});
