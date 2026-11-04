import test from "node:test";
import assert from "node:assert/strict";
import { canCallNoShows, matchAttendance, mergeParticipants, sessionOver } from "../src/lib/eventAttendanceLogic";

const regs = [
  { id: "r1", email: "ana@x.com", firstName: "Ana", lastName: "Lopez" },
  { id: "r2", email: "ben@x.com", firstName: "Ben", lastName: "Ray" },
  { id: "r3", email: "cy@x.com", firstName: "Cy", lastName: null },
  { id: "r4", email: "dee1@x.com", firstName: "Dee", lastName: "Fox" },
  { id: "r5", email: "dee2@x.com", firstName: "Dee", lastName: "Fox" },
];

test("one row per person: joins by email and by name are summed, and short visits are dropped later", () => {
  const rows = [
    { email: "Ana@x.com", name: "Ana", durationSeconds: 120 },
    { email: "ana@x.com", name: "Ana L", durationSeconds: 240 },
    { email: "", name: "Ben Ray", durationSeconds: 600 },
    { email: "", name: "", durationSeconds: 900 },
  ];
  const m = mergeParticipants(rows);
  assert.equal(m.length, 2);
  assert.equal(m.find((p) => p.email === "ana@x.com")?.minutes, 6);
});

test("attended means five minutes or more, matched by email first, then by a full name that belongs to one registrant", () => {
  const m = matchAttendance(regs, [
    { email: "ana@x.com", name: "Ana", minutes: 90 },
    { email: "", name: "Ben Ray", minutes: 60 },
    { email: "cy@x.com", name: "Cy", minutes: 3 },
    { email: "", name: "Dee Fox", minutes: 60 },
    { email: "", name: "Cy", minutes: 60 },
  ]);
  assert.deepEqual(m.attended.sort(), ["r1", "r2"]);
  assert.equal(m.byName, 1);
  const names = m.unmatched.map((p) => p.name).sort();
  assert.deepEqual(names, ["Cy", "Dee Fox"], "a first name alone and a name shared by two people are never guessed");
});

test("no-shows are only called when Zoom showed emails for most of the room", () => {
  const good = matchAttendance(regs, [
    { email: "ana@x.com", name: "Ana", minutes: 90 },
    { email: "ben@x.com", name: "Ben", minutes: 90 },
  ]);
  assert.equal(canCallNoShows(good), true);
  const blind = matchAttendance(regs, [
    { email: "", name: "Guest 1", minutes: 90 },
    { email: "", name: "Guest 2", minutes: 90 },
    { email: "", name: "Guest 3", minutes: 90 },
    { email: "ana@x.com", name: "Ana", minutes: 90 },
  ]);
  assert.equal(canCallNoShows(blind), false);
});

test("a session is judged only after it has been over for ten minutes", () => {
  const start = "2026-11-16T22:00:00Z";
  assert.equal(sessionOver(start, 120, Date.parse("2026-11-17T00:05:00Z")), false);
  assert.equal(sessionOver(start, 120, Date.parse("2026-11-17T00:11:00Z")), true);
});
