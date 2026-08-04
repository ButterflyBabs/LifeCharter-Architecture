"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Wand2, Loader2, Check, ChevronDown, ChevronUp, CircleDot, CheckCircle2 } from "lucide-react";

interface Section {
  key: string;
  title: string;
  description: string;
  baseline: boolean;
  guiding: string[];
  content: string;
  answers: Record<string, string>;
  status: string;
  source: string;
}

interface Data {
  blueprint: { kind: string; label: string; tagline: string };
  sections: Section[];
  baselineCompleteness: number;
  overallCompleteness: number;
  filledCount: number;
  total: number;
}

export default function PlanBuilder({ planType }: { planType: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [draftingKey, setDraftingKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/plans/sections?type=${planType}`);
      const d = await res.json().catch(() => ({}));
      if (d.sections) {
        setData(d);
        // Open the first unfilled baseline section by default.
        const first = (d.sections as Section[]).find((s) => s.baseline && !s.content.trim());
        if (first) setOpen({ [first.key]: true });
      }
    } finally {
      setLoaded(true);
    }
  }, [planType]);

  useEffect(() => {
    load();
  }, [load]);

  const patchLocal = (key: string, patch: Partial<Section>) =>
    setData((prev) =>
      prev ? { ...prev, sections: prev.sections.map((s) => (s.key === key ? { ...s, ...patch } : s)) } : prev
    );

  const recompute = (sections: Section[]) => {
    const filled = sections.filter((s) => s.content.trim());
    const baseline = sections.filter((s) => s.baseline);
    const baseDone = baseline.filter((s) => s.content.trim()).length;
    return {
      baselineCompleteness: baseline.length ? Math.round((baseDone / baseline.length) * 100) : 100,
      overallCompleteness: sections.length ? Math.round((filled.length / sections.length) * 100) : 0,
      filledCount: filled.length,
    };
  };

  const saveSection = async (key: string, opts: { content?: string; answers?: Record<string, string>; source?: string } = {}) => {
    const sec = data?.sections.find((s) => s.key === key);
    if (!sec) return;
    const content = opts.content !== undefined ? opts.content : sec.content;
    const answers = opts.answers !== undefined ? opts.answers : sec.answers;
    const status = content.trim() ? (opts.source === "ai" ? "drafted" : "edited") : "empty";
    setSavingKey(key);
    setErr("");
    try {
      await fetch("/api/plans/sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: planType, sectionKey: key, content, answers, status, source: opts.source }),
      });
      setSavedKey(key);
      setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1500);
    } finally {
      setSavingKey(null);
    }
    // Recompute meters after a content change.
    setData((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s) => (s.key === key ? { ...s, content, answers, status } : s));
      return { ...prev, sections, ...recompute(sections) };
    });
  };

  const draft = async (key: string) => {
    const sec = data?.sections.find((s) => s.key === key);
    if (!sec) return;
    setDraftingKey(key);
    setNeedsKey(false);
    setErr("");
    try {
      const res = await fetch("/api/plans/sections/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: planType, sectionKey: key, answers: sec.answers }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.needsKey) {
        setNeedsKey(true);
      } else if (d.content) {
        patchLocal(key, { content: d.content, source: "ai" });
        await saveSection(key, { content: d.content, source: "ai" });
      } else {
        setErr(d.error || "Couldn't draft that.");
      }
    } catch {
      setErr("Couldn't reach the AI.");
    } finally {
      setDraftingKey(null);
    }
  };

  if (!loaded) return <p className="text-sm text-[#b8a898]">Loading your plan…</p>;
  if (!data) return <p className="text-sm text-[#b8a898]">Couldn&apos;t load this plan.</p>;

  return (
    <div>
      {/* Completeness header */}
      <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-5 mb-5">
        <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf] mb-3">{data.blueprint.tagline}</p>
        <div className="grid grid-cols-2 gap-4">
          <Meter label="Foundational baseline" pct={data.baselineCompleteness} accent="#2E7C83" />
          <Meter label="Overall depth" pct={data.overallCompleteness} accent="#7b6b8d" />
        </div>
        {data.baselineCompleteness < 100 && (
          <p className="text-xs text-[#8a6a15] mt-3">
            Fill the baseline sections (marked <strong>Foundational</strong>) for a plan that&apos;s meaningful and
            practical — go deeper wherever you like.
          </p>
        )}
      </div>

      {needsKey && (
        <p className="text-xs text-[#8a6a15] mb-3">Connect your AI key in settings to draft sections with AI.</p>
      )}
      {err && <p className="text-xs text-[#8a2f2f] mb-3">{err}</p>}

      <div className="space-y-3">
        {data.sections.map((s) => {
          const isOpen = open[s.key];
          const filled = s.content.trim().length > 0;
          return (
            <div key={s.key} className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 overflow-hidden">
              <button
                onClick={() => setOpen((p) => ({ ...p, [s.key]: !p[s.key] }))}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#2E7C83]/5"
              >
                {filled ? (
                  <CheckCircle2 className="w-5 h-5 text-[#2c6b3f] flex-shrink-0" />
                ) : (
                  <CircleDot className="w-5 h-5 text-[#b8a898] flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.title}</span>
                    {s.baseline ? (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#2E7C83]/12 text-[#2E7C83]">
                        Foundational
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#1a2b4a]/8 text-[#7a8a99]">
                        Optional
                      </span>
                    )}
                    {s.source === "ai" && filled && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[#c9a227]/15 text-[#8a6a15]">
                        <Sparkles className="w-2.5 h-2.5" /> AI draft
                      </span>
                    )}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-[#b8a898]" /> : <ChevronDown className="w-4 h-4 text-[#b8a898]" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf] mb-3">{s.description}</p>

                  {/* Guiding questions */}
                  {s.guiding.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {s.guiding.map((q, i) => (
                        <div key={i}>
                          <label className="block text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">{q}</label>
                          <input
                            value={s.answers[String(i)] || ""}
                            onChange={(e) => patchLocal(s.key, { answers: { ...s.answers, [String(i)]: e.target.value } })}
                            onBlur={() => saveSection(s.key)}
                            placeholder="Your answer (optional — helps the AI draft)"
                            className="w-full px-3 h-9 text-sm rounded-lg border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[#7a8a99]">Section content</label>
                    <button
                      onClick={() => draft(s.key)}
                      disabled={draftingKey === s.key}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
                    >
                      {draftingKey === s.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                      {filled ? "Redraft with AI" : "Draft with AI"}
                    </button>
                  </div>
                  <textarea
                    value={s.content}
                    onChange={(e) => patchLocal(s.key, { content: e.target.value })}
                    onBlur={() => saveSection(s.key)}
                    rows={6}
                    placeholder="Write this section, or let AI draft it from your assessments and answers above — then edit."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => saveSection(s.key)}
                      disabled={savingKey === s.key}
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
                    >
                      {savingKey === s.key ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : savedKey === s.key ? (
                        <Check className="w-3.5 h-3.5 text-[#2c6b3f]" />
                      ) : null}
                      {savedKey === s.key ? "Saved" : "Save"}
                    </button>
                    <span className="text-[11px] text-[#b8a898]">Autosaves when you click away.</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Meter({ label, pct, accent }: { label: string; pct: number; accent: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-[#7a8a99] dark:text-[#b8c2cf]">{label}</span>
        <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#1a2b4a]/8 overflow-hidden">
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: accent }} />
      </div>
    </div>
  );
}
