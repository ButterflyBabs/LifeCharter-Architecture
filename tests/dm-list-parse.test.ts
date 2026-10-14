import { test } from "node:test";
import assert from "node:assert/strict";
import { parseList } from "../src/lib/dmListParse";

test("names, links and a line about them are read from mixed lines", () => {
  const { rows } = parseList([
    "Name\tProfile link\tHeadline\tGroup",
    "Jane Doe",
    "Sam Lee https://www.facebook.com/sam.lee",
    "Ana Cruz, https://www.facebook.com/ana, Founder at Cruz Studio",
    "Priya N\thttps://www.facebook.com/priya\tCoach, 10 years\tCollective group",
    "Tom Hall | Consultant | Denver",
  ].join("\n"));
  assert.deepEqual(rows.map((r) => r.name), ["Jane Doe", "Sam Lee", "Ana Cruz", "Priya N", "Tom Hall"]);
  assert.equal(rows[1].profileUrl, "https://www.facebook.com/sam.lee");
  assert.equal(rows[2].notes, "Founder at Cruz Studio");
  assert.equal(rows[3].notes, "Coach, 10 years · Collective group");
  assert.equal(rows[4].notes, "Consultant · Denver");
});

test("blank and unreadable lines are skipped; the paste is capped", () => {
  const { rows, skipped } = parseList("\n\nhttps://facebook.com/x\nA\nJane Doe\n", 5);
  assert.deepEqual(rows.map((r) => r.name), ["Jane Doe"]);
  assert.equal(skipped.length, 2);
  const many = Array.from({ length: 12 }, (_, i) => `Person Number${i}`).join("\n");
  assert.equal(parseList(many, 10).rows.length, 10);
});
