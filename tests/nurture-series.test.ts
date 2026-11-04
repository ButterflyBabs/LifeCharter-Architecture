import test from "node:test";
import assert from "node:assert/strict";

import { NURTURE_GAP_DAYS, NURTURE_TOTAL, nurtureStepOf } from "../src/lib/dmPipeline";

test("nurture step is read from the script title", () => {
  assert.equal(nurtureStepOf("DRAFT · MasterClass DM · LinkedIn Nurture 3 · Day 20, a soft invite"), 3);
  assert.equal(nurtureStepOf("MasterClass DM · LinkedIn 8 · Gentle follow-up, no reply"), null);
  assert.equal(nurtureStepOf(null), null);
});

test("five messages land on days 0, 7, 14, 21 and 30, then nothing more", () => {
  assert.equal(NURTURE_TOTAL, 5);
  let day = 0;
  const days = [0];
  for (let step = 1; step < NURTURE_TOTAL; step++) {
    day += NURTURE_GAP_DAYS[step] as number;
    days.push(day);
  }
  assert.deepEqual(days, [0, 7, 14, 21, 30]);
  assert.equal(NURTURE_GAP_DAYS[5], null);
});
