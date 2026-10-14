import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTasks, guessMapping, parseDays, readProjectTable, tableFromTrello } from "../src/lib/projectImport";

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

// A Trello board as founders really keep it: list and card order from pos, Mountain-time due days, a person's
// name used as a label, and a "Done" list that means done.
test("Trello: board order, Mountain due day, person labels and the Done list", () => {
  const board = {
    name: "Strategic Days",
    lists: [
      { id: "l-done", name: "Done", pos: 3 },
      { id: "l-focus", name: "Focus Day", pos: 2 },
      { id: "l-week", name: "This Week", pos: 1 },
    ],
    members: [{ id: "m1", fullName: "Margie Lee", username: "margie" }],
    cards: [
      { id: "c3", name: "Order headset", idList: "l-done", pos: 1 },
      { id: "c2", name: "Write the keynote", idList: "l-focus", pos: 2, due: "2026-10-21T02:00:00.000Z", labels: [{ name: "Margie" }] },
      { id: "c1", name: "Book travel", idList: "l-week", pos: 1 },
      { id: "c0", name: "Old idea", idList: "l-week", pos: 2, closed: true },
    ],
  };
  const t = tableFromTrello(board);
  assert.ok(t);
  assert.deepEqual(t.rows.map((r) => r[0]), ["Book travel", "Write the keynote", "Order headset"]);
  const keynote = t.rows[1];
  assert.equal(keynote[4], "2026-10-20"); // 8 pm Mountain on Oct 20, not Oct 21 in UTC
  assert.equal(keynote[6], "Margie Lee"); // the "Margie" label
  assert.equal(t.rows[2][7], "yes"); // in the Done list
  assert.equal(t.rows[0][7], "");
});
