import { test } from "node:test";
import assert from "node:assert/strict";
import { stopsReportEmail } from "../src/lib/coldEmailReplies";

const row = { name: "Brent Hultman", email: "brent@kairosprofitcoach.com", text: "no thanks", receivedAt: "2026-10-29T20:03:57Z", detail: "Kairos Profit Coach · Owner" };

test("a week with stops lists each person and what they wrote", () => {
  const { subject, html } = stopsReportEmail([row], "Cold Email", "America/Denver");
  assert.match(subject, /1 person this week/);
  assert.match(html, /Brent Hultman/);
  assert.match(html, /no thanks/);
  assert.match(html, /Thu, Oct 29/);
  assert.match(html, /already marked do not contact/);
});

test("several stops are counted in the subject", () => {
  assert.match(stopsReportEmail([row, { ...row, name: "Pat" }], "Cold Email", "America/Denver").subject, /2 people this week/);
});

test("an empty week still says so", () => {
  const { subject, html } = stopsReportEmail([], "Cold Email", "America/Denver");
  assert.match(subject, /no one this week/);
  assert.doesNotMatch(html, /already marked/);
});

test("what a prospect wrote cannot inject markup", () => {
  const { html } = stopsReportEmail([{ ...row, text: "<script>x</script>" }], "Cold Email", "America/Denver");
  assert.doesNotMatch(html, /<script>/);
});
