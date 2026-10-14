import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyCap, daysSince, parseGuard } from "../src/lib/broadcasts/warmup";

test("the warm-up cap doubles every few days and stops at the maximum", () => {
  const g = parseGuard({ warmup_guard_on: "true", warmup_guard_start: "2026-10-15", warmup_guard_start_cap: "25", warmup_guard_step_days: "3", warmup_guard_max: "300" }, "2026-10-14");
  assert.equal(g.on, true);
  assert.equal(dailyCap(g, "2026-10-15"), 25); // day 0
  assert.equal(dailyCap(g, "2026-10-17"), 25); // day 2
  assert.equal(dailyCap(g, "2026-10-18"), 50); // day 3
  assert.equal(dailyCap(g, "2026-10-24"), 200); // day 9
  assert.equal(dailyCap(g, "2026-12-01"), 300); // capped
  assert.equal(dailyCap(g, "2026-10-01"), 25); // before the start is day 0
});

test("the guard is off unless it says true, and bad numbers fall back to the defaults", () => {
  assert.equal(parseGuard({}, "2026-10-14").on, false);
  const g = parseGuard({ warmup_guard_on: "yes", warmup_guard_start_cap: "zero" }, "2026-10-14");
  assert.equal(g.on, false);
  assert.equal(g.startCap, 25);
  assert.equal(g.stepDays, 3);
  assert.equal(g.max, 1000);
  assert.equal(daysSince("2026-10-14", "2026-10-14"), 0);
});
