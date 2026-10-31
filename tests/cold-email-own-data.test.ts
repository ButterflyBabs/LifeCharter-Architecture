// A client's cold email and personal links use their own details, never Babs's. Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_STEPS, STARTER_STEPS, cleanLinkUrl, coldNotReady, varsFor } from "../src/lib/coldEmail";
import { replyNotifyList } from "../src/lib/coldEmailReplies";

const ready = [{ day: 0, subject: "Hi {{first_name}}", body: "My own words: {{personal_link}} {{booking_link}}" }];
const links = { personal: "https://example.com/start", booking: "https://example.com/book" };

test("the client starter emails carry none of Babs's details", () => {
  const text = JSON.stringify(STARTER_STEPS);
  assert.ok(!/AmiLynne|Babs|LifeCharter|Marcello|Wings/i.test(text));
});

test("a client series stays off until it is their own", () => {
  assert.match(coldNotReady([], "Address", links) ?? "", /emails/);
  assert.match(coldNotReady(STARTER_STEPS, "Address", links) ?? "", /brackets/);
  assert.match(coldNotReady(ready, " ", links) ?? "", /address/);
  assert.match(coldNotReady(ready, "Address", { ...links, personal: "" }) ?? "", /personal link/);
  assert.match(coldNotReady(ready, "Address", { ...links, booking: "" }) ?? "", /booking link/);
  assert.equal(coldNotReady(ready, "Address", links), null);
});

test("a client's merge fields never fall back to Babs's pages", () => {
  const v = varsFor({ name: "Jo Lee", notes: null, link_code: "abc" }, "", { personal: "", booking: "" });
  assert.equal(v.personal_link, "");
  assert.equal(v.booking_link, "");
  assert.equal(varsFor({ name: "Jo", notes: null, link_code: "abc" }, "", links).booking_link, links.booking);
});

test("Babs's account keeps her own defaults", () => {
  assert.match(varsFor({ name: "Jo", notes: null, link_code: null }, "").personal_link, /masterclass-signup/);
  assert.match(JSON.stringify(DEFAULT_STEPS), /AmiLynne/);
});

test("a client's reply alerts go to the client, not Babs's team", () => {
  assert.deepEqual(replyNotifyList(null, false, "owner@example.com"), ["owner@example.com"]);
  assert.ok(replyNotifyList(null, true, "x@example.com").some((e) => e.includes("sumbal")));
  assert.deepEqual(replyNotifyList({ coldReplyNotify: ["a@b.co", 4] }, false, "x@example.com"), ["a@b.co"]);
});

test("only a whole web address is saved as a destination", () => {
  assert.equal(cleanLinkUrl(" https://mysite.com/start "), "https://mysite.com/start");
  assert.equal(cleanLinkUrl("mysite.com"), "");
  assert.equal(cleanLinkUrl("javascript:alert(1)"), "");
});
