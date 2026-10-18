import { test } from "node:test";
import assert from "node:assert/strict";
import { newPortalToken, portalUrl, validToken } from "../src/lib/portal";

test("portal links are long, unguessable and checked before any lookup", () => {
  const t = newPortalToken();
  assert.equal(validToken(t), true);
  assert.ok(t.length >= 32);
  assert.notEqual(t, newPortalToken());
  assert.equal(validToken("short"), false);
  assert.equal(validToken("x".repeat(30) + "'; drop"), false);
  assert.match(portalUrl(t), /\/portal\/[A-Za-z0-9_-]+$/);
});

test("portal look: unknown values fall back, sections keep every section once in the chosen order", async () => {
  const { cleanLook, DEFAULT_LOOK, headingFor, onAccent } = await import("../src/lib/portalLook");
  const l = cleanLook({ accent: "red", background: "#ffffff", font: "comic", heading: "Hi {first}!", sections: [{ key: "messages", title: "Talk to me" }, { key: "nope" }, { key: "sessions", hidden: true }, { key: "messages" }] });
  assert.equal(l.accent, DEFAULT_LOOK.accent);
  assert.equal(l.background, "#ffffff");
  assert.equal(l.font, "classic");
  assert.deepEqual(l.sections.slice(0, 2), [{ key: "messages", title: "Talk to me", hidden: false }, { key: "sessions", title: "Your sessions", hidden: true }]);
  assert.equal(l.sections.length, 8);
  assert.equal(headingFor(l, "Eloise"), "Hi Eloise!");
  assert.equal(cleanLook({ logoPath: "../../etc/passwd" }).logoPath, null);
  assert.equal(onAccent("#2E7C83"), "#FFFFFF");
  assert.equal(onAccent("#F5E6A8"), "#1F2B3A");
});

test("events: challenge days count from the start date; calendar links carry the time and join link", async () => {
  const { challengeDay, googleCalendarUrl, icsFor, replayOpen } = await import("../src/lib/events");
  assert.equal(challengeDay("2026-10-20", "2026-10-19"), 0);
  assert.equal(challengeDay("2026-10-20", "2026-10-20"), 1);
  assert.equal(challengeDay("2026-10-20", "2026-10-24"), 5);
  const ev = { id: "e1", title: "Clarity, Live", starts_at: "2026-11-05T18:00:00.000Z", duration_min: 90, join_url: "https://zoom.us/j/1", description: "Bring a pen" };
  assert.match(googleCalendarUrl(ev)!, /dates=20261105T180000Z%2F20261105T193000Z/);
  const ics = icsFor(ev);
  assert.match(ics, /DTSTART:20261105T180000Z/);
  assert.match(ics, /SUMMARY:Clarity\\, Live/);
  assert.equal(replayOpen({ replay_url: "https://v", replay_hours: 72, replay_sent_at: new Date(Date.now() - 73 * 3_600_000).toISOString() }), false);
  assert.equal(replayOpen({ replay_url: "https://v", replay_hours: 72, replay_sent_at: new Date().toISOString() }), true);
  assert.equal(replayOpen({ replay_url: null, replay_hours: null, replay_sent_at: null }), false);
});
