"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
} from "lucide-react";

interface Entry {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

export default function QAPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Add-your-own state.
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ category: "General", question: "", answer: "", keywords: "" });
  const [saveErr, setSaveErr] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/qa");
      const d = await res.json().catch(() => ({}));
      if (Array.isArray(d.entries)) setEntries(d.entries);
      if (Array.isArray(d.categories)) setCategories(d.categories);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (activeCat !== "All" && e.category !== activeCat) return false;
      if (!q) return true;
      const hay = `${e.question} ${e.answer} ${e.keywords.join(" ")} ${e.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [entries, query, activeCat]);

  const grouped = useMemo(() => {
    const m = new Map<string, Entry[]>();
    for (const e of filtered) {
      if (!m.has(e.category)) m.set(e.category, []);
      m.get(e.category)!.push(e);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const saveDraft = async () => {
    if (!draft.question.trim() || !draft.answer.trim()) {
      setSaveErr("Add both a question and an answer.");
      return;
    }
    setSaveErr("");
    const res = await fetch("/api/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const d = await res.json().catch(() => ({}));
    if (d.entry) {
      setEntries((prev) => [...prev, d.entry]);
      if (!categories.includes(d.entry.category)) setCategories((prev) => [...prev, d.entry.category]);
      setDraft({ category: "General", question: "", answer: "", keywords: "" });
      setAdding(false);
    } else {
      setSaveErr(d.error || "Couldn't save.");
    }
  };

  const remove = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/qa?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  };

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#2E7C83] hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7b6b8d] to-[#2E7C83] flex items-center justify-center">
          <HelpCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Help & Q&amp;A</h1>
          <p className="text-[#b8a898]">Everything LifeCharter can do — and how it works.</p>
        </div>
      </div>

      <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf] mb-6 flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-[#2E7C83]" />
        Your Travel Partner widget answers from this same knowledge base — open it and switch to <strong className="mx-1">Ask</strong>.
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b8a898]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the knowledge base…"
          className="w-full pl-10 pr-3 h-11 rounded-xl border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/30 text-[#1a2b4a] dark:text-[#F8F5F0]"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["All", ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              activeCat === c
                ? "bg-[#2E7C83] text-white border-[#2E7C83]"
                : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {!loaded ? (
        <p className="text-sm text-[#b8a898]">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[#b8a898]">No matches. Try a different search, or add your own Q&amp;A below.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7a8a99] mb-2">{cat}</h2>
              <div className="space-y-2">
                {items.map((e) => {
                  const isOpen = open[e.id];
                  const isCustom = e.id.startsWith("custom:");
                  return (
                    <div
                      key={e.id}
                      className="rounded-xl border border-[#1a2b4a]/12 bg-white dark:bg-[#1a2b4a]/30 overflow-hidden"
                    >
                      <button
                        onClick={() => setOpen((p) => ({ ...p, [e.id]: !p[e.id] }))}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#2E7C83]/5"
                      >
                        <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{e.question}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#b8a898] flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#b8a898] flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4">
                          <p className="text-sm text-[#3a3630] dark:text-[#d8d2c8] leading-relaxed">{e.answer}</p>
                          {isCustom && (
                            <button
                              onClick={() => remove(e.id)}
                              className="mt-3 inline-flex items-center gap-1 text-xs text-[#8a2f2f] hover:underline"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove this entry
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add your own */}
      <div className="mt-8 pt-6 border-t border-[#1a2b4a]/10">
        {adding ? (
          <div className="rounded-xl border border-[#2E7C83]/40 bg-[#2E7C83]/5 p-4 space-y-2">
            <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Add a Q&amp;A entry</p>
            <input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="Category"
              className="w-full px-3 h-9 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
            />
            <input
              value={draft.question}
              onChange={(e) => setDraft({ ...draft, question: e.target.value })}
              placeholder="Question"
              className="w-full px-3 h-9 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
            />
            <textarea
              value={draft.answer}
              onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
              placeholder="Answer"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
            />
            <input
              value={draft.keywords}
              onChange={(e) => setDraft({ ...draft, keywords: e.target.value })}
              placeholder="Keywords (comma-separated, optional)"
              className="w-full px-3 h-9 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
            />
            {saveErr && <p className="text-xs text-[#8a2f2f]">{saveErr}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={saveDraft}
                className="inline-flex items-center gap-1 text-sm font-medium px-3 h-9 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71]"
              >
                <Check className="w-4 h-4" /> Save
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setSaveErr("");
                }}
                className="inline-flex items-center gap-1 text-sm font-medium px-3 h-9 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-xl border border-dashed border-[#2E7C83]/40 text-[#2E7C83] hover:bg-[#2E7C83]/5"
          >
            <Plus className="w-4 h-4" /> Add your own Q&amp;A
          </button>
        )}
      </div>
    </div>
  );
}
