"use client";

import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/tracking";
import { CATEGORIES, QUESTIONS, QUESTION_COUNT, TAG_LABEL, adviceFor, computeResult, insightsFor, type HealthResult } from "@/lib/healthCheck";

// The Business Health Check, start to finish: an intro, 25 questions (one at a time), your name and email, a short
// "scoring" moment, then your report (scorecard, advisor notes, action plan). Progress is kept in this browser so a
// refresh never loses it; nothing is sent until the email step.

type Screen = "intro" | "quiz" | "gate" | "loading" | "report";
type Saved = { answers: Array<number | null>; current: number; screen: "intro" | "quiz" | "gate"; firstName: string; businessName: string };

const KEY = "bhc-v1";
const empty = () => new Array<number | null>(QUESTION_COUNT).fill(null);
const LETTERS = ["A", "B", "C", "D"];
const LOADING = ["Scoring your revenue health…", "Looking at how leads are handled…", "Reviewing your systems…", "Considering the client experience…", "Weighing your team and capacity…", "Reading the founder signals…", "Writing your advisor notes…", "Building your action plan…"];

const box = "w-full rounded-lg border border-[#1a2b4a]/25 bg-white px-3 py-2.5 text-base text-[#1a2b4a] dark:bg-[#1a2b4a]/40 dark:text-[#F8F5F0]";
const navy = "text-[#1a2b4a] dark:text-[#F8F5F0]";
const muted = "text-[#5a6472] dark:text-[#b8c2cf]";
const primary = "inline-flex items-center justify-center rounded-xl bg-[#1a2b4a] px-6 py-3 text-base font-semibold text-[#F8F5F0] hover:bg-[#243a63] disabled:opacity-40 dark:bg-[#c9a227] dark:text-[#1a2b4a] dark:hover:bg-[#d9b95a]";
const secondary = "inline-flex items-center justify-center rounded-xl border border-[#1a2b4a]/25 px-5 py-3 text-base font-semibold text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:border-white/25 dark:text-[#F8F5F0] dark:hover:bg-white/10";
const TONE: Record<"strong" | "good" | "watch" | "low", { text: string; bar: string; chip: string; stroke: string }> = {
  strong: { text: "text-[#2c6b3f] dark:text-[#9bd6ae]", bar: "bg-[#2c6b3f]", chip: "bg-[#2c6b3f]/15 text-[#2c6b3f] dark:text-[#9bd6ae]", stroke: "#2c6b3f" },
  good: { text: "text-[#8a6a15] dark:text-[#e6cf7a]", bar: "bg-[#c9a227]", chip: "bg-[#c9a227]/20 text-[#6b5410] dark:text-[#e6cf7a]", stroke: "#c9a227" },
  watch: { text: "text-[#8a6a15] dark:text-[#e6cf7a]", bar: "bg-[#c9a227]", chip: "bg-[#c9a227]/20 text-[#6b5410] dark:text-[#e6cf7a]", stroke: "#c9a227" },
  low: { text: "text-[#A4523C] dark:text-[#f0b8a4]", bar: "bg-[#A4523C]", chip: "bg-[#A4523C]/15 text-[#7d3a28] dark:text-[#f0b8a4]", stroke: "#A4523C" },
};

export default function HealthCheckApp() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [answers, setAnswers] = useState<Array<number | null>>(empty);
  const [current, setCurrent] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [emailed, setEmailed] = useState<boolean | null>(null);
  const [msg, setMsg] = useState(0);
  const [ready, setReady] = useState(false);

  // Pick up where this browser left off.
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null") as Saved | null;
      if (raw && Array.isArray(raw.answers) && raw.answers.length === QUESTION_COUNT) {
        setAnswers(raw.answers.map((a) => (typeof a === "number" && a >= 0 && a <= 3 ? a : null)));
        setCurrent(Math.min(QUESTION_COUNT - 1, Math.max(0, Number(raw.current) || 0)));
        if (raw.screen === "quiz" || raw.screen === "gate") setScreen(raw.screen);
        if (raw.firstName) setFirstName(raw.firstName);
        if (raw.businessName) setBusinessName(raw.businessName);
      }
    } catch {
      /* nothing saved */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || screen === "loading" || screen === "report") return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ answers, current, screen, firstName, businessName } satisfies Saved));
    } catch {
      /* not saved */
    }
  }, [ready, screen, answers, current, firstName, businessName]);

  // The "scoring" moment: cycle the messages, then show the report.
  useEffect(() => {
    if (screen !== "loading") return;
    setMsg(0);
    const t = setInterval(() => {
      setMsg((m) => {
        if (m + 1 >= LOADING.length) {
          clearInterval(t);
          setScreen("report");
          if (typeof window !== "undefined") window.scrollTo({ top: 0 });
          return m;
        }
        return m + 1;
      });
    }, 450);
    return () => clearInterval(t);
  }, [screen]);

  const complete = answers.every((a) => a !== null);
  const result = useMemo(() => (complete ? computeResult(answers as number[]) : null), [answers, complete]);
  const top = () => typeof window !== "undefined" && window.scrollTo({ top: 0, behavior: "smooth" });

  function pick(i: number) {
    setAnswers((a) => a.map((v, k) => (k === current ? i : v)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !complete) return;
    setBusy(true);
    setErr("");
    const sp = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"]) {
      const v = sp.get(k);
      if (v) utm[k] = v.slice(0, 120);
    }
    const eid = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
    const r = await fetch("/api/health-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, email, phone, businessName, answers, _hp: hp, _utm: utm, _eid: eid, _page: window.location.href }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r?.ok) return setErr(d.error || "Something went wrong. Please try again.");
    trackEvent("Lead", { content_name: "business_health_check" }, { eventID: eid });
    setEmailed(Boolean(d.emailed));
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* fine */
    }
    setScreen("loading");
    top();
  }

  function restart() {
    setAnswers(empty());
    setCurrent(0);
    setEmailed(null);
    setErr("");
    setScreen("intro");
    top();
  }

  if (!ready) return <main className="mx-auto max-w-2xl px-4 py-12" />;

  // ── Intro ──
  if (screen === "intro")
    return (
      <Shell>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#a8812b]">Free · about 5 minutes · instant results</p>
        <h1 className={`mt-2 text-3xl font-bold leading-tight ${navy}`}>The Business Health Check</h1>
        <p className={`mt-3 text-lg ${navy}`}>Find out where your business is strong and where it is leaking, before the gaps find you.</p>
        <p className={`mt-3 ${navy}`}>Twenty-five questions across six areas. When you finish you get a personal scorecard, written advisor notes and a ranked action plan. No generic advice.</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <li key={c.key} className="flex items-start gap-3 rounded-xl border border-[#1a2b4a]/10 bg-white p-3 dark:border-white/10 dark:bg-[#1a2b4a]/40">
              <span aria-hidden="true" className="text-xl">{c.icon}</span>
              <span>
                <span className={`block font-semibold ${navy}`}>{c.name}</span>
                <span className={`block text-sm ${muted}`}>{QUESTIONS.filter((q) => q.cat === c.key).length} questions</span>
              </span>
            </li>
          ))}
        </ul>
        <p className={`mt-5 text-sm ${muted}`}>There are no wrong answers. Answer for the business as it is today, not as you hope it will be.</p>
        <button className={`${primary} mt-6`} onClick={() => { setScreen("quiz"); top(); }}>{answers.some((a) => a !== null) ? "Continue my check" : "Start my free check"}</button>
        <p className={`mt-6 text-sm ${muted}`}>From AmiLynne &lsquo;Babs&rsquo; Carroll, Alignment Architect.</p>
      </Shell>
    );

  // ── One question at a time ──
  if (screen === "quiz") {
    const q = QUESTIONS[current];
    const cat = CATEGORIES.find((c) => c.key === q.cat)!;
    const last = current === QUESTION_COUNT - 1;
    return (
      <Shell>
        <Progress label={`Question ${current + 1} of ${QUESTION_COUNT}`} value={current / QUESTION_COUNT} />
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-[#a8812b]"><span aria-hidden="true">{cat.icon} </span>{cat.name}</p>
        <fieldset className="mt-2">
          <legend className={`text-xl font-semibold leading-snug ${navy}`}>{q.text}</legend>
          <div className="mt-4 space-y-2">
            {q.options.map((o, i) => (
              <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-base ${answers[current] === i ? "border-[#c9a227] bg-[#c9a227]/15" : "border-[#1a2b4a]/15 bg-white hover:bg-[#1a2b4a]/5 dark:border-white/15 dark:bg-[#1a2b4a]/40 dark:hover:bg-white/10"} ${navy}`}>
                <input type="radio" name={`q${current}`} checked={answers[current] === i} onChange={() => pick(i)} className="mt-1 h-4 w-4 shrink-0 accent-[#1a2b4a]" />
                <span><b className="mr-2 text-[#a8812b]">{LETTERS[i]}</b>{o}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-8 flex items-center justify-between gap-3">
          <button type="button" className={secondary} onClick={() => { if (current === 0) { setScreen("intro"); } else setCurrent(current - 1); top(); }}>Back</button>
          <button type="button" className={primary} disabled={answers[current] === null} onClick={() => { if (last) setScreen("gate"); else setCurrent(current + 1); top(); }}>{last ? "See my results" : "Next"}</button>
        </div>
      </Shell>
    );
  }

  // ── Name and email ──
  if (screen === "gate")
    return (
      <Shell>
        <Progress label="All 25 questions answered" value={1} />
        <h1 className={`mt-6 text-2xl font-bold leading-tight ${navy}`}>Your report is ready. Where should we send your scores?</h1>
        <p className={`mt-2 ${muted}`}>You will see your full report on the next screen, and we will email you your scores too.</p>
        <form onSubmit={submit} className="mt-5 space-y-3 rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 dark:bg-[#1a2b4a]/40">
          <label className={`block text-sm font-medium ${navy}`}>First name<input className={box} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required /></label>
          <label className={`block text-sm font-medium ${navy}`}>Email<input type="email" className={box} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label className={`block text-sm font-medium ${navy}`}>Business name <span className={`font-normal ${muted}`}>(optional)</span><input className={box} value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoComplete="organization" /></label>
          <label className={`block text-sm font-medium ${navy}`}>Phone <span className={`font-normal ${muted}`}>(optional)</span><input type="tel" className={box} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></label>
          <input aria-hidden="true" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" name="website" />
          {err && <p role="alert" className="text-sm font-medium text-[#A4523C]">{err}</p>}
          <button type="submit" className={`${primary} w-full`} disabled={busy}>{busy ? "Scoring…" : "Show me my report"}</button>
          <p className={`text-xs ${muted}`}>By continuing you will also get occasional emails from AmiLynne Carroll. You can unsubscribe in one click at any time. We never sell your information or share your answers.</p>
        </form>
        <div className="mt-5"><button className={secondary} onClick={() => { setScreen("quiz"); setCurrent(QUESTION_COUNT - 1); top(); }}>Back</button></div>
      </Shell>
    );

  // ── The scoring moment ──
  if (screen === "loading")
    return (
      <Shell>
        <div className="py-16 text-center" role="status" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#a8812b]">Analyzing your business</p>
          <p className={`mt-4 text-xl ${navy}`}>{LOADING[msg]}</p>
          <div className="mx-auto mt-6 h-2 w-64 overflow-hidden rounded-full bg-[#1a2b4a]/10 dark:bg-white/15">
            <div className="h-full rounded-full bg-[#c9a227] transition-all duration-500" style={{ width: `${((msg + 1) / LOADING.length) * 100}%` }} />
          </div>
        </div>
      </Shell>
    );

  // ── Report ──
  return result ? (
    <Shell wide>
      <Report result={result} answers={answers as number[]} firstName={firstName} emailed={emailed} onRestart={restart} />
    </Shell>
  ) : null;
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <main className={`mx-auto px-4 py-10 ${wide ? "max-w-3xl" : "max-w-2xl"}`}>{children}</main>;
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

/** A paragraph with **bold** lead-ins, without letting any HTML through. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>))}
    </>
  );
}

function ScoreRing({ pct, stroke }: { pct: number; stroke: string }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <svg viewBox="0 0 170 170" className="h-40 w-40 shrink-0" role="img" aria-label={`Overall score ${pct} percent`}>
      <circle cx="85" cy="85" r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="12" />
      <circle cx="85" cy="85" r={r} fill="none" stroke={stroke} strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (shown / 100) * c} transform="rotate(-90 85 85)" style={{ transition: "stroke-dashoffset 1.6s ease-out" }} />
      <text x="85" y="92" textAnchor="middle" fontSize="40" fontWeight="700" fill={stroke}>{pct}</text>
      <text x="85" y="114" textAnchor="middle" fontSize="12" fill="currentColor" fillOpacity="0.6">out of 100</text>
    </svg>
  );
}

function Report({ result, answers, firstName, emailed, onRestart }: { result: HealthResult; answers: number[]; firstName: string; emailed: boolean | null; onRestart: () => void }) {
  const g = result.grade;
  const [first, second] = result.gaps;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#a8812b]">Your Business Health Report</p>
        <div className="flex gap-2">
          <button className={`${secondary} !px-4 !py-2 !text-sm`} onClick={() => window.print()}>Save as PDF</button>
          <button className={`${secondary} !px-4 !py-2 !text-sm`} onClick={onRestart}>Retake</button>
        </div>
      </div>
      <h1 className={`mt-2 text-3xl font-bold leading-tight ${navy}`}>{firstName ? `${firstName}, here is the health of your business.` : "Here is the health of your business."}</h1>
      {emailed === true && <p className={`mt-2 text-sm ${muted} print:hidden`}>We have emailed you your scores.</p>}

      <section className={`mt-6 flex flex-col items-center gap-6 rounded-2xl border border-[#1a2b4a]/10 bg-white p-6 sm:flex-row dark:border-white/10 dark:bg-[#1a2b4a]/40 ${navy}`}>
        <ScoreRing pct={result.overall} stroke={TONE[g.tone].stroke} />
        <div>
          <p className={`text-sm font-semibold uppercase tracking-widest ${TONE[g.tone].text}`}>Grade {g.grade}</p>
          <h2 className="mt-1 text-2xl font-bold">{g.label}</h2>
          <p className={`mt-2 ${muted}`}>{g.sub}</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className={`text-xl font-bold ${navy}`}>Where you are strong, and where you are leaking</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {result.categories.map((c) => (
            <li key={c.key} className="rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:border-white/10 dark:bg-[#1a2b4a]/40">
              <p className={`font-semibold ${navy}`}><span aria-hidden="true" className="mr-2">{c.icon}</span>{c.name}</p>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#1a2b4a]/10 dark:bg-white/15" role="img" aria-label={`${c.pct} percent`}>
                <div className={`h-full rounded-full ${TONE[c.tier.tone].bar}`} style={{ width: `${c.pct}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-lg font-bold tabular-nums ${TONE[c.tier.tone].text}`}>{c.pct}%</span>
                <span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${TONE[c.tier.tone].chip}`}>{c.tier.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border-l-4 border-[#c9a227] bg-[#c9a227]/10 p-5">
        <h2 className={`text-xl font-bold ${navy}`}>Your advisor notes</h2>
        <p className={`mt-3 ${navy}`}>Based on your 25 answers, your business scores <b>{result.overall}%</b>: {g.label.toLowerCase()}.</p>
        <p className={`mt-4 ${navy}`}><b className="block text-[#2c6b3f] dark:text-[#9bd6ae]">✓ Your strongest area: {result.strongest.name} ({result.strongest.pct}%)</b>That is a real foundation. Protect it while you fix what is weaker.</p>
        <p className={`mt-4 ${navy}`}><b className="block text-[#A4523C] dark:text-[#f0b8a4]">⚠ Biggest gap: {first.name} ({first.pct}%)</b>{adviceFor(first)}</p>
        <p className={`mt-4 ${navy}`}><b className="block text-[#A4523C] dark:text-[#f0b8a4]">⚠ Second priority: {second.name} ({second.pct}%)</b>{adviceFor(second)}</p>
        {insightsFor(answers).map((t, i) => (
          <p key={i} className={`mt-4 ${navy}`}><Rich text={t} /></p>
        ))}
        <p className={`mt-5 border-l-2 border-[#c9a227] pl-4 italic ${navy}`}>The businesses that grow fastest are not the ones that work hardest. They fix the right leak first. You now know where yours are.</p>
      </section>

      <section className="mt-8">
        <h2 className={`text-xl font-bold ${navy}`}>Your action plan</h2>
        <p className={`mt-1 ${muted}`}>Ranked by impact. Take them in order.</p>
        <ol className="mt-4 space-y-3">
          {result.priorities.map((p, i) => (
            <li key={p.title} className="flex gap-4 rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:border-white/10 dark:bg-[#1a2b4a]/40">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a2b4a] font-bold text-[#F8F5F0] dark:bg-[#c9a227] dark:text-[#1a2b4a]">{i + 1}</span>
              <div>
                <p className={`font-semibold ${navy}`}>{p.title}</p>
                <p className={`mt-1 text-sm ${muted}`}>{p.desc}</p>
                <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${p.tag === "high" ? TONE.low.chip : p.tag === "quick" ? TONE.strong.chip : TONE.good.chip}`}>{TAG_LABEL[p.tag]}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 rounded-2xl bg-[#1a2b4a] p-6 text-[#F8F5F0] print:border print:bg-white print:text-black">
        <h2 className="text-xl font-bold">Want help closing these gaps?</h2>
        <p className="mt-2 text-[#dfe5ee] print:text-black">Book an Executive Consultation. We will look at your scores together and talk through the right next step for your business.</p>
        <a href="/schedule/masterclass" className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#c9a227] px-6 py-3 font-semibold text-[#1a2b4a] hover:bg-[#d9b95a] print:hidden">Book my Executive Consultation</a>
        <p className="mt-5 text-sm text-[#b8c2cf] print:text-black">Prefer to learn first? <a href="/masterclass-signup" className="underline">Join the free Command Shift MasterClass</a>.</p>
      </section>
      <p className={`mt-6 text-sm ${muted}`}>Head up - Wings out, Babs</p>
    </div>
  );
}
