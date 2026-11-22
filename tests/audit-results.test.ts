import test from "node:test";
import assert from "node:assert/strict";
import { healthRow, miniRow, sortRows, toCsv } from "../src/lib/auditResults";
import { computeResult } from "../src/lib/healthCheck";

const health = (over: Record<string, unknown> = {}) => ({
  id: "h1", first_name: "Eloise", email: "eloise@example.com", phone: "303-555-0100", business_name: "Willow Co",
  result: JSON.parse(JSON.stringify(computeResult(new Array(25).fill(2)))), attribution: { utm_source: "facebook", utm_campaign: "bhc" },
  email_status: "sent", contact_id: "c1", created_at: "2026-11-22T10:00:00Z", ...over,
});
const mini = (over: Record<string, unknown> = {}) => ({
  id: "m1", first_name: "Jo", email: "jo@example.com", profile: { stage: "Growing (1 to 3 years)", revenue: "Under $50,000", team: "Just me" },
  result: { depth: "quick", start: [{ name: "Offers and Pricing" }, { name: "Team and Capacity" }], phases: [{ name: "Offers and Pricing", build: 25, health: 1, band: "At Risk" }] },
  attribution: {}, email_status: "sent", contact_id: "c2", created_at: "2026-11-22T11:00:00Z", ...over,
});

test("a Health Check row carries the name, email, phone, business, score and all six categories", () => {
  const r = healthRow(health() as never);
  assert.equal(r.kind, "health");
  assert.deepEqual([r.name, r.email, r.phone, r.business], ["Eloise", "eloise@example.com", "303-555-0100", "Willow Co"]);
  assert.match(r.headline, /67% · Grade C/);
  assert.equal(r.details.length, 6);
  assert.equal(r.source, "facebook / bhc");
  assert.equal(r.lowest.length, 2);
});

test("a Mini Command Audit row takes phone and business from the contact, and says where to start", () => {
  const r = miniRow(mini() as never, { phone: "720-555-0111", company: "Jo's Studio" });
  assert.equal(r.phone, "720-555-0111");
  assert.equal(r.business, "Jo's Studio");
  assert.equal(r.headline, "Start with Offers and Pricing and Team and Capacity");
  assert.equal(r.details[3].value, "The first 24");
  const bare = miniRow(mini() as never, null);
  assert.equal(bare.phone, "");
});

test("rows sort newest first", () => {
  const rows = sortRows([healthRow(health() as never), miniRow(mini() as never)]);
  assert.deepEqual(rows.map((r) => r.kind), ["mini", "health"]);
});

test("the spreadsheet has a header, one line per person, quoted cells, and neutralizes formulas", () => {
  const csv = toCsv(sortRows([healthRow(health({ first_name: '=HYPERLINK("http://x")', business_name: 'A "B" Co' }) as never), miniRow(mini() as never)]));
  const lines = csv.split("\r\n");
  assert.equal(lines.length, 3);
  assert.ok(lines[0].startsWith('"Date","Audit","Name","Email","Phone","Business"'));
  assert.ok(csv.includes(`"'=HYPERLINK(""http://x"")"`));
  assert.ok(csv.includes('"A ""B"" Co"'));
});

import { execRow, KIND_LABEL } from "../src/lib/auditResults";

test("an Executive Business Assessment row is built from the timeline event: score, next step, gaps and every dimension", () => {
  const ev = { id: "e1", contact_id: "c1", created_at: "2026-11-22T12:00:00Z", detail: { data: { overall: "62", top_gaps: "Finance, Systems, Legal & Admin", recommendation: "masterclass", Marketing: "4", Finance: "2" } } };
  const r = execRow(ev, { name: "Jo Rivers", email: "jo@example.com", phone: "303-555-0100", company: "Rivers Co" });
  assert.equal(r.kind, "exec");
  assert.equal(KIND_LABEL.exec, "Executive Business Assessment");
  assert.equal(r.headline, "62% · Sent toward the MasterClass");
  assert.deepEqual(r.lowest, ["Finance", "Systems", "Legal & Admin"]);
  assert.deepEqual(r.details, [{ label: "Recommended next step", value: "MasterClass" }, { label: "Marketing", value: "4 of 5" }, { label: "Finance", value: "2 of 5" }]);
  assert.equal(r.business, "Rivers Co");
});

test("an Executive Business Assessment event with no saved detail still makes a row", () => {
  const r = execRow({ id: "e2", contact_id: null, created_at: "2026-11-22T12:00:00Z", detail: null }, { name: "x", email: "x@example.com", phone: null, company: null });
  assert.equal(r.headline, "?%");
  assert.deepEqual(r.lowest, []);
});
