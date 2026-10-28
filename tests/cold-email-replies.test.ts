import { test } from "node:test";
import assert from "node:assert/strict";
import { replyText } from "../src/lib/coldEmailReplies";

test("keeps what the person wrote and drops the quoted email", () => {
  const raw = "Sounds interesting, send me the link.\n\nThanks,\nJo\n\nOn Tue, Oct 27, 2026 at 8:01 AM AmiLynne Carroll <amilynne@lifecharterpro.com> wrote:\n> Hi Jo, I'm AmiLynne";
  assert.equal(replyText(raw), "Sounds interesting, send me the link.\n\nThanks,\nJo");
});

test("turns an HTML reply into plain text", () => {
  const html = "<div>Yes please.<br>Wednesday works.</div><div><b>Jo</b> &amp; team</div><blockquote>old</blockquote>";
  assert.match(replyText(html, true), /^Yes please\.\nWednesday works\.\nJo & team/);
});

test("handles empty input", () => {
  assert.equal(replyText(null), "");
});

import { senderStart, rampCap, daysBetween } from "../src/lib/coldEmail";

test("a mailbox added after the series began warms up from its own first day", () => {
  assert.equal(senderStart("2026-10-26", "2026-10-21T02:11:00Z", "America/Denver"), "2026-10-26");
  const start = senderStart("2026-10-26", "2026-10-29T14:00:00Z", "America/Denver");
  assert.equal(start, "2026-10-29");
  assert.equal(rampCap(daysBetween(start, "2026-10-29"), 30), 5);
  assert.equal(rampCap(daysBetween(start, "2026-11-04"), 30), 10);
});
