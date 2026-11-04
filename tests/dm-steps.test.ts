import test from "node:test";
import assert from "node:assert/strict";
import { dmLabel, scriptPlatform, stepOrder, suggestedStep, NURTURE_TOTAL } from "../src/lib/dmSteps";

test("scripts sort in pipeline order: steps 1 to 8, then Nurture 1 to 5, then everything else", () => {
  const titles = [
    "Command Seat DM · LinkedIn Nurture 2 · Day 7, my story",
    "Command Seat DM · LinkedIn 8 · After, they missed it",
    "Command Seat DM · LinkedIn 2 · Invite",
    "Command Seat DM · Voice note talking points",
    "Command Seat DM · LinkedIn 1 · New connection opener",
    "Command Seat DM · LinkedIn Nurture 1 · Day 0, a useful idea (no ask)",
  ];
  const sorted = [...titles].sort((a, b) => stepOrder(a) - stepOrder(b));
  assert.deepEqual(sorted.map((t) => stepOrder(t)), [1, 2, 8, 101, 102, 500]);
});

test("the prefix is dropped for every event and the platform stays", () => {
  assert.equal(dmLabel("Command Seat DM · Facebook 2 · Invite"), "Facebook 2 · Invite");
  assert.equal(dmLabel("MasterClass DM · LinkedIn 3 · Welcome"), "LinkedIn 3 · Welcome");
  assert.equal(dmLabel("Incubator DM · Instagram 1 · Opener"), "Instagram 1 · Opener");
});

test("a script belongs to one platform, or to all of them", () => {
  assert.equal(scriptPlatform(["LI", "DM"]), "LI");
  assert.equal(scriptPlatform(["WA", "DM"]), "WA");
  assert.equal(scriptPlatform(["IG", "FB", "LI", "DM"]), null);
  assert.equal(scriptPlatform([]), null);
});

test("each stage suggests the step it usually sends next", () => {
  assert.equal(suggestedStep("to_reach"), 1);
  assert.equal(suggestedStep("connected"), 2);
  assert.equal(suggestedStep("sent"), 2);
  assert.equal(suggestedStep("invited"), 3);
  assert.equal(suggestedStep("registered"), 4);
  assert.equal(suggestedStep("attended"), 7);
  assert.equal(suggestedStep("no_show"), 8);
  assert.equal(suggestedStep("nurture"), null);
  assert.equal(suggestedStep("connect_sent"), null, "waiting for a LinkedIn accept: nothing to send yet");
  assert.equal(NURTURE_TOTAL, 5);
});
