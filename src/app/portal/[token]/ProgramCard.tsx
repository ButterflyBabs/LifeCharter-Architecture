"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, Circle, Lock, MessageCircle, Paperclip, Pin, PlayCircle, Send } from "lucide-react";

export type Program = {
  id: string;
  kind: "cohort" | "course" | "membership";
  accessEndsOn: string | null;
  progress: { done: number; total: number; percent: number };
  completionMessage: string | null;
  name: string;
  description: string | null;
  startsOn: string | null;
  endsOn: string | null;
  feedOn: boolean;
  sessions: { id: string; title: string; start: string; minutes: number; joinUrl: string | null; notes: string | null }[];
  lessons: { id: string; title: string; module: string | null; open: boolean; opensOn: string | null; done: boolean; body: string | null; url: string | null; videoUrl: string | null; hasFile: boolean; fileName: string | null }[];
  tasks: { id: string; title: string; body: string | null; dueOn: string | null; done: boolean }[];
  recaps: { id: string; title: string; date: string; sections: { title: string; content: string }[]; commitments: { text: string; due: string | null }[] }[];
  feed: { id: string; body: string; pinned: boolean; at: string; by: string; mine: boolean; owner: boolean; replies: { id: string; body: string; at: string; by: string; mine: boolean; owner: boolean }[] }[];
};

const day = (d: string) => new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const sub = "mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-[var(--pf-accent)]";

// One program in the member's portal: sessions, lessons (open or opening on a date), homework, group notes and the feed.
export default function ProgramCard({ p, token, act }: { p: Program; token: string; act: (body: Record<string, unknown>) => Promise<boolean> }) {
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [openRecap, setOpenRecap] = useState<string | null>(null);
  const [post, setPost] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function send(body: string, parentId?: string) {
    if (!body.trim()) return;
    setBusy(true);
    const ok = await act({ action: "program-post", programId: p.id, body, parentId });
    setBusy(false);
    if (ok) parentId ? setReply({ ...reply, [parentId]: "" }) : setPost("");
  }

  return (
    <div className="rounded-xl border border-[#E5DDCF] p-4">
      <h3 className="text-xl font-semibold [font-family:var(--pf-heading)]">{p.name}</h3>
      {p.kind === "cohort" && (p.startsOn || p.endsOn) && <p className="text-xs text-[#56616E]">{p.startsOn ? day(p.startsOn) : ""}{p.endsOn ? ` to ${day(p.endsOn)}` : ""}</p>}
      {p.accessEndsOn && <p className="text-xs text-[#56616E]">Your access lasts until {day(p.accessEndsOn)}</p>}
      {p.description && <p className="mt-1 whitespace-pre-wrap text-sm text-[#3d4652]">{p.description}</p>}
      {p.progress.total > 0 && (
        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-[#E5DDCF]" role="progressbar" aria-valuenow={p.progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Your progress">
            <div className="h-2 rounded-full bg-[var(--pf-accent)]" style={{ width: `${p.progress.percent}%` }} />
          </div>
          <p className="mt-1 text-xs text-[#56616E]">{p.progress.done} of {p.progress.total} lessons complete ({p.progress.percent}%)</p>
        </div>
      )}
      {p.completionMessage && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-[var(--pf-accent)]/10 px-3 py-2 text-sm font-semibold">{p.completionMessage}</p>}

      {p.sessions.length > 0 && (
        <>
          <p className={sub}>Upcoming sessions</p>
          <ul className="space-y-2 text-sm">
            {p.sessions.slice(0, 5).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FBF8F1] px-3 py-2">
                <span><CalendarDays className="mr-1 inline h-4 w-4 text-[var(--pf-accent)]" /><span className="font-semibold">{s.title}</span> · {when(s.start)} · {s.minutes} min</span>
                {s.joinUrl && <a href={s.joinUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[var(--pf-accent)] px-3 py-1 text-xs font-semibold text-[var(--pf-on)]">Join</a>}
              </li>
            ))}
          </ul>
        </>
      )}

      {p.lessons.length > 0 && (
        <>
          <p className={sub}>Lessons</p>
          <ul className="divide-y divide-[#E5DDCF] text-sm">
            {p.lessons.map((l, i) => (
              <li key={l.id} className="py-2">
                {(i === 0 || (p.lessons[i - 1].module || "") !== (l.module || "")) && l.module && <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#56616E]">{l.module}</p>}
                {l.open ? (
                  <>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setOpenLesson(openLesson === l.id ? null : l.id)} aria-expanded={openLesson === l.id} className={`flex min-w-0 flex-1 items-center gap-2 text-left font-semibold ${l.done ? "text-[#56616E]" : ""}`}>
                        <PlayCircle className="h-4 w-4 shrink-0 text-[var(--pf-accent)]" />{l.title}
                      </button>
                      <button type="button" onClick={() => void act({ action: "lesson-done", programId: p.id, lessonId: l.id, done: !l.done })} aria-label={l.done ? `Mark "${l.title}" not complete` : `Mark "${l.title}" complete`} className="shrink-0 text-[var(--pf-accent)]">
                        {l.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </button>
                    </div>
                    {openLesson === l.id && (
                      <div className="mt-2 space-y-2 pl-6">
                        {l.body && <p className="whitespace-pre-wrap">{l.body}</p>}
                        <div className="flex flex-wrap gap-3 text-xs font-semibold">
                          {l.videoUrl && <a href={l.videoUrl} target="_blank" rel="noreferrer" className="text-[var(--pf-accent)] underline">Watch the video</a>}
                          {l.url && <a href={l.url} target="_blank" rel="noreferrer" className="text-[var(--pf-accent)] underline">Open the link</a>}
                          {l.hasFile && <a href={`/api/portal/${token}/file?lesson=${l.id}`} className="text-[var(--pf-accent)] underline"><Paperclip className="mr-0.5 inline h-3 w-3" />{l.fileName || "Download"}</a>}
                        </div>
                        {!l.done && <button type="button" onClick={() => void act({ action: "lesson-done", programId: p.id, lessonId: l.id, done: true })} className="rounded-full bg-[var(--pf-accent)] px-3 py-1 text-xs font-semibold text-[var(--pf-on)]">Mark complete</button>}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="flex items-center gap-2 text-[#56616E]"><Lock className="h-4 w-4 shrink-0" />{l.title}<span className="ml-auto text-xs">Opens {l.opensOn ? day(l.opensOn) : "soon"}</span></p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {p.tasks.length > 0 && (
        <>
          <p className={sub}>Group homework</p>
          <ul className="space-y-2 text-sm">
            {p.tasks.map((t) => (
              <li key={t.id} className="flex items-start gap-3">
                <button type="button" onClick={() => void act({ action: "program-task", programId: p.id, taskId: t.id, done: !t.done })} aria-label={t.done ? `Mark "${t.title}" not done` : `Mark "${t.title}" done`} className="mt-0.5 text-[var(--pf-accent)]">
                  {t.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </button>
                <div className="min-w-0">
                  <p className={t.done ? "text-[#56616E] line-through" : "font-semibold"}>{t.title}</p>
                  {t.body && <p className="whitespace-pre-wrap text-[#56616E]">{t.body}</p>}
                  {t.dueOn && !t.done && <p className="text-xs text-[#56616E]">By {day(t.dueOn)}</p>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {p.recaps.length > 0 && (
        <>
          <p className={sub}>Group session notes</p>
          <ul className="divide-y divide-[#E5DDCF] text-sm">
            {p.recaps.map((r) => (
              <li key={r.id} className="py-2">
                <button type="button" onClick={() => setOpenRecap(openRecap === r.id ? null : r.id)} aria-expanded={openRecap === r.id} className="flex w-full items-baseline justify-between gap-2 text-left">
                  <span className="font-semibold">{r.title}</span><span className="text-[#56616E]">{day(r.date)}</span>
                </button>
                {openRecap === r.id && (
                  <div className="mt-2 space-y-3">
                    {r.sections.map((s) => <div key={s.title}><p className="font-semibold text-[var(--pf-accent)]">{s.title}</p><p className="whitespace-pre-wrap">{s.content}</p></div>)}
                    {r.commitments.length > 0 && <div><p className="font-semibold text-[var(--pf-accent)]">Commitments</p><ul className="list-disc pl-5">{r.commitments.map((c, i) => <li key={i}>{c.text}{c.due ? ` (by ${day(c.due)})` : ""}</li>)}</ul></div>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {p.feedOn && (
        <>
          <p className={sub}><MessageCircle className="mr-1 inline h-4 w-4" />Group conversation</p>
          <div className="flex gap-2">
            <label htmlFor={`post-${p.id}`} className="sr-only">Post to the group</label>
            <textarea id={`post-${p.id}`} rows={2} value={post} onChange={(e) => setPost(e.target.value)} placeholder="Share a win, a question or an insight with the group…" className="min-w-0 flex-1 rounded-xl border border-[#E5DDCF] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--pf-accent)]" />
            <button type="button" onClick={() => void send(post)} disabled={busy || !post.trim()} aria-label="Post to the group" className="self-end rounded-full bg-[var(--pf-accent)] p-3 text-[var(--pf-on)] disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </div>
          <ul className="mt-3 space-y-3">
            {p.feed.map((f) => (
              <li key={f.id} className={`rounded-xl px-3 py-2 text-sm ${f.pinned ? "bg-[var(--pf-accent)]/10" : "bg-[#FBF8F1]"}`}>
                <p className="text-xs font-semibold text-[#56616E]">{f.pinned && <Pin className="mr-1 inline h-3 w-3" />}{f.by}{f.owner ? " (host)" : ""} · {when(f.at)}</p>
                <p className="mt-0.5 whitespace-pre-wrap">{f.body}</p>
                {f.replies.map((r) => (
                  <div key={r.id} className="ml-4 mt-2 border-l-2 border-[#E5DDCF] pl-3">
                    <p className="text-xs font-semibold text-[#56616E]">{r.by}{r.owner ? " (host)" : ""} · {when(r.at)}</p>
                    <p className="whitespace-pre-wrap">{r.body}</p>
                  </div>
                ))}
                <div className="ml-4 mt-2 flex gap-2">
                  <label htmlFor={`reply-${f.id}`} className="sr-only">Reply</label>
                  <input id={`reply-${f.id}`} value={reply[f.id] ?? ""} onChange={(e) => setReply({ ...reply, [f.id]: e.target.value })} placeholder="Reply…" className="min-w-0 flex-1 rounded-lg border border-[#E5DDCF] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[var(--pf-accent)]" />
                  <button type="button" onClick={() => void send(reply[f.id] ?? "", f.id)} disabled={busy || !(reply[f.id] ?? "").trim()} className="text-xs font-semibold text-[var(--pf-accent)] disabled:opacity-50">Reply</button>
                </div>
              </li>
            ))}
            {!p.feed.length && <li className="text-sm text-[#56616E]">No posts yet. Start the conversation.</li>}
          </ul>
          <p className="mt-2 text-[11px] text-[#9aa3ad]">Everyone in this program sees posts here, with first names only.</p>
        </>
      )}
    </div>
  );
}
