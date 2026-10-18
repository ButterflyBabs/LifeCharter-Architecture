import { test } from "node:test";
import assert from "node:assert/strict";
import { accessEnded, accessEndsOn, byModule, lessonOpen, lessonOpensOn, percent } from "../src/lib/courses";

const L = (opens_on: string | null, open_after_days: number | null) => ({ opens_on, open_after_days });

test("a group program opens lessons on their date only", () => {
  assert.equal(lessonOpensOn(L("2026-11-01", 7), "cohort", "2026-10-18"), "2026-11-01");
  assert.equal(lessonOpen(L(null, 7), "cohort", "2026-10-18", "2026-10-18"), true);
});

test("a self-paced lesson opens N days after each person joins", () => {
  assert.equal(lessonOpensOn(L(null, 7), "course", "2026-10-18"), "2026-10-25");
  assert.equal(lessonOpen(L(null, 7), "course", "2026-10-18", "2026-10-24"), false);
  assert.equal(lessonOpen(L(null, 7), "course", "2026-10-18", "2026-10-25"), true);
  assert.equal(lessonOpen(L(null, null), "membership", "2026-10-18", "2026-10-18"), true);
});

test("with both a date and a day count, the later one wins", () => {
  assert.equal(lessonOpensOn(L("2026-12-01", 7), "course", "2026-10-18"), "2026-12-01");
  assert.equal(lessonOpensOn(L("2026-10-01", 7), "course", "2026-10-18"), "2026-10-25");
});

test("course access length", () => {
  assert.equal(accessEndsOn("course", 30, "2026-10-18"), "2026-11-17");
  assert.equal(accessEnded("course", 30, "2026-10-18", "2026-11-17"), false);
  assert.equal(accessEnded("course", 30, "2026-10-18", "2026-11-18"), true);
  assert.equal(accessEndsOn("course", null, "2026-10-18"), null);
  assert.equal(accessEndsOn("membership", 30, "2026-10-18"), null);
});

test("progress and modules", () => {
  assert.equal(percent(1, 3), 33);
  assert.equal(percent(0, 0), 0);
  const g = byModule([{ module: "A" }, { module: "A" }, { module: null }, { module: "B" }]);
  assert.deepEqual(g.map((x) => [x.module, x.lessons.length]), [["A", 2], ["", 1], ["B", 1]]);
});
