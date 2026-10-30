import { test } from "node:test";
import assert from "node:assert/strict";
import { focusOf, matchesFocus } from "../src/lib/taskFocus";

test("Incubator projects are Incubator work", () => {
  assert.equal(focusOf("Incubator · Nov 12", null), "incubator");
  assert.equal(focusOf("Incubator engine (build once)", null), "incubator");
});

test("the LifeCharter Program offer or project is Program work", () => {
  assert.equal(focusOf(null, "LifeCharter Program"), "program");
  assert.equal(focusOf("LC App · LifeCharter Program launch", null), "program");
});

test("everything else, including other Life Charter offers, is neither", () => {
  assert.equal(focusOf("MasterClass · Oct 22", null), null);
  assert.equal(focusOf(null, "LifeCharter Circle - Incubator Special"), null);
  assert.equal(focusOf(null, null), null);
});

test("an Incubator project wins over the Program offer", () => {
  assert.equal(focusOf("Incubator · Nov 12", "LifeCharter Program"), "incubator");
});

test("the filter keeps the right tasks", () => {
  assert.equal(matchesFocus("", "program"), true);
  assert.equal(matchesFocus("program", "incubator"), false);
  assert.equal(matchesFocus("incubator", "incubator"), true);
  assert.equal(matchesFocus("other", null), true);
  assert.equal(matchesFocus("other", "program"), false);
});
