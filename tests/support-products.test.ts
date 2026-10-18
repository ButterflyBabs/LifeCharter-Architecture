import { test } from "node:test";
import assert from "node:assert/strict";
import { productLabel, supportProduct } from "../src/lib/support/products";

test("support requests are tagged with the app they came from; anything unknown is the Command Suite", () => {
  assert.equal(supportProduct("volant"), "volant");
  assert.equal(supportProduct("fledge"), "fledge");
  assert.equal(supportProduct("beacon"), "lccs");
  assert.equal(supportProduct(undefined), "lccs");
  assert.equal(productLabel("fledge"), "LC Fledge");
  assert.equal(productLabel(null), "Command Suite");
});
