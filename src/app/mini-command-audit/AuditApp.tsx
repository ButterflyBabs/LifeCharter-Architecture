"use client";

import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/tracking";
import {
  PHASES,
  PROFILE_QUESTIONS,
  SCALE,
  NOT_SURE,
  NOT_APPLICABLE,
  computeResult,
  type Answer,
  type Answers,
  type AuditResult,
  type PhaseResult,
  type Question,
} from "@/lib/miniAudit";

// The Mini Command Audit, start to finish: a few questions about the business, 12 short steps (two questions each), your
// name and email, then your results. From the results you can go deeper with the other two questions in every phase.
// Progress is kept in this browser (localStorage) so a refresh never loses it; nothing is sent until the email step.

type Saved = { token: string; firstName: string; answers: Answers; depth: "quick" | "full"; result: AuditResult };
type Screen = "intro" | "profile" | "quick" | "gate" | "results" | "deep";

const KEY = "mca-v1";
const box = "w-full rounded-lg border border-[#1a2b4a]/25 bg-white px-3 py-2.5 text-base text-[#1a2b4a] dark:bg-[#1a2b4a]/40 dark:text-[#F8F5F0]";
const navy = "text-[#1a2b4a] dark:text-[#F8F5F0]";
const muted = "text-[#5a6472] dark:text-[#b8c2cf]";
const primary = "inline-flex items-center justify-center rounded-xl bg-[#1a2b4a] px-6 py-3 text-base font-semibold text-[#F8F5F0] hover:bg-[#243a63] disabled:opacity-40 dark:bg-[#c9a227] dark:text-[#1a2b4a] dark:hover:bg-[#d9b95a]";
const secondary = "inline-flex items-center justify-center rounded-xl border border-[#1a2b4a]/25 px-5 py-3 text-base font-semibold text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:border-white/25 dark:text-[#F8F5F0] dark:hover:bg-white/10";

const BAND_STYLE: Record<string, string> = {
  "At Risk": "bg-[#A4523C]/15 text-[#7d3a28] dark:text-[#f0b8a4]",
  "Needs Attention": "bg-[#c9a227]/20 text-[#6b5410] dark:text-[#e6cf7a]",
  Stable: "bg-[#2E7C83]/15 text-[#1F5E63] dark:text-[#8fd0d6]",
  Strong: "bg-[#2c6b3f]/15 text-[#2c6b3f] dark:text-[#9bd6ae]",
};

export default function AuditApp({ saved }: { saved?: Saved }) {
  const [screen, setScreen] = useState<Screen>(saved ? "results" : "intro");
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Answers>(saved?.answers ?? {});
  const [step, setStep] = useState(0);
  const [token, setToken] = useState(saved?.token ?? "");
  const [depth, setDepth] = useState<"quick" | "full">(saved?.depth ?? "quick");
  const [firstName, setFirstName] = useState(saved?.firstName ?? "");
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [emailed, setEmailed] = useState<boolean | null>(null);
  const [ready, setReady] = useState(Boolean(saved));

  // Pick up where this browser left off (a person who has not finished yet).
  useEffect(() => {
    if (saved) return;
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && typeof raw === "object") {
        if (raw.profile) setProfile(raw.profile);
        if (raw.answers) setAnswers(raw.answers);
        if (typeof raw.step === "number") setStep(Math.min(11, Math.max(0, raw.step)));
        if (raw.screen === "quick" || raw.screen === "profile" || raw.screen === "gate") setScreen(raw.screen);
        if (raw.firstName) setFirstName(raw.firstName);
      }
    } catch {
      /* nothing saved */
    }
    setReady(true);
  }, [saved]);
  useEffect(() => {
    if (!ready || saved || token) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ profile, answers, step, screen: screen === "quick" || screen === "profile" || screen === "gate" ? screen : "intro", firstName }));
    } catch {
      /* not saved */
    }
  }, [ready, saved, token, profile, answers, step, screen, firstName]);

  const result = useMemo(() => computeResult(answers, depth), [answers, depth]);
  const phase = PHASES[step];
  const set = (q: Question, a: Answer) => setAnswers((x) => ({ ...x, [q.key]: a }));

  // The two questions asked in this phase: the quick pair first, then (on "go deeper") the other pair.
  const pair = (p: (typeof PHASES)[number], deep: boolean) => p.questions.filter((q) => q.quick !== deep);
  const pairDone = (deep: boolean) => pair(phase, deep).every((q) => answers[q.key] !== undefined);

  function go(next: Screen, nextStep = 0) {
    setScreen(next);
    setStep(nextStep);
    setErr("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    const sp = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"]) {
      const v = sp.get(k);
      if (v) utm[k] = v.slice(0, 120);
    }
    const eid = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
    const quickKeys = new Set(PHASES.flatMap((p) => p.questions.filter((q) => q.quick).map((q) => q.key)));
    const quick = Object.fromEntries(Object.entries(answers).filter(([k]) => quickKeys.has(k)));
    const r = await fetch("/api/mini-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", firstName, email, profile, answers: quick, _hp: hp, _utm: utm, _eid: eid, _page: window.location.href }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r?.ok) return setErr(d.error || "Something went wrong. Please try again.");
    trackEvent("Lead", { content_name: "mini_command_audit" }, { eventID: eid });
    setToken(d.token);
    setEmailed(Boolean(d.emailed));
    try {
      localStorage.removeItem(KEY);
      window.history.replaceState(null, "", `/mini-command-audit/results/${d.token}`);
    } catch {
      /* fine */
    }
    go("results");
  }

  async function finishDeep() {
    if (busy) return;
    setBusy(true);
    setErr("");
    const deepKeys = new Set(PHASES.flatMap((p) => p.questions.filter((q) => !q.quick).map((q) => q.key)));
    const deepAnswers = Object.fromEntries(Object.entries(answers).filter(([k]) => deepKeys.has(k)));
    const r = await fetch("/api/mini-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deepen", token, answers: deepAnswers }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r?.ok) return setErr(d.error || "Something went wrong. Please try again.");
    setDepth("full");
    go("results");
  }

  if (!ready) return <main className="mx-auto max-w-2xl px-4 py-12" />;

  // ── Intro ──
  if (screen === "intro")
    return (
      <Shell>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#a8812b]">Free · about 8 minutes</p>
        <h1 className={`mt-2 text-3xl font-bold leading-tight ${navy}`}>The Mini Command Audit: where should you start?</h1>
        <p className={`mt-3 text-lg ${navy}`}>Twenty-four questions across twelve areas of your business, from your leadership to your team. You get your scores the moment you finish.</p>
        <ul className={`mt-5 space-y-2 ${navy}`}>
          <li className="flex gap-2"><Dot />Each area gets two scores: how well it is built, and how well it is working.</li>
          <li className="flex gap-2"><Dot />You see your two best places to start, so you leave with a next step instead of a long to-do list.</li>
          <li className="flex gap-2"><Dot />Want more? You can answer 24 more questions afterward for the full picture.</li>
        </ul>
        <p className={`mt-5 text-sm ${muted}`}>There are no wrong answers. Answer for the business as it is today, not as you hope it will be.</p>
        <button className={`${primary} mt-7`} onClick={() => go("profile")}>Start the audit</button>
        <p className={`mt-6 text-sm ${muted}`}>From AmiLynne &lsquo;Babs&rsquo; Carroll, Alignment Architect.</p>
      </Shell>
    );

  // ── Profile ──
  if (screen === "profile")
    return (
      <Shell>
        <Progress label="First, three quick questions about you" value={0} />
        <div className="mt-6 space-y-6">
          {PROFILE_QUESTIONS.map((q) => (
            <fieldset key={q.key}>
              <legend className={`mb-2 text-lg font-semibold ${navy}`}>{q.label}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((o) => (
                  <Choice key={o} name={q.key} checked={profile[q.key] === o} onChange={() => setProfile((p) => ({ ...p, [q.key]: o }))}>{o}</Choice>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <Nav onBack={() => go("intro")} onNext={() => go("quick", 0)} nextLabel="Begin" disabled={PROFILE_QUESTIONS.some((q) => !profile[q.key])} />
      </Shell>
    );

  // ── Questions (quick set, or the deeper pair) ──
  if (screen === "quick" || screen === "deep") {
    const deep = screen === "deep";
    const total = PHASES.length;
    const last = step === total - 1;
    return (
      <Shell>
        <Progress label={`${deep ? "Going deeper · " : ""}Area ${step + 1} of ${total}`} value={(step + (pairDone(deep) ? 1 : 0)) / total} />
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-[#a8812b]">{phase.name}</p>
        <p className={`mt-1 text-sm ${muted}`}>{phase.blurb}</p>
        <div className="mt-5 space-y-8">
          {pair(phase, deep).map((q, i) => (
            <fieldset key={q.key}>
              <legend className={`text-lg font-semibold leading-snug ${navy}`}><span className="mr-1 text-[#a8812b]">{i + 1}.</span>{q.text}</legend>
              <div className="mt-3 space-y-2">
                {[...SCALE].reverse().map((o) => (
                  <Choice key={o.score} name={q.key} checked={answers[q.key] === o.score} onChange={() => set(q, o.score)}>
                    <b>{o.score}</b> · {o.label}
                  </Choice>
                ))}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Choice small name={q.key} checked={answers[q.key] === NOT_SURE} onChange={() => set(q, NOT_SURE)}>I&apos;m not sure</Choice>
                  <Choice small name={q.key} checked={answers[q.key] === NOT_APPLICABLE} onChange={() => set(q, NOT_APPLICABLE)}>Doesn&apos;t apply to my business</Choice>
                </div>
              </div>
            </fieldset>
          ))}
        </div>
        {err && <p role="alert" className="mt-4 text-sm font-medium text-[#A4523C]">{err}</p>}
        <Nav
          onBack={() => (step === 0 ? go(deep ? "results" : "profile") : go(screen, step - 1))}
          onNext={() => (last ? (deep ? void finishDeep() : go("gate")) : go(screen, step + 1))}
          nextLabel={last ? (deep ? (busy ? "Saving…" : "See my full results") : "Almost done") : "Next"}
          disabled={!pairDone(deep) || busy}
        />
      </Shell>
    );
  }

  // ── Name and email, then results ──
  if (screen === "gate")
    return (
      <Shell>
        <Progress label="All twelve areas answered" value={1} />
        <h1 className={`mt-6 text-2xl font-bold leading-tight ${navy}`}>Your results are ready. Where should we send them?</h1>
        <p className={`mt-2 ${muted}`}>You will see them on the next screen, and we will email you a link so you can come back to them any time.</p>
        <form onSubmit={submit} className="mt-5 space-y-3 rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 dark:bg-[#1a2b4a]/40">
          <label className={`block text-sm font-medium ${navy}`}>First name<input className={box} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required /></label>
          <label className={`block text-sm font-medium ${navy}`}>Email<input type="email" className={box} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
          <input aria-hidden="true" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" name="website" />
          {err && <p role="alert" className="text-sm font-medium text-[#A4523C]">{err}</p>}
          <button type="submit" className={`${primary} w-full`} disabled={busy}>{busy ? "Scoring…" : "Show me my results"}</button>
          <p className={`text-xs ${muted}`}>By continuing you will also get occasional emails from AmiLynne Carroll. You can unsubscribe in one click at any time. We never share your answers.</p>
        </form>
        <div className="mt-5"><button className={secondary} onClick={() => go("quick", 11)}>Back</button></div>
      </Shell>
    );

  // ── Results ──
  return (
    <Shell wide>
      <Results result={result} depth={depth} firstName={firstName} emailed={emailed} onDeeper={() => { setDepth("quick"); go("deep", 0); }} deepAnswered={PHASES.every((p) => pair(p, true).every((q) => answers[q.key] !== undefined))} />
    </Shell>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <main className={`mx-auto px-4 py-10 ${wide ? "max-w-3xl" : "max-w-2xl"}`}>{children}</main>;
}
function Dot() {
  return <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#c9a227]" />;
}
function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className={`text-sm font-medium ${muted}`}>{label}</p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#1a2b4a]/10 dark:bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-label="Progress">
        <div className="h-full rounded-full bg-[#c9a227] transition-all" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}
function Choice({ name, checked, onChange, children, small }: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode; small?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 ${small ? "py-2 text-sm" : "py-3 text-base"} ${checked ? "border-[#c9a227] bg-[#c9a227]/15" : "border-[#1a2b4a]/15 bg-white hover:bg-[#1a2b4a]/5 dark:border-white/15 dark:bg-[#1a2b4a]/40 dark:hover:bg-white/10"} ${navy}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 h-4 w-4 shrink-0 accent-[#1a2b4a]" />
      <span>{children}</span>
    </label>
  );
}
function Nav({ onBack, onNext, nextLabel, disabled }: { onBack: () => void; onNext: () => void; nextLabel: string; disabled?: boolean }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      <button type="button" className={secondary} onClick={onBack}>Back</button>
      <button type="button" className={primary} onClick={onNext} disabled={disabled}>{nextLabel}</button>
    </div>
  );
}

function Results({ result, depth, firstName, emailed, onDeeper, deepAnswered }: { result: AuditResult; depth: "quick" | "full"; firstName: string; emailed: boolean | null; onDeeper: () => void; deepAnswered: boolean }) {
  const hasStart = result.start.length === 2;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[#a8812b]">Your Mini Command Audit{depth === "full" ? " · full results" : ""}</p>
      <h1 className={`mt-2 text-3xl font-bold leading-tight ${navy}`}>{firstName ? `${firstName}, here is where your business stands.` : "Here is where your business stands."}</h1>
      {emailed === true && <p className={`mt-2 text-sm ${muted}`}>We have emailed you a link to these results.</p>}
      {emailed === false && <p className={`mt-2 text-sm ${muted}`}>Save this page&apos;s address to come back to these results.</p>}

      {hasStart ? (
        <section className="mt-6">
          <h2 className={`text-xl font-bold ${navy}`}>Start here</h2>
          <p className={`mt-1 ${muted}`}>These are your two lowest-scoring areas. Improving one of them will do more for you right now than working on everything at once.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {result.start.map((p, i) => (
              <div key={p.key} className="rounded-2xl border-l-4 border-[#c9a227] bg-[#c9a227]/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8a6a15] dark:text-[#d9b95a]">{i === 0 ? "First" : "Second"}</p>
                <p className={`mt-1 text-lg font-bold ${navy}`}>{p.name}</p>
                <p className={`mt-1 text-sm ${muted}`}>{p.blurb}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className={`mt-6 ${muted}`}>You marked too many questions as not sure or not applicable to pick a place to start. Answer a few more and your two best places to start will appear.</p>
      )}

      {result.strong.length === 2 && (
        <p className={`mt-5 ${navy}`}>
          <b>Your strongest areas:</b> {result.strong[0].name} and {result.strong[1].name}. Keep doing what you are doing there.
        </p>
      )}

      <section className="mt-8">
        <h2 className={`text-xl font-bold ${navy}`}>All twelve areas</h2>
        <p className={`mt-1 text-sm ${muted}`}>
          <b>Built</b> is how much of the area is in place, from 0% to 100%. <b>Working</b> is how well it runs day to day: At Risk, Needs Attention, Stable or Strong.
        </p>
        <ol className="mt-4 space-y-3">
          {result.phases.map((p) => (
            <PhaseRow key={p.key} p={p} />
          ))}
        </ol>
        {(result.unsure > 0 || result.skipped > 0) && (
          <p className={`mt-4 text-sm ${muted}`}>
            {result.unsure > 0 ? `You were not sure about ${result.unsure} ${result.unsure === 1 ? "question" : "questions"}. ` : ""}
            {result.skipped > 0 ? `${result.skipped} did not apply. ` : ""}
            These are left out of your scores. A question you are not sure about is often a good place to look first.
          </p>
        )}
      </section>

      <section className="mt-10 rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 dark:bg-[#1a2b4a]/40">
        {depth === "quick" ? (
          <>
            <h2 className={`text-xl font-bold ${navy}`}>Want the full picture?</h2>
            <p className={`mt-2 ${muted}`}>These scores come from two questions per area. Answer {deepAnswered ? "any you skipped" : "24 more (two more per area)"} and each area is scored on all four, including how well you measure and improve it. It takes about 8 more minutes.</p>
            <button className={`${primary} mt-4`} onClick={onDeeper}>Go deeper</button>
          </>
        ) : (
          <>
            <h2 className={`text-xl font-bold ${navy}`}>You answered all 48 questions</h2>
            <p className={`mt-2 ${muted}`}>These scores use all four questions in every area. Keep this page: you can retake the audit in a few months to see what has moved.</p>
          </>
        )}
      </section>

      <section className="mt-6 rounded-2xl border-l-4 border-[#c9a227] bg-[#c9a227]/10 p-5">
        <h2 className={`text-xl font-bold ${navy}`}>Work on your lowest areas with me</h2>
        <p className={`mt-2 ${navy}`}>Join the free Command Shift MasterClass. It is taught live, and one registration works for every session.</p>
        <a href="/masterclass-signup" className={`${primary} mt-4`}>Save my seat</a>
      </section>
    </div>
  );
}

function PhaseRow({ p }: { p: PhaseResult }) {
  return (
    <li className="rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:border-white/10 dark:bg-[#1a2b4a]/40">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={`font-semibold ${navy}`}><span className="mr-2 text-[#a8812b]">{p.order}</span>{p.name}</p>
        {p.risk && <span className="rounded-full bg-[#A4523C]/15 px-2.5 py-0.5 text-xs font-semibold text-[#7d3a28] dark:text-[#f0b8a4]">Worth a closer look</span>}
      </div>
      {p.overall == null ? (
        <p className={`mt-2 text-sm ${muted}`}>Not scored: every question here was marked not sure or not applicable.</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className={`text-sm ${muted}`}>Built</p>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#1a2b4a]/10 dark:bg-white/15" role="img" aria-label={p.build == null ? "Not scored" : `${p.build} percent built`}>
                <div className="h-full rounded-full bg-[#1a2b4a] dark:bg-[#c9a227]" style={{ width: `${p.build ?? 0}%` }} />
              </div>
              <span className={`w-12 shrink-0 text-right text-sm font-semibold tabular-nums ${navy}`}>{p.build == null ? "n/a" : `${p.build}%`}</span>
            </div>
          </div>
          <div>
            <p className={`text-sm ${muted}`}>Working</p>
            <p className="mt-1">{p.band ? <span className={`inline-block rounded-full px-3 py-0.5 text-sm font-semibold ${BAND_STYLE[p.band]}`}>{p.band}</span> : <span className={`text-sm ${muted}`}>n/a</span>}</p>
          </div>
        </div>
      )}
    </li>
  );
}
