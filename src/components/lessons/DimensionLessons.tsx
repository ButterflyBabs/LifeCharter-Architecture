"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, PlayCircle, Sparkles } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  summary: string | null;
  body: string | null;
  video_url: string | null;
  resource_url: string | null;
}
interface Coach {
  title: string;
  why: string;
  principles: string[];
  steps: string[];
  firstAction: string;
  createdAt?: string;
}

// "How to run this part": the Alignment Architect's lessons for this area, plus a
// personal lesson the client's own assistant writes on request.
export default function DimensionLessons({ dimension, label, score }: { dimension: string; label: string; score: number | null }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/lessons?dimension=${dimension}`).then((r) => r.json()).then((d) => setLessons(d.lessons ?? [])).catch(() => {});
    fetch(`/api/lessons/coach?dimension=${dimension}`).then((r) => r.json()).then((d) => d.lesson && setCoach(d.lesson)).catch(() => {});
  }, [dimension]);

  async function write() {
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/lessons/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dimension }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.needsKey) return setMsg("Connect your AI in Settings → AI and your assistant will write this lesson for you.");
    if (!r.ok) return setMsg(d.error || "Couldn't write the lesson just now.");
    setCoach(d.lesson);
  }

  const weak = score !== null && score < 60;
  return (
    <div id="lessons" className={`mt-8 rounded-2xl border p-5 ${weak ? "border-[#c9a227]/50 bg-[#c9a227]/5" : "border-[#1a2b4a]/10"}`}>
      <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">How to run {label} well</h2>
      <p className="text-sm text-[#7a8a99]">{weak ? "This is one of your lower scores. Start here." : "Short lessons for strengthening this part of your business."}</p>

      {!!lessons.length && (
        <div className="mt-4 space-y-2">
          {lessons.map((l) => (
            <div key={l.id} className="rounded-xl bg-white dark:bg-[#1a2b4a]/20 border border-[#1a2b4a]/10 p-3">
              <button onClick={() => setOpen(open === l.id ? null : l.id)} className="w-full text-left">
                <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{l.title}</p>
                {l.summary && <p className="text-sm text-[#7a8a99]">{l.summary}</p>}
              </button>
              {open === l.id && (
                <div className="mt-2 space-y-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                  {l.body && <p className="whitespace-pre-line">{l.body}</p>}
                  <div className="flex flex-wrap gap-3">
                    {l.video_url && (
                      <a href={l.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#2E7C83] hover:underline">
                        <PlayCircle className="w-4 h-4" /> Watch
                      </a>
                    )}
                    {l.resource_url && (
                      <a href={l.resource_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#2E7C83] hover:underline">
                        <ExternalLink className="w-4 h-4" /> Open the resource
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-xl bg-white dark:bg-[#1a2b4a]/20 border border-[#1a2b4a]/10 p-4">
        {coach ? (
          <div className="space-y-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6a15]">Your personal lesson</p>
            <p className="text-base font-semibold">{coach.title}</p>
            {coach.why && <p>{coach.why}</p>}
            {!!coach.principles?.length && (
              <ul className="list-disc pl-5">{coach.principles.map((p) => <li key={p}>{p}</li>)}</ul>
            )}
            {!!coach.steps?.length && (
              <ol className="list-decimal pl-5">{coach.steps.map((p) => <li key={p}>{p}</li>)}</ol>
            )}
            {coach.firstAction && <p><strong>This week:</strong> {coach.firstAction}</p>}
            <button onClick={write} disabled={busy} className="text-xs text-[#2E7C83] hover:underline">{busy ? "Writing…" : "Write a fresh one"}</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Want a lesson written for your business specifically? Your assistant can build one from your own answers and numbers.</p>
            <button onClick={write} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Show me how
            </button>
          </div>
        )}
        {msg && <p className="mt-2 text-sm text-[#8a6a15]">{msg}</p>}
      </div>
    </div>
  );
}
