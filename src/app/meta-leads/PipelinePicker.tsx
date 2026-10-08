"use client";

import { useState } from "react";

export default function PipelinePicker({ boards, current }: { boards: { id: string; name: string }[]; current: string | null }) {
  const [val, setVal] = useState(current ?? "");
  const [msg, setMsg] = useState("");
  async function save(v: string) {
    setVal(v);
    setMsg("Saving…");
    try {
      const r = await fetch("/api/meta-lead-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boardId: v || null }) });
      setMsg(r.ok ? "Saved" : "Couldn't save, please try again");
    } catch {
      setMsg("Couldn't save, please try again");
    }
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <select value={val} onChange={(e) => void save(e.target.value)} aria-label="Pipeline for new leads" className="rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]">
        <option value="">Contacts only, no pipeline card</option>
        {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <span className="text-sm text-[#7a8a99]" aria-live="polite">{msg}</span>
    </div>
  );
}
