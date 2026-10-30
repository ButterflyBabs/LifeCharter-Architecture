import { test } from "node:test";
import assert from "node:assert/strict";
import { applyOrder, cleanOrders, moveKey } from "../src/lib/taskOrder";

test("no saved order keeps the usual order", () => {
  assert.deepEqual(applyOrder(["a", "b", "c"], undefined), ["a", "b", "c"]);
  assert.deepEqual(applyOrder(["a", "b", "c"], []), ["a", "b", "c"]);
});

test("a saved order wins, and new or missing keys are handled", () => {
  assert.deepEqual(applyOrder(["a", "b", "c"], ["c", "a", "b"]), ["c", "a", "b"]);
  assert.deepEqual(applyOrder(["a", "b", "c", "d"], ["c", "a"]), ["c", "a", "b", "d"]);
  assert.deepEqual(applyOrder(["a", "b"], ["x", "b", "a"]), ["b", "a"]);
});

test("dragging one section onto another takes its place", () => {
  assert.deepEqual(moveKey(["a", "b", "c", "d"], "d", "b"), ["a", "d", "b", "c"]);
  assert.deepEqual(moveKey(["a", "b", "c", "d"], "a", "c"), ["b", "c", "a", "d"]);
  assert.deepEqual(moveKey(["a", "b"], "a", "a"), ["a", "b"]);
  assert.deepEqual(moveKey(["a", "b"], "a", "zzz"), ["a", "b"]);
});

test("stored orders are cleaned", () => {
  assert.equal(cleanOrders("x"), null);
  assert.equal(cleanOrders([1]), null);
  assert.deepEqual(cleanOrders({ groups: ["program", 3, "other"], "bad scope!": ["a"], empty: [] }), { groups: ["program", "other"] });
});
