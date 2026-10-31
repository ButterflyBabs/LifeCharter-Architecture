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

import { accessEndOf, cleanExpiryDate, cleanTimeZone, todayInZone, withAccessEnd } from "../src/lib/teamRoles";

test("the last day counts in the time zone it was set in", () => {
  const p = { extras: { expiresOn: "2026-11-06", expiresTz: "Asia/Karachi" } };
  assert.equal(memberAccessExpired(p, at("2026-11-06T18:59:00Z")), false); // Nov 6, 11:59 PM in Karachi
  assert.equal(memberAccessExpired(p, at("2026-11-06T19:00:00Z")), true); // Nov 7, 12:00 AM in Karachi
  assert.equal(memberAccessExpired({ extras: { expiresOn: "2026-11-06", expiresTz: "Not/AZone" } }, at("2026-11-07T07:00:00Z")), true); // bad zone falls back to Mountain
});

test("only real calendar days and real time zones are accepted", () => {
  assert.equal(cleanExpiryDate("2026-11-06"), "2026-11-06");
  assert.equal(cleanExpiryDate("2026-02-30"), null);
  assert.equal(cleanExpiryDate("11/06/2026"), null);
  assert.equal(cleanTimeZone("America/Denver"), "America/Denver");
  assert.equal(cleanTimeZone("nope"), null);
  assert.equal(todayInZone("America/Denver", at("2026-11-07T06:59:00Z")), "2026-11-06");
});

test("setting or removing the last day keeps everything else in the permissions", () => {
  const base = { preset: "va", features: { tasks: "edit" }, extras: { restrict: true, noDelete: true } };
  const set = withAccessEnd(base, { on: "2026-11-06", tz: "America/Denver" });
  assert.deepEqual(set, { preset: "va", features: { tasks: "edit" }, extras: { restrict: true, noDelete: true, expiresOn: "2026-11-06", expiresTz: "America/Denver" } });
  assert.deepEqual(accessEndOf(set), { on: "2026-11-06", tz: "America/Denver" });
  assert.deepEqual(withAccessEnd(set, null), base);
  assert.deepEqual(withAccessEnd({}, { on: "2026-11-06" }), { extras: { expiresOn: "2026-11-06", expiresTz: "America/Denver" } });
  assert.deepEqual(withAccessEnd({ extras: { expiresOn: "2026-11-06" } }, null), {});
  assert.equal(accessEndOf({}), null);
});
