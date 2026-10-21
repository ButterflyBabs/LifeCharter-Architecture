import { test } from "node:test";
import assert from "node:assert/strict";
import { columnOf, mapPeople, parseCsv, summarize } from "../src/lib/dmEmailList";

test("a CSV with quotes, commas and a header is read into people", () => {
  const csv = 'First name,Last name,Email,Company,Title,Location\r\nJane,Doe,Jane@Example.com,"Doe, Inc.",Founder,Denver\r\nSam,Lee,not-an-email,Lee Co,CEO,Austin\r\n,,solo@example.com,Solo,Coach,Reno\r\nJane,Doe,jane@example.com,Dup,Founder,Denver\r\n';
  const { rows, invalid } = mapPeople(parseCsv(csv));
  assert.equal(rows.length, 2);
  assert.equal(rows[0].email, "jane@example.com");
  assert.equal(rows[0].name, "Jane Doe");
  assert.match(rows[0].notes ?? "", /Doe, Inc\./);
  assert.equal(rows[1].name, "solo");
  assert.equal(invalid.length, 1);
  assert.match(invalid[0], /not a valid email/);
});

test("the Prospect Bank headers work as they are", () => {
  const csv = "group,firstName,lastName,position_title,company_name,location,url,enriched_email,segment\nx,Isabele,M.,CEO,Valkyries,California,https://www.linkedin.com/in/abc,isa@valkyries.com,coach\n";
  const { rows } = mapPeople(parseCsv(csv));
  assert.equal(rows[0].name, "Isabele M.");
  assert.equal(rows[0].email, "isa@valkyries.com");
  assert.equal(rows[0].profileUrl, "https://www.linkedin.com/in/abc");
});

test("a list with no header is read by the shape of each cell, and a row needs an email or a link", () => {
  const { rows, invalid } = mapPeople(parseCsv("Ana Cruz,ana@cruz.co\nBob Roe\n"));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, "ana@cruz.co");
  assert.equal(invalid.length, 1);
});

test("semicolon and tab files are read", () => {
  assert.equal(mapPeople(parseCsv("Name;Email\nA Person;a@person.org\n")).rows.length, 1);
  assert.equal(mapPeople(parseCsv("Name\tEmail\nA Person\ta@person.org\n")).rows.length, 1);
});

test("every pipeline's stage keys fall into the same columns", () => {
  assert.equal(columnOf("to_reach", "open"), "added");
  assert.equal(columnOf("connect_sent", "open"), "contacted");
  assert.equal(columnOf("lci_attended", "open"), "came");
  assert.equal(columnOf("my_custom_stage", "booked"), "booked");
  assert.equal(columnOf("my_custom_stage", "closed"), "stopped");
  assert.equal(columnOf("my_custom_stage", "open"), "contacted");
});

test("the summary adds up across pipelines and channels", () => {
  const stages = [
    { id: "s1", key: "to_reach", kind: "open" },
    { id: "s2", key: "sent", kind: "open" },
    { id: "s3", key: "registered", kind: "open" },
    { id: "s4", key: "not_now", kind: "closed" },
  ];
  const cards = [
    { board_id: "b1", stage_id: "s1", platform: "LI" },
    { board_id: "b1", stage_id: "s2", platform: "LI" },
    { board_id: "b2", stage_id: "s3", platform: "Email" },
    { board_id: "b2", stage_id: "s4", platform: "Email" },
    { board_id: "b2", stage_id: "s2", platform: null },
  ];
  const out = summarize(cards, stages, [{ id: "b1", name: "MasterClass" }, { id: "b2", name: "Cold email" }], (p) => (p === "LI" ? "LinkedIn" : p === "Email" ? "Email" : ""));
  assert.equal(out.total.added, 5);
  assert.equal(out.total.contacted, 2);
  assert.equal(out.total.registered, 1);
  assert.equal(out.total.stopped, 1);
  assert.equal(out.channels.find((c) => c.channel === "Email")?.added, 2);
  assert.equal(out.channels.find((c) => c.channel === "No channel set")?.contacted, 1);
  assert.equal(out.boards.find((b) => b.name === "Cold email")?.added, 3);
});
