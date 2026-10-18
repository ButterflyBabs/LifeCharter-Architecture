import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { allSigned, currentRound, fillPlaceholders, hashCode, newCode, newToken, hashToken, pdfSafe, placeholders, validDrawnSignature, validTypedSignature } from "../src/lib/esign";
import { sealPdf } from "../src/lib/esignPdf";

test("blanks are found and filled", () => {
  const b = "Hi {{Client name}}, starting {{ Start date }}. {{Client name}} again. {{Unknown}}";
  assert.deepEqual(placeholders(b), ["Client name", "Start date", "Unknown"]);
  assert.equal(fillPlaceholders(b, { "client name": "Ann", "Start date": "Nov 1" }), "Hi Ann, starting Nov 1. Ann again. {{Unknown}}");
});

test("links and codes are private and tied to the signer", () => {
  const { token, hash } = newToken();
  assert.ok(token.length >= 30);
  assert.equal(hashToken(token), hash);
  const { code, hash: ch } = newCode("signer-a");
  assert.match(code, /^\d{6}$/);
  assert.equal(hashCode("signer-a", code), ch);
  assert.notEqual(hashCode("signer-b", code), ch);
});

test("signers go in order; same number signs together", () => {
  const s = [{ order_no: 1, status: "signed" }, { order_no: 2, status: "sent" }, { order_no: 2, status: "waiting" }, { order_no: 3, status: "waiting" }];
  assert.deepEqual(currentRound(s).map((x) => x.order_no), [2, 2]);
  assert.equal(allSigned(s), false);
  assert.equal(allSigned(s.map((x) => ({ ...x, status: "signed" }))), true);
});

test("signatures are checked", () => {
  assert.equal(validTypedSignature("Ann Lee"), true);
  assert.equal(validTypedSignature("1"), false);
  assert.equal(validDrawnSignature("data:image/png;base64," + "A".repeat(300)), true);
  assert.equal(validDrawnSignature("javascript:alert(1)"), false);
  assert.equal(pdfSafe("“Hi” — it’s 🦋"), '"Hi" - it\'s ?');
});

test("a sealed PDF has the document, a signature page and a certificate", async () => {
  const bytes = await sealPdf({
    id: "doc-1",
    title: "Coaching Agreement",
    business: "Bright Path",
    body: "## Coaching Agreement\n\nThis agreement is between Bright Path and Ann.\n\n" + "A long paragraph. ".repeat(400),
    original: null,
    originalHash: "abc123",
    signers: [{ name: "Ann Lee", email: "ann@example.com", signedAt: "2026-10-18T20:00:00Z", ip: "1.2.3.4", type: "typed", text: "Ann Lee", image: null }],
    events: [{ at: "2026-10-18T19:59:00Z", event: "Code emailed", who: "Ann Lee <ann@example.com>", ip: "1.2.3.4" }],
    completedAt: "2026-10-18T20:00:01Z",
    consentText: "I agree to use electronic records.",
  });
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() >= 4, `pages: ${pdf.getPageCount()}`);
  assert.equal(pdf.getTitle(), "Coaching Agreement");
});

test("an uploaded PDF keeps its pages and gets signature and certificate pages", async () => {
  const src = await PDFDocument.create();
  src.addPage();
  src.addPage();
  const bytes = await sealPdf({ id: "d2", title: "Uploaded", business: "B", body: null, original: await src.save(), originalHash: "h", signers: [{ name: "Bo", email: "bo@x.co", signedAt: "2026-10-18T20:00:00Z", ip: null, type: "typed", text: "Bo", image: null }], events: [], completedAt: "2026-10-18T20:00:00Z", consentText: "c" });
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 4);
});
