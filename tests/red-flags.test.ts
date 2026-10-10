import { test } from "node:test";
import assert from "node:assert/strict";
import { detectRedFlags, promptHint, CRISIS_REPLY } from "../src/lib/ai/redFlags";

test("crisis phrases are caught", () => {
  for (const t of ["I want to die", "I've been thinking about suicide", "I don't want to be here anymore", "thinking about ending my life", "I keep wanting to hurt myself"]) {
    assert.ok(detectRedFlags(t).includes("crisis"), t);
  }
});

test("ordinary business talk is not a crisis", () => {
  for (const t of ["This deadline is killing me", "I could die of embarrassment on that call", "My launch is dead in the water", "Kill the old funnel and rebuild it", "I'm dying to see the new plan"]) {
    assert.ok(!detectRedFlags(t).includes("crisis"), t);
  }
});

test("hardship, frustration and misleading requests are caught", () => {
  assert.ok(detectRedFlags("I can't afford rent this month").includes("hardship"));
  assert.ok(detectRedFlags("we're facing eviction").includes("hardship"));
  assert.ok(detectRedFlags("This is useless, what a waste of money").includes("frustration"));
  assert.ok(detectRedFlags("Write me some fake testimonials for my page").includes("misleading"));
  assert.deepEqual(detectRedFlags("What should I focus on this week?"), []);
});

test("the crisis reply gives real resources and the hints stay practical", () => {
  assert.match(CRISIS_REPLY, /988/);
  assert.match(CRISIS_REPLY, /911/);
  assert.match(promptHint(["hardship"]), /never suggest spending/i);
  assert.equal(promptHint([]), "");
});
