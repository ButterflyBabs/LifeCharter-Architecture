import test from "node:test";
import assert from "node:assert/strict";

import { cardFields, closeTag, consultantKey, discoveryTag, followupTag, leadTag, shapeCard } from "../src/lib/c2c";

test("tags follow the consultant's name", () => {
  const key = consultantKey("Call to Close: Mide");
  assert.equal(key, "mide");
  assert.equal(leadTag(key, "America/Denver", new Date("2026-10-27T18:00:00Z")), "c2c-mide-oct-2026");
  assert.equal(leadTag(key, "America/Denver", new Date("2026-12-01T03:00:00Z")), "c2c-mide-nov-2026"); // still Nov 30 in Denver
  assert.equal(discoveryTag(key), "c2c-mide-discovery");
  assert.equal(followupTag(key), "c2c-mide-followup");
  assert.equal(closeTag(key, "vip", "2026-11-03"), "c2c-mide-vip-2026-11-03");
});

test("a card keeps only the fields a consultant may edit, cleaned", () => {
  const { patch, error } = cardFields({ name: "  Dana Lee ", businessName: "Lee Coaching", email: "DANA@Example.com", phone: "303-555-0100", linkedin: "in/dana", stageId: "x", contact_id: "y", notes: "warm" });
  assert.equal(error, undefined);
  assert.deepEqual(patch, { name: "Dana Lee", business_name: "Lee Coaching", email: "dana@example.com", phone: "303-555-0100", linkedin: "in/dana", notes: "warm" });
  assert.equal(cardFields({ email: "nope" }).error, "That email address doesn't look right.");
  assert.equal(cardFields({ name: " " }).error, "A card needs a name.");
  assert.equal(cardFields({ followupAt: "soon" }).error, "Enter a valid follow-up date and time.");
  assert.equal(cardFields({ followupAt: null }).patch.followup_at, null);
});

test("a card is only in the CRM once it has a contact", () => {
  const base = { id: "c", stage_id: "s", name: "Dana", card_tags: ["c2c-mide-oct-2026"], discovery_outcome: "attended" };
  assert.equal(shapeCard({ ...base, contact_id: null }).inCrm, false);
  assert.equal(shapeCard({ ...base, contact_id: "abc" }).inCrm, true);
  assert.equal(shapeCard({ ...base, contact_id: null, discovery_outcome: "weird" }).outcome, null);
  assert.deepEqual(shapeCard({ ...base, contact_id: null }).tags, ["c2c-mide-oct-2026"]);
});

import { readLeadsCsv } from "../src/lib/c2cLeads";
import { CONSULTANT_APIS, CONSULTANT_PAGES, memberApiAccess, memberPageRedirect } from "../src/lib/teamRoles";

test("a lead list is read however the headers are worded", () => {
  const { rows, unreadable } = readLeadsCsv("First Name,Last Name,Company,E-mail,Mobile,LinkedIn URL,IG,Comments\nDana,Lee,Lee Coaching,dana@example.com,303-555-0100,linkedin.com/in/dana,@dana,met at summit\n,,,,,,,\n");
  assert.equal(unreadable, false);
  assert.deepEqual(rows, [{ name: "Dana Lee", businessName: "Lee Coaching", email: "dana@example.com", phone: "303-555-0100", linkedin: "linkedin.com/in/dana", facebook: "", instagram: "@dana", notes: "met at summit" }]);
  assert.equal(readLeadsCsv("foo,bar\n1,2").unreadable, true);
});

test("a Call to Close consultant reaches one page and a few APIs, nothing else", () => {
  assert.equal(memberPageRedirect("consultant", "/call-to-close"), null);
  for (const p of ["/", "/contacts", "/sales", "/dm-pipeline", "/settings", "/sales-reference", "/tasks", "/finance"]) assert.equal(memberPageRedirect("consultant", p), "/call-to-close", p);
  for (const a of CONSULTANT_APIS) assert.equal(memberApiAccess("consultant", a, "POST").allow, true, a);
  for (const a of ["/api/crm/contacts", "/api/dm-pipeline", "/api/sales/contacts", "/api/sales/search-contacts", "/api/sales/lookup-contact", "/api/pipeline", "/api/tasks", "/api/calendars", "/api/billing", "/api/workspaces"]) assert.equal(memberApiAccess("consultant", a, "GET").allow, false, a);
  assert.deepEqual(CONSULTANT_PAGES, ["/call-to-close"]);
});
