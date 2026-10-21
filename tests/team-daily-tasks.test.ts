import { test } from "node:test";
import assert from "node:assert/strict";
import { countsLine, isWeekday, mountainParts, tallyDms } from "../src/lib/teamDailyTasks";

test("Mountain time parts follow daylight saving", () => {
  // 13:00 UTC on Oct 21, 2026 is 7:00 AM MDT; 14:00 UTC on Nov 2, 2026 is 7:00 AM MST.
  assert.deepEqual(mountainParts(new Date("2026-10-21T13:00:00Z")), { day: "2026-10-21", weekday: 3, hour: 7 });
  assert.deepEqual(mountainParts(new Date("2026-11-02T14:00:00Z")), { day: "2026-11-02", weekday: 1, hour: 7 });
  // 00:00 UTC Thursday is 6:00 PM MDT Wednesday; 01:00 UTC is 6:00 PM MST.
  assert.deepEqual(mountainParts(new Date("2026-10-22T00:00:00Z")), { day: "2026-10-21", weekday: 3, hour: 18 });
  assert.deepEqual(mountainParts(new Date("2026-11-03T01:00:00Z")), { day: "2026-11-02", weekday: 1, hour: 18 });
});

test("only Monday to Friday count", () => {
  assert.equal(isWeekday(0), false);
  assert.equal(isWeekday(6), false);
  for (const d of [1, 2, 3, 4, 5]) assert.equal(isWeekday(d), true);
});

test("DM counts split new from follow-up per platform, and always show LinkedIn and Facebook", () => {
  const t = tallyDms([
    { platform: "LI", kind: "new" },
    { platform: "LI", kind: "new" },
    { platform: "LI", kind: "follow_up" },
    { platform: "FB", kind: "follow_up" },
  ]);
  assert.deepEqual(t, { LI: { newDms: 2, followUps: 1 }, FB: { newDms: 0, followUps: 1 } });
  assert.equal(countsLine(t), "LinkedIn 2 new, 1 follow-up. Facebook 0 new, 1 follow-up.");
  assert.equal(countsLine({}), "LinkedIn 0 new, 0 follow-up. Facebook 0 new, 0 follow-up.");
});

import { groupDigest } from "../src/lib/teamDailyTasks";

test("the 8 AM list sorts a member's tasks into overdue, today and soon", () => {
  const t = (id: number, day: string | null, today = false) => ({ id, title: `t${id}`, day, time: null, today });
  const g = groupDigest([t(1, "2026-10-20"), t(2, "2026-10-21"), t(3, null, true), t(4, "2026-10-23"), t(5, "2026-10-30"), t(6, null)], "2026-10-21");
  assert.deepEqual(g.overdue.map((x) => x.id), [1]);
  assert.deepEqual(g.dueToday.map((x) => x.id).sort(), [2, 3]);
  assert.deepEqual(g.soon.map((x) => x.id), [4], "a task five days out and one with no date are left out");
});
