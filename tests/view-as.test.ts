import { test } from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_SERVICE_ROLE_KEY = "test-secret-for-view-as";

// "View as client" cookie: only a value this server signed, unexpired, unaltered, is honoured.
test("view-as claim round-trips, and tampering or expiry is refused", async () => {
  const { makeViewAsValue, parseViewAsValue } = await import("../src/lib/viewAs");
  const claim = { planId: "plan-1", userId: "user-1", logId: "log-1", expires: Date.now() + 60_000 };
  const good = makeViewAsValue(claim);
  assert.deepEqual(parseViewAsValue(good), claim);

  // A different plan swapped into the body fails the signature.
  const [, sig] = good.split(".");
  const forgedBody = Buffer.from(JSON.stringify({ p: "plan-2", u: "user-1", l: "log-1", e: claim.expires })).toString("base64url");
  assert.equal(parseViewAsValue(`${forgedBody}.${sig}`), null);

  // Expired.
  assert.equal(parseViewAsValue(makeViewAsValue({ ...claim, expires: Date.now() - 1 })), null);

  // Junk.
  assert.equal(parseViewAsValue(""), null);
  assert.equal(parseViewAsValue("nonsense"), null);
  assert.equal(parseViewAsValue(undefined), null);
});
