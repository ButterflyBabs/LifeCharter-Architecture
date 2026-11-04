"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Circle, Download, ExternalLink, Lock, Printer, Rocket } from "lucide-react";
import UserGuideHome from "@/app/user-guide/UserGuideHome";
import { STARTER_GUIDE_URL, WELCOME_OVERVIEW_PATH } from "@/lib/starterGuide";
import { ASSESSMENT_NEEDS_AI_MESSAGE, combineSteps, nextStep, weekLocked, WEEK_TITLES, type StartStep } from "@/lib/startHere";
import type { GuideEntry } from "@/lib/userGuide/types";

type EntryCardData = Pick<GuideEntry, "id" | "name" | "where" | "area" | "starter">;
type TabKey = "days" | "picture" | "lookup";
const TABS: { key: TabKey; label: string }[] = [
  { key: "days", label: "Your 30 Days" },
  { key: "picture", label: "The Big Picture" },
  { key: "lookup", label: "Look It Up" },
];

function useStartSteps() {
  const [state, setState] = useState<{ steps: StartStep[]; day: number } | null>(null);
  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch("/api/first30", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/setup/status", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      ]);
      if (!a) return;
      const setup = {
        ai: Boolean(b?.ai?.connected),
        brain: Boolean(b?.assessments?.brain),
        soul: Boolean(b?.assessments?.soul),
        profit: Boolean(b?.assessments?.profit),
        tools: Boolean(b?.tools?.connected),
      };
      setState({ steps: combineSteps(a.steps ?? [], setup), day: a.day ?? 1 });
    } catch {
      /* the page keeps what it has */
    }
  }, []);
  useEffect(() => {
    void load();
    // Coming back from an assessment or Settings: tick what was finished while away.
    window.addEventListener("focus", load);
    window.addEventListener("tasks-changed", load);
    return () => {
      window.removeEventListener("focus", load);
      window.removeEventListener("tasks-changed", load);
    };
  }, [load]);
  return state;
}

function StepRow({ s }: { s: StartStep }) {
  if (s.blocked && !s.done) {
    return (
      <Link href="/settings?tab=ai" className="flex items-start gap-3 rounded-lg px-2 py-3 opacity-70 hover:bg-[#1a2b4a]/5">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#7a8a99]" aria-label="Locked" />
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{s.title}</span>
          <span className="block text-xs font-semibold text-[#8a6a15]">{s.blocked}, so your assistant can help you complete it. It opens as soon as your AI is connected.</span>
        </span>
      </Link>
    );
  }
  return (
    <Link href={s.href} className="flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-[#1a2b4a]/5">
      {s.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2c6b3f]" aria-label="Done" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#c9a227]" aria-label="Not done yet" />}
      <span className="min-w-0 flex-1">
        <span className={`block font-medium ${s.done ? "text-[#7a8a99] line-through" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
          {s.title}
          {s.focus && !s.done && <span className="ml-2 rounded-full bg-[#c9a227]/15 px-2 py-0.5 text-[11px] font-semibold text-[#8a6a15]">Focus for you · {s.focus}</span>}
        </span>
        {s.why && <span className="block text-xs text-[#7a8a99]">{s.why}</span>}
        {s.time && !s.done && <span className="block text-xs text-[#7a8a99]">{s.time}</span>}
      </span>
    </Link>
  );
}

function Days() {
  const d = useStartSteps();
  const needAi = useSearchParams().get("need") === "ai";
  const steps = useMemo(() => d?.steps ?? [], [d]);
  const done = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const setupSteps = steps.filter((s) => s.week === 0);
  const setupDone = setupSteps.filter((s) => s.done).length;
  const next = nextStep(steps);
  const weeks = Array.from(new Set(steps.map((s) => s.week))).sort((a, b) => a - b);
  if (!d) return <p className="text-[#7a8a99]">Loading…</p>;
  return (
    <div>
      {needAi && !steps.find((x) => x.key === "ai")?.done && (
        <p className="mb-4 rounded-xl border border-[#c9a227]/50 bg-[#c9a227]/10 p-4 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]" role="status">{ASSESSMENT_NEEDS_AI_MESSAGE}</p>
      )}
      <div className="rounded-2xl border border-[#c9a227]/40 bg-white p-5 shadow-sm dark:bg-[#1a2b4a]/30">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{done} of {total} steps done</p>
          <p className="text-sm text-[#7a8a99]">Day {Math.min(d.day, 30)} of 30 · Set up {setupDone} of {setupSteps.length}</p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#1a2b4a]/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Getting started progress">
          <div className="h-full rounded-full bg-[#c9a227] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-xs text-[#7a8a99]">Each step ticks itself off the moment it is finished. An assessment counts once you press Complete on it.</p>
      </div>

      {next ? (
        <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#1a2b4a] to-[#3d4f7a] p-5 text-[#F8F5F0] shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#d9c27a]">Your next step</p>
          <p className="mt-1 font-serif text-xl">{next.title}</p>
          {next.why && <p className="mt-1 text-sm text-[#e8e4f0]">{next.why}</p>}
          {next.time && <p className="mt-1 text-xs text-[#d9c27a]">{next.time}</p>}
          <Link href={next.href} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#1a2b4a] hover:opacity-90">Open it <ArrowRight className="h-4 w-4" /></Link>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-[#2c6b3f]/30 bg-[#2c6b3f]/5 p-5">
          <p className="font-serif text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">You have finished every step.</p>
          <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">The Suite is set up and running. Look anything up in the User Guide whenever you need it.</p>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {weeks.map((w) => {
          const list = steps.filter((s) => s.week === w);
          const wdone = list.filter((s) => s.done).length;
          const locked = weekLocked(steps, w);
          const complete = wdone === list.length;
          const title = WEEK_TITLES[w] ?? `Week ${w}`;
          if (locked) {
            return (
              <div key={w} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 opacity-60 dark:bg-[#1a2b4a]/20">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">{title}</p>
                <p className="flex items-center gap-2 py-2 text-sm text-[#7a8a99]"><Lock className="h-4 w-4" aria-hidden /> Opens once {w === 1 ? "your setup is" : `Week ${w - 1} is`} complete.</p>
              </div>
            );
          }
          return (
            <details key={w} open={!complete} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 dark:bg-[#1a2b4a]/20">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">
                <span>{title}</span>
                <span className={complete ? "text-[#2c6b3f]" : ""}>{complete ? "Complete ✓" : `${wdone} of ${list.length}`}</span>
              </summary>
              <div className="mt-2 divide-y divide-[#1a2b4a]/10">
                {[...list].sort((a, b) => Number(!!b.focus && !b.done) - Number(!!a.focus && !a.done)).map((s) => <StepRow key={s.key} s={s} />)}
              </div>
            </details>
          );
        })}
      </div>

      <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <a className="inline-flex items-center gap-1 font-semibold text-[#2E7C83] hover:underline" href={STARTER_GUIDE_URL} target="_blank" rel="noopener noreferrer"><Printer className="h-4 w-4" /> Open the printable checklist (Starter Guide)</a>
      </p>
    </div>
  );
}

function Picture() {
  return (
    <div>
      <p className="text-[#5a6472] dark:text-[#b8c2cf]">The whole Suite on one map: your first 30 days, each area of the Suite and where to find it, and life after day 30.</p>
      <p className="mt-3 flex flex-wrap gap-4 text-sm">
        <a className="inline-flex items-center gap-1 font-semibold text-[#2E7C83] hover:underline" href={WELCOME_OVERVIEW_PATH} download><Download className="h-4 w-4" /> Download the PDF</a>
        <a className="inline-flex items-center gap-1 font-semibold text-[#2E7C83] hover:underline" href={WELCOME_OVERVIEW_PATH} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> Open it in its own tab</a>
      </p>
      <iframe src={WELCOME_OVERVIEW_PATH} title="Client Welcome Overview" className="mt-4 h-[75vh] w-full rounded-xl border border-[#1a2b4a]/15 bg-white" />
    </div>
  );
}

export default function GettingStarted({ entries, top, topTitle }: { entries: EntryCardData[]; top: EntryCardData[]; topTitle: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const tab: TabKey = (TABS.find((t) => t.key === params.get("tab"))?.key ?? "days") as TabKey;
  const pick = (k: TabKey) => router.replace(k === "days" ? "/getting-started" : `/getting-started?tab=${k}`, { scroll: false });
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#c9a227] to-[#2E7C83]"><Rocket className="h-6 w-6 text-white" /></div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Getting Started</h1>
          <p className="text-[#7a8a99]">Set up your Suite, see the whole picture, and look anything up, all in one place.</p>
        </div>
      </div>
      <div role="tablist" aria-label="Getting Started" className="mb-6 flex flex-wrap gap-2 border-b border-[#1a2b4a]/10 pb-3">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => pick(t.key)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t.key ? "bg-[#1a2b4a] text-white" : "border border-[#1a2b4a]/20 text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:text-[#F8F5F0]"}`}>{t.label}</button>
        ))}
      </div>
      {tab === "days" && <Days />}
      {tab === "picture" && <Picture />}
      {tab === "lookup" && (entries.length ? <UserGuideHome entries={entries} top={top} topTitle={topTitle} withGlossary embedded /> : <p className="text-[#7a8a99]">The User Guide is not open for this account yet.</p>)}
    </div>
  );
}
