"use client";

import { useEffect, useState } from "react";

interface Row {
  id: string;
  title: string;
  status: string;
  error: string | null;
  createdAt: string;
}

const LABEL: Record<string, string> = { proposed: "Waiting for you", executed: "Done", cancelled: "Cancelled", undone: "Undone", failed: "Didn't work" };
const TONE: Record<string, string> = {
  executed: "bg-green-500/10 text-[#2c6b3f]",
  proposed: "bg-[#c9a227]/15 text-[#8a6a15]",
  failed: "bg-red-500/10 text-[#8a2f2f]",
  cancelled: "bg-[#7b6b8d]/10 text-[#7b6b8d]",
  undone: "bg-[#7b6b8d]/10 text-[#7b6b8d]",
};

// Settings > AI Assistant: everything your assistant has prepared for you, and what you decided.
export default function AssistantActivity() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open || rows) return;
    fetch("/api/assistant/actions?history=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRows(d.history ?? []))
      .catch(() => setRows([]));
  }, [open, rows]);
  return (
    <div className="mt-4 rounded-xl border border-[#1a2b4a]/10 p-4 dark:border-white/10">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
        {open ? "▾" : "▸"} What your assistant has done
      </button>
      {open && (
        <div className="mt-3 space-y-1.5">
          {rows === null && <p className="text-sm text-[#7a8a99]">Loading…</p>}
          {rows && !rows.length && <p className="text-sm text-[#7a8a99]">Nothing yet. When your assistant prepares something for your approval, it shows up here.</p>}
          {(rows ?? []).map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[r.status] ?? TONE.cancelled}`}>{LABEL[r.status] ?? r.status}</span>
              <span className="min-w-0 flex-1 text-[#1a2b4a] dark:text-[#F8F5F0]">{r.title}</span>
              <span className="text-xs text-[#7a8a99]">{new Date(r.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
