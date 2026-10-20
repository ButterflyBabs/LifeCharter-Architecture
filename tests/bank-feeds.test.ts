import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanVendor, dayOf, findDuplicate, findOwnTransfers, looksLikeProcessorPayout, looksLikeTransfer, pickCategory, suggest, typeOf, type BankLine, type LedgerLine } from "../src/lib/bankFeedsLogic";

test("money out is an expense, money in is income", () => {
  assert.equal(typeOf(-1000), "expense");
  assert.equal(typeOf(2500), "income");
});

test("vendor names lose card noise, codes and dates", () => {
  assert.equal(cleanVendor("AMZN Mktp US*2K4TY8 Amzn.com/bill WA"), "Amazon");
  assert.ok(!/\d{3,}/.test(cleanVendor("CHECKCARD 0412 STARBUCKS #12345 DENVER CO")));
  assert.ok(cleanVendor("CHECKCARD 0412 STARBUCKS #12345 DENVER CO").toLowerCase().includes("starbucks"));
  assert.equal(cleanVendor(""), "");
});

test("transfers and processor payouts are recognized", () => {
  assert.equal(looksLikeTransfer("Online Transfer to Savings"), true);
  assert.equal(looksLikeTransfer("STRIPE TRANSFER ST-ABC123XYZ"), true);
  assert.equal(looksLikeProcessorPayout("STRIPE TRANSFER ST-ABC123XYZ"), true);
  assert.equal(looksLikeTransfer("Starbucks #1234"), false);
});

test("suggestions use the client's own spelling and past choices first", () => {
  const hist = new Map<string, string>([["canva", "Design tools"]]);
  const s1 = suggest({ amountCents: -1299, description: "CANVA* 12345" }, hist, [], ["Software"]);
  assert.equal(s1.type, "expense");
  assert.equal(s1.category, "Design tools");
  const s2 = suggest({ amountCents: -5000, description: "ZOOM.US 888" }, new Map(), [], ["software & tools"]);
  assert.equal(s2.category, "software & tools");
  const s3 = suggest({ amountCents: 15000, description: "ACH deposit invoice 442" }, new Map(), ["Client payments"], []);
  assert.equal(s3.type, "income");
  assert.equal(s3.category, "Client payments");
  const s4 = suggest({ amountCents: -800, description: "MYSTERY VENDOR" }, new Map(), [], []);
  assert.equal(s4.category, "Uncategorized");
  assert.equal(pickCategory("Meals", ["Meals & entertainment"]), "Meals & entertainment");
});

test("the same amount out of one account and into another is a transfer", () => {
  const lines: BankLine[] = [
    { id: "a", connectionId: "c1", amountCents: -50000, description: "Transfer to card", day: "2026-10-10" },
    { id: "b", connectionId: "c2", amountCents: 50000, description: "Payment thank you", day: "2026-10-11" },
    { id: "c", connectionId: "c1", amountCents: -50000, description: "Rent", day: "2026-10-10" },
  ];
  const t = findOwnTransfers(lines);
  assert.deepEqual(Array.from(t).sort(), ["a", "b"]);
});

test("an existing ledger line with the same amount near the same day is a duplicate", () => {
  const ledger: LedgerLine[] = [
    { id: "e1", type: "expense", amount: 49.99, occurred_on: "2026-10-09", source: "manual" },
    { id: "e2", type: "income", amount: 49.99, occurred_on: "2026-10-09", source: "manual" },
  ];
  const m = findDuplicate({ amountCents: -4999, day: "2026-10-11" }, ledger, new Set());
  assert.equal(m?.id, "e1");
  assert.equal(findDuplicate({ amountCents: -4999, day: "2026-10-20" }, ledger, new Set()), null);
  assert.equal(findDuplicate({ amountCents: -4999, day: "2026-10-11" }, ledger, new Set(["e1"])), null);
});

test("Stripe timestamps land on the Mountain-time day", () => {
  // 2026-10-19 02:00 UTC is still October 18 in Denver.
  assert.equal(dayOf(Date.UTC(2026, 9, 19, 2, 0, 0) / 1000), "2026-10-18");
});

test("Facebook card lines, tools and moves between a client's own accounts are recognized", () => {
  assert.equal(suggest({ amountCents: -1500, description: "FACEBK *AEAWXDX WILMINGTON DE" }, new Map(), [], ["Ads", "Software"]).category, "Ads");
  assert.equal(suggest({ amountCents: -3000, description: "BOLDSIGN, MORRISVILLE, NC" }, new Map(), [], ["Software"]).category, "Software");
  assert.equal(looksLikeTransfer("TAXES TO PRIMARY"), true);
  assert.equal(looksLikeTransfer("SPARROW CRD PMT"), true);
  assert.equal(pickCategory("Advertising", ["Marketing"]), "Marketing");
});

test("vendor names read the way people write them", () => {
  assert.equal(cleanVendor("FACEBK *TPBXXB2AX4    , 6505434800   , CA , USA"), "Facebook");
  assert.equal(cleanVendor("SUPABASE, SINGAPORE,    , SGP"), "Supabase");
  assert.equal(cleanVendor("XOOM.COM              , 8778151531   , CA , USA"), "Xoom");
  assert.equal(cleanVendor("Joe's Coffee Shop DENVER CO"), "Joe's Coffee Shop");
});
