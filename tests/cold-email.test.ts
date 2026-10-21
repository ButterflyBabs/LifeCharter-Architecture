import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STEPS, classifyMessage, dueStep, firstNameOf, inSendWindow, rampCap, render, varsFor } from "../src/lib/coldEmail";

test("the ramp starts small and never goes over the mailbox cap", () => {
  assert.equal(rampCap(0, 30), 5);
  assert.equal(rampCap(5, 30), 10);
  assert.equal(rampCap(9, 30), 20);
  assert.equal(rampCap(20, 30), 30);
  assert.equal(rampCap(20, 12), 12);
  assert.equal(rampCap(0, 3), 3);
});

test("emails go out on weekdays inside the window, in the sender's own time zone", () => {
  // Wed Oct 21 2026 17:00 UTC = 11:00 Mountain
  assert.equal(inSendWindow(new Date("2026-10-21T17:00:00Z"), "America/Denver", 9, 16, true), true);
  // 06:00 UTC = midnight Mountain
  assert.equal(inSendWindow(new Date("2026-10-21T06:00:00Z"), "America/Denver", 9, 16, true), false);
  // Sat Oct 24 2026 17:00 UTC
  assert.equal(inSendWindow(new Date("2026-10-24T17:00:00Z"), "America/Denver", 9, 16, true), false);
  assert.equal(inSendWindow(new Date("2026-10-24T17:00:00Z"), "America/Denver", 9, 16, false), true);
});

test("each step waits for its gap, and the series ends after the last", () => {
  const t0 = new Date("2026-10-21T17:00:00Z");
  assert.equal(dueStep([], DEFAULT_STEPS, t0), 0);
  assert.equal(dueStep([{ step: 0, sentAt: t0 }], DEFAULT_STEPS, new Date(t0.getTime() + 3 * 86400000)), null);
  assert.equal(dueStep([{ step: 0, sentAt: t0 }], DEFAULT_STEPS, new Date(t0.getTime() + 4 * 86400000)), 1);
  const t1 = new Date(t0.getTime() + 4 * 86400000);
  assert.equal(dueStep([{ step: 0, sentAt: t0 }, { step: 1, sentAt: t1 }], DEFAULT_STEPS, new Date(t1.getTime() + 4 * 86400000)), null);
  assert.equal(dueStep([{ step: 0, sentAt: t0 }, { step: 1, sentAt: t1 }], DEFAULT_STEPS, new Date(t1.getTime() + 5 * 86400000)), 2);
  assert.equal(dueStep([{ step: 0, sentAt: t0 }, { step: 1, sentAt: t1 }, { step: 2, sentAt: t1 }], DEFAULT_STEPS, new Date(t1.getTime() + 99 * 86400000)), null);
});

test("merge fields fill in, and a missing company does not leave a gap", () => {
  const v = varsFor({ name: "Jane Doe", notes: "Doe Studio · Founder · Denver", link_code: "abc1234" }, "Thursday, November 5");
  const body = render(DEFAULT_STEPS[0].body, v);
  assert.match(body, /Hi Jane,/);
  assert.match(body, /your work at Doe Studio, and/);
  assert.match(body, /https:\/\/lccommandsuite\.com\/m\/abc1234/);
  assert.ok(!/\{\{/.test(body));
  const none = render(DEFAULT_STEPS[0].body, varsFor({ name: "Sam", notes: null, link_code: null }, "x"));
  assert.match(none, /your work, and/);
  assert.equal(firstNameOf("  "), "there");
});

test("replies, stop requests, auto-replies and bounces are told apart", () => {
  const me = "amilynne@lifecharterpro.com";
  assert.equal(classifyMessage({ fromEmail: "jane@x.com", subject: "Re: a quick question", preview: "Sure, tell me more about the session." }, me).kind, "reply");
  assert.equal(classifyMessage({ fromEmail: "jane@x.com", subject: "Re: a quick question", preview: "No thanks, please remove me." }, me).kind, "stop");
  assert.equal(classifyMessage({ fromEmail: "jane@x.com", subject: "Re: hi", preview: 'Interesting! On Tue, Oct 20 AmiLynne wrote: If this is not for you, reply "no thanks"' }, me).kind, "reply");
  assert.equal(classifyMessage({ fromEmail: "jane@x.com", subject: "Automatic reply: a quick question", preview: "I am out of the office" }, me).kind, "auto");
  const b = classifyMessage({ fromEmail: "mailer-daemon@googlemail.com", subject: "Delivery Status Notification (Failure)", preview: "Your message wasn't delivered to ghost@nowhere.com because the address couldn't be found. " + me }, me);
  assert.equal(b.kind, "bounce");
  assert.deepEqual(b.kind === "bounce" ? b.addresses : [], ["ghost@nowhere.com"]);
});
