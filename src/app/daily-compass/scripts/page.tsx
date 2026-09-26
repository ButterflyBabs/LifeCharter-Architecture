"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Copy,
  CheckCircle,
  Sparkles,
  Search,
  Star,
  Plus,
  Wand2,
  Loader2,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Share2,
  SlidersHorizontal,
  BookmarkPlus,
  Library,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { SCRIPT_CATEGORIES, SCRIPT_CHANNELS } from "@/lib/scriptsSeed";
import { SCRIPT_LIBRARY, extractFields, fillFields } from "@/lib/scriptLibrary";

interface Script {
  id: string;
  title: string;
  description: string;
  itemType: "script" | "template";
  category: string;
  channel: string;
  content: string;
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  lastUsed: string | null;
  source: string;
}

// Fields worth remembering between scripts (about you, not about a prospect).
const REMEMBER = /^(your|my|business|company|website|booking|phone|email|offer|program|service|signature)/i;
const DEFAULTS_KEY = "script-fill-defaults";
const loadDefaults = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(DEFAULTS_KEY) || "{}");
  } catch {
    return {};
  }
};
const AI_CHIPS = [
  { label: "Make it mine", text: "Use my business details and voice." },
  { label: "Shorter", text: "Make it shorter and tighter." },
  { label: "Warmer", text: "Make it warmer and more personal." },
  { label: "More direct", text: "Make it more direct and confident." },
];

type Working = {
  savedId: string | null; // set when this came from the client's own library
  title: string;
  description: string;
  itemType: "script" | "template";
  category: string;
  channel: string;
  tags: string[];
  base: string; // the text being filled in (original or AI-rewritten)
};

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  sales: <Phone className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  dm: <MessageSquare className="w-3.5 h-3.5" />,
  objection: <MessageSquare className="w-3.5 h-3.5" />,
  social: <Share2 className="w-3.5 h-3.5" />,
};

type FormState = {
  id: string | null;
  title: string;
  description: string;
  itemType: "script" | "template";
  category: string;
  channel: string;
  content: string;
  tags: string;
};

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  description: "",
  itemType: "script",
  category: "Sales",
  channel: "sales",
  content: "",
  tags: "",
};

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [favOnly, setFavOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"mine" | "library">("mine");
  const [savedLibIds, setSavedLibIds] = useState<Set<string>>(new Set());

  // Fill-in & AI panel.
  const [work, setWork] = useState<Working | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [aiText, setAiText] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [rewriteNote, setRewriteNote] = useState("");
  const [workMsg, setWorkMsg] = useState("");
  const [workNeedsKey, setWorkNeedsKey] = useState(false);
  const [workSaving, setWorkSaving] = useState(false);

  // Editor modal.
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  // AI-guided generation.
  const [aiMode, setAiMode] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const [ai, setAi] = useState({ purpose: "", audience: "", channel: "sales", tone: "warm and professional", keyPoints: "", itemType: "script" as "script" | "template" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/scripts");
      const d = await res.json().catch(() => ({}));
      if (Array.isArray(d.items)) setScripts(d.items);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const libraryAsScripts: Script[] = useMemo(
    () =>
      SCRIPT_LIBRARY.map((l) => ({
        id: l.id, title: l.title, description: l.description, itemType: l.itemType, category: l.category,
        channel: l.channel, content: l.content, tags: l.tags, isFavorite: false, usageCount: 0, lastUsed: null, source: "library",
      })),
    []
  );
  const isLib = tab === "library";
  const pool = isLib ? libraryAsScripts : scripts;

  const filtered = pool.filter((s) => {
    if (!isLib && favOnly && !s.isFavorite) return false;
    if (cat !== "All" && s.category !== cat) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const copy = async (s: Script) => {
    try {
      await navigator.clipboard.writeText(s.content);
    } catch {
      /* clipboard may be blocked; still record use */
    }
    setCopiedId(s.id);
    setTimeout(() => setCopiedId((c) => (c === s.id ? null : c)), 2000);
    if (s.id.startsWith("lib-")) return; // starter items aren't tracked
    setScripts((prev) => prev.map((x) => (x.id === s.id ? { ...x, usageCount: x.usageCount + 1 } : x)));
    fetch("/api/scripts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, action: "use" }),
    });
  };

  const toggleFav = async (s: Script) => {
    const next = !s.isFavorite;
    setScripts((prev) => prev.map((x) => (x.id === s.id ? { ...x, isFavorite: next } : x)));
    fetch("/api/scripts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, isFavorite: next }),
    });
  };

  const remove = async (id: string) => {
    setScripts((prev) => prev.filter((x) => x.id !== id));
    fetch(`/api/scripts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  };

  // Copy a starter item into this client's own library (their copy is private).
  const addToMine = async (s: Script) => {
    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: s.title, description: s.description, itemType: s.itemType, category: s.category, channel: s.channel, content: s.content, tags: s.tags, source: "library" }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.item) {
        setScripts((prev) => [d.item, ...prev]);
        setSavedLibIds((prev) => new Set(prev).add(s.id));
      }
    } catch {
      /* leave the button available to retry */
    }
  };

  const openFill = (s: Script) => {
    const remembered = loadDefaults();
    const init: Record<string, string> = {};
    for (const f of extractFields(s.content)) {
      const k = f.toLowerCase();
      if (remembered[k]) init[k] = remembered[k];
    }
    setValues(init);
    setAiText("");
    setRewriteNote("");
    setWorkMsg("");
    setWorkNeedsKey(false);
    setWork({
      savedId: s.id.startsWith("lib-") ? null : s.id,
      title: s.title, description: s.description, itemType: s.itemType, category: s.category, channel: s.channel, tags: s.tags, base: s.content,
    });
  };

  const workText = work ? aiText || work.base : "";
  const workFields = useMemo(() => extractFields(workText), [workText]);
  const filledText = useMemo(() => fillFields(workText, values), [workText, values]);
  const emptyFields = workFields.filter((f) => !(values[f.toLowerCase()] || "").trim()).length;

  const rememberValues = () => {
    try {
      const keep = loadDefaults();
      for (const f of workFields) {
        const k = f.toLowerCase();
        if (REMEMBER.test(f) && (values[k] || "").trim()) keep[k] = values[k].trim();
      }
      localStorage.setItem(DEFAULTS_KEY, JSON.stringify(keep));
    } catch {
      /* storage blocked — nothing to remember */
    }
  };

  const copyFilled = async () => {
    if (!work) return;
    try {
      await navigator.clipboard.writeText(filledText);
    } catch {
      /* clipboard may be blocked */
    }
    rememberValues();
    setWorkMsg("Copied.");
    if (work.savedId) {
      setScripts((prev) => prev.map((x) => (x.id === work.savedId ? { ...x, usageCount: x.usageCount + 1 } : x)));
      fetch("/api/scripts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: work.savedId, action: "use" }) });
    }
  };

  const rewrite = async (instruction: string) => {
    if (!work) return;
    setRewriting(true);
    setWorkMsg("");
    setWorkNeedsKey(false);
    try {
      const res = await fetch("/api/scripts/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: workText, instruction, title: work.title }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.needsKey) setWorkNeedsKey(true);
      else if (d.content) {
        setAiText(d.content);
        setRewriteNote(d.note || "Rewritten.");
      } else setWorkMsg(d.error || "Couldn't rewrite that.");
    } catch {
      setWorkMsg("Couldn't reach the AI just now.");
    } finally {
      setRewriting(false);
    }
  };

  // Keep the current version (fields filled or AI-rewritten) as a new item in
  // this client's own library.
  const saveWork = async () => {
    if (!work) return;
    setWorkSaving(true);
    setWorkMsg("");
    rememberValues();
    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: work.savedId || tab === "library" ? `${work.title} (mine)` : work.title,
          description: work.description, itemType: work.itemType, category: work.category, channel: work.channel,
          content: filledText, tags: work.tags, source: aiText ? "ai" : "manual",
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.item) {
        setScripts((prev) => [d.item, ...prev]);
        setWorkMsg("Saved to My Library.");
      } else setWorkMsg(d.error || "Couldn't save.");
    } finally {
      setWorkSaving(false);
    }
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setAiMode(false);
    setFormErr("");
    setNeedsKey(false);
    setEditorOpen(true);
  };

  const openEdit = (s: Script) => {
    setForm({
      id: s.id,
      title: s.title,
      description: s.description,
      itemType: s.itemType,
      category: s.category,
      channel: s.channel,
      content: s.content,
      tags: s.tags.join(", "),
    });
    setAiMode(false);
    setFormErr("");
    setEditorOpen(true);
  };

  const runAi = async () => {
    if (!ai.purpose.trim()) {
      setFormErr("Tell me what the script is for.");
      return;
    }
    setAiBusy(true);
    setFormErr("");
    setNeedsKey(false);
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ai),
      });
      const d = await res.json().catch(() => ({}));
      if (d.needsKey) {
        setNeedsKey(true);
      } else if (d.draft) {
        setForm({
          id: null,
          title: d.draft.title,
          description: d.draft.description,
          itemType: d.draft.itemType,
          category: d.draft.category,
          channel: d.draft.channel,
          content: d.draft.content,
          tags: (d.draft.tags || []).join(", "),
        });
        setAiMode(false); // drop into the editable form with the draft filled in
      } else {
        setFormErr(d.error || "Couldn't draft that.");
      }
    } catch {
      setFormErr("Couldn't reach the AI just now.");
    } finally {
      setAiBusy(false);
    }
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setFormErr("Give it a title and content.");
      return;
    }
    setSaving(true);
    setFormErr("");
    const payload = {
      title: form.title,
      description: form.description,
      itemType: form.itemType,
      category: form.category,
      channel: form.channel,
      content: form.content,
      tags: form.tags,
    };
    try {
      if (form.id) {
        const res = await fetch("/api/scripts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: form.id, ...payload }),
        });
        const d = await res.json().catch(() => ({}));
        if (d.ok) {
          setScripts((prev) =>
            prev.map((x) =>
              x.id === form.id
                ? { ...x, ...payload, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) }
                : x
            )
          );
          setEditorOpen(false);
        } else setFormErr(d.error || "Couldn't save.");
      } else {
        const res = await fetch("/api/scripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, source: form.tags.includes("ai") ? "ai" : "manual" }),
        });
        const d = await res.json().catch(() => ({}));
        if (d.item) {
          setScripts((prev) => [d.item, ...prev]);
          setEditorOpen(false);
        } else setFormErr(d.error || "Couldn't save.");
      }
    } finally {
      setSaving(false);
    }
  };

  const favCount = scripts.filter((s) => s.isFavorite).length;

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <Link
        href="/daily-compass"
        className="inline-flex items-center gap-1.5 text-sm text-[#2E7C83] hover:underline mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Daily Compass
      </Link>

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7b6b8d] to-[#2E7C83] flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Scripts &amp; Templates</h1>
            <p className="text-[#b8a898]">A starter library of {SCRIPT_LIBRARY.length} ready-to-use scripts and templates, plus your own — fill in, personalize with AI, and save.</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-xl bg-[#2E7C83] text-white hover:bg-[#256b71]"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1 bg-[#1a2b4a]/5 rounded-xl p-1 mb-4 max-w-md">
        <button
          onClick={() => setTab("mine")}
          className={`inline-flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg ${tab === "mine" ? "bg-white dark:bg-[#1a2b4a] text-[#1a2b4a] dark:text-[#F8F5F0] shadow-sm" : "text-[#7a8a99]"}`}
        >
          <BookOpen className="w-4 h-4" /> My Library{loaded ? ` (${scripts.length})` : ""}
        </button>
        <button
          onClick={() => setTab("library")}
          className={`inline-flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg ${tab === "library" ? "bg-white dark:bg-[#1a2b4a] text-[#2E7C83] shadow-sm" : "text-[#7a8a99]"}`}
        >
          <Library className="w-4 h-4" /> Starter Library ({SCRIPT_LIBRARY.length})
        </button>
      </div>
      {isLib ? (
        <p className="text-xs text-[#7a8a99] mb-4">
          Starter items are shared examples for everyone. Save one to <strong>My Library</strong> to make your own copy — what you save is private to your account.
        </p>
      ) : null}

      {/* Search + filters */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b8a898]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search scripts & templates…"
          className="w-full pl-10 pr-3 h-11 rounded-xl border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/30 text-[#1a2b4a] dark:text-[#F8F5F0]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {!isLib && <button
          onClick={() => setFavOnly((f) => !f)}
          className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border ${
            favOnly ? "bg-[#c9a227] text-[#1a2b4a] border-[#c9a227]" : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0]"
          }`}
        >
          <Star className="w-3.5 h-3.5" /> Favorites{favCount ? ` (${favCount})` : ""}
        </button>}
        {["All", ...SCRIPT_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              cat === c
                ? "bg-[#2E7C83] text-white border-[#2E7C83]"
                : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {!isLib && !loaded ? (
        <p className="text-sm text-[#b8a898]">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[#b8a898]">
          {!isLib && scripts.length === 0 ? (
            <>Your library is empty. Browse the <button onClick={() => setTab("library")} className="font-medium text-[#2E7C83] underline">Starter Library</button> and save the ones you like, or hit <strong>New</strong> to write or generate your own.</>
          ) : (
            <>Nothing matches. Try a different search or category.</>
          )}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.title}</h3>
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#2E7C83]/10 text-[#2E7C83]">
                        {CHANNEL_ICON[s.channel] || CHANNEL_ICON.sales}
                        {s.category}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1a2b4a]/8 text-[#7b6b8d] dark:text-[#e8e4f0] capitalize">
                        {s.itemType}
                      </span>
                      {s.source === "ai" && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full bg-[#c9a227]/15 text-[#8a6a15]">
                          <Sparkles className="w-3 h-3" /> AI
                        </span>
                      )}
                    </div>
                    {s.description && <p className="text-xs text-[#b8a898] mt-1">{s.description}</p>}
                  </div>
                  {!isLib && (
                    <button onClick={() => toggleFav(s)} aria-label="Favorite" className="flex-shrink-0">
                      <Star
                        className={`w-5 h-5 ${s.isFavorite ? "fill-[#c9a227] text-[#c9a227]" : "text-[#b8a898]"}`}
                      />
                    </button>
                  )}
                </div>

                {expanded === s.id && (
                  <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-[#3a3630] dark:text-[#d8d2c8] bg-[#1a2b4a]/4 dark:bg-[#0f2530] rounded-lg p-3 leading-relaxed">
                    {s.content}
                  </pre>
                )}

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => setExpanded((e) => (e === s.id ? null : s.id))}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7C83] hover:underline"
                  >
                    {expanded === s.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded === s.id ? "Hide" : "View"}
                  </button>
                  <button
                    onClick={() => openFill(s)}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71]"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Fill in &amp; personalize
                  </button>
                  <button
                    onClick={() => copy(s)}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#1a2b4a] text-white hover:bg-[#1a2b4a]/90"
                  >
                    {copiedId === s.id ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === s.id ? "Copied" : "Copy"}
                  </button>
                  {isLib ? (
                    <button
                      onClick={() => addToMine(s)}
                      disabled={savedLibIds.has(s.id) || scripts.some((x) => x.title === s.title && x.source === "library")}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5 disabled:opacity-60"
                    >
                      {savedLibIds.has(s.id) || scripts.some((x) => x.title === s.title && x.source === "library") ? (
                        <><CheckCircle className="w-3.5 h-3.5" /> In My Library</>
                      ) : (
                        <><BookmarkPlus className="w-3.5 h-3.5" /> Save to My Library</>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => openEdit(s)}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => remove(s.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#8a2f2f]/25 text-[#8a2f2f] hover:bg-[#8a2f2f]/5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </>
                  )}
                  {!isLib && s.usageCount > 0 && (
                    <span className="ml-auto text-[11px] text-[#b8a898]">Used {s.usageCount}×</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Fill in & personalize */}
      {work && (
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-[#111d33] rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2b4a]/10">
              <h2 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{work.title}</h2>
              <button onClick={() => setWork(null)} aria-label="Close">
                <X className="w-5 h-5 text-[#b8a898]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {workFields.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-[#7a8a99] mb-2">
                    Fill in the blanks{emptyFields > 0 ? ` — ${emptyFields} left` : " — all set"}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {workFields.map((f) => (
                      <input
                        key={f}
                        id={`fill-${f}`}
                        aria-label={f}
                        value={values[f.toLowerCase()] || ""}
                        onChange={(e) => setValues((v) => ({ ...v, [f.toLowerCase()]: e.target.value }))}
                        placeholder={f}
                        className="w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#7a8a99]">This one has no blanks to fill in — it&apos;s ready to use as written.</p>
              )}

              <div>
                <p className="text-xs font-medium text-[#7a8a99] mb-2">Preview</p>
                <pre className="whitespace-pre-wrap font-sans text-sm text-[#3a3630] dark:text-[#d8d2c8] bg-[#1a2b4a]/4 dark:bg-[#0f2530] rounded-lg p-3 leading-relaxed max-h-72 overflow-y-auto">
                  {filledText}
                </pre>
              </div>

              <div className="rounded-xl border border-[#2E7C83]/25 bg-[#2E7C83]/5 p-3 space-y-2">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E7C83]">
                  <Wand2 className="w-3.5 h-3.5" /> Ask your AI assistant to rewrite it
                </p>
                <div className="flex flex-wrap gap-2">
                  {AI_CHIPS.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => rewrite(c.text)}
                      disabled={rewriting}
                      className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#2E7C83]/30 text-[#2E7C83] hover:bg-[#2E7C83]/10 disabled:opacity-60"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = (new FormData(e.currentTarget).get("instruction") as string) || "";
                    if (v.trim()) rewrite(v.trim());
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="instruction"
                    aria-label="What to change"
                    placeholder="Or say what to change — e.g. “for busy new moms”"
                    className="flex-1 px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                  <button
                    type="submit"
                    disabled={rewriting}
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-3 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
                  >
                    {rewriting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Rewrite
                  </button>
                </form>
                {rewriteNote && (
                  <p className="text-xs text-[#5a6472] dark:text-[#c3ccd8]">
                    {rewriteNote}{" "}
                    <button onClick={() => { setAiText(""); setRewriteNote(""); }} className="underline font-medium">Undo rewrite</button>
                  </p>
                )}
                {workNeedsKey && <p className="text-xs text-[#8a6a15]">Connect your AI key in Settings to use your assistant here.</p>}
              </div>

              {workMsg && <p className="text-xs text-[#5a6472] dark:text-[#c3ccd8]">{workMsg}</p>}
              <div className="flex items-center gap-2 justify-end flex-wrap">
                <button
                  onClick={saveWork}
                  disabled={workSaving}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5 disabled:opacity-60"
                >
                  {workSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
                  Save to My Library
                </button>
                <button
                  onClick={copyFilled}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-[#1a2b4a] text-white hover:bg-[#1a2b4a]/90"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor / AI modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-[#111d33] rounded-2xl shadow-2xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2b4a]/10">
              <h2 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                {form.id ? "Edit" : aiMode ? "Generate with AI" : "New script or template"}
              </h2>
              <button onClick={() => setEditorOpen(false)} aria-label="Close">
                <X className="w-5 h-5 text-[#b8a898]" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {!form.id && (
                <div className="grid grid-cols-2 gap-1 bg-[#1a2b4a]/5 rounded-lg p-1">
                  <button
                    onClick={() => setAiMode(false)}
                    className={`text-sm font-medium py-1.5 rounded-md ${!aiMode ? "bg-white dark:bg-[#1a2b4a] text-[#1a2b4a] dark:text-[#F8F5F0] shadow-sm" : "text-[#7a8a99]"}`}
                  >
                    Write it myself
                  </button>
                  <button
                    onClick={() => setAiMode(true)}
                    className={`inline-flex items-center justify-center gap-1.5 text-sm font-medium py-1.5 rounded-md ${aiMode ? "bg-white dark:bg-[#1a2b4a] text-[#2E7C83] shadow-sm" : "text-[#7a8a99]"}`}
                  >
                    <Wand2 className="w-4 h-4" /> AI (guided)
                  </button>
                </div>
              )}

              {needsKey && (
                <p className="text-xs text-[#8a6a15]">
                  Connect your AI key in settings to generate scripts with AI.
                </p>
              )}
              {formErr && <p className="text-xs text-[#8a2f2f]">{formErr}</p>}

              {aiMode && !form.id ? (
                <>
                  <label className="block text-xs font-medium text-[#7a8a99]">What is this script for? *</label>
                  <input
                    value={ai.purpose}
                    onChange={(e) => setAi({ ...ai, purpose: e.target.value })}
                    placeholder="e.g. Booking a discovery call from a warm lead"
                    className="w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                  <label className="block text-xs font-medium text-[#7a8a99]">Who&apos;s it for?</label>
                  <input
                    value={ai.audience}
                    onChange={(e) => setAi({ ...ai, audience: e.target.value })}
                    placeholder="e.g. Coaches who attended my free workshop"
                    className="w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-[#7a8a99]">Channel</label>
                      <select
                        value={ai.channel}
                        onChange={(e) => setAi({ ...ai, channel: e.target.value })}
                        className="w-full h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                      >
                        {SCRIPT_CHANNELS.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#7a8a99]">Type</label>
                      <select
                        value={ai.itemType}
                        onChange={(e) => setAi({ ...ai, itemType: e.target.value as "script" | "template" })}
                        className="w-full h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                      >
                        <option value="script">Script</option>
                        <option value="template">Template</option>
                      </select>
                    </div>
                  </div>
                  <label className="block text-xs font-medium text-[#7a8a99]">Tone</label>
                  <input
                    value={ai.tone}
                    onChange={(e) => setAi({ ...ai, tone: e.target.value })}
                    placeholder="warm and professional"
                    className="w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                  <label className="block text-xs font-medium text-[#7a8a99]">Key points to include (optional)</label>
                  <textarea
                    value={ai.keyPoints}
                    onChange={(e) => setAi({ ...ai, keyPoints: e.target.value })}
                    rows={2}
                    placeholder="Offer, price, deadline, proof point…"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                  <button
                    onClick={runAi}
                    disabled={aiBusy}
                    className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
                  >
                    {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {aiBusy ? "Drafting…" : "Generate draft"}
                  </button>
                  <p className="text-[11px] text-[#b8a898] text-center">
                    The draft drops into an editable form — tweak it, then save.
                  </p>
                </>
              ) : (
                <>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Title"
                    className="w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="One-line description (optional)"
                    className="w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                    >
                      {SCRIPT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={form.channel}
                      onChange={(e) => setForm({ ...form, channel: e.target.value })}
                      className="h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                    >
                      {SCRIPT_CHANNELS.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                    <select
                      value={form.itemType}
                      onChange={(e) => setForm({ ...form, itemType: e.target.value as "script" | "template" })}
                      className="h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                    >
                      <option value="script">Script</option>
                      <option value="template">Template</option>
                    </select>
                  </div>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={10}
                    placeholder="Your script or template. Use [brackets] for anything personal."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] font-mono"
                  />
                  <input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="Tags (comma-separated)"
                    className="w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setEditorOpen(false)}
                      className="text-sm font-medium px-4 py-2 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={save}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Save to directory
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
