import test from "node:test";
import assert from "node:assert/strict";

import { matchWaitingCard, parseAcceptance, parseInvite } from "../src/lib/linkedinRequests";

const accept = (subject: string, link = "https://www.linkedin.com/in/jane-doe-123/") => ({ id: "m1", subject, body: { content: `<a href="${link}">profile</a>` } });

test("an acceptance email is read as an acceptance, with the profile link", () => {
  const a = parseAcceptance(accept("Jane Doe accepted your invitation"));
  assert.deepEqual(a, { name: "Jane Doe", slug: "jane-doe-123" });
});

test("a new request email is not an acceptance", () => {
  assert.equal(parseAcceptance({ id: "m2", subject: "Jane Doe wants to connect" }), null);
  assert.equal(parseAcceptance({ id: "m3", subject: "Your weekly digest" }), null);
});

test("acceptance wording is never mistaken for a new request on the name path", () => {
  assert.ok(parseAcceptance(accept("Jane Doe accepted your invitation")));
  assert.equal(parseInvite({ id: "m4", subject: "Jane Doe wants to connect", from: { emailAddress: { name: "Jane Doe via LinkedIn" } } })?.name, "Jane Doe");
});

const cards = [
  { id: "a", name: "Jane Doe", profile_url: "https://www.linkedin.com/in/jane-doe-123" },
  { id: "b", name: "Sam Lee", profile_url: null },
  { id: "c", name: "Sam Lee", profile_url: null },
];

test("matches by profile link first", () => {
  assert.equal(matchWaitingCard(cards, { name: "Someone Else", slug: "jane-doe-123" })?.id, "a");
});

test("falls back to an exact name when only one card has it", () => {
  assert.equal(matchWaitingCard(cards, { name: "jane  doe", slug: null })?.id, "a");
});

test("two cards with the same name and no link are left alone", () => {
  assert.equal(matchWaitingCard(cards, { name: "Sam Lee", slug: null }), null);
});
