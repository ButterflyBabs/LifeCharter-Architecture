import { test } from "node:test";
import assert from "node:assert/strict";
import { findEmail, productTag, readEvent } from "../src/lib/bridge";

test("Payhip sale and refund", () => {
  const e = readEvent("payhip", { type: "paid", id: "AB12", email: "Ann@Example.com", price: 4700, items: [{ product_key: "x9", product_name: "Voice Course" }] });
  assert.equal(e.kind, "sale");
  assert.equal(e.email, "ann@example.com");
  assert.equal(e.amountCents, 4700);
  assert.deepEqual(e.products, [{ key: "x9", name: "Voice Course" }]);
  assert.equal(readEvent("payhip", { type: "refunded", id: "AB12", email: "a@b.co", amount_refunded: 4700 }).kind, "refund");
  assert.equal(readEvent("payhip", { type: "subscription.deleted", id: "s1", email: "a@b.co" }).kind, "cancel");
});

test("Kajabi purchase, flat or wrapped", () => {
  const flat = readEvent("kajabi", { id: 5, offer_id: 77, offer_title: "Inner Circle", amount_in_cents: 9700, member: { email: "b@c.co", first_name: "Bo", last_name: "Lee" } });
  assert.equal(flat.kind, "sale");
  assert.equal(flat.amountCents, 9700);
  assert.equal(flat.firstName, "Bo");
  assert.deepEqual(flat.products, [{ key: "77", name: "Inner Circle" }]);
  const wrapped = readEvent("kajabi", { event: "purchase.created", payload: { payment_transaction_id: "t1", offer: { id: 3, title: "Course" }, contact: { email: "c@d.co", name: "Cy Ray" } } });
  assert.equal(wrapped.email, "c@d.co");
  assert.equal(wrapped.lastName, "Ray");
  assert.equal(wrapped.externalId, "t1");
});

test("Teachable sale and enrollment", () => {
  const s = readEvent("teachable", { type: "Sale.created", object: { id: 9, final_price: 19900, user: { email: "d@e.co", name: "Di Fox" }, course: { id: 4, name: "Brand Basics" } } });
  assert.equal(s.kind, "sale");
  assert.equal(s.amountCents, 19900);
  assert.equal(readEvent("teachable", { type: "Enrollment.created", object: { user: { email: "d@e.co" } } }).kind, "enroll");
});

test("Thinkific order", () => {
  const t = readEvent("thinkific", { resource: "order", action: "created", payload: { id: 12, amount_cents: 5000, user: { email: "f@g.co", first_name: "Fi" }, items: [{ product_id: 8, product_name: "Masterclass" }] } });
  assert.equal(t.kind, "sale");
  assert.equal(t.amountCents, 5000);
  assert.deepEqual(t.products, [{ key: "8", name: "Masterclass" }]);
});

test("Zapier or Make, in dollars", () => {
  const z = readEvent("zapier", { event: "purchase", id: "o-1", email: "h@i.co", product: "Workshop", amount: "47.00" });
  assert.equal(z.amountCents, 4700);
  assert.equal(readEvent("zapier", { event: "refund", email: "h@i.co" }).kind, "refund");
});

test("email found anywhere; product tags", () => {
  assert.equal(findEmail({ a: { b: [{ c: "x@y.co" }] } }), "x@y.co");
  assert.equal(productTag("Brand Voice: The Course!"), "bought-brand-voice-the-course");
});
