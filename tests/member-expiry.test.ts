import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanExtras, memberAccessExpired } from "../src/lib/teamRoles";

const perms = { extras: { expiresOn: "2026-11-06" } };
const at = (iso: string) => new Date(iso);

test("access works through the whole last day in Mountain time", () => {
  assert.equal(memberAccessExpired(perms, at("2026-11-06T06:59:00Z")), false); // Nov 5, 11:59 PM MST
  assert.equal(memberAccessExpired(perms, at("2026-11-07T06:59:00Z")), false); // Nov 6, 11:59 PM MST
});

test("access stops when the next day begins in Mountain time", () => {
  assert.equal(memberAccessExpired(perms, at("2026-11-07T07:00:00Z")), true); // Nov 7, 12:00 AM MST
  assert.equal(memberAccessExpired(perms, at("2026-12-01T12:00:00Z")), true);
});

test("members without an expiry, or with a malformed one, never expire", () => {
  assert.equal(memberAccessExpired(null), false);
  assert.equal(memberAccessExpired({}), false);
  assert.equal(memberAccessExpired({ extras: { expiresOn: "soon" } }), false);
  assert.equal(memberAccessExpired({ extras: { demo: true } }), false);
});

test("the expiry survives cleaning the extras (an edit in Settings must not drop it)", () => {
  assert.deepEqual(cleanExtras({ expiresOn: "2026-11-06", noDelete: true }), { expiresOn: "2026-11-06", noDelete: true });
  assert.equal(cleanExtras({ expiresOn: "nope" }), null);
});
