// The User Guide search. Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";

import { GUIDE_ENTRIES } from "../src/lib/userGuide/entries";
import { GUIDE_RECENT_MAX, cleanGuideRecent, guideHomeList, searchGuide, slips } from "../src/lib/userGuide/search";

const top = (q: string) => searchGuide(q, GUIDE_ENTRIES)[0];

test("an exact name comes first", () => {
  assert.equal(top("Glossary")?.entry.id, "glossary");
});

test("suggestions start from the first letters", () => {
  assert.equal(top("gloss")?.entry.id, "glossary");
});

test("small typos are forgiven", () => {
  assert.equal(top("glosary")?.entry.id, "glossary");
  assert.equal(top("contcats")?.entry.id, "contacts");
  assert.equal(top("pasword")?.entry.id, "logins-passwords");
});

test("the small words in a question are ignored", () => {
  assert.equal(top("how do I reset my password")?.entry.id, "signing-in-and-resetting-your-password");
  assert.equal(top("where do I save a password in my vault")?.entry.id, "logins-passwords");
});

test("a search finds the words people use, not only the page name", () => {
  assert.equal(top("crm")?.entry.id, "contacts");
});

test("a search for a named part lands on that part", () => {
  const hit = top("check back");
  assert.equal(hit?.entry.id, "tasks");
  assert.equal(hit?.section?.id, "waiting");
});

test("a word that is nowhere returns nothing", () => {
  assert.deepEqual(searchGuide("zzzzqqq", GUIDE_ENTRIES), []);
});

test("short words need to be exact, so a slip does not make another word", () => {
  assert.equal(slips("tax", "tag", 0), 1);
});

test("two swapped letters count as one slip", () => {
  assert.equal(slips("form", "from", 1), 1);
});

test("every related link points at a real entry", () => {
  const ids = new Set(GUIDE_ENTRIES.map((e) => e.id));
  for (const e of GUIDE_ENTRIES) for (const r of e.related) assert.ok(ids.has(r), `${e.id} -> ${r}`);
});

test("recent searches drop repeats, blanks and anything past the limit", () => {
  assert.deepEqual(cleanGuideRecent([" tasks ", "TASKS", "", 4, "contacts"]), ["tasks", "contacts"]);
  assert.equal(cleanGuideRecent(Array.from({ length: 20 }, (_, i) => `s${i}`)).length, GUIDE_RECENT_MAX);
  assert.deepEqual(cleanGuideRecent("tasks"), []);
});

test("Frequently used stays on the starter list until enough opens are in", () => {
  const starters = GUIDE_ENTRIES.filter((e) => e.starter);
  const few = guideHomeList(GUIDE_ENTRIES, [{ entry_id: "glossary", opens: 5 }]);
  assert.equal(few.title, "Good places to start");
  assert.deepEqual(few.list.map((e) => e.id), starters.map((e) => e.id));
});

test("Frequently used shows the most opened entries, and skips any that no longer exist", () => {
  const home = guideHomeList(GUIDE_ENTRIES, [
    { entry_id: "gone", opens: 90 },
    { entry_id: "glossary", opens: 40 },
    { entry_id: "tasks", opens: 30 },
    { entry_id: "contacts", opens: 20 },
    { entry_id: "reminders", opens: 10 },
    { entry_id: "time", opens: 5 },
  ]);
  assert.equal(home.title, "Frequently used");
  assert.deepEqual(home.list.map((e) => e.id), ["glossary", "tasks", "contacts", "reminders"]);
});
