import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LEVELS, PARTNER_SHEET_HEADERS, PARTNER_TEMPLATE_CSV, audiencePrompt, shapeIcp } from "../src/lib/qualifier";

const row = (purpose: string) => ({ id: "1", name: "Coaching Partner", purpose, who_serve: "Established coaches", levels: DEFAULT_LEVELS });

test("a profile is a client profile unless it is marked partner", () => {
  assert.equal(shapeIcp(row("partner")).purpose, "partner");
  assert.equal(shapeIcp(row("client")).purpose, "client");
  assert.equal(shapeIcp({ id: "1", name: "x", who_serve: "y" }).purpose, "client");
  assert.equal(shapeIcp(row("anything else")).purpose, "client");
});

test("the partner first pass scores active clients, the hard no list and asks for a check", () => {
  const p = audiencePrompt(shapeIcp(row("partner")));
  assert.match(p, /COACHING PARTNERS/);
  assert.match(p, /ACTIVE clients/);
  assert.match(p, /HARD NO/);
  assert.match(p, /not in the list/);
  assert.match(p, /ask on the call/);
  assert.match(p, /"check"/);
  assert.match(p, /never a passive link/);
});

test("the client first pass is unchanged", () => {
  const p = audiencePrompt(shapeIcp(row("client")));
  assert.doesNotMatch(p, /COACHING PARTNERS/);
  assert.doesNotMatch(p, /"check"/);
  assert.match(p, /FIRST PASS over a list of prospects/);
});

test("the partner sheet asks for what a person can see", () => {
  assert.ok(PARTNER_SHEET_HEADERS.includes("Active clients seen"));
  assert.ok(PARTNER_SHEET_HEADERS.includes("Audience size"));
  assert.ok(!PARTNER_SHEET_HEADERS.includes("Group"), "the Group column is skipped by the list reader, so it is called Found in");
  assert.ok(PARTNER_TEMPLATE_CSV.startsWith("Name,Profile link,Headline,Found in,"));
});
