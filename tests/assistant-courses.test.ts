import { test } from "node:test";
import assert from "node:assert/strict";
import { createCourse, setAway, createLandingPage } from "../src/lib/ai/actions/courses";
import type { ActionCtx } from "../src/lib/ai/actions/types";

const ctx = { planId: "p", userEmail: null, db: {} } as unknown as ActionCtx;

test("course card shows lessons and promises no members or email", async () => {
  const r = await createCourse.plan!({ name: "Price With Confidence", kind: "course", access_days: 90, lessons: [{ title: "Your number", module: "Module 1", open_after_days: 0 }, { title: "Say it out loud", module: "Module 1", open_after_days: 7 }] }, ctx);
  assert.ok("preview" in r);
  if ("preview" in r) {
    assert.match(r.preview.title, /self-paced course "Price With Confidence"/);
    assert.ok(r.preview.lines.some((l) => l.includes("Say it out loud (opens day 7)")));
    assert.ok(r.preview.lines.some((l) => /No members are added and nothing is emailed/.test(l)));
    assert.ok(r.preview.lines.some((l) => /Access lasts 90 days/.test(l)));
  }
  assert.ok("error" in (await createCourse.plan!({ kind: "course" }, ctx)));
});

test("away card checks the dates", async () => {
  const future = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
  const later = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
  const ok = await setAway.plan!({ starts_on: future, ends_on: later }, ctx);
  assert.ok("preview" in ok);
  if ("preview" in ok) assert.ok(ok.preview.lines.some((l) => /Bookings already made are not touched/.test(l)));
  assert.ok("error" in (await setAway.plan!({ starts_on: later, ends_on: future }, ctx)));
  assert.ok("error" in (await setAway.plan!({ starts_on: "2020-01-01", ends_on: "2020-01-02" }, ctx)));
  const off = await setAway.plan!({ clear: true }, ctx);
  assert.ok("preview" in off && /Turn off/.test(off.preview.title));
});

test("landing page card says it stays a draft", async () => {
  const r = await createLandingPage.plan!({ template: "optin", headline: "Get your week back", bullets: ["One", "Two"] }, ctx);
  assert.ok("preview" in r);
  if ("preview" in r) {
    assert.ok(r.preview.lines.some((l) => /Saved as a draft/.test(l)));
    assert.ok(r.preview.lines.some((l) => /Not linked yet/.test(l)));
  }
  assert.ok("error" in (await createLandingPage.plan!({ template: "nope", headline: "x" }, ctx)));
});
