import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { ALL_QUESTIONS, PHASES, QUICK_QUESTIONS, DEEP_QUESTIONS, NOT_SURE, NOT_APPLICABLE, bandFor, cleanAnswers, computeResult, isComplete, type Answers } from "../src/lib/miniAudit";
import { miniAuditEmail } from "../src/lib/miniAuditEmail";

// The audit's 48 questions are canonical: the wording must never change silently (migration notes in the question bank).
test("the 48 canonical question strings are unchanged", () => {
  assert.equal(ALL_QUESTIONS.length, 48);
  const sum = createHash("sha256").update(ALL_QUESTIONS.map((q) => q.text).join("\n")).digest("hex");
  assert.equal(sum, "6f4ac751540e60f012833011a8c5425175918c7a770f044e9403af8ac1a9effb");
});

test("12 phases of 4; the quick set is one Build and one Health question per phase", () => {
  assert.equal(PHASES.length, 12);
  assert.equal(QUICK_QUESTIONS.length, 24);
  assert.equal(DEEP_QUESTIONS.length, 24);
  for (const p of PHASES) {
    assert.equal(p.questions.length, 4);
    const quick = p.questions.filter((q) => q.quick);
    assert.deepEqual(quick.map((q) => q.measure).sort(), ["Build Completion", "Operating Health"]);
    const deep = p.questions.filter((q) => !q.quick);
    assert.deepEqual(deep.map((q) => q.measure).sort(), ["Build Completion", "Operating Health"]);
  }
});

const all = (n: number | string): Answers => Object.fromEntries(ALL_QUESTIONS.map((q) => [q.key, n as never]));

test("Build Completion is the Build average over 4 x 100, Operating Health is the Health average with the file's bands", () => {
  const a: Answers = { ...all(2) };
  const p1 = PHASES[0].questions;
  a[p1[0].key] = 4; // build 4 (quick)
  a[p1[2].key] = 1; // health 1 (quick)
  const r = computeResult(a, "quick");
  assert.equal(r.phases[0].build, 100);
  assert.equal(r.phases[0].health, 1);
  assert.equal(r.phases[0].band, "At Risk");
  assert.equal(r.phases[1].build, 50);
  assert.equal(r.phases[1].band, "Needs Attention");
  const full = computeResult({ ...a, [p1[1].key]: 2, [p1[3].key]: 3 }, "full");
  assert.equal(full.phases[0].build, 75); // (4 + 2) / 2 / 4
  assert.equal(full.phases[0].health, 2); // (1 + 3) / 2
});

test("the bands follow the file", () => {
  assert.equal(bandFor(0), "At Risk");
  assert.equal(bandFor(1.49), "At Risk");
  assert.equal(bandFor(1.5), "Needs Attention");
  assert.equal(bandFor(2.5), "Stable");
  assert.equal(bandFor(3.5), "Strong");
  assert.equal(bandFor(4), "Strong");
  assert.equal(bandFor(null), null);
});

test("Not Sure and Not Applicable are left out of the scores, and a phase with nothing scored is not assessed", () => {
  const a: Answers = { ...all(4) };
  for (const q of PHASES[2].questions) a[q.key] = NOT_SURE;
  a[PHASES[3].questions[0].key] = NOT_APPLICABLE; // its Build question
  const r = computeResult(a, "quick");
  assert.equal(r.phases[2].overall, null);
  assert.equal(r.phases[2].build, null);
  assert.equal(r.phases[2].band, null);
  assert.equal(r.phases[3].build, null); // its only quick Build answer was skipped
  assert.equal(r.phases[3].health, 4);
  assert.equal(r.unsure, 2);
  assert.equal(r.skipped, 1);
  assert.ok(!r.start.some((p) => p.key === PHASES[2].key));
});

test("the two lowest phases are the place to start, lowest first", () => {
  const a: Answers = { ...all(3) };
  for (const q of PHASES[5].questions) a[q.key] = 0;
  for (const q of PHASES[8].questions) a[q.key] = 1;
  for (const q of PHASES[0].questions) a[q.key] = 4;
  const r = computeResult(a, "full");
  assert.deepEqual(r.start.map((p) => p.key), [PHASES[5].key, PHASES[8].key]);
  assert.equal(r.strong[0].key, PHASES[0].key);
});

test("a risk-eligible question answered 0 or 1 flags the phase", () => {
  const a: Answers = { ...all(3) };
  const risky = PHASES[9].questions.find((q) => q.risk && q.quick)!; // Finance, Legal and Risk, question 3
  a[risky.key] = 1;
  assert.equal(computeResult(a, "quick").phases[9].risk, true);
  assert.equal(computeResult({ ...a, [risky.key]: 2 }, "quick").phases[9].risk, false);
});

test("answers are cleaned: only real questions, whole numbers 0 to 4, or the two unscored choices", () => {
  const c = cleanAnswers({ [ALL_QUESTIONS[0].key]: 3, [ALL_QUESTIONS[1].key]: 9, [ALL_QUESTIONS[2].key]: 1.5, [ALL_QUESTIONS[3].key]: NOT_SURE, nope: 2, [ALL_QUESTIONS[4].key]: "4" });
  assert.deepEqual(c, { [ALL_QUESTIONS[0].key]: 3, [ALL_QUESTIONS[3].key]: NOT_SURE });
  assert.deepEqual(cleanAnswers({ [DEEP_QUESTIONS[0].key]: 2 }, QUICK_QUESTIONS), {});
  assert.equal(isComplete(all(2), "quick"), true);
  assert.equal(isComplete({}, "quick"), false);
});

test("the results email links to the saved results, names the two places to start and shows no prices", () => {
  const a: Answers = { ...all(3) };
  for (const q of PHASES[5].questions) a[q.key] = 0;
  for (const q of PHASES[8].questions) a[q.key] = 1;
  const m = miniAuditEmail({ name: "Eloise Carter", origin: "https://lccommandsuite.com", token: "abc123", result: computeResult(a, "quick") });
  assert.match(m.html, /https:\/\/lccommandsuite\.com\/mini-command-audit\/results\/abc123/);
  assert.match(m.text, /Sales and Revenue and Marketing and Audience Growth/);
  assert.match(m.text, /Head up - Wings out/);
  assert.ok(!/\$\d/.test(m.html + m.text));
});
