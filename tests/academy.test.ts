import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ACADEMY_LESSONS as L } from "../src/content/academy";
import { NOT_YET_IN_A_LESSON } from "../src/content/academy/coverage";
import { GUIDE_ENTRIES } from "../src/lib/userGuide/entries";
import { forLearner, gradeQuiz, lessonStates, levelViews, pathFor, reviewState, lessonHash, trackFor } from "../src/lib/academy/rules";
import { staleLessons, uncoveredEntries, type Stamps } from "../src/lib/academy/freshness";
import { academyOpenFor } from "../src/lib/academy/flag";
import { extrasApiAccess, memberApiAccess, memberPageRedirect, restrictedPageRedirect } from "../src/lib/teamRoles";

const stamps = JSON.parse(fs.readFileSync("src/content/academy/stamps.json", "utf8")) as Stamps;

// The standing rule: an app change reaches the Academy. See "Update et al" in CLAUDE.md.
test("every Academy lesson matches the app it was written from", () => {
  const stale = staleLessons(L, GUIDE_ENTRIES, stamps, process.cwd()).map((l) => `${l.id} (${l.title})`);
  assert.deepEqual(stale, [], `Update these lessons, then run: npm run academy:stamp -- <lesson ids>`);
});
test("every User Guide entry is in a lesson or listed for a later level", () => {
  assert.deepEqual(uncoveredEntries(L, GUIDE_ENTRIES, NOT_YET_IN_A_LESSON), [], "Add it to a lesson, or to src/content/academy/coverage.ts");
  const taught = new Set(L.flatMap((l) => l.sources));
  assert.deepEqual(NOT_YET_IN_A_LESSON.filter((id) => taught.has(id)), [], "Take these off coverage.ts: a lesson teaches them now");
});
test("lessons are well formed and cite real User Guide entries", () => {
  const ids = L.flatMap((l) => l.questions.map((q) => q.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(L.map((l) => l.id)).size, L.length);
  for (const l of L) {
    assert.ok(l.questions.length >= 3, l.id);
    for (const s of l.sources) assert.ok(GUIDE_ENTRIES.some((e) => e.id === s), `${l.id} cites ${s}`);
    for (const q of l.questions) {
      assert.equal(new Set([q.right, ...q.wrong]).size, 4, q.id);
      if (l.kind === "lesson") assert.ok(q.why, q.id);
    }
  }
});

const path = pathFor("client", L);
const lesson = path[0];
const answersFor = (l: typeof lesson, right: number) =>
  Object.fromEntries(l.questions.map((q, i) => [q.id, forLearner(q).options.find((o) => (o.text === q.right) === (i < right))!.id]));

test("the page never receives an answer", () => {
  const shown = JSON.stringify(forLearner(lesson.questions[0]));
  assert.ok(!shown.includes('"right"') && !shown.includes('"why"'));
});
test("80% passes and a lesson quiz explains each miss, an exam does not", () => {
  const n = lesson.questions.length;
  assert.equal(gradeQuiz(lesson, answersFor(lesson, n)).score, 100);
  const low = gradeQuiz(lesson, answersFor(lesson, n - 2));
  assert.equal(low.passed, false);
  assert.ok(low.results.find((r) => !r.correct)?.why);
  const exam = L.find((l) => l.kind === "exam")!;
  const miss = gradeQuiz(exam, answersFor(exam, 8));
  assert.equal(miss.passed, true);
  assert.equal(miss.results.find((r) => !r.correct)?.why, null);
});
test("a lesson opens only after the one before it, and the level certificate needs every lesson", () => {
  const states = lessonStates(path, [{ lesson_id: path[0].id, best_score: 100, attempts: 1, passed_at: "2026-11-02" }]);
  assert.deepEqual([states.get(path[0].id), states.get(path[1].id), states.get(path[2].id)], ["passed", "open", "locked"]);
  assert.equal(levelViews(path, []).find((v) => v.key === "foundations")?.certificate, false);
  const all = path.map((p) => ({ lesson_id: p.id, best_score: 90, attempts: 1, passed_at: "2026-11-02" }));
  assert.equal(levelViews(path, all).find((v) => v.key === "foundations")?.certificate, true);
});
test("each person gets the right path, ending in the exam", () => {
  assert.equal(trackFor({ houseMember: false, role: "editor", salesReference: false }), "client");
  assert.equal(trackFor({ houseMember: true, role: "editor", salesReference: false }), "team-ops");
  assert.equal(trackFor({ houseMember: true, role: "editor", salesReference: true }), "team-sales");
  assert.equal(trackFor({ houseMember: true, role: "sales", salesReference: false }), "team-sales");
  assert.equal(trackFor({ houseMember: true, role: "consultant", salesReference: false }), "team-sales");
  for (const t of ["client", "team-ops", "team-sales"] as const) {
    const p = pathFor(t, L);
    assert.equal(p[p.length - 1].kind, "exam");
    assert.ok(p.every((l) => l.track === "core" || l.track === t));
  }
});
test("an approval goes out of date when the lesson changes", () => {
  const row = { status: "approved", note: null, content_hash: lessonHash(lesson) };
  assert.equal(reviewState(lesson, row).status, "approved");
  assert.equal(reviewState(lesson, { ...row, content_hash: "old" }).status, "edited");
  assert.equal(reviewState(lesson, undefined).status, "draft");
});
test("release stages open the Academy in order", () => {
  assert.equal(academyOpenFor("x@y.z", false, true, "review"), false);
  assert.equal(academyOpenFor("x@y.z", true, false, "review"), true);
  assert.equal(academyOpenFor("x@y.z", false, true, "team"), true);
  assert.equal(academyOpenFor("x@y.z", false, false, "team"), false);
  assert.equal(academyOpenFor("x@y.z", false, false, "all"), true);
});
test("every team role can open the Academy and save answers", () => {
  for (const role of ["sales", "consultant", "viewer", "editor"]) {
    assert.equal(memberPageRedirect(role, "/academy/f-tasks"), null, role);
    assert.deepEqual(memberApiAccess(role, "/api/academy", "POST"), { allow: true }, role);
  }
  const restricted = { restrict: true };
  assert.equal(restrictedPageRedirect({}, restricted, "/academy"), null);
  assert.deepEqual(extrasApiAccess(restricted, "/api/academy", "POST"), { allow: true });
});
