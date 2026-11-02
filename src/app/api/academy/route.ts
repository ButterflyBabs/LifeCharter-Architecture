import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { ACADEMY_LESSONS, academyLesson } from "@/content/academy";
import { canOpen, academyLearner, memberOfHouse, type Learner } from "@/lib/academy/server";
import { countsToward, forLearner, gradeQuiz, isLevel, lessonHash, lessonStates, levelViews, pathFor, releasedLessons, reviewState, trackFor, wingsFor, type ProgressRow } from "@/lib/academy/rules";
import { LEVELS, TRACK_LABELS, WINGS, type LearnerTrack, type ReviewState } from "@/lib/academy/types";
import { cleanFeatureMap } from "@/lib/teamRoles";

export const dynamic = "force-dynamic";

// LCCS Academy.
//   GET                     -> my path: every level and lesson with my progress
//   GET ?lesson=<id>        -> one lesson, without its answers
//   GET ?people=1           -> who is where, and the questions people miss most
//   GET ?certificate=<level>-> my certificate for a finished level
//   POST { action: "submit", lessonId, answers } -> marks a quiz on the server and saves the result
//   POST { action: "answer", lessonId, answer } -> saves the try-it answer their assistant reads
//   POST { action: "review", lessonId, status, note } -> Babs's Approved / Edit on a lesson
const noStore = { headers: { "Cache-Control": "no-store" } };
const denied = (error: string, status: number) => NextResponse.json({ error }, { status });

async function myProgress(l: Learner): Promise<ProgressRow[]> {
  const { data } = await createServerClient().from("academy_progress").select("lesson_id, best_score, attempts, passed_at").eq("user_id", l.userId);
  return (data ?? []) as ProgressRow[];
}

async function myAnswers(l: Learner): Promise<Map<string, string>> {
  const { data } = await createServerClient().from("academy_answers").select("lesson_id, answer").eq("user_id", l.userId);
  return new Map(((data ?? []) as { lesson_id: string; answer: string }[]).map((a) => [a.lesson_id, a.answer]));
}

async function reviews(): Promise<Map<string, ReviewState>> {
  const { data } = await createServerClient().from("academy_lesson_reviews").select("lesson_id, status, note, content_hash");
  const rows = new Map(((data ?? []) as { lesson_id: string; status: string; note: string | null; content_hash: string | null }[]).map((r) => [r.lesson_id, r]));
  return new Map(ACADEMY_LESSONS.map((lesson) => [lesson.id, reviewState(lesson, rows.get(lesson.id))]));
}

// Babs previews every lesson; everyone else sees only what she has approved.
const lessonsFor = async (l: Learner) => (l.preview ? ACADEMY_LESSONS : releasedLessons(ACADEMY_LESSONS, await reviews()));

async function people(l: Learner) {
  const db = createServerClient();
  const allAccounts = l.preview;
  let progressQ = db.from("academy_progress").select("user_id, lesson_id, master_plan_id, email, name, best_score, passed_at, last_at");
  let attemptsQ = db.from("academy_attempts").select("lesson_id, missed").order("created_at", { ascending: false }).limit(1000);
  if (!allAccounts) {
    progressQ = progressQ.eq("master_plan_id", l.planId);
    attemptsQ = attemptsQ.eq("master_plan_id", l.planId);
  }
  const { data: workspaces } = await db.from("workspaces").select("id").eq("master_plan_id", l.planId);
  const ids = ((workspaces ?? []) as { id: string }[]).map((w) => w.id);
  const [{ data: progress }, { data: attempts }, { data: members }] = await Promise.all([
    progressQ,
    attemptsQ,
    ids.length ? db.from("workspace_members").select("name, email, role, permissions, workspace_id").in("workspace_id", ids).in("status", ["active", "pending"]) : Promise.resolve({ data: [] }),
  ]);
  type Row = { user_id: string; lesson_id: string; master_plan_id: string | null; email: string | null; name: string | null; best_score: number; passed_at: string | null; last_at: string };
  type Member = { name: string | null; email: string | null; role: string | null; permissions: { features?: unknown } | null; workspace_id: string };
  const house = await memberOfHouse(ids[0] ?? null);
  const released = releasedLessons(ACADEMY_LESSONS, await reviews());
  const roster = new Map(((members ?? []) as Member[]).map((m) => [(m.email || "").toLowerCase(), m]));
  const trackOf = (m: Member | undefined): LearnerTrack =>
    m ? trackFor({ houseMember: house, role: m.role, salesReference: (cleanFeatureMap(m.permissions?.features)?.sales_reference ?? "none") !== "none" }) : "client";
  const byEmail = new Map<string, Row[]>();
  for (const r of (progress ?? []) as Row[]) {
    const key = (r.email || r.user_id).toLowerCase();
    byEmail.set(key, [...(byEmail.get(key) ?? []), r]);
  }
  const keys = Array.from(new Set([...Array.from(roster.keys()), ...Array.from(byEmail.keys())]));
  const rows = keys.map((key) => {
    const m = roster.get(key);
    const mine = byEmail.get(key) ?? [];
    const track = trackOf(m);
    const path = pathFor(track, released);
    const passed = mine.filter((r) => r.passed_at && path.some((p) => p.id === r.lesson_id));
    const current = path.find((p) => !passed.some((r) => r.lesson_id === p.id));
    return {
      key,
      name: m?.name || mine[0]?.name || key,
      email: m?.email || mine[0]?.email || null,
      team: Boolean(m),
      required: Boolean(m) && house,
      track: TRACK_LABELS[track],
      passed: passed.length,
      total: path.length,
      level: LEVELS.find((lv) => lv.key === current?.level)?.title ?? "Finished",
      current: current?.title ?? null,
      average: passed.length ? Math.round(passed.reduce((n, r) => n + r.best_score, 0) / passed.length) : null,
      lastAt: mine.map((r) => r.last_at).sort().pop() ?? null,
    };
  });
  rows.sort((a, b) => Number(b.team) - Number(a.team) || a.name.localeCompare(b.name));

  const tries = new Map<string, number>();
  const misses = new Map<string, number>();
  for (const a of (attempts ?? []) as { lesson_id: string; missed: string[] }[]) {
    tries.set(a.lesson_id, (tries.get(a.lesson_id) ?? 0) + 1);
    for (const q of a.missed) misses.set(q, (misses.get(q) ?? 0) + 1);
  }
  const hardest = ACADEMY_LESSONS.flatMap((lesson) =>
    lesson.questions.filter((q) => misses.has(q.id)).map((q) => ({ id: q.id, q: q.q, lesson: lesson.title, misses: misses.get(q.id) ?? 0, tries: tries.get(lesson.id) ?? 0 })),
  ).sort((a, b) => b.misses - a.misses).slice(0, 10);
  return { rows, hardest, allAccounts };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const l = await academyLearner(url.searchParams.get("track"));
  if (!l) return denied("Not found.", 404);
  const path = pathFor(l.track, await lessonsFor(l));

  if (url.searchParams.get("people")) {
    if (!l.canSeePeople) return denied("Only the account owner or an admin can see this.", 403);
    return NextResponse.json(await people(l), noStore);
  }

  const [progress, answers] = await Promise.all([myProgress(l), myAnswers(l)]);
  const answered = new Set(answers.keys());

  const level = url.searchParams.get("certificate");
  if (level) {
    if (!isLevel(level)) return denied("Not found.", 404);
    const view = levelViews(path, progress).find((v) => v.key === level);
    if (!view?.certificate) return denied("This level is not finished yet.", 403);
    const ids = new Set(view.lessons.map((c) => c.id));
    const earned = progress.filter((p) => ids.has(p.lesson_id) && p.passed_at).map((p) => p.passed_at as string).sort().pop();
    return NextResponse.json({ name: l.name, level: view.title, earned }, noStore);
  }

  const lessonId = url.searchParams.get("lesson");
  if (lessonId) {
    const lesson = academyLesson(lessonId);
    const onPath = path.some((p) => p.id === lessonId) || (l.preview && lesson);
    if (!lesson || !onPath) return denied("That lesson could not be found.", 404);
    const state = lessonStates(l.preview ? [lesson] : path, progress, l.preview).get(lessonId) ?? "locked";
    if (state === "locked") return denied("Finish the lesson before this one first.", 403);
    const row = progress.find((p) => p.lesson_id === lessonId);
    const here = path.findIndex((p) => p.id === lessonId);
    return NextResponse.json({
      id: lesson.id,
      level: lesson.level,
      track: lesson.track,
      kind: lesson.kind,
      title: lesson.title,
      minutes: lesson.minutes,
      summary: lesson.summary,
      sections: lesson.sections,
      questions: (lesson.kind === "exam" ? [...lesson.questions].sort(() => Math.random() - 0.5) : lesson.questions).map(forLearner),
      tryIt: lesson.tryIt ? { ...lesson.tryIt, href: canOpen(l, lesson.tryIt.href) ? lesson.tryIt.href : null } : null,
      answer: answers.get(lessonId) ?? null,
      countsToward: countsToward(lesson),
      state,
      bestScore: row?.best_score ?? null,
      attempts: row?.attempts ?? 0,
      nextId: path[here + 1]?.id ?? null,
      ...(l.preview ? { review: (await reviews()).get(lessonId) } : {}),
    }, noStore);
  }

  return NextResponse.json({
    learner: { name: l.name, track: l.track, trackLabel: TRACK_LABELS[l.track], required: l.required, preview: l.preview, canSeePeople: l.canSeePeople },
    levels: levelViews(path, progress, l.preview, l.preview ? await reviews() : undefined, answered),
    rewards: { wings: wingsFor(path, progress, answered), answered: path.filter((p) => answered.has(p.id)).length, tryIts: path.filter((p) => p.tryIt).length },
    tracks: l.preview ? TRACK_LABELS : null,
  }, noStore);
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return denied("cross-origin request blocked", 403);
  const body = (await request.json().catch(() => ({}))) as { action?: string; lessonId?: string; answers?: Record<string, unknown>; answer?: string; status?: string; note?: string; track?: string };
  const l = await academyLearner(body.track);
  if (!l) return denied("Not found.", 404);
  const lesson = academyLesson(String(body.lessonId || ""));
  if (!lesson) return denied("That lesson could not be found.", 404);
  const db = createServerClient();

  if (body.action === "review") {
    if (!l.preview) return denied("Only Babs reviews lessons.", 403);
    const status = body.status === "approved" || body.status === "changes" ? body.status : "draft";
    const note = status === "changes" ? String(body.note || "").trim().slice(0, 4000) : null;
    if (status === "changes" && !note) return denied("Say what should change.", 400);
    const { error } = await db.from("academy_lesson_reviews").upsert({ lesson_id: lesson.id, status, note, content_hash: status === "approved" ? lessonHash(lesson) : null, updated_at: new Date().toISOString() });
    if (error) return denied("That didn't save. Try again.", 500);
    return NextResponse.json({ review: { status, note } }, noStore);
  }

  if (body.action !== "submit" && body.action !== "answer") return denied("Unknown action.", 400);
  if (l.viewingAs) return denied("You're viewing as a team member, so answers aren't saved.", 403);

  if (body.action === "answer") {
    if (!lesson.tryIt) return denied("This lesson has no question to answer.", 400);
    const answer = String(body.answer ?? "").trim().slice(0, 2000);
    if (answer.length < 15) return denied("Write a sentence or two so your assistant has something to work with.", 400);
    const { error } = await db.from("academy_answers").upsert({ user_id: l.userId, lesson_id: lesson.id, master_plan_id: l.planId, name: l.name, question: lesson.tryIt.question, answer, updated_at: new Date().toISOString() });
    if (error) return denied("Your answer didn't save. Try again.", 500);
    return NextResponse.json({ answer, countsToward: countsToward(lesson) }, noStore);
  }

  const path = pathFor(l.track, await lessonsFor(l));
  const progress = await myProgress(l);
  const onPath = path.some((p) => p.id === lesson.id) || l.preview;
  const state = lessonStates(l.preview ? [lesson] : path, progress, l.preview).get(lesson.id);
  if (!onPath || state === "locked") return denied("Finish the lesson before this one first.", 403);
  const picks = body.answers && typeof body.answers === "object" ? body.answers : {};
  if (lesson.questions.some((q) => !picks[q.id])) return denied("Answer every question first.", 400);

  const result = gradeQuiz(lesson, picks);
  const now = new Date().toISOString();
  const row = progress.find((p) => p.lesson_id === lesson.id);
  const { error } = await db.from("academy_progress").upsert({
    user_id: l.userId,
    lesson_id: lesson.id,
    master_plan_id: l.planId,
    email: l.email,
    name: l.name,
    best_score: Math.max(row?.best_score ?? 0, result.score),
    attempts: (row?.attempts ?? 0) + 1,
    passed_at: row?.passed_at ?? (result.passed ? now : null),
    last_at: now,
  });
  if (error) return denied("Your answers didn't save. Try again.", 500);
  await db.from("academy_attempts").insert({ user_id: l.userId, master_plan_id: l.planId, lesson_id: lesson.id, score: result.score, passed: result.passed, missed: result.missed });
  const here = path.findIndex((p) => p.id === lesson.id);
  return NextResponse.json({ ...result, exam: lesson.kind === "exam", nextId: path[here + 1]?.id ?? null, level: lesson.level, wings: lesson.kind === "exam" ? WINGS.exam : WINGS.lesson }, noStore);
}
