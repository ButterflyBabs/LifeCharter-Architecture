import test from "node:test";
import assert from "node:assert/strict";
import { combineSteps, nextStep, startHereApplies, weekLocked, START_HERE_FROM } from "../src/lib/startHere";
import { gatePageAllowed } from "../src/lib/assessmentGate";

const f30 = [
  { key: "brain", week: 0, title: "Take the Brain assessment", href: "/assessments/brain", done: true },
  { key: "vision", week: 1, title: "Write your vision", href: "/business-plan", done: false },
  { key: "offers", week: 1, title: "Add offers", href: "/sales/offers", done: false, focus: "Sales 20" },
  { key: "ledger", week: 2, title: "Record income", href: "/finance/import", done: false },
];
const none = { ai: false, brain: false, soul: false, profit: false, tools: false };

test("existing clients (John, Franc) keep the old menu: only new accounts and the house account get Getting Started", () => {
  const before = new Date(Date.parse(START_HERE_FROM) - 86400000).toISOString();
  const after = new Date(Date.parse(START_HERE_FROM) + 3600000).toISOString();
  assert.equal(startHereApplies({ planId: "john", createdAt: before, house: false }), false);
  assert.equal(startHereApplies({ planId: "franc", createdAt: before, house: false }), false);
  assert.equal(startHereApplies({ planId: "new", createdAt: after, house: false }), true);
  assert.equal(startHereApplies({ planId: "babs", createdAt: before, house: true }), true);
  assert.equal(startHereApplies({ planId: "babs", createdAt: before, house: true, demo: true }), false);
  assert.equal(startHereApplies({ planId: "x", createdAt: null, house: false }), false);
});

test("the five setup steps come first, and the assessments count only when COMPLETE (not just started)", () => {
  const steps = combineSteps(f30, { ...none, ai: true });
  assert.deepEqual(steps.slice(0, 5).map((s) => s.key), ["ai", "brain", "soul", "profit", "tools"]);
  assert.equal(steps.find((s) => s.key === "brain")?.done, false, "Brain was only started in the First 30 list; setup says not complete");
  assert.equal(steps.find((s) => s.key === "ai")?.done, true);
  assert.equal(steps.length, 5 + 3);
});

test("a week opens only when everything before it is done, and the next step is the first open one (focus first)", () => {
  let steps = combineSteps(f30, none);
  assert.equal(weekLocked(steps, 1), true);
  assert.equal(nextStep(steps)?.key, "ai");
  steps = combineSteps(f30, { ai: true, brain: true, soul: true, profit: true, tools: true });
  assert.equal(weekLocked(steps, 1), false);
  assert.equal(weekLocked(steps, 2), true);
  assert.equal(nextStep(steps)?.key, "offers", "the step that strengthens the lowest score comes first");
  const all = steps.map((s) => ({ ...s, done: true }));
  assert.equal(nextStep(all), null);
});

test("a locked account (assessments unfinished) can still open Getting Started", () => {
  assert.equal(gatePageAllowed("/getting-started"), true);
  assert.equal(gatePageAllowed("/finance"), false);
});
