"use client";

import { useEffect, useState } from "react";

interface Row {
  id: string;
  account: string;
  rating: "up" | "down";
  note: string | null;
  question: string | null;
  answer: string | null;
  created_at: string;
}

// Support Desk > Assistant: thumbs up / down (and notes) clients left on the AI assistant's answers.
export default function AssistantFeedbackTab() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [only, setOnly] = useState<"all" | "down">("down");
  useEffect(() => {
    fetch("/api/assistant/feedback", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRows(d.feedback ?? []))
      .catch(() => setRows([]));
  }, []);
  const shown = (rows ?? []).filter((r) => only === "all" || r.rating === "down");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["down", "all"] as const).map((k) => (
          <button key={k} onClick={() => setOnly(k)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${only === k ? "bg-[#1a2b4a] text-white" : "text-[#5a6472] hover:bg-[#1a2b4a]/5"}`}>
            {k === "down" ? "Needs work (thumbs down)" : "Everything"}
          </button>
        ))}
      </div>
      {rows === null && <p className="text-sm text-[#7a8a99]">Loading…</p>}
      {rows && !shown.length && <p className="text-sm text-[#7a8a99]">Nothing here yet.</p>}
      {shown.map((r) => (
        <article key={r.id} className="rounded-xl border border-[#1a2b4a]/10 bg-white p-4 text-sm dark:bg-[#1a2b4a]/30">
          <p className="text-xs text-[#7a8a99]">
            {r.rating === "up" ? "👍" : "👎"} {r.account} · {new Date(r.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
          {r.question && <p className="mt-2"><span className="font-semibold">Asked:</span> {r.question}</p>}
          {r.answer && <p className="mt-1 whitespace-pre-wrap text-[#5a6472]"><span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Answered:</span> {r.answer}</p>}
          {r.note && <p className="mt-2 rounded-lg bg-[#c9a227]/15 px-3 py-2"><span className="font-semibold">Their note:</span> {r.note}</p>}
        </article>
      ))}
    </div>
  );
}
