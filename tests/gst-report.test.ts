import { test } from "node:test";
import assert from "node:assert/strict";
import { gstReturn, periodOf } from "../src/lib/salesTax";
import { buildGstReport, buildProvSection, gstCsv, gstAlerts, lastEndedPeriod, parseProvTax, parseTax, pickPeriod, provAlerts, provRegistered, shiftPeriod, type GstRow } from "../src/lib/finance/gstReport";
import { isEmailWorthy } from "../src/lib/alerts";
import { cleanReceiptRead } from "../src/lib/finance/receipts";
import { gstNamedPeriod } from "../src/lib/ai/actions/finance";

// The GST/HST report (task 1520 follow-up): Eloise's Ontario coaching business, filing quarterly.

const rows: GstRow[] = [
  { id: "a", type: "income", amount: 1000, tax_amount: 130, currency: "cad", occurred_on: "2026-10-05", tax_province: "ON", vendor: "Eloise Client", category: "Coaching" },
  { id: "b", type: "income", amount: 500, tax_amount: 0, currency: "cad", occurred_on: "2026-10-09", category: "Course" },
  { id: "c", type: "income", amount: 300, tax_amount: 0, currency: "cad", occurred_on: "2026-10-10", tax_province: "OUTSIDE" },
  { id: "d", type: "income", amount: 400, tax_amount: 0, currency: "usd", occurred_on: "2026-10-11" },
  { id: "e", type: "expense", amount: 200, tax_amount: 26, currency: "cad", occurred_on: "2026-11-07", category: "Software", description: 'Zoom, "Pro"' },
  { id: "f", type: "expense", amount: 100, tax_amount: 13, currency: "cad", occurred_on: "2026-11-08", category: "Refunds", tax_province: "ON" },
  { id: "g", type: "expense", amount: 50, tax_amount: 0, currency: "cad", occurred_on: "2026-11-09", category: "Refunds" },
];

test("a refund with GST/HST lowers sales and tax collected, not tax paid", () => {
  const r = gstReturn(rows, "2026-10-01", "2026-12-31");
  assert.equal(r.line101, 1000 + 500 + 300 - 100);
  assert.equal(r.line103, 130 - 13);
  assert.equal(r.line106, 26, "the refund's tax is not an input tax credit; a refund with no tax stays an expense");
  assert.equal(r.line109, 117 - 26);
  assert.deepEqual(r.byProvince, { ON: 117 });
  assert.deepEqual(r.refunds, { sales: 100, tax: 13 });
  assert.deepEqual(r.usdLeftOut, { sales: 400, tax: 0, taxPaid: 0 });
  const usdRefund = gstReturn([{ type: "expense", amount: 80, tax_amount: 10, currency: "usd", occurred_on: "2026-10-01", category: "refunds" }], "2026-10-01", "2026-12-31");
  assert.deepEqual(usdRefund.usdLeftOut, { sales: -80, tax: -10, taxPaid: 0 });
  assert.equal(usdRefund.line103, 0);
});

test("the report lists CAD sales with no tax to check, but not ones marked outside Canada", () => {
  const p = periodOf("quarterly", "2026-10-28");
  const rep = buildGstReport(rows, p);
  assert.deepEqual(rep.check.map((c) => c.id), ["b"]);
  assert.deepEqual(rep.counts, { sales: 4, expenses: 2, refunds: 1 });
});

test("the CSV has every row in the period, before-tax amount and tax apart", () => {
  const csv = gstCsv(rows, periodOf("quarterly", "2026-10-28")).trim().split("\n");
  assert.equal(csv[0], "Date,Type,Description,Amount before tax,GST/HST,Province,Currency,Category");
  assert.equal(csv.length, 1 + rows.length);
  assert.equal(csv[1], "2026-10-05,Sale,Eloise Client · Coaching,1000.00,130.00,Ontario,CAD,Coaching");
  assert.ok(csv.some((l) => l.startsWith("2026-11-08,Refund,")));
  assert.ok(csv.some((l) => l.includes('"Software · Zoom, ""Pro"""')), "quotes and commas are escaped");
  assert.ok(csv.some((l) => l.includes(",Outside Canada,")));
});

test("periods move back and forward, and a named start is honoured", () => {
  const q4 = periodOf("quarterly", "2026-10-28");
  assert.equal(shiftPeriod("quarterly", q4, -1).start, "2026-07-01");
  assert.equal(shiftPeriod("quarterly", q4, 1).start, "2027-01-01");
  assert.equal(shiftPeriod("monthly", periodOf("monthly", "2026-01-15"), -1).start, "2025-12-01");
  assert.equal(pickPeriod("quarterly", "2026-10-28", "2026-04-01").label, "Q2 2026 (Apr to Jun)");
  assert.equal(pickPeriod("quarterly", "2026-10-28", "2026-04-02").start, "2026-10-01", "not a period start: today's period");
  assert.equal(lastEndedPeriod("annual", "2026-03-01").start, "2025-01-01");
});

test("the assistant understands the period the client names", () => {
  assert.equal(gstNamedPeriod("quarterly", "Q3 2026", "2026-10-28"), "2026-07-01");
  assert.equal(gstNamedPeriod("quarterly", "last quarter", "2026-10-28"), "2026-07-01");
  assert.equal(gstNamedPeriod("monthly", "September 2026", "2026-10-28"), "2026-09-01");
  assert.equal(gstNamedPeriod("quarterly", "2026-05-14", "2026-10-28"), "2026-04-01");
  assert.equal(gstNamedPeriod("annual", "2025", "2026-10-28"), "2025-01-01");
  assert.equal(gstNamedPeriod("quarterly", "current", "2026-10-28"), null);
});

test("entry APIs accept GST/HST as 0 or more and a real province", () => {
  assert.deepEqual(parseTax({}), { taxAmount: 0, taxProvince: null });
  assert.deepEqual(parseTax({ taxAmount: "13.456", taxProvince: "ON" }), { taxAmount: 13.46, taxProvince: "ON" });
  assert.deepEqual(parseTax({ taxAmount: 0, taxProvince: "OUTSIDE" }), { taxAmount: 0, taxProvince: "OUTSIDE" });
  assert.ok("error" in parseTax({ taxAmount: -1 }));
  assert.ok("error" in parseTax({ taxAmount: 5, taxProvince: "Ontario" }));
});

test("the receipt reader keeps the GST/HST apart only when it makes sense", () => {
  assert.equal(cleanReceiptRead({ amount: "113.00", tax: "13.00" }, "2026-10-28").tax, 13);
  assert.equal(cleanReceiptRead({ amount: "113.00", tax: "200" }, "2026-10-28").tax, undefined);
  assert.equal(cleanReceiptRead({ amount: "113.00" }, "2026-10-28").tax, undefined);
});

test("alerts: the return coming due, once per period", () => {
  const base = { registered: true, registeredFrom: null, frequency: "quarterly" as const, homeCurrency: "cad" };
  // Q3 2026 is paid by Oct 31: the alert shows from Oct 17 to Oct 31.
  assert.equal(gstAlerts({ ...base, today: "2026-10-16" }).length, 0);
  const a = gstAlerts({ ...base, today: "2026-10-28" });
  assert.equal(a.length, 1);
  assert.equal(a[0].nkey, "gst-due:2026-07-01");
  assert.match(a[0].title, /GST\/HST return due Oct\.? 31/);
  assert.equal(gstAlerts({ ...base, today: "2026-11-01" }).length, 0);
  assert.equal(gstAlerts({ ...base, today: "2026-10-28", registeredFrom: "2026-10-01" }).length, 0, "not registered yet in that period");
});

test("alerts: close to and past the $30,000 line, only for unregistered CAD accounts", () => {
  const base = { registered: false, registeredFrom: null, frequency: "quarterly" as const, homeCurrency: "cad", today: "2026-10-28" };
  assert.equal(gstAlerts({ ...base, fourQuarterSales: 23999 }).length, 0);
  assert.equal(gstAlerts({ ...base, fourQuarterSales: 24000 })[0].nkey, "gst-line:near:2026-Q4");
  const over = gstAlerts({ ...base, fourQuarterSales: 30000 });
  assert.equal(over.length, 1);
  assert.equal(over[0].nkey, "gst-line:over:2026-Q4");
  assert.equal(over[0].type, "warning");
  assert.equal(gstAlerts({ ...base, homeCurrency: "usd", fourQuarterSales: 50000 }).length, 0);
});

// ── Provincial sales tax (QST, PST, RST) ─────────────────────────────────────
// Eloise also sells from Montreal (QST, monthly) and ships digital products to BC (PST, quarterly).

const provRows: GstRow[] = [
  { id: "p1", type: "income", amount: 1000, tax_amount: 50, prov_tax_amount: 99.75, currency: "cad", occurred_on: "2026-10-03", tax_province: "QC", category: "Coaching" },
  { id: "p2", type: "income", amount: 200, tax_amount: 10, prov_tax_amount: 14, currency: "cad", occurred_on: "2026-10-04", tax_province: "BC", category: "Course" },
  { id: "p3", type: "expense", amount: 100, tax_amount: 5, prov_tax_amount: 9.98, currency: "cad", occurred_on: "2026-10-06", category: "Software" },
  { id: "p4", type: "expense", amount: 100, tax_amount: 5, prov_tax_amount: 9.98, currency: "cad", occurred_on: "2026-10-07", tax_province: "QC", category: "Refunds" },
  { id: "p5", type: "income", amount: 300, tax_amount: 0, prov_tax_amount: 29.93, currency: "usd", occurred_on: "2026-10-08", tax_province: "QC" },
  { id: "p6", type: "income", amount: 400, tax_amount: 20, prov_tax_amount: 0, currency: "cad", occurred_on: "2026-10-09", tax_province: "ON" },
];
const provRegs = { QC: { registered: true, number: "1234567890TQ0001", frequency: "monthly" as const }, BC: { registered: true, number: "PST-1234-5678", frequency: "quarterly" as const }, MB: { registered: false, number: "", frequency: "quarterly" as const } };

test("entry APIs accept the QST / PST as 0 or more", () => {
  assert.deepEqual(parseProvTax({}), { provTaxAmount: 0 });
  assert.deepEqual(parseProvTax({ provTaxAmount: "9.975" }), { provTaxAmount: 9.98 });
  assert.ok("error" in parseProvTax({ provTaxAmount: -2 }));
  assert.ok("error" in parseProvTax({ provTaxAmount: "lots" }));
});

test("only registered provinces get a section, in a fixed order", () => {
  assert.deepEqual(provRegistered(provRegs), ["QC", "BC"]);
  assert.deepEqual(provRegistered({}), []);
});

test("a QST section: its own (monthly) period, collected after refunds, QST paid claimed back, USD left out", () => {
  const q = buildProvSection(provRows, provRegs, "QC", "2026-10-28");
  assert.equal(q.period.start, "2026-10-01");
  assert.equal(q.period.end, "2026-10-31");
  assert.equal(q.prev.start, "2026-09-01");
  assert.equal(q.kind, "QST");
  assert.equal(q.claimable, true);
  assert.equal(q.ret.taxableSales, 900);
  assert.equal(q.ret.collected, 89.77);
  assert.equal(q.ret.refunded, 9.98);
  assert.equal(q.ret.claimable, 9.98);
  assert.equal(q.ret.net, 79.79);
  assert.equal(q.ret.usdLeftOut, 29.93);
  assert.equal(buildProvSection(provRows, provRegs, "QC", "2026-10-28", "2026-09-01").period.label.includes("Sep"), true, "a named period start is honoured");
});

test("a PST section: quarterly, nothing to claim back", () => {
  const b = buildProvSection(provRows, provRegs, "BC", "2026-10-28");
  assert.equal(b.period.start, "2026-10-01");
  assert.equal(b.period.end, "2026-12-31");
  assert.equal(b.kind, "PST");
  assert.equal(b.claimable, false);
  assert.deepEqual([b.ret.taxableSales, b.ret.collected, b.ret.claimable, b.ret.net], [200, 14, 0, 14]);
});

test("the CSV gets a provincial column, and a provincial download keeps only rows with that tax", () => {
  const p = periodOf("quarterly", "2026-10-28");
  const all = gstCsv(provRows, p, { prov: "QST / PST" }).trim().split("\n");
  assert.equal(all[0], "Date,Type,Description,Amount before tax,GST/HST,QST / PST,Province,Currency,Category");
  assert.equal(all[1], "2026-10-03,Sale,Coaching,1000.00,50.00,99.75,Quebec,CAD,Coaching");
  const only = gstCsv(provRows, p, { prov: "QST", only: "prov" }).trim().split("\n");
  assert.equal(only.length, 1 + 5, "the Ontario sale with no provincial tax is left out");
  assert.ok(only.some((l) => l.startsWith("2026-10-07,Refund,")));
  assert.equal(gstCsv(rows, p).split("\n")[0], "Date,Type,Description,Amount before tax,GST/HST,Province,Currency,Category", "no provincial column unless asked");
});

test("alerts: each provincial return coming due, once per registration and period", () => {
  // QST monthly: September is paid by Oct 31. BC PST quarterly: Q3 is paid by Oct 31.
  const a = provAlerts({ today: "2026-10-28", provincial: provRegs });
  assert.deepEqual(a.map((x) => x.nkey), ["pst-due:QC:2026-09-01", "pst-due:BC:2026-07-01"]);
  assert.match(a[0].title, /^QST return \(Quebec\) due Oct\.? 31/);
  assert.match(a[0].body, /Revenu Québec/);
  assert.equal(a[0].href, "/finance/gst-hst?qc=2026-09-01#qc");
  assert.equal(provAlerts({ today: "2026-10-16", provincial: provRegs }).length, 0);
  assert.equal(provAlerts({ today: "2026-10-28", provincial: {} }).length, 0);
  assert.ok(isEmailWorthy(a[0].nkey));
});

test("the receipt reader keeps the QST apart only when it makes sense", () => {
  const r = cleanReceiptRead({ amount: "114.98", tax: "5.00", provTax: "9.98" }, "2026-10-28");
  assert.equal(r.provTax, 9.98);
  assert.equal(cleanReceiptRead({ amount: "10", tax: "5", provTax: "6" }, "2026-10-28").provTax, undefined, "both taxes can't be more than the total");
  assert.equal(cleanReceiptRead({ amount: "10" }, "2026-10-28").provTax, undefined);
});
