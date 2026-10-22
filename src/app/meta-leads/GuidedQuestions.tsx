"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, suggestedTargetCpl, breakEvenCpl, type Goals, type Guidance } from "@/lib/metaAdsReport";

const FIELD_OF: Record<string, keyof Goals> = { goalLeads: "goalLeads", eventDate: "eventAnchor", cycleDays: "cycleDays", customerValue: "customerValue", targetCpl: "targetCpl", dailyBudget: "dailyBudget", monthlyLimit: "monthlyLimit" };

function initial(goals: Goals): Record<string, string> {
  const out: Record<string, string> = { ...goals.answers };
  for (const [id, f] of Object.entries(FIELD_OF)) {
    const v = goals[f];
    if (v != null && !out[id]) out[id] = String(v);
  }
  return out;
}

// A short guided set of questions. The answers set the owner's own yardstick (what a lead is worth), which the weekly report then uses
// for every verdict, and they feed the "What your answers say" notes.
export default function GuidedQuestions({ goals, adNames, guidance }: { goals: Goals; adNames: string[]; guidance: Guidance[] }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [a, setA] = useState<Record<string, string>>(() => initial(goals));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const q = QUESTIONS[i];
  const set = (v: string) => setA((p) => ({ ...p, [q.id]: v }));
  const answered = QUESTIONS.filter((x) => (a[x.id] ?? "").trim()).length;

  const live: Goals = { ...goals, customerValue: Number(a.customerValue) || null, answers: a };
  const be = breakEvenCpl(live);
  const sug = suggestedTargetCpl(live);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/meta-ads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "goals", answers: a }) });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setMsg({ ok: true, text: "Saved. Your report now uses your answers." });
        router.refresh();
      } else setMsg({ ok: false, text: j.error ?? "Couldn't save." });
    } catch {
      setMsg({ ok: false, text: "No connection. Try again." });
    }
    setBusy(false);
  }

  const input = "mt-3 w-full max-w-sm rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]";
  return (
    <div className="mt-2 rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/40">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#7a8a99]">
        <span>Question {i + 1} of {QUESTIONS.length}</span>
        <span>{answered} answered</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#1a2b4a]/10" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={answered} aria-label="Questions answered">
        <div className="h-full bg-[#c9a227]" style={{ width: `${(answered / QUESTIONS.length) * 100}%` }} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{q.text}</h3>
      <p className="mt-1 max-w-2xl text-sm text-[#5a6472] dark:text-[#b8c2cf]">{q.why}</p>

      {q.kind === "choice" && (
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={q.text}>
          {q.choices!.map((c) => (
            <button key={c.value} role="radio" aria-checked={a[q.id] === c.value} onClick={() => set(c.value)} className={`rounded-full border px-4 py-2 text-sm ${a[q.id] === c.value ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
              {c.label}
            </button>
          ))}
        </div>
      )}
      {q.kind === "ad" && (
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={q.text}>
          {adNames.map((n) => (
            <button key={n} role="radio" aria-checked={a[q.id] === n} onClick={() => set(n)} className={`rounded-full border px-4 py-2 text-sm ${a[q.id] === n ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
              {n}
            </button>
          ))}
          {!adNames.length && <p className="text-sm text-[#7a8a99]">Add an export first and your ads will appear here.</p>}
        </div>
      )}
      {(q.kind === "money" || q.kind === "number") && (
        <input inputMode="decimal" value={a[q.id] ?? ""} onChange={(e) => set(e.target.value)} className={input} aria-label={q.text} placeholder={q.kind === "money" ? "$" : ""} />
      )}
      {q.kind === "date" && <input type="date" value={a[q.id] ?? ""} onChange={(e) => set(e.target.value)} className={input} aria-label={q.text} />}

      {q.id === "targetCpl" && (
        <div className="mt-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
          {sug != null ? (
            <p>
              From your answers, a sign-up is worth up to <b>${be!.toFixed(2)}</b> to you. A good target is <b>${sug.toFixed(2)}</b>.{" "}
              <button className="underline" onClick={() => set(String(sug))}>Use ${sug.toFixed(2)}</button>
            </p>
          ) : (
            <p className="text-[#5a6472] dark:text-[#b8c2cf]">Answer the questions about what a client is worth and how many sign-ups become clients and I will suggest a number here. Or type your own.</p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-lg border border-[#1a2b4a]/20 px-4 py-2 text-sm text-[#1a2b4a] disabled:opacity-40 dark:text-[#F8F5F0]">Back</button>
        {i < QUESTIONS.length - 1 ? (
          <button onClick={() => setI(i + 1)} className="rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-medium text-white">{(a[q.id] ?? "").trim() ? "Next" : "Skip"}</button>
        ) : (
          <button disabled={busy} onClick={() => void save()} className="rounded-lg bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#1a2b4a] disabled:opacity-50">Save and see my next steps</button>
        )}
        {i < QUESTIONS.length - 1 && <button disabled={busy} onClick={() => void save()} className="text-sm underline text-[#1a2b4a] dark:text-[#F8F5F0]">Save what I have</button>}
        {msg && <span role="status" className={`text-sm ${msg.ok ? "text-[#1a2b4a] dark:text-[#F8F5F0]" : "text-[#A4523C]"}`}>{msg.text}</span>}
      </div>
      {guidance.length > 0 && (
        <div className="mt-6 border-t border-[#1a2b4a]/10 pt-4">
          <h4 className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Your next steps, from your answers</h4>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {guidance.map((g) => (
              <div key={g.title} className="rounded-lg bg-[#1a2b4a]/5 p-3">
                <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{g.title}</p>
                <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">{g.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#7a8a99]">Your answers also set the yardstick every ad is judged against in the report above.</p>
        </div>
      )}
    </div>
  );
}
