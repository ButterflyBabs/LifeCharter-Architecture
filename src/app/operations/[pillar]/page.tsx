"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { OPERATIONS_PILLARS, PILLAR_PLAN_LINK } from "@/lib/operations";
import type { DeeperAnswers, DeeperQuestion } from "@/lib/operationsDeeper";

const input = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";

// "Go deeper" for one operational pillar: a short set of questions, saved to the pillar and read by
// the Operations AI insights.
export default function PillarDeeperPage({ params }: { params: { pillar: string } }) {
  const def = OPERATIONS_PILLARS.find((p) => p.key === params.pillar);
  const [questions, setQuestions] = useState<DeeperQuestion[] | null>(null);
  const [answers, setAnswers] = useState<DeeperAnswers>({});
  const [saved, setSaved] = useState<DeeperAnswers>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/operations/deeper?pillar=${encodeURIComponent(params.pillar)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setQuestions(d.questions ?? []);
        setAnswers(d.answers ?? {});
        setSaved(d.answers ?? {});
      })
      .catch(() => setQuestions([]));
  }, [params.pillar]);

  const dirty = useMemo(() => JSON.stringify(answers) !== JSON.stringify(saved), [answers, saved]);
  const answered = (questions ?? []).filter((q) => {
    const v = answers[q.id];
    return Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim() !== "";
  }).length;

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/operations/deeper", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pillar: params.pillar, answers }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Couldn't save.");
      setAnswers(d.answers);
      setSaved(d.answers);
      setMsg("Saved. Your pillar score and Operations insights now use these answers.");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const setOne = (id: string, v: string | string[]) => setAnswers((a) => ({ ...a, [id]: v }));

  if (!def) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <Link href="/operations" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline"><ArrowLeft className="h-4 w-4" /> Operations</Link>
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Go deeper</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{def.name}</h1>
        <p className="mt-2 text-[15px] text-[#5b5f73] dark:text-[#b8a898]">{def.description}. Answer what you can; skip what doesn&rsquo;t apply. Your answers are part of this pillar&rsquo;s score and shape your Operations insights.</p>
        {questions && <p className="mt-2 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{answered} of {questions.length} answered</p>}
        {PILLAR_PLAN_LINK[def.key] && (
          <p className="mt-3 rounded-xl bg-[#c9a227]/10 px-4 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
            You plan this in your {PILLAR_PLAN_LINK[def.key].plan} (&ldquo;{PILLAR_PLAN_LINK[def.key].section}&rdquo;). Here you tell us how it&apos;s running, and your pillar score reflects it.{" "}
            <Link href={PILLAR_PLAN_LINK[def.key].href} className="font-semibold text-[#2E7C83] underline">Open the {PILLAR_PLAN_LINK[def.key].plan} →</Link>
          </p>
        )}
      </header>

      {!questions ? (
        <p className="text-sm text-[#7b6b8d]">Loading…</p>
      ) : (
        <div className="space-y-5">
          {questions.map((q, i) => (
            <fieldset key={q.id} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
              <legend className="sr-only">{q.q}</legend>
              <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]" aria-hidden="true"><span className="mr-1 text-[#c9a227]">{i + 1}.</span> {q.q}</p>
              {q.type === "choice" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {q.options.map((o) => {
                    const on = answers[q.id] === o;
                    return (
                      <button key={o} type="button" aria-pressed={on} onClick={() => setOne(q.id, on ? "" : o)} className={`rounded-full border px-3.5 py-1.5 text-sm ${on ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/15 text-[#1a2b4a] hover:border-[#c9a227] dark:text-[#F8F5F0] dark:border-white/15"}`}>
                        {o}
                      </button>
                    );
                  })}
                </div>
              )}
              {q.type === "multi" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {q.options.map((o) => {
                    const cur = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
                    const on = cur.includes(o);
                    return (
                      <button key={o} type="button" aria-pressed={on} onClick={() => setOne(q.id, on ? cur.filter((x) => x !== o) : [...cur, o])} className={`inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm ${on ? "border-[#2E7C83] bg-[#2E7C83] text-white" : "border-[#1a2b4a]/15 text-[#1a2b4a] hover:border-[#c9a227] dark:text-[#F8F5F0] dark:border-white/15"}`}>
                        {on && <Check className="h-3.5 w-3.5" />} {o}
                      </button>
                    );
                  })}
                  <p className="w-full text-xs text-[#7b6b8d]">Choose all that apply.</p>
                </div>
              )}
              {q.type === "text" && (
                <input aria-label={q.q} className={`${input} mt-3`} value={(answers[q.id] as string) || ""} placeholder={q.placeholder} onChange={(e) => setOne(q.id, e.target.value)} />
              )}
              {q.type === "textarea" && (
                <textarea aria-label={q.q} rows={3} className={`${input} mt-3`} value={(answers[q.id] as string) || ""} placeholder={q.placeholder} onChange={(e) => setOne(q.id, e.target.value)} />
              )}
            </fieldset>
          ))}
          <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#1a2b4a]/10 bg-[#FAF8F3]/95 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#141f38]/95">
            <button onClick={save} disabled={busy || !dirty} className="rounded-lg bg-[#1a2b4a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{busy ? "Saving…" : dirty ? "Save answers" : "Saved"}</button>
            <Link href="/operations" className="text-sm text-[#2E7C83] hover:underline">Back to Operations</Link>
            {msg && <span role="status" className="text-sm text-[#5b5f73] dark:text-[#b8a898]">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
