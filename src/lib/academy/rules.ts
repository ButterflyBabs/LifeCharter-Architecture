// LCCS Academy rules, the pure parts: which lessons a person takes, what is unlocked, grading, and turning a lesson
// into what the page may see (never the answers). Server only: the lessons import from here carry the answers.
import crypto from "node:crypto";
import { DIMENSION_LABEL, type DimensionKey } from "../scoring/dimensionModel";
import { LEVELS, PASS_MARK, WINGS, type Lesson, type LearnerTrack, type LevelKey, type LevelView, type LessonState, type Question, type QuestionForLearner, type QuizResult, type ReviewState } from "./types";

export interface ProgressRow {
  lesson_id: string;
  best_score: number;
  attempts: number;
  passed_at: string | null;
}

/** The team path comes from what the person does; everyone who is not on Babs's team takes the client path. */
export function trackFor(p: { houseMember: boolean; role: string | null; salesReference: boolean }): LearnerTrack {
  if (!p.houseMember) return "client";
  return p.role === "sales" || p.role === "consultant" || p.salesReference ? "team-sales" : "team-ops";
}

/** One person's lessons in order: the core lessons, their own path, then the level's exam. Levels in order. */
export function pathFor(track: LearnerTrack, lessons: Lesson[]): Lesson[] {
  return LEVELS.flatMap((lv) => {
    const here = lessons.filter((l) => l.level === lv.key);
    return [
      ...here.filter((l) => l.kind === "lesson" && l.track === "core"),
      ...here.filter((l) => l.kind === "lesson" && l.track === track),
      ...here.filter((l) => l.kind === "exam" && (l.track === "core" || l.track === track)),
    ];
  });
}

/** A lesson opens when every lesson before it on the person's path is passed. */
export function lessonStates(path: Lesson[], progress: ProgressRow[], openAll = false): Map<string, LessonState> {
  const passed = new Set(progress.filter((p) => p.passed_at).map((p) => p.lesson_id));
  const out = new Map<string, LessonState>();
  let open = true;
  for (const l of path) {
    if (passed.has(l.id)) out.set(l.id, "passed");
    else if (open || openAll) {
      out.set(l.id, "open");
      open = false;
    } else out.set(l.id, "locked");
  }
  return out;
}

export const countsToward = (l: Lesson) => (l.dimension ? DIMENSION_LABEL[l.dimension] : null);

export function levelViews(path: Lesson[], progress: ProgressRow[], openAll = false, reviews?: Map<string, ReviewState>, answered: Set<string> = new Set()): LevelView[] {
  const states = lessonStates(path, progress, openAll);
  const rows = new Map(progress.map((p) => [p.lesson_id, p]));
  return LEVELS.map((lv) => {
    const lessons = path.filter((l) => l.level === lv.key).map((l) => ({
      id: l.id,
      title: l.title,
      minutes: l.minutes,
      summary: l.summary,
      kind: l.kind,
      track: l.track,
      state: states.get(l.id) ?? "locked",
      bestScore: rows.get(l.id)?.best_score ?? null,
      attempts: rows.get(l.id)?.attempts ?? 0,
      hasTryIt: Boolean(l.tryIt),
      answered: answered.has(l.id),
      countsToward: countsToward(l),
      ...(reviews ? { review: reviews.get(l.id) ?? { status: "draft" as const, note: null } } : {}),
    }));
    const passed = lessons.filter((l) => l.state === "passed").length;
    return { key: lv.key, title: lv.title, blurb: lv.blurb, lessons, passed, certificate: lessons.length > 0 && passed === lessons.length };
  });
}

/** Wings for one person: a passed lesson, an answered try-it on a passed lesson, a passed exam. */
export function wingsFor(path: Lesson[], progress: ProgressRow[], answered: Set<string>): number {
  const passed = new Set(progress.filter((p) => p.passed_at).map((p) => p.lesson_id));
  return path.filter((l) => passed.has(l.id)).reduce((n, l) => n + (l.kind === "exam" ? WINGS.exam : WINGS.lesson) + (answered.has(l.id) ? WINGS.answer : 0), 0);
}

/** How many lessons of real work count toward each dimension: quiz passed AND try-it answered by the same person. */
export function creditedByDimension(lessons: Lesson[], passed: { user_id: string; lesson_id: string }[], answers: { user_id: string; lesson_id: string }[]): Partial<Record<DimensionKey, number>> {
  const done = new Set(passed.map((p) => `${p.user_id}|${p.lesson_id}`));
  const ids = new Set(answers.filter((a) => done.has(`${a.user_id}|${a.lesson_id}`)).map((a) => a.lesson_id));
  const out: Partial<Record<DimensionKey, number>> = {};
  for (const l of lessons) if (l.dimension && ids.has(l.id)) out[l.dimension] = (out[l.dimension] ?? 0) + 1;
  return out;
}

const optionId = (q: Question, text: string) => crypto.createHash("sha1").update(`${q.id}|${text}`).digest("hex").slice(0, 10);

const shuffled = <T,>(items: T[]) => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** A question as the page sees it: options in a fresh order, nothing that marks the right one. */
export function forLearner(q: Question): QuestionForLearner {
  return { id: q.id, q: q.q, options: shuffled([q.right, ...q.wrong]).map((text) => ({ id: optionId(q, text), text })) };
}

/** Marks a quiz. A lesson quiz explains each miss; an exam only names the misses, so it stays a real exam. */
export function gradeQuiz(lesson: Lesson, answers: Record<string, unknown>): QuizResult {
  const results = lesson.questions.map((q) => {
    const correct = answers[q.id] === optionId(q, q.right);
    return { id: q.id, correct, why: correct || lesson.kind === "exam" ? null : q.why };
  });
  const right = results.filter((r) => r.correct).length;
  const score = lesson.questions.length ? Math.round((right / lesson.questions.length) * 100) : 0;
  return { score, passed: score >= PASS_MARK, missed: results.filter((r) => !r.correct).map((r) => r.id), results };
}

/** What learners may take: lessons Babs approved. An approved lesson edited afterward stays up while she re-approves it. */
export const releasedLessons = (lessons: Lesson[], reviews: Map<string, ReviewState>) =>
  lessons.filter((l) => ["approved", "edited"].includes(reviews.get(l.id)?.status ?? ""));

export const levelTitle = (key: string) => LEVELS.find((l) => l.key === key)?.title ?? null;
export const isLevel = (key: string): key is LevelKey => LEVELS.some((l) => l.key === key);

/** The fingerprint of a lesson's own wording, so an approval shows as out of date if the lesson changes. */
export const lessonHash = (l: Lesson) => crypto.createHash("sha1").update(JSON.stringify(l)).digest("hex").slice(0, 16);

export function reviewState(l: Lesson, row: { status: string; note: string | null; content_hash: string | null } | undefined): ReviewState {
  if (!row) return { status: "draft", note: null };
  if (row.status === "approved" && row.content_hash !== lessonHash(l)) return { status: "edited", note: row.note };
  return { status: row.status === "approved" || row.status === "changes" ? row.status : "draft", note: row.note };
}
