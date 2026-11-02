"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Award, CheckCircle2, Circle, Lock } from "lucide-react";
import { guideCard } from "@/app/user-guide/guideStyles";
import type { LessonCard, LevelView, ReviewStatus } from "@/lib/academy/types";
import AcademyPeople from "./AcademyPeople";

type Overview = {
  learner: { name: string; track: string; trackLabel: string; required: boolean; preview: boolean; canSeePeople: boolean };
  levels: LevelView[];
  rewards: { wings: number; answered: number; tryIts: number };
  tracks: Record<string, string> | null;
};

export const REVIEW_LABEL: Record<ReviewStatus, string> = { draft: "Needs review", approved: "Approved", changes: "Changes asked", edited: "Edited since approved" };
const heading = "text-sm font-semibold uppercase tracking-[0.12em] text-[#5a6472] dark:text-[#b8c2cf]";

function LessonRow({ lesson, track }: { lesson: LessonCard; track: string }) {
  const locked = lesson.state === "locked";
  const icon = lesson.state === "passed" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2f7d4f]" aria-hidden /> : locked ? <Lock className="h-5 w-5 shrink-0 text-[#8b95a3]" aria-hidden /> : <Circle className="h-5 w-5 shrink-0 text-[#c9a227]" aria-hidden />;
  const body = (
    <>
      <div className="flex items-start gap-3">
        {icon}
        <div className="min-w-0">
          <span className="block font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{lesson.title}</span>
          <span className="mt-1 block text-sm text-[#5a6472] dark:text-[#b8c2cf]">{lesson.summary}</span>
          <span className="mt-2 block text-xs text-[#5a6472] dark:text-[#b8c2cf]">
            {lesson.kind === "exam" ? "Exam" : "Lesson"} · about {lesson.minutes} minutes
            {lesson.bestScore !== null ? ` · best score ${lesson.bestScore}%` : ""}
            {lesson.hasTryIt && lesson.answered ? " · answer saved" : ""}
            {lesson.countsToward ? ` · counts toward ${lesson.countsToward}` : ""}
            {locked ? " · finish the lesson before this one" : ""}
          </span>
          {lesson.review && <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${lesson.review.status === "approved" ? "bg-[#2f7d4f]/15 text-[#2f7d4f]" : "bg-[#c9a227]/15 text-[#7a6210] dark:text-[#e4c766]"}`}>{REVIEW_LABEL[lesson.review.status]}</span>}
        </div>
      </div>
    </>
  );
  if (locked) return <div className={`${guideCard} p-4 opacity-70`}>{body}</div>;
  return <Link href={`/academy/${lesson.id}?track=${track}`} className={`${guideCard} block p-4 transition-shadow hover:shadow-[0_14px_34px_rgba(31,43,58,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c9a227]`}>{body}</Link>;
}

export default function AcademyHome() {
  const [data, setData] = useState<Overview | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<"training" | "people">("training");
  const [track, setTrack] = useState("client");

  const load = useCallback((t: string) => {
    fetch(`/api/academy?track=${t}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);
  useEffect(() => load(track), [load, track]);

  if (failed) return <p className="px-4 py-8 text-[#5a6472] dark:text-[#b8c2cf] sm:px-6">The Academy did not load. Refresh the page to try again.</p>;
  if (!data) return <p className="px-4 py-8 text-[#5a6472] dark:text-[#b8c2cf] sm:px-6">Loading your training…</p>;

  const lessons = data.levels.flatMap((l) => l.lessons);
  const passed = lessons.filter((l) => l.state === "passed").length;
  const percent = lessons.length ? Math.round((passed / lessons.length) * 100) : 0;
  const certificates = data.levels.filter((l) => l.certificate).length;
  const approved = lessons.filter((l) => l.review?.status === "approved").length;
  const tabClass = (on: boolean) => `rounded-full border px-4 py-1.5 text-sm ${on ? "border-[#c9a227] bg-[#c9a227]/15 text-[#1a2b4a] dark:text-[#F8F5F0]" : "border-[#E6DDCB] dark:border-[#2F3B4A] bg-card text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#c9a227]/10"}`;

  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="font-serif text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] sm:text-4xl">LCCS Academy</h1>
      <p className="mt-2 text-[#5a6472] dark:text-[#b8c2cf]">From your first day to expert, one lesson at a time. Pass each quiz with 80% to open the next lesson. You can retake any quiz as often as you like.</p>

      {data.learner.canSeePeople && (
        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Academy views">
          <button type="button" role="tab" aria-selected={tab === "training"} onClick={() => setTab("training")} className={tabClass(tab === "training")}>My training</button>
          <button type="button" role="tab" aria-selected={tab === "people"} onClick={() => setTab("people")} className={tabClass(tab === "people")}>People</button>
        </div>
      )}

      {tab === "people" ? <AcademyPeople /> : (
        <>
          {data.tracks && (
            <div className="mt-5">
              <h2 className={heading}>Preview a path</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(data.tracks).map(([key, label]) => (
                  <button key={key} type="button" aria-pressed={track === key} onClick={() => setTrack(key)} className={tabClass(track === key)}>{label}</button>
                ))}
              </div>
              <p className="mt-2 text-sm text-[#5a6472] dark:text-[#b8c2cf]">{approved} of {lessons.length} lessons on this path approved. Open a lesson to approve it or ask for a change.</p>
            </div>
          )}

          <section className={`${guideCard} mt-6 p-5`} aria-label="Your progress">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{data.learner.trackLabel}{data.learner.required ? " · required for your role" : ""}</span>
              <span className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">{passed} of {lessons.length} passed</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#E6DDCB] dark:bg-[#2F3B4A]" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Lessons passed">
              <div className="h-full rounded-full bg-[#c9a227]" style={{ width: `${percent}%` }} />
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <div><dt className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">Wings earned</dt><dd className="font-serif text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{data.rewards.wings}</dd></div>
              <div><dt className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">Try-its answered</dt><dd className="font-serif text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{data.rewards.answered} of {data.rewards.tryIts}</dd></div>
              <div><dt className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">Certificates</dt><dd className="font-serif text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{certificates}</dd></div>
            </dl>
            <p className="mt-3 text-sm text-[#5a6472] dark:text-[#b8c2cf]">You earn 1 Wing for each lesson you pass, 1 more for answering its try-it, and 5 for each exam. A lesson marked counts toward lifts that health score once you pass it and answer its try-it.</p>
          </section>

          {data.levels.map((level) => (
            <section key={level.key} className="mt-8" aria-labelledby={`level-${level.key}`}>
              <h2 id={`level-${level.key}`} className="font-serif text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{level.title}</h2>
              <p className="mt-1 text-[#5a6472] dark:text-[#b8c2cf]">{level.blurb}</p>
              {level.certificate && (
                <Link href={`/academy/certificate/${level.key}?track=${track}`} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#24395f]">
                  <Award className="h-4 w-4" aria-hidden /> View your certificate
                </Link>
              )}
              {level.lessons.length ? (
                <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {level.lessons.map((l) => <LessonRow key={l.id} lesson={l} track={track} />)}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#5a6472] dark:text-[#b8c2cf]">Coming next.</p>
              )}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
