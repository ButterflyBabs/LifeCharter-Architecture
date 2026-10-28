import { test } from "node:test";
import assert from "node:assert/strict";
import { taxFor, taxCents, placeFromAddress, periodsFor, periodOf, gstReturn, fourQuarterSales } from "../src/lib/salesTax";

// GST/HST (task 1520 follow-up, for Franc Godri): rates by the customer's province, kept apart from income.

test("the rate follows the customer's province", () => {
  assert.equal(taxFor("ON").rate, 13);
  assert.equal(taxFor("ON").kind, "HST");
  assert.equal(taxFor("NS").rate, 14, "Nova Scotia fell to 14% on April 1, 2025");
  assert.equal(taxFor("NB").rate, 15);
  assert.equal(taxFor("AB").rate, 5);
  assert.equal(taxFor("QC").kind, "GST", "QST is not handled; only the 5% GST");
  assert.equal(taxFor("OUTSIDE").rate, 0);
  assert.equal(taxCents(150000, 13), 19500);
  assert.equal(taxCents(3333, 13), 433);
});

test("a contact's address gives their province, or null when it can't tell", () => {
  assert.equal(placeFromAddress("ON", "Canada"), "ON");
  assert.equal(placeFromAddress("Ontario", ""), "ON");
  assert.equal(placeFromAddress("P.E.I.", "CA"), "PE");
  assert.equal(placeFromAddress("Colorado", "United States"), "OUTSIDE");
  assert.equal(placeFromAddress("", "Canada"), null);
  assert.equal(placeFromAddress(null, null), null);
});

test("filing periods and due dates", () => {
  const q = periodsFor("quarterly", 2026);
  assert.equal(q.length, 4);
  assert.equal(q[0].end, "2026-03-31");
  assert.equal(q[0].fileBy, "2026-04-30");
  assert.equal(q[3].fileBy, "2027-01-31");
  assert.equal(periodsFor("monthly", 2026)[1].end, "2026-02-28");
  const a = periodsFor("annual", 2026)[0];
  assert.deepEqual([a.payBy, a.fileBy], ["2027-04-30", "2027-06-15"]);
  assert.equal(periodOf("quarterly", "2026-10-28").label, "Q4 2026 (Oct to Dec)");
});

test("the return totals CAD sales, tax collected and tax paid, and leaves USD out", () => {
  const rows = [
    { type: "income", amount: 1000, tax_amount: 130, currency: "cad", occurred_on: "2026-10-05", tax_province: "ON" },
    { type: "income", amount: 500, tax_amount: 25, currency: "cad", occurred_on: "2026-11-05", tax_province: "AB" },
    { type: "income", amount: 400, tax_amount: 0, currency: "usd", occurred_on: "2026-11-06" },
    { type: "expense", amount: 200, tax_amount: 26, currency: "cad", occurred_on: "2026-11-07" },
    { type: "expense", amount: 100, tax_amount: 0, currency: "cad", occurred_on: "2026-11-08" },
    { type: "income", amount: 999, tax_amount: 99, currency: "cad", occurred_on: "2026-09-30" },
  ];
  const r = gstReturn(rows, "2026-10-01", "2026-12-31");
  assert.equal(r.line101, 1500);
  assert.equal(r.line103, 155);
  assert.equal(r.line106, 26);
  assert.equal(r.line109, 129);
  assert.deepEqual(r.byProvince, { ON: 130, AB: 25 });
  assert.deepEqual(r.usdLeftOut, { sales: 400, tax: 0, taxPaid: 0 });
});

test("the $30,000 line counts the last four quarters of CAD sales", () => {
  const rows = [
    { type: "income", amount: 20000, currency: "cad", occurred_on: "2026-01-15" },
    { type: "income", amount: 9000, currency: "cad", occurred_on: "2025-12-31" },
    { type: "income", amount: 5000, currency: "usd", occurred_on: "2026-05-01" },
  ];
  assert.equal(fourQuarterSales(rows, "2026-10-28"), 20000);
});

// Quebec QST and provincial sales tax (BC, SK, MB): only where registered, QST follows GST, PST only on ticked items.
import { provincialFor, provincialReturn, cleanProvRegs } from "../src/lib/salesTax";

test("QST follows GST for Quebec customers; PST needs the item's tick; nothing where not registered", () => {
  const regs = cleanProvRegs({ QC: { registered: true, number: "1234567890 tq0001", frequency: "quarterly" }, BC: { registered: true }, SK: { registered: false } });
  assert.equal(regs.QC?.number, "1234567890 TQ0001");
  assert.deepEqual(provincialFor("QC", regs, false), { place: "QC", kind: "QST", rate: 9.975, label: "QST 9.975% (Quebec)" });
  assert.equal(provincialFor("BC", regs, false), null, "coaching: PST not ticked");
  assert.equal(provincialFor("BC", regs, true)?.rate, 7);
  assert.equal(provincialFor("SK", regs, true), null, "not registered in Saskatchewan");
  assert.equal(provincialFor("MB", regs, true), null);
  assert.equal(provincialFor("ON", regs, true), null, "Ontario has HST only");
  assert.equal(provincialFor("OUTSIDE", regs, true), null);
  assert.equal(taxCents(100000, 9.975), 9975);
});

test("a province's return: collected, refunds given back, QST claimed back, USD left out", () => {
  const rows = [
    { type: "income", amount: 1000, prov_tax_amount: 99.75, currency: "cad", occurred_on: "2026-10-05", tax_province: "QC" },
    { type: "income", amount: 500, prov_tax_amount: 35, currency: "cad", occurred_on: "2026-10-06", tax_province: "BC" },
    { type: "expense", category: "Refunds", amount: 200, prov_tax_amount: 19.95, currency: "cad", occurred_on: "2026-11-01", tax_province: "QC" },
    { type: "expense", category: "Software", amount: 100, prov_tax_amount: 9.98, currency: "cad", occurred_on: "2026-11-02" },
    { type: "income", amount: 300, prov_tax_amount: 29.93, currency: "usd", occurred_on: "2026-11-03", tax_province: "QC" },
  ];
  const qc = provincialReturn(rows, "QC", "2026-10-01", "2026-12-31");
  assert.deepEqual([qc.taxableSales, qc.collected, qc.refunded, qc.claimable, qc.net, qc.usdLeftOut], [800, 79.8, 19.95, 9.98, 69.82, 29.93]);
  const bc = provincialReturn(rows, "BC", "2026-10-01", "2026-12-31");
  assert.deepEqual([bc.collected, bc.claimable, bc.net], [35, 0, 35], "PST paid on expenses is not claimed back");
});
