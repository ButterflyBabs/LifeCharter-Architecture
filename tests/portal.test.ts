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
