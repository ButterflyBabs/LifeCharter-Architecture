import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, QUESTIONS, QUESTION_COUNT, cleanAnswers, computeResult, gradeFor, insightsFor } from "../src/lib/healthCheck";
import { healthCheckEmail } from "../src/lib/healthCheckEmail";

const all = (n: number) => new Array(QUESTION_COUNT).fill(n) as number[];

test("25 questions in the six categories (5, 5, 5, 4, 3, 3), four answers each", () => {
  assert.equal(QUESTIONS.length, 25);
  assert.deepEqual(CATEGORIES.map((c) => QUESTIONS.filter((q) => q.cat === c.key).length), [5, 5, 5, 4, 3, 3]);
  for (const q of QUESTIONS) assert.equal(q.options.length, 4);
});

test("cleanAnswers accepts 25 whole numbers 0 to 3 and nothing else", () => {
  assert.deepEqual(cleanAnswers(all(2)), all(2));
  assert.equal(cleanAnswers(all(2).slice(1)), null);
  assert.equal(cleanAnswers([...all(2).slice(1), 4]), null);
  assert.equal(cleanAnswers([...all(2).slice(1), 1.5]), null);
  assert.equal(cleanAnswers([...all(2).slice(1), "2"]), null);
  assert.equal(cleanAnswers(null), null);
});

test("all-top answers score 100 / A, all-bottom score 0 / F, with every category at its extreme", () => {
  const top = computeResult(all(3));
  assert.equal(top.overall, 100);
  assert.equal(top.grade.grade, "A");
  assert.ok(top.categories.every((c) => c.pct === 100 && c.tier.label === "Strong"));
  const bottom = computeResult(all(0));
  assert.equal(bottom.overall, 0);
  assert.equal(bottom.grade.grade, "F");
  assert.ok(bottom.categories.every((c) => c.pct === 0 && c.tier.label === "Gap"));
});

test("grade bands", () => {
  assert.equal(gradeFor(85).grade, "A");
  assert.equal(gradeFor(84).grade, "B");
  assert.equal(gradeFor(70).grade, "B");
  assert.equal(gradeFor(55).grade, "C");
  assert.equal(gradeFor(40).grade, "D");
  assert.equal(gradeFor(39).grade, "F");
});

test("the two lowest categories and the strongest are found, ties going to the earlier category", () => {
  const a = all(3);
  QUESTIONS.forEach((q, i) => {
    if (q.cat === "team") a[i] = 0;
    if (q.cat === "clients") a[i] = 1;
  });
  const r = computeResult(a);
  assert.deepEqual(r.gaps.map((g) => g.key), ["team", "clients"]);
  assert.equal(r.strongest.key, "revenue");
});

test("the action plan has up to 5 items, no repeats, high impact first, and adds answer-specific quick wins", () => {
  const r = computeResult(all(0));
  assert.equal(r.priorities.length, 5);
  assert.equal(new Set(r.priorities.map((p) => p.title)).size, 5);
  const order = { high: 0, quick: 1, medium: 2 };
  for (let i = 1; i < r.priorities.length; i++) assert.ok(order[r.priorities[i - 1].tag] <= order[r.priorities[i].tag]);
  assert.ok(r.priorities.some((p) => /reply/i.test(p.title)));
  assert.equal(insightsFor(all(0)).length, 3);
  assert.equal(insightsFor(all(3)).length, 0);
  assert.equal(computeResult(all(3)).priorities.length, 5);
});

test("the email carries the scores, links the consultation and the retake, signs as Babs, and has no pricing or markup from the name", () => {
  const mail = healthCheckEmail({ name: 'Jo<script>"', origin: "https://lccommandsuite.com", result: computeResult(all(2)) });
  assert.ok(mail.html.includes("Hi Joscript") && !mail.html.includes("<script>"));
  assert.ok(mail.html.includes("/schedule/masterclass") && mail.html.includes("/business-health-check"));
  assert.ok(mail.text.includes("Head up - Wings out\nBabs"));
  for (const c of CATEGORIES) assert.ok(mail.text.includes(c.name));
  assert.ok(!/\$\d/.test(mail.text + mail.html));
});
