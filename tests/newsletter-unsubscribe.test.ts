import test from "node:test";
import assert from "node:assert/strict";

import { renderStep, unsubscribeUrl, unsubscribeApiUrl, readUnsubscribeToken, unsubscribeToken } from "../src/lib/sequences/render";
import { isNewsletter } from "../src/lib/broadcasts/engine";

const contact = { id: "11111111-1111-4111-8111-111111111111", first_name: "Eloise" };

test("newsletter emails: main link leaves the newsletter only, with a separate stop-all link", () => {
  const m = renderStep({ brand: "Head Up, Wings Out", subject: "s", body: "hello", contact, list: "newsletter" });
  assert.ok(m.html.includes(unsubscribeUrl(contact.id, "newsletter").replace(/&/g, "&")));
  assert.ok(m.html.includes("stop all emails"));
  assert.ok(m.text.includes("list=newsletter"));
  assert.ok(m.text.includes(`Stop all emails: ${unsubscribeUrl(contact.id)}`));
});

test("every other email keeps the single full unsubscribe link", () => {
  const m = renderStep({ brand: "x", subject: "s", body: "hello", contact });
  assert.ok(!m.html.includes("list=newsletter"));
  assert.ok(m.text.includes(`Unsubscribe: ${unsubscribeUrl(contact.id)}`));
});

test("the one-click header link carries the list, and the token still verifies", () => {
  assert.ok(unsubscribeApiUrl(contact.id, "newsletter").endsWith("&list=newsletter"));
  assert.equal(readUnsubscribeToken(unsubscribeToken(contact.id)), contact.id);
});

test("only a broadcast to the headup-wingsout list counts as the newsletter", () => {
  assert.equal(isNewsletter({ tags: ["headup-wingsout"] }), true);
  assert.equal(isNewsletter({ tags: ["lcmc-oct-22-invite"] }), false);
});
