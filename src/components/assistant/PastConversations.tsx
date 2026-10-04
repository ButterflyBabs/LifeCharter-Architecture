"use client";

import { useEffect, useState } from "react";
import { History, Trash2, X } from "lucide-react";

interface Saved { id: string; archivedAt: string; count: number; title: string }
interface Msg { id: string; role: "user" | "assistant"; content: string }

const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// Saved conversations: nothing the client has discussed with their assistant is lost when they start a new one.
export default function PastConversations({ open, onClose, onContinued }: { open: boolean; onClose: () => void; onContinued: () => void }) {
  const [list, setList] = useState<Saved[] | null>(null);
  const [viewing, setViewing] = useState<{ id: string; title: string; messages: Msg[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetch("/api/assistant/conversations", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((d) => setList(d.conversations ?? []))
      .catch(() => setList([]));

  useEffect(() => {
    if (open) {
      setViewing(null);
      void load();
    }
  }, [open]);

  if (!open) return null;

  async function view(c: Saved) {
    const d = await fetch(`/api/assistant/conversations?id=${encodeURIComponent(c.id)}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({ messages: [] }));
    setViewing({ id: c.id, title: c.title, messages: [...(d.messages ?? [])].reverse() });
  }
  async function act(action: "continue" | "delete", id: string) {
    setBusy(true);
    await fetch("/api/assistant/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id }) }).catch(() => {});
    setBusy(false);
    if (action === "continue") {
      onContinued();
      onClose();
    } else {
      setViewing(null);
      void load();
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-[#1a2b4a]/10 bg-white p-3 text-sm dark:bg-[#1a2b4a]/30">
      <div className="mb-2 flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><History className="h-4 w-4 text-[#c9a227]" /> Past conversations</p>
        <button onClick={onClose} aria-label="Close past conversations" className="text-[#7a8a99] hover:text-[#1a2b4a]"><X className="h-4 w-4" /></button>
      </div>
      {viewing ? (
        <div>
          <p className="mb-2 text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{viewing.title}</p>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg bg-[#F8F5F0] p-2 text-xs text-[#3F4654]">
            {viewing.messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
                <span className={`inline-block max-w-[92%] whitespace-pre-wrap rounded-lg px-2.5 py-1.5 ${m.role === "user" ? "bg-[#1a2b4a] text-white" : "bg-white"}`}>{m.content}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button disabled={busy} onClick={() => act("continue", viewing.id)} className="rounded-lg bg-[#1a2b4a] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">Continue this conversation</button>
            <button onClick={() => setViewing(null)} className="text-xs text-[#2E7C83] hover:underline">Back to the list</button>
            <button disabled={busy} onClick={() => act("delete", viewing.id)} className="ml-auto inline-flex items-center gap-1 text-xs text-[#8a2f2f] hover:underline"><Trash2 className="h-3 w-3" /> Delete</button>
          </div>
        </div>
      ) : list === null ? (
        <p className="text-xs text-[#7a8a99]">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-xs text-[#7a8a99]">Nothing saved yet. When you start a new conversation, the old one is kept here.</p>
      ) : (
        <ul className="divide-y divide-[#1a2b4a]/10">
          {list.map((c) => (
            <li key={c.id}>
              <button onClick={() => view(c)} className="flex w-full items-baseline justify-between gap-3 py-2 text-left hover:bg-[#1a2b4a]/5">
                <span className="truncate text-[#1a2b4a] dark:text-[#F8F5F0]">{c.title}</span>
                <span className="shrink-0 text-[11px] text-[#7a8a99]">{when(c.archivedAt)} · {c.count} messages</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
