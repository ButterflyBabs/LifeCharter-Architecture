import { test } from "node:test";
import assert from "node:assert/strict";
import { boundary, buildCycles, buildMonths, currentIndex, type CycleSetup } from "../src/lib/metaAdsCycles";
import { EMPTY_GOALS, buildReport, guidance, type AdRow, type Goals } from "../src/lib/metaAdsReport";

const setup: CycleSetup = { anchor: "2026-10-22", days: 14, hour: 19, goal: 30 };
// The 11 Meta sign-ups so far (Oct 10 to Oct 20, Mountain time shown in UTC).
const signups = ["2026-10-10T17:33:00Z", "2026-10-11T19:54:00Z", "2026-10-11T20:21:00Z", "2026-10-12T04:58:00Z", "2026-10-14T17:58:00Z", "2026-10-15T00:37:00Z", "2026-10-15T10:44:00Z", "2026-10-16T06:23:00Z", "2026-10-16T13:50:00Z", "2026-10-18T11:30:00Z", "2026-10-21T01:08:00Z"].map((s) => new Date(s));
const spend = [{ periodStart: "2026-10-10", periodEnd: "2026-10-21", spend: 112.76 }];

test("the count closes at 7 PM Mountain on event day, in daylight and standard time", () => {
  assert.equal(boundary(setup, 0).toISOString(), "2026-10-23T01:00:00.000Z"); // 7 PM MDT
  assert.equal(boundary(setup, 1).toISOString(), "2026-11-06T02:00:00.000Z"); // 7 PM MST, Nov 5
});

test("before 7 PM on Oct 22 the open count is the Oct 22 event, after 7 PM it is the Nov 5 event at zero", () => {
  const before = new Date("2026-10-22T23:00:00Z"); // 5 PM MDT
  const after = new Date("2026-10-23T01:30:00Z"); // 7:30 PM MDT
  assert.equal(currentIndex(setup, before), 0);
  assert.equal(currentIndex(setup, after), 1);
  const a = buildCycles(setup, signups, spend, before);
  assert.equal(a[0].eventDate, "2026-10-22");
  assert.equal(a[0].signups, 11);
  assert.equal(a[0].current, true);
  const b = buildCycles(setup, signups, spend, after);
  assert.equal(b[0].eventDate, "2026-11-05");
  assert.equal(b[0].signups, 0);
  assert.equal(b[1].eventDate, "2026-10-22");
  assert.equal(b[1].signups, 11);
  assert.equal(b[1].current, false);
});

test("a sign-up a minute after 7 PM counts for the next event", () => {
  const late = [new Date("2026-10-23T00:59:00Z"), new Date("2026-10-23T01:01:00Z")];
  const c = buildCycles(setup, late, [], new Date("2026-10-23T02:00:00Z"));
  assert.equal(c[0].signups, 1); // Nov 5 event
  assert.equal(c[1].signups, 1); // Oct 22 event
});

test("spend and cost per sign-up follow the event the days belong to", () => {
  const c = buildCycles(setup, signups, spend, new Date("2026-10-22T23:00:00Z"));
  assert.equal(c[0].spend, 112.76);
  assert.equal(c[0].costPer, 10.25);
  const d = buildCycles(setup, signups, spend, new Date("2026-10-23T02:00:00Z"));
  assert.equal(d[0].spend, 0);
  assert.equal(d[0].costPer, null);
});

test("months add up their own sign-ups, spend, events and goal", () => {
  const m = buildMonths(setup, signups, spend, new Date("2026-10-22T23:00:00Z"));
  const oct = m.find((x) => x.month === "2026-10")!;
  assert.equal(oct.signups, 11);
  assert.equal(oct.spend, 112.76);
  assert.deepEqual(oct.events, ["2026-10-22"]); // the Oct 8 event came before the ads began
  assert.equal(oct.goal, 30);
  assert.equal(oct.current, true);
  const nov = buildMonths(setup, signups, spend, new Date("2026-11-10T18:00:00Z")).find((x) => x.month === "2026-11")!;
  assert.deepEqual(nov.events, ["2026-11-05", "2026-11-19"]);
  assert.equal(nov.goal, 60);
});

test("the report says 0 of 30 for the Nov 5 event after the Oct 22 count closes, and 11 of 30 before", () => {
  const rows: AdRow[] = [{ adName: "Ad 2", periodStart: "2026-10-10", periodEnd: "2026-10-21", spend: 112.76, impressions: 1600, reach: 1000, linkClicks: 39, leads: 11, frequency: 1.5 }];
  const goals: Goals = { ...EMPTY_GOALS, goalLeads: 30, eventAnchor: "2026-10-22", cycleDays: 14, cycleHour: 19, dailyBudget: 16 };
  const before = buildReport({ rows, goals, signups, now: new Date("2026-10-22T23:00:00Z") })!;
  assert.equal(before.cycles[0].signups, 11);
  assert.match(guidance(goals, before).find((g) => g.title.startsWith("Your goal for the"))!.text, /^11 of 30 sign-ups so far/);
  const after = buildReport({ rows, goals, signups, now: new Date("2026-10-23T02:00:00Z") })!;
  assert.equal(after.cycles[0].signups, 0);
  assert.equal(after.cycles[0].eventDate, "2026-11-05");
  const g = guidance(goals, after).find((x) => x.title.startsWith("Your goal for the"))!;
  assert.match(g.title, /November 5/);
  assert.match(g.text, /^0 of 30 sign-ups so far/);
});

test("events that closed before any ads or sign-ups are left out of the list", () => {
  const c = buildCycles(setup, signups, spend, new Date("2026-10-22T23:00:00Z"));
  assert.deepEqual(c.map((x) => x.eventDate), ["2026-10-22"]);
  const d = buildCycles(setup, signups, spend, new Date("2026-11-20T18:00:00Z"));
  assert.deepEqual(d.map((x) => x.eventDate), ["2026-11-19", "2026-11-05", "2026-10-22"]);
});
