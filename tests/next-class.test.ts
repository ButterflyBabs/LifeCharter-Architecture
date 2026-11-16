import { test } from "node:test";
import assert from "node:assert/strict";
import { nextClassLabel } from "../src/lib/masterclass/results";
import { renderStep } from "../src/lib/sequences/render";

// The follow-up emails say "on {{next_class}}", so they must name a class that really runs.
test("the day after a class names the next Wednesday", () => {
  assert.equal(nextClassLabel(new Date("2026-12-03T15:00:00Z")), "Wednesday, December 9");
  assert.equal(nextClassLabel(new Date("2026-12-01T15:00:00Z")), "Wednesday, December 2");
});

test("skipped weeks are passed over", () => {
  // Nov 18 (Take the Command Seat week) does not run.
  assert.equal(nextClassLabel(new Date("2026-11-17T15:00:00Z")), "Wednesday, November 25");
  // Dec 23 and Dec 30 do not run, so the class after Dec 16 is Jan 6.
  assert.equal(nextClassLabel(new Date("2026-12-22T15:00:00Z")), "Wednesday, January 6");
  assert.equal(nextClassLabel(new Date("2026-12-17T15:00:00Z")), "Wednesday, January 6");
});

test("on the day of a class the next one is the following class", () => {
  assert.equal(nextClassLabel(new Date("2026-12-09T20:00:00Z")), "Wednesday, December 16");
});

test("{{next_class}} is filled in the subject and the body", () => {
  const out = renderStep({ brand: "x", subject: "A seat on {{next_class}}", body: "See you on {{next_class}} at noon MT.", contact: { id: "c1", first_name: "Eve" } });
  assert.doesNotMatch(out.subject, /\{\{/);
  assert.doesNotMatch(out.html, /\{\{/);
  assert.match(out.subject, /^A seat on (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), /);
});
