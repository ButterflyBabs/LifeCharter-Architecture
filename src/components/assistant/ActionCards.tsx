"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Pencil, Undo2, X, XCircle } from "lucide-react";

export interface ActionCardData {
  id: string;
  tool: string;
  status: "proposed" | "executed" | "cancelled" | "failed" | "undone";
  title: string;
  lines: string[];
  summary?: string;
  error?: string;
  canUndo?: boolean;
  args?: Record<string, unknown>;
}

// What the AI assistant has prepared. Nothing runs until the client presses Approve here.
export default function AssistantActionCards({ fresh, onRevise }: { fresh: ActionCardData[]; onRevise?: (card: ActionCardData, instruction: string) => Promise<void> }) {
  const [cards, setCards] = useState<ActionCardData[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Anything still waiting for approval from earlier (survives a page reload).
  useEffect(() => {
    fetch("/api/assistant/actions", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const waiting = ((d?.actions ?? []) as ActionCardData[]).filter((a) => a.status === "proposed");
        if (waiting.length) setCards((cur) => [...cur, ...waiting.filter((w) => !cur.some((c) => c.id === w.id))]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!fresh.length) return;
    setCards((cur) => [...fresh, ...cur.filter((c) => !fresh.some((f) => f.id === c.id))]);
  }, [fresh]);

  async function decide(id: string, decision: "approve" | "cancel" | "undo") {
    setBusy(id);
    setErr("");
    try {
      const res = await fetch("/api/assistant/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, decision }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "That didn't work.");
      setCards((cur) => cur.map((c) => (c.id === id ? (d.card as ActionCardData) : c)));
      // Tell any plan page that's open that a section just changed (approved or undone), so it reloads itself.
      if (["update_plan_section", "fill_plan_answers"].includes((d.card as ActionCardData).tool) && decision !== "cancel") window.dispatchEvent(new Event("lc-plan-changed"));
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(null);
  }

  // Ask the assistant to change what it prepared: the old preview is cancelled and a corrected one comes back.
  async function revise(c: ActionCardData) {
    if (!onRevise || !note.trim()) return;
    setBusy(c.id);
    setErr("");
    try {
      const res = await fetch("/api/assistant/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, decision: "cancel" }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "That didn't work.");
      setCards((cur) => cur.filter((x) => x.id !== c.id));
      setEditing(null);
      const instruction = note.trim();
      setNote("");
      await onRevise(c, instruction);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(null);
  }

  // Only what still needs a decision gets the big yellow card. What is finished shrinks to ONE thin line (the
  // newest one) so the conversation stays in view; the chat already records what was done.
  const waiting = cards.filter((c) => c.status === "proposed");
  const lastDone = cards.find((c) => c.status !== "proposed" && !dismissed.includes(c.id));
  if (!waiting.length && !lastDone) return null;
  return (
    <div className="mb-3 space-y-2">
      {lastDone && (
        <div className="flex items-center gap-2 rounded-lg border border-[#c9a227]/30 bg-[#FBF7EC] px-3 py-1.5 text-xs text-[#3F4654] dark:bg-[#2a2415] dark:text-[#e8e4f0]">
          {lastDone.status === "executed" && <CheckCircle2 className="h-3.5 w-3.5 flex-none text-[#2c6b3f]" />}
          {lastDone.status === "undone" && <Undo2 className="h-3.5 w-3.5 flex-none text-[#7a8a99]" />}
          {lastDone.status === "cancelled" && <XCircle className="h-3.5 w-3.5 flex-none text-[#7a8a99]" />}
          <span className="min-w-0 flex-1 truncate" title={lastDone.title}>
            {lastDone.status === "executed" ? "Done: " : lastDone.status === "undone" ? "Undone: " : lastDone.status === "cancelled" ? "Cancelled: " : "Didn't work: "}
            {lastDone.title}
          </span>
          {lastDone.status === "executed" && lastDone.canUndo && (
            <button onClick={() => decide(lastDone.id, "undo")} disabled={busy === lastDone.id} className="inline-flex flex-none items-center gap-1 text-[#2E7C83] hover:underline">
              {busy === lastDone.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Undo2 className="h-3 w-3" />} Undo
            </button>
          )}
          <button onClick={() => setDismissed((d) => [...d, lastDone.id])} aria-label="Hide" className="flex-none text-[#7a8a99] hover:text-[#1a2b4a]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {waiting.map((c) => (
        <div key={c.id} className="rounded-xl border border-[#c9a227]/40 bg-[#FBF7EC] p-4 text-sm text-[#3F4654] dark:bg-[#2a2415] dark:text-[#e8e4f0]">
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{c.title}</p>
          {c.lines.length > 0 && c.status === "proposed" && (
            <ul className="mt-1.5 list-disc pl-5 text-xs text-[#5a6472] dark:text-[#b8c2cf]">
              {c.lines.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          )}
          {c.status === "proposed" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={() => decide(c.id, "approve")} disabled={busy === c.id} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a2b4a] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60">
                {busy === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve
              </button>
              {onRevise && (
                <button onClick={() => { setEditing(editing === c.id ? null : c.id); setNote(""); }} disabled={busy === c.id} aria-expanded={editing === c.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a227] px-4 py-2 text-xs font-semibold text-[#1a2b4a] hover:bg-[#c9a227]/10 dark:text-[#F8F5F0]">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              )}
              <button onClick={() => decide(c.id, "cancel")} disabled={busy === c.id} className="rounded-lg border border-[#1a2b4a]/20 px-4 py-2 text-xs font-medium text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:text-[#F8F5F0]">
                Cancel
              </button>
              <span className="text-[11px] text-[#7a8a99]">Nothing changes until you approve.</span>
            </div>
          )}
          {c.status === "proposed" && editing === c.id && (
            <div className="mt-3 rounded-lg border border-[#1a2b4a]/10 bg-white p-3 dark:bg-[#1a2b4a]/30">
              <label className="block text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0]" htmlFor={`edit-${c.id}`}>What should change?</label>
              <textarea id={`edit-${c.id}`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Rename it, drop the third step, add a column for Date, make it sound warmer…" className="mt-1 w-full rounded-lg border border-[#1a2b4a]/15 bg-white px-3 py-2 text-xs text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]" />
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => revise(c)} disabled={busy === c.id || !note.trim()} className="rounded-lg bg-[#1a2b4a] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Send changes</button>
                <button onClick={() => setEditing(null)} className="text-xs text-[#7a8a99] hover:underline">Never mind</button>
              </div>
            </div>
          
          )}
          {c.status === "executed" && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2c6b3f]"><CheckCircle2 className="h-3.5 w-3.5" /> {c.summary || "Done."}</span>
              {c.canUndo && (
                <button onClick={() => decide(c.id, "undo")} disabled={busy === c.id} className="inline-flex items-center gap-1 text-xs text-[#2E7C83] hover:underline">
                  <Undo2 className="h-3 w-3" /> Undo
                </button>
              )}
            </div>
          )}
          {c.status === "undone" && <p className="mt-2 text-xs text-[#7a8a99]">{c.summary || "Undone."}</p>}
          {c.status === "cancelled" && <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#7a8a99]"><XCircle className="h-3.5 w-3.5" /> Cancelled. Nothing was changed.</p>}
          {c.status === "failed" && <p className="mt-2 text-xs text-[#8a2f2f]">That didn&apos;t work{c.error ? `: ${c.error}` : "."} Nothing else was changed.</p>}
        </div>
      ))}
      {err && <p role="alert" className="text-xs text-[#8a2f2f]">{err}</p>}
    </div>
  );
}
