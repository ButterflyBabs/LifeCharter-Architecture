import { test } from "node:test";
import assert from "node:assert/strict";
import { businessGaps, cleanBusiness, fillReminder, inQuietHours, keywordOf, prettyPhone, segmentsOf, toE164, SMS_CAP_BY_TIER } from "../src/lib/sms";
import { createHmac } from "crypto";

test("phone numbers become +1 numbers, or nothing", () => {
  assert.equal(toE164("(303) 555-0123"), "+13035550123");
  assert.equal(toE164("1-303-555-0123"), "+13035550123");
  assert.equal(toE164("+1 303 555 0123"), "+13035550123");
  assert.equal(toE164("555-0123"), null);
  assert.equal(toE164("(103) 555-0123"), null);
  assert.equal(toE164(""), null);
  assert.equal(prettyPhone("+13035550123"), "(303) 555-0123");
});

test("message parts are counted like carriers count them", () => {
  assert.equal(segmentsOf("a".repeat(160)), 1);
  assert.equal(segmentsOf("a".repeat(161)), 2);
  assert.equal(segmentsOf("Hi 🦋"), 1);
  assert.equal(segmentsOf("🦋".repeat(36)), 2);
});

test("STOP, START and HELP are understood", () => {
  assert.equal(keywordOf(" stop "), "stop");
  assert.equal(keywordOf("Unsubscribe."), "stop");
  assert.equal(keywordOf("START"), "start");
  assert.equal(keywordOf("help"), "help");
  assert.equal(keywordOf("Can we move it to 3?"), null);
});

test("reminders always name the business and say how to opt out", () => {
  const r = fillReminder("Hi {first}, see you {time} for your {event}.", { first: "Ann", business: "Bright Path", event: "Discovery Call", time: "10 AM", date: "Oct 20" });
  assert.match(r, /^Bright Path: Hi Ann, see you 10 AM for your Discovery Call\. Reply STOP to opt out\.$/);
});

test("no texts between 9 PM and 8 AM where the person is", () => {
  assert.equal(inQuietHours(new Date("2026-10-19T13:00:00Z"), "America/Denver"), true); // 7 AM
  assert.equal(inQuietHours(new Date("2026-10-19T16:00:00Z"), "America/Denver"), false); // 10 AM
  assert.equal(inQuietHours(new Date("2026-10-20T03:30:00Z"), "America/Denver"), true); // 9:30 PM
});

test("plan caps", () => {
  assert.deepEqual(SMS_CAP_BY_TIER, { starter: 500, growth: 1000, vip: 2500 });
});

test("business details: what's missing", () => {
  const b = cleanBusiness({ legalName: "Bright Path LLC", website: "brightpath.com", type: "PRIVATE_PROFIT", ein: "12-3456789", street: "1 Main", city: "Denver", state: "CO", postal: "80202", contactFirst: "Ann", contactLast: "Lee", contactEmail: "ann@brightpath.com", contactPhone: "303 555 0123" });
  assert.equal(b.website, "https://brightpath.com");
  assert.deepEqual(businessGaps(b), []);
  assert.deepEqual(businessGaps({ ...b, ein: "" }), ["EIN (9 digits)"]);
  assert.deepEqual(businessGaps({ ...b, ein: "", type: "SOLE_PROPRIETOR" }), []);
});

test("Twilio signatures are checked", async () => {
  process.env.TWILIO_AUTH_TOKEN = "testtoken";
  process.env.TWILIO_ACCOUNT_SID = "ACtest";
  const { validTwilioSignature } = await import("../src/lib/smsServer");
  const url = "https://lccommandsuite.com/api/sms/inbound";
  const params = { From: "+13035550123", Body: "STOP", To: "+18885550123" };
  const sig = createHmac("sha1", "testtoken").update(url + "Body" + "STOP" + "From" + "+13035550123" + "To" + "+18885550123").digest("base64");
  assert.equal(validTwilioSignature(url, params, sig), true);
  assert.equal(validTwilioSignature(url, { ...params, Body: "START" }, sig), false);
  assert.equal(validTwilioSignature(url, params, null), false);
});
