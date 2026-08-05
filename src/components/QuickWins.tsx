"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, Sparkles, Pencil, Trash2, Plus, Check, X, Loader2, Wand2 } from "lucide-react";

export interface QuickWin {
  id: string;
  title: string;
  detail: string;
  emoji: string;
  priority: "high" | "medium" | "low";
  source: string;
}

const PRIORITY_DOT: Record<string, string> = {
  high: "#c0632f",
  medium: "#c9a227",
  low: "#2E7C83",
};

interface Props {
  // "full" shows manage/add/AI controls; "compact" is click-to-add only.
  mode?: "full" | "compact";
  // How many to show in compact mode before "show all".
  compactLimit?: number;
  // "list" stacks vertically; "grid" lays wins out horizontally in columns.
  layout?: "list" | "grid";
  className?: string;
}

export default function QuickWins({ mode = "full", compactLimit = 4, layout = "list", className = "" }: Props) {
  const [wins, setWins] = useState<QuickWin[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState("");

  // Inline editor state (for add or edit).
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ title: string; detail: string; emoji: string; priority: string }>({
    title: "",
    detail: "",
    emoji: "⚡",
    priority: "medium",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/quick-wins");
      const d = await res.json().catch(() => ({}));
      if (Array.isArray(d.wins)) setWins(d.wins);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Clicking a win spins up a real task for today.
  const doWin = async (w: QuickWin) => {
    setBusyId(w.id);
    setError("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: w.title, priority: w.priority, status: "today" }),
      });
      if (!res.ok) throw new Error();
      setAddedId(w.id);
      setTimeout(() => setAddedId((cur) => (cur === w.id ? null : cur)), 2200);
    } catch {
      setError("Couldn't add that to your tasks — try again.");
    } finally {
      setBusyId(null);
    }
  };

  const startAdd = () => {
    setEditId("new");
    setDraft({ title: "", detail: "", emoji: "⚡", priority: "medium" });
    setError("");
  };
  const startEdit = (w: QuickWin) => {
    setEditId(w.id);
    setDraft({ title: w.title, detail: w.detail, emoji: w.emoji, priority: w.priority });
    setError("");
  };
  const cancelEdit = () => {
    setEditId(null);
    setError("");
  };

  const saveDraft = async () => {
    const title = draft.title.trim();
    if (!title) {
      setError("Give it a title.");
      return;
    }
    setAiBusy(false);
    if (editId === "new") {
      const res = await fetch("/api/quick-wins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, title }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.win) setWins((prev) => [...prev, d.win]);
      else setError(d.error || "Couldn't save.");
    } else if (editId) {
      const res = await fetch("/api/quick-wins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, ...draft, title }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok) {
        setWins((prev) =>
          prev.map((w) =>
            w.id === editId ? { ...w, ...draft, title, priority: draft.priority as QuickWin["priority"] } : w
          )
        );
      } else setError(d.error || "Couldn't save.");
    }
    setEditId(null);
  };

  const remove = async (id: string) => {
    setWins((prev) => prev.filter((w) => w.id !== id));
    await fetch(`/api/quick-wins?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  };

  // Improve the wording of the current draft with AI.
  const improveDraft = async () => {
    if (!draft.title.trim()) {
      setError("Type a rough idea first, then let AI polish it.");
      return;
    }
    setAiBusy(true);
    setError("");
    setNeedsKey(false);
    try {
      const res = await fetch("/api/quick-wins/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "improve", title: draft.title, detail: draft.detail }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.needsKey) setNeedsKey(true);
      else if (d.win) setDraft({ title: d.win.title, detail: d.win.detail, emoji: d.win.emoji, priority: d.win.priority });
      else setError(d.error || "Couldn't improve it.");
    } catch {
      setError("Couldn't reach AI.");
    } finally {
      setAiBusy(false);
    }
  };

  // Generate a brand-new AI quick win, tailored to the business, and save it.
  const generateWin = async () => {
    setAiBusy(true);
    setError("");
    setNeedsKey(false);
    try {
      const res = await fetch("/api/quick-wins/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "generate", existing: wins.map((w) => w.title) }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.needsKey) {
        setNeedsKey(true);
        return;
      }
      if (!d.win) {
        setError(d.error || "Couldn't generate one.");
        return;
      }
      const saveRes = await fetch("/api/quick-wins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d.win, source: "ai" }),
      });
      const saved = await saveRes.json().catch(() => ({}));
      if (saved.win) setWins((prev) => [...prev, saved.win]);
      else setError(saved.error || "Couldn't save the new win.");
    } catch {
      setError("Couldn't reach AI.");
    } finally {
      setAiBusy(false);
    }
  };

  const visible = mode === "compact" && !showAll ? wins.slice(0, compactLimit) : wins;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#c9a227]" />
          <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Quick Wins</h2>
        </div>
        {mode === "full" && (
          <div className="flex items-center gap-2">
            <button
              onClick={generateWin}
              disabled={aiBusy}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
            >
              {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              AI suggest
            </button>
            <button
              onClick={() => setManaging((m) => !m)}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
            >
              <Pencil className="w-3.5 h-3.5" />
              {managing ? "Done" : "Manage"}
            </button>
          </div>
        )}
      </div>

      {needsKey && (
        <p className="text-xs text-[#8a6a15] dark:text-[#e8cf8a] mb-2">
          Connect your AI key in settings to generate or polish quick wins with AI.
        </p>
      )}
      {error && <p className="text-xs text-[#8a2f2f] dark:text-[#f0b8b8] mb-2">{error}</p>}

      {!loaded ? (
        <p className="text-sm text-[#b8a898]">Loading…</p>
      ) : (
        <div className={layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 items-start" : "space-y-2"}>
          {visible.map((w) =>
            editId === w.id ? (
              <DraftEditor
                key={w.id}
                draft={draft}
                setDraft={setDraft}
                onSave={saveDraft}
                onCancel={cancelEdit}
                onImprove={improveDraft}
                aiBusy={aiBusy}
              />
            ) : (
              <div key={w.id} className="flex items-stretch gap-2">
                <button
                  onClick={() => doWin(w)}
                  disabled={busyId === w.id}
                  className="flex-1 flex items-center gap-3 text-left rounded-xl border border-[#1a2b4a]/12 bg-white dark:bg-[#1a2b4a]/30 px-3 py-2.5 hover:border-[#2E7C83]/50 hover:bg-[#2E7C83]/5 transition disabled:opacity-60"
                >
                  <span className="text-2xl">{w.emoji}</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PRIORITY_DOT[w.priority] || PRIORITY_DOT.medium }}
                      />
                      <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] truncate">{w.title}</span>
                    </span>
                    {w.detail && <span className="block text-xs text-[#b8a898] truncate">{w.detail}</span>}
                  </span>
                  <span className="ml-auto flex-shrink-0">
                    {addedId === w.id ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2c6b3f]">
                        <Check className="w-3.5 h-3.5" /> Added
                      </span>
                    ) : busyId === w.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#b8a898]" />
                    ) : (
                      <span className="text-xs text-[#b8a898]">+ Task</span>
                    )}
                  </span>
                </button>
                {mode === "full" && managing && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => startEdit(w)}
                      className="p-1.5 rounded-lg border border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
                      aria-label="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => remove(w.id)}
                      className="p-1.5 rounded-lg border border-[#8a2f2f]/25 text-[#8a2f2f] hover:bg-[#8a2f2f]/5"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {mode === "full" && managing && editId === "new" && (
            <div className={layout === "grid" ? "sm:col-span-2 lg:col-span-3" : ""}>
              <DraftEditor
                draft={draft}
                setDraft={setDraft}
                onSave={saveDraft}
                onCancel={cancelEdit}
                onImprove={improveDraft}
                aiBusy={aiBusy}
              />
            </div>
          )}

          {mode === "full" && managing && editId !== "new" && (
            <button
              onClick={startAdd}
              className={`${layout === "grid" ? "sm:col-span-2 lg:col-span-3 " : ""}w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium py-2.5 rounded-xl border border-dashed border-[#2E7C83]/40 text-[#2E7C83] hover:bg-[#2E7C83]/5`}
            >
              <Plus className="w-4 h-4" /> Add a quick win
            </button>
          )}

          {mode === "compact" && wins.length > compactLimit && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="w-full text-xs font-medium text-[#2E7C83] py-1.5 hover:underline"
            >
              {showAll ? "Show fewer" : `Show all ${wins.length} quick wins`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DraftEditor({
  draft,
  setDraft,
  onSave,
  onCancel,
  onImprove,
  aiBusy,
}: {
  draft: { title: string; detail: string; emoji: string; priority: string };
  setDraft: (d: { title: string; detail: string; emoji: string; priority: string }) => void;
  onSave: () => void;
  onCancel: () => void;
  onImprove: () => void;
  aiBusy: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#2E7C83]/40 bg-[#2E7C83]/5 p-3 space-y-2">
      <div className="flex gap-2">
        <input
          value={draft.emoji}
          onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
          className="w-12 text-center text-lg rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20"
          aria-label="Emoji"
        />
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Quick win title"
          className="flex-1 px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
        />
      </div>
      <input
        value={draft.detail}
        onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
        placeholder="One-line detail (optional)"
        className="w-full px-3 h-9 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
      />
      <div className="flex items-center gap-2">
        <select
          value={draft.priority}
          onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
          className="h-9 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button
          onClick={onImprove}
          disabled={aiBusy}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 h-9 rounded-lg border border-[#2E7C83]/40 text-[#2E7C83] hover:bg-[#2E7C83]/10 disabled:opacity-60"
        >
          {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          Polish with AI
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onSave}
            className="inline-flex items-center gap-1 text-xs font-medium px-3 h-9 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71]"
          >
            <Check className="w-3.5 h-3.5" /> Save
          </button>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 h-9 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
