"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { guideCard } from "@/app/user-guide/guideStyles";
import { PASS_MARK, type LessonForLearner, type QuizResult, type ReviewState } from "@/lib/academy/types";

type Submitted = QuizResult & { exam: boolean; nextId: string | null; level: string; wings: number };

const REVIEW_LABEL = { draft: "Needs review", approved: "Approved", changes: "Changes asked", edited: "Edited since approved" };
const primary = "rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#24395f] disabled:opacity-50";
const secondary = "rounded-lg border border-[#E6DDCB] dark:border-[#2F3B4A] px-4 py-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#c9a227]/10";
const muted = "text-[#5a6472] dark:text-[#b8c2cf]";

// Babs's own Edit and Approved on each lesson. Edit takes her note; the wording itself lives in the code.
function ReviewBar({ lessonId, track, review, onChange }: { lessonId: string; track: string; review: ReviewState; onChange: (r: ReviewState) => void }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(review.note ?? "");
  const [error, setError] = useState("");
  const save = async (status: string) => {
    setError("");
    const r = await fetch("/api/academy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "review", lessonId, track, status, note }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setError(d.error || "That didn't save. Try again.");
    setEditing(false);
    onChange(d.review);
  };
  return (
    <section className={`${guideCard} mt-5 p-4 print:hidden`} aria-label="Lesson review">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-[#c9a227]/15 px-3 py-1 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{REVIEW_LABEL[review.status]}</span>
        <button type="button" className={primary} onClick={() => save("approved")}>Approved</button>
        <button type="button" className={secondary} onClick={() => setEditing(!editing)}>Edit</button>
      </div>
      {review.note && !editing && <p className={`mt-3 text-sm ${muted}`}>Your note: {review.note}</p>}
      {editing && (
        <div className="mt-3">
          <label htmlFor="review-note" className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">What should change in this lesson or its questions?</label>
          <textarea id="review-note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E6DDCB] dark:border-[#2F3B4A] bg-card p-2 text-[#1a2b4a] dark:text-[#F8F5F0]" />
          <button type="button" className={`${primary} mt-2`} onClick={() => save("changes")}>Save my note</button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-[#b3402e]">{error}</p>}
    </section>
  );
}

// The try-it is real work, so it has a place to land: the answer is saved for their assistant and earns its reward.
function TryIt({ lesson, track, onSaved }: { lesson: LessonForLearner; track: string; onSaved: (answer: string) => void }) {
  const tryIt = lesson.tryIt!;
  const [text, setText] = useState(lesson.answer ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    const r = await fetch("/api/academy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "answer", lessonId: lesson.id, track, answer: text }) });
    const d = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) return setError(d.error || "Your answer did not save. Try again.");
    setSaved(true);
    onSaved(d.answer);
  };
  return (
    <section className={`${guideCard} mt-6 p-5`}>
      <h2 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Try it in your account</h2>
      <p className={`mt-1 ${muted}`}>{tryIt.task}</p>
      {tryIt.href ? <a href={tryIt.href} target="_blank" rel="noopener" className={`${secondary} mt-3 inline-block`}>{tryIt.label}</a> : <p className={`mt-2 text-sm ${muted}`}>That page is not part of your access, so answer from what you know.</p>}
      <label htmlFor="try-answer" className="mt-4 block font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{tryIt.question}</label>
      <textarea id="try-answer" rows={4} maxLength={2000} value={text} onChange={(e) => { setText(e.target.value); setSaved(false); }} className="mt-1 w-full rounded-lg border border-[#E6DDCB] dark:border-[#2F3B4A] bg-card p-2 text-[#1a2b4a] dark:text-[#F8F5F0]" />
      <p className={`mt-1 text-sm ${muted}`}>Your assistant reads this so it can help you follow through. It earns 1 Wing{lesson.countsToward ? ` and, once you pass the quiz, counts toward your ${lesson.countsToward} score` : ""}.</p>
      <button type="button" className={`${primary} mt-2`} disabled={saving || text.trim().length < 15} onClick={save}>{saving ? "Saving…" : lesson.answer ? "Update my answer" : "Save my answer"}</button>
      {saved && <p role="status" className="mt-2 text-sm font-medium text-[#2f7d4f]">Saved. Your assistant has it.</p>}
      {error && <p role="alert" className="mt-2 text-sm text-[#b3402e]">{error}</p>}
    </section>
  );
}

export default function AcademyLesson({ id, track }: { id: string; track: string }) {
  const [lesson, setLesson] = useState<LessonForLearner | null>(null);
  const [problem, setProblem] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Submitted | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setProblem("");
    fetch(`/api/academy?lesson=${encodeURIComponent(id)}&track=${track}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "This lesson didn't load.");
        setLesson(d);
      })
      .catch((e: Error) => setProblem(e.message));
  }, [id, track]);
  useEffect(load, [load]);

  const submit = async () => {
    setSaving(true);
    setError("");
    const r = await fetch("/api/academy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit", lessonId: id, track, answers }) });
    const d = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) return setError(d.error || "Your answers didn't save. Try again.");
    setResult(d);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const retake = () => {
    setResult(null);
    setAnswers({});
    load();
  };

  const back = <Link href="/academy" className={`text-sm underline ${muted}`}>Back to the Academy</Link>;
  if (problem) return <div className="px-4 py-8 sm:px-6"><p className={muted}>{problem}</p><p className="mt-3">{back}</p></div>;
  if (!lesson) return <p className={`px-4 py-8 sm:px-6 ${muted}`}>Loading your lesson…</p>;

  const missed = new Map((result?.results ?? []).filter((r) => !r.correct).map((r) => [r.id, r.why]));
  const allAnswered = lesson.questions.every((q) => answers[q.id]);

  return (
    <div className="px-4 py-8 sm:px-6">
      {back}
      <h1 className="mt-3 font-serif text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] sm:text-4xl">{lesson.title}</h1>
      <p className={`mt-2 ${muted}`}>{lesson.summary} About {lesson.minutes} minutes.{lesson.bestScore !== null ? ` Your best score: ${lesson.bestScore}%.` : ""}</p>
      {lesson.review && <ReviewBar lessonId={id} track={track} review={lesson.review} onChange={(review) => setLesson({ ...lesson, review })} />}

      {result && (
        <section className={`${guideCard} mt-5 p-5`} aria-live="polite">
          <p className="font-serif text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{result.passed ? `You passed with ${result.score}%` : `You scored ${result.score}%. You need ${PASS_MARK}% to pass.`}</p>
          <p className={`mt-1 ${muted}`}>{result.passed ? (result.missed.length ? "Look at the questions you missed below." : "You got every question right.") : result.exam ? "The questions you missed are marked below. Go back through the lessons, then try again." : "Read why under each question you missed, then try again."}</p>
          {result.passed && (
            <p className="mt-2 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              You earned {result.wings} {result.wings === 1 ? "Wing" : "Wings"}.
              {lesson.tryIt && !lesson.answer ? " Answer the try-it below to earn 1 more." : ""}
              {lesson.countsToward ? (lesson.answer ? ` This lesson now counts toward your ${lesson.countsToward} score.` : ` Your answer also counts toward your ${lesson.countsToward} score.`) : ""}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {result.passed && result.exam && <Link href={`/academy/certificate/${result.level}?track=${track}`} className={primary}>View your certificate</Link>}
            {result.passed && result.nextId && <Link href={`/academy/${result.nextId}?track=${track}`} className={primary}>Next lesson</Link>}
            {!result.passed && <button type="button" className={primary} onClick={retake}>Try again</button>}
            {result.passed && <Link href="/academy" className={secondary}>Back to the Academy</Link>}
          </div>
        </section>
      )}

      {lesson.links.length > 0 && (
        <section className={`${guideCard} mt-6 p-5`} aria-labelledby="lesson-links">
          <h2 id="lesson-links" className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">What this lesson covers</h2>
          <ul className="mt-2 grid gap-3 md:grid-cols-2">
            {lesson.links.map((f) => (
              <li key={f.guide}>
                <span className="block font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{f.name}</span>
                <span className={`block text-sm ${muted}`}>{f.where}</span>
                <span className="mt-1 flex flex-wrap gap-3 text-sm">
                  {f.href && <a href={f.href} target="_blank" rel="noopener" className="font-medium text-[#1a2b4a] underline dark:text-[#F8F5F0]">Open it</a>}
                  <a href={f.guide} target="_blank" rel="noopener" className="font-medium text-[#1a2b4a] underline dark:text-[#F8F5F0]">Read the User Guide</a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lesson.sections.map((s) => (
        <section key={s.heading} className="mt-6">
          <h2 className="font-serif text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.heading}</h2>
          {s.text && <p className="mt-1 text-[#1a2b4a] dark:text-[#F8F5F0]">{s.text}</p>}
          {s.steps && <ol className="mt-2 list-decimal space-y-1 pl-6 text-[#1a2b4a] dark:text-[#F8F5F0]">{s.steps.map((t) => <li key={t}>{t}</li>)}</ol>}
          {s.tips && <ul className="mt-2 list-disc space-y-1 pl-6 text-[#1a2b4a] dark:text-[#F8F5F0]">{s.tips.map((t) => <li key={t}>{t}</li>)}</ul>}
          {s.image && (
            <figure className="mt-3">
              <a href={s.image.src} target="_blank" rel="noopener" aria-label={`Open full size: ${s.image.alt}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image.src} alt={s.image.alt} loading="lazy" className={`${guideCard} w-full`} />
              </a>
              {s.image.caption && <figcaption className={`mt-2 text-sm ${muted}`}>{s.image.caption}</figcaption>}
            </figure>
          )}
        </section>
      ))}

      {lesson.tryIt && <TryIt lesson={lesson} track={track} onSaved={(answer) => setLesson({ ...lesson, answer })} />}

      <section className="mt-8" aria-labelledby="quiz-title">
        <h2 id="quiz-title" className="font-serif text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{lesson.kind === "exam" ? "Exam" : "Check your understanding"}</h2>
        <div className="mt-3 grid gap-4 xl:grid-cols-2">
          {lesson.questions.map((q, n) => (
            <fieldset key={q.id} className={`${guideCard} p-4`} disabled={Boolean(result)}>
              <legend className="sr-only">Question {n + 1}</legend>
              <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{n + 1}. {q.q}</p>
              <div className="mt-2 space-y-1">
                {q.options.map((o) => (
                  <label key={o.id} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 text-[#1a2b4a] hover:bg-[#c9a227]/10 dark:text-[#F8F5F0]">
                    <input type="radio" name={q.id} value={o.id} checked={answers[q.id] === o.id} onChange={() => setAnswers({ ...answers, [q.id]: o.id })} className="mt-1 accent-[#c9a227]" />
                    <span>{o.text}</span>
                  </label>
                ))}
              </div>
              {result && (missed.has(q.id) ? (
                <p className="mt-2 rounded-lg bg-[#b3402e]/10 p-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]"><strong>Not quite.</strong> {missed.get(q.id) ?? "Go back through the lessons on this one."}</p>
              ) : (
                <p className="mt-2 rounded-lg bg-[#2f7d4f]/10 p-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]"><strong>Correct.</strong></p>
              ))}
            </fieldset>
          ))}
        </div>
        {!result && (
          <div className="mt-4">
            <button type="button" className={primary} disabled={!allAnswered || saving} onClick={submit}>{saving ? "Checking…" : "Check my answers"}</button>
            {!allAnswered && <p className={`mt-2 text-sm ${muted}`}>Answer every question to continue.</p>}
            {error && <p role="alert" className="mt-2 text-sm text-[#b3402e]">{error}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
