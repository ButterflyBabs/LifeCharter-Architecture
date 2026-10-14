import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTasks, guessMapping, parseDays, readProjectTable } from "../src/lib/projectImport";

// Real-export shapes that once landed wrong: Jira's 15/Sep/26 dates and Todoist's section rows.
test("Jira day/Mon/yy dates are read", () => {
  assert.equal(parseDays("15/Sep/26").due, "2026-09-15");
  assert.equal(parseDays("01-Oct-2026").due, "2026-10-01");
  assert.equal(parseDays("3 Nov 26").due, "2026-11-03");
});

test("Todoist section and note rows are not tasks; the section carries to the tasks under it", () => {
  const csv = `TYPE,CONTENT,DESCRIPTION,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE,DATE_LANG,TIMEZONE
section,Before launch,,,,,,,,
task,Call the printer,Ask about rush,1,1,Babs (1),,"Oct 20 2026",en,America/Denver
note,Remember the deadline,,,,,,,,
task,Buy ribbon,,3,1,Babs (1),,,en,
section,After launch,,,,,,,,
task,Send thank-yous,,4,1,Babs (1),,,en,`;
  const t = readProjectTable(csv, "todoist.csv");
  assert.ok(t);
  assert.equal(t.source, "todoist");
  assert.equal(t.rows.length, 3);
  const b = buildTasks(t, guessMapping(t.headers, t.source), { source: t.source, order: "mdy", sectionUse: "notes", statusMap: {}, year: 2026 });
  assert.deepEqual(b.tasks.map((x) => x.title), ["Call the printer", "Buy ribbon", "Send thank-yous"]);
  assert.deepEqual(b.sections.sort(), ["After launch", "Before launch"]);
});
