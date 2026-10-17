import { test } from "node:test";
import assert from "node:assert/strict";
import { evidenceReady, missingPieces, missingText } from "../src/lib/accountEvidence";

// Babs's rule (2026-10-17): no account is ever created without a payment AND the client's signature on the Year-1 agreement.
const e = (hasAccount: boolean, paid: boolean, signed: boolean) => ({ hasAccount, paid, signed });

test("an account needs both the payment and the signature", () => {
  assert.equal(evidenceReady(e(false, true, true)), true);
  assert.equal(evidenceReady(e(false, true, false)), false, "paid but not signed");
  assert.equal(evidenceReady(e(false, false, true)), false, "signed but not paid");
  assert.equal(evidenceReady(e(false, false, false)), false, "neither");
});

test("a person who already has an account is only updated, so nothing is held back", () => {
  assert.equal(evidenceReady(e(true, false, false)), true);
  assert.deepEqual(missingPieces(e(true, false, false)), []);
});

test("it says exactly what is still missing", () => {
  assert.deepEqual(missingPieces(e(false, true, false)), ["the signed agreement"]);
  assert.deepEqual(missingPieces(e(false, false, true)), ["the payment"]);
  assert.equal(missingText(e(false, false, false)), "the payment and the signed agreement");
  assert.equal(missingText(e(false, true, true)), "");
});
