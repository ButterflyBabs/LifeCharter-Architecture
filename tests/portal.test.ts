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
