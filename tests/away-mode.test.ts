import { test } from "node:test";
import assert from "node:assert/strict";
import { awayDates, awayNote, dayIn, isAwayOn } from "../src/lib/awayMode";
import { cleanYear } from "../src/lib/yearReview";

  const a = { starts_on: "2026-12-20", ends_on: "2026-12-31", message: null };
test("is on only between the first and last day", () => {
    assert.equal(isAwayOn(a, "2026-12-19"), false);
    assert.equal(isAwayOn(a, "2026-12-20"), true);
    assert.equal(isAwayOn(a, "2026-12-31"), true);
    assert.equal(isAwayOn(a, "2027-01-01"), false);
    assert.equal(isAwayOn(null, "2026-12-25"), false);
});
test("writes a default note with the day they're back", () => {
    assert.equal(awayNote(a), "I'm away and back on January 1. I'll reply when I'm back.");
    assert.equal(awayNote({ ...a, message: "  Gone fishing  " }), "Gone fishing");
});
test("shows the dates plainly", () => {
    assert.equal(awayDates(a), "December 20 to December 31");
    assert.equal(awayDates({ starts_on: "2026-12-25", ends_on: "2026-12-25" }), "December 25");
});
test("reads today in a time zone", () => {
    assert.equal(dayIn("America/Denver", new Date("2026-10-19T03:00:00Z")), "2026-10-18");
    assert.equal(dayIn("Not/AZone", new Date("2026-10-19T03:00:00Z")), "2026-10-19");
});

test("only takes real past or current years", () => {
    const now = new Date().getUTCFullYear();
    assert.equal(cleanYear("2025"), 2025);
    assert.equal(cleanYear("1999"), now);
    assert.equal(cleanYear(now + 1), now);
    assert.equal(cleanYear("abc"), now);
});
