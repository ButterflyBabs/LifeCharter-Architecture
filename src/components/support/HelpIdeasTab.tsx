"use client";

import { useCallback, useEffect, useState } from "react";

interface Row {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  status: "pending" | "approved" | "dismissed";
}

// Support Desk > Help ideas: answers drafted from resolved tickets. Approve (after editing if you like) and every
// client's assistant can use it; dismiss to drop it.
export default function HelpIdeasTab() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [edits, setEdits] = useState<Record<string, { question: string; answer: string }>>({});

  const load = useCallback(async () => {
    const d = await fetch("/api/support/help-suggestions", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setRows((d.suggestions ?? []).filter((r: Row) => r.question !== "(skipped)"));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const post = (body: Record<string, unknown>) =>
    fetch("/api/support/help-suggestions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());

  async function generate() {
    setBusy(true);
    setNote("");
    const d = await post({ action: "generate" }).catch(() => ({}));
    setBusy(false);
    if (d.needsKey) setNote("Add your OpenAI key in Settings first.");
    else setNote(d.ok ? `Looked at ${d.looked} resolved ticket${d.looked === 1 ? "" : "s"}; drafted ${d.drafted}.` : "That didn't work.");
    await load();
  }
  async function decide(r: Row, action: "approve" | "dismiss") {
    const e = edits[r.id];
    await post({ action, id: r.id, ...(e && action === "approve" ? e : {}) });
    await load();
  }

  const pending = (rows ?? []).filter((r) => r.status === "pending");
  const decided = (rows ?? []).filter((r) => r.status !== "pending");
  const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white p-2 text-sm dark:bg-[#1a2b4a]/20";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={generate} disabled={busy} className="rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Drafting…" : "Draft answers from resolved tickets"}
        </button>
        {note && <span className="text-sm text-[#5a6472]">{note}</span>}
      </div>
      {rows === null && <p className="text-sm text-[#7a8a99]">Loading…</p>}
      {rows && !pending.length && <p className="text-sm text-[#7a8a99]">Nothing waiting. Resolve a ticket with a reply, then draft answers.</p>}
      {pending.map((r) => {
        const e = edits[r.id] ?? { question: r.question, answer: r.answer };
        return (
          <article key={r.id} className="rounded-xl border border-[#c9a227]/40 bg-white p-4 dark:bg-[#1a2b4a]/30">
            {r.category && <p className="text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">{r.category}</p>}
            <label htmlFor={`q-${r.id}`} className="mt-2 block text-xs font-semibold text-[#7a8a99]">Question</label>
            <input id={`q-${r.id}`} className={field} value={e.question} onChange={(ev) => setEdits({ ...edits, [r.id]: { ...e, question: ev.target.value } })} />
            <label htmlFor={`a-${r.id}`} className="mt-2 block text-xs font-semibold text-[#7a8a99]">Answer</label>
            <textarea id={`a-${r.id}`} rows={4} className={field} value={e.answer} onChange={(ev) => setEdits({ ...edits, [r.id]: { ...e, answer: ev.target.value } })} />
            <div className="mt-3 flex gap-3">
              <button onClick={() => decide(r, "approve")} className="rounded-lg bg-[#2c6b3f] px-3 py-1.5 text-sm font-semibold text-white">Approve</button>
              <button onClick={() => decide(r, "dismiss")} className="rounded-lg border border-[#1a2b4a]/20 px-3 py-1.5 text-sm">Dismiss</button>
            </div>
          </article>
        );
      })}
      {decided.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-[#5a6472]">Decided ({decided.length})</summary>
          <ul className="mt-2 space-y-1">
            {decided.map((r) => (
              <li key={r.id}>
                <span className={r.status === "approved" ? "text-[#2c6b3f]" : "text-[#7a8a99]"}>{r.status === "approved" ? "Approved" : "Dismissed"}</span>: {r.question}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
