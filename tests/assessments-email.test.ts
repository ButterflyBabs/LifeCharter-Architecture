import { test } from "node:test";
import assert from "node:assert/strict";
import { assessmentEmailWindow } from "../src/lib/clientWalkthrough";
import { WELCOME_EMAILS } from "../src/lib/email/welcomeContent";

// The assessments email goes about 1 hour after joining, never earlier, and not more than 3 hours late.
test("assessments email window: early, due, late", () => {
  const joined = new Date("2026-10-10T15:00:00Z");
  const at = (min: number) => joined.getTime() + min * 60_000;
  assert.equal(assessmentEmailWindow(joined, at(3)), "early");
  assert.equal(assessmentEmailWindow(joined, at(59)), "early");
  assert.equal(assessmentEmailWindow(joined, at(60)), "due");
  assert.equal(assessmentEmailWindow(joined, at(60 + 180)), "due");
  assert.equal(assessmentEmailWindow(joined, at(60 + 181)), "late");
});

test("assessments email is queued, so the 9 am run never sends it", () => {
  const e = WELCOME_EMAILS.find((x) => x.key === "assessments");
  assert.ok(e);
  assert.equal(e.queued, true);
  assert.equal(e.day, 0);
  assert.match(e.body, /\{\{GREETING\}\}/);
});
