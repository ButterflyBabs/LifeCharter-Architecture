import { test } from "node:test";
import assert from "node:assert/strict";
import { eventConsentText, eventTextBody } from "../src/lib/workshopTexts";

test("the workshop agreement names the sender, the number of texts and STOP", () => {
  const t = eventConsentText("LifeCharter", 3);
  assert.ok(t.includes("LifeCharter") && t.includes("up to 3 texts") && t.includes("Reply STOP"));
  assert.ok(eventConsentText("LifeCharter", 1).includes("up to 1 text)"));
});

test("a day's text says which day, the start time, the join link and how to stop", () => {
  const b = eventTextBody({ brand: "LifeCharter", title: "Take the Command Seat", day: 2, days: 3, time: "3:00 PM MST", joinUrl: "https://zoom.us/j/1" });
  assert.equal(b, "LifeCharter: Take the Command Seat, Day 2 of 3, starts today at 3:00 PM MST. Join: https://zoom.us/j/1 Reply STOP to opt out.");
  assert.ok(!eventTextBody({ brand: "X", title: "T", day: 1, days: 1, time: "3 PM", joinUrl: null }).includes("Join:"));
});
