import { test } from "node:test";
import assert from "node:assert/strict";
import { movesForward } from "../src/lib/dmPipeline";
import { DEFAULT_STEPS, type ColdStep, classifyMessage, dueStep, firstNameOf, inSendWindow, pickVariantKey, rampCap, render, stepText, varsFor, variantKeys } from "../src/lib/coldEmail";

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

test("a coach listed under their own name gets no 'at <name>' in the greeting", () => {
  const v = varsFor({ name: "Erin Witter", notes: "Erin Witter · Boulder, CO", link_code: "abc1234" }, "x");
  assert.equal(v.company, "");
  assert.equal(v.at_company, "");
  assert.equal(varsFor({ name: "Jane Doe", notes: "Doe Studio · Denver", link_code: "a" }, "x").at_company, " at Doe Studio");
});

test("Email 2 moves a card from Email 1 sent to the follow-up stage, and a reply still moves it on", () => {
  assert.equal(movesForward("sent", "open", "followed_up"), true);
  assert.equal(movesForward("followed_up", "open", "sent"), false);
  assert.equal(movesForward("followed_up", "open", "conversation"), true);
  assert.equal(movesForward("conversation", "open", "followed_up"), false);
});

test("a dated series squeezes follow-ups to fit before the event and stops after it", () => {
  const by = "2026-11-13";
  const steps: ColdStep[] = [
    { day: 0, subject: "a", body: "a", by },
    { day: 2, subject: "b", body: "b", by },
    { day: 4, subject: "c", body: "c", by },
  ];
  const at = (iso: string) => new Date(iso);
  // Email 1 on Mon Nov 9: Email 2 on its normal day 2, Email 3 on day 4 (both before Fri Nov 13).
  const t0 = at("2026-11-09T17:00:00Z");
  assert.equal(dueStep([{ step: 0, sentAt: t0 }], steps, at("2026-11-10T17:00:00Z")), null);
  assert.equal(dueStep([{ step: 0, sentAt: t0 }], steps, at("2026-11-11T17:00:00Z")), 1);
  const t1 = at("2026-11-11T17:00:00Z");
  assert.equal(dueStep([{ step: 0, sentAt: t0 }, { step: 1, sentAt: t1 }], steps, at("2026-11-13T17:00:00Z")), 2);
  // Email 1 on Wed Nov 11: Email 2 on Fri Nov 13 is still in time; Email 3 would be Sun Nov 15, so it is skipped.
  const w = at("2026-11-11T17:00:00Z");
  assert.equal(dueStep([{ step: 0, sentAt: w }], steps, at("2026-11-13T17:00:00Z")), 1);
  assert.equal(dueStep([{ step: 0, sentAt: w }, { step: 1, sentAt: at("2026-11-13T17:00:00Z") }], steps, at("2026-11-20T17:00:00Z")), null);
  // Email 1 on Thu Nov 12: nothing more fits before the day, so nothing more goes out.
  assert.equal(dueStep([{ step: 0, sentAt: at("2026-11-12T17:00:00Z") }], steps, at("2026-11-30T17:00:00Z")), null);
  // After the day, no new person starts the series, until the wording is switched.
  assert.equal(dueStep([], steps, at("2026-11-14T17:00:00Z")), null);
  assert.equal(dueStep([], steps, at("2026-11-13T17:00:00Z")), 0);
});

test("A/B variants: each card keeps one letter, the split is even, and fewer follow-up variants are shared out in turn", () => {
  const v = (key: string, t: string) => ({ key, subject: `s${key}`, body: `${t}${key}` });
  const steps: ColdStep[] = [
    { day: 0, subject: "sA", body: "e1A", variants: [v("A", "e1"), v("B", "e1"), v("C", "e1"), v("D", "e1")] },
    { day: 2, subject: "sA", body: "e2A", variants: [v("A", "e2"), v("B", "e2")] },
  ];
  const keys = variantKeys(steps);
  assert.deepEqual(keys, ["A", "B", "C", "D"]);
  assert.equal(pickVariantKey("abc", keys), pickVariantKey("abc", keys));
  const tally: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (let i = 0; i < 4000; i++) tally[pickVariantKey(`card-${i}-${i * 7919}`, keys) as string]++;
  for (const k of keys) assert.ok(tally[k] > 800 && tally[k] < 1200, `${k} got ${tally[k]}`);
  assert.equal(stepText(steps[0], "C", keys).body, "e1C");
  assert.equal(stepText(steps[1], "A", keys).body, "e2A");
  assert.equal(stepText(steps[1], "C", keys).body, "e2A");
  assert.equal(stepText(steps[1], "D", keys).body, "e2B");
  // A series with no variants is untouched: everyone gets the step's own words.
  assert.deepEqual(stepText(DEFAULT_STEPS[0], null, []), { subject: DEFAULT_STEPS[0].subject, body: DEFAULT_STEPS[0].body, key: null });
  assert.equal(pickVariantKey("x", []), null);
  assert.deepEqual(variantKeys(DEFAULT_STEPS), []);
});
