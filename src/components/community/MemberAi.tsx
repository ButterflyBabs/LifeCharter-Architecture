"use client";

// Member AI features (co036): voice journaling, "What you missed", thread
// "Catch me up", "Help me say this", and event recaps / focus notes.
// Same rules as the journal assistant (JournalAssist): the member's own
// Command Suite AI or Collective Plus as Mariposa; free members see the Plus
// invitation (never in the iPhone app) or nothing; consent is asked once.
// Nothing here ever posts or sends on the member's behalf.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpenText, Lock, Mic, NotebookPen, Sparkles, Square, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/lib/community/context";
import { useIsNativeApp } from "@/lib/community/native";
import type { Session } from "@/lib/community/events";
import { AI_PRIVACY_NOTE, PlusInvite, Suggestion, aiPost, useJournalAi, useJournalAiStatus } from "./JournalAssist";
import { Button, Card, ErrorNote, Eyebrow, Input, Label, Modal, TextArea } from "./ui";

export async function askMemberAi<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const res = await aiPost("/api/community/member-ai", { action, ...payload });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.result) throw new Error(json.error || "The AI didn't respond — try again.");
  return json.result as T;
}

const errText = (e: unknown) => (e instanceof Error ? e.message : "The AI didn't respond — try again.");

// ─── Voice journaling ──────────────────────────────────────────────────────

const MAX_SECONDS = 300;
const VOICE_OK_KEY = "cm-voice-explained";

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return options.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";
}

function micError(e: unknown): string {
  const name = (e as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Microphone access is turned off. To speak an entry, allow the microphone for this site in your browser settings (in the iPhone app: Settings → LifeCharter → Microphone), then try again.";
  if (name === "NotFoundError") return "No microphone was found on this device.";
  return "The microphone couldn't start — please try again.";
}

// A mic button for the private journal: record → text → added to the entry.
export function VoiceNote({ onText }: { onText: (text: string) => void }) {
  const ai = useJournalAi();
  const [phase, setPhase] = useState<"idle" | "explain" | "recording" | "working" | "result">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [tidying, setTidying] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);
  useEffect(() => () => {
    if (rec.current && rec.current.state !== "inactive") {
      rec.current.onstop = null;
      rec.current.stop();
    }
    cleanup();
  }, [cleanup]);

  if (!ai) return null;
  const supported = typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

  async function transcribe(blob: Blob) {
    setPhase("working");
    try {
      const fd = new FormData();
      fd.append("audio", blob, "voice-note");
      const res = await aiPost("/api/community/transcribe", fd);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.text) throw new Error(json.error || "Couldn't turn that into text — try again.");
      setText(json.text as string);
      setPhase("result");
    } catch (e) {
      setError(errText(e));
      setPhase("idle");
    }
  }

  async function start() {
    setError(null);
    try {
      localStorage.setItem(VOICE_OK_KEY, "1");
    } catch {
      /* private mode */
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      stream.current = s;
      const mime = pickMime();
      const r = new MediaRecorder(s, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 48_000 });
      chunks.current = [];
      r.ondataavailable = (ev) => ev.data.size && chunks.current.push(ev.data);
      r.onstop = () => {
        cleanup();
        const blob = new Blob(chunks.current, { type: r.mimeType || mime || "audio/webm" });
        void transcribe(blob);
      };
      rec.current = r;
      r.start(1000);
      setSeconds(0);
      setPhase("recording");
      timer.current = setInterval(() => {
        setSeconds((n) => {
          if (n + 1 >= MAX_SECONDS && rec.current?.state === "recording") rec.current.stop();
          return n + 1;
        });
      }, 1000);
    } catch (e) {
      cleanup();
      setError(micError(e));
      setPhase("idle");
    }
  }

  function tap() {
    if (!supported) return setError("Voice notes aren't supported in this browser — try Safari or Chrome.");
    let explained = false;
    try {
      explained = localStorage.getItem(VOICE_OK_KEY) === "1";
    } catch {
      /* private mode */
    }
    if (explained) void start();
    else setPhase("explain");
  }

  async function tidy() {
    setTidying(true);
    setError(null);
    try {
      const r = await askMemberAi<{ text: string }>("tidy", { text });
      setText(r.text);
    } catch (e) {
      setError(errText(e));
    } finally {
      setTidying(false);
    }
  }

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-2">
      {phase === "idle" && (
        <Button type="button" size="sm" variant="outline" onClick={tap}>
          <Mic className="h-4 w-4 text-[var(--cm-gold-text)]" /> Speak it instead
        </Button>
      )}
      {phase === "explain" && (
        <div className="rounded-2xl border border-[#D4AF63]/40 bg-[var(--cm-gold-soft)] p-3.5 text-[13.5px] text-[var(--cm-body)]">
          <p>
            Your device will ask to use the microphone. Talk as long as you like (up to 5 minutes), then tap <strong>Stop</strong>. The recording goes to{" "}
            {ai.assistantName} (OpenAI) only to turn it into text — it isn&rsquo;t kept, and you choose what goes into your journal.
          </p>
          <div className="mt-2.5 flex gap-2">
            <Button type="button" size="sm" variant="gold" onClick={() => void start()}>
              <Mic className="h-4 w-4" /> Start recording
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPhase("idle")}>
              Not now
            </Button>
          </div>
        </div>
      )}
      {phase === "recording" && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/60 px-3.5 py-2.5">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          <span className="text-[14px] font-semibold tabular-nums text-[var(--cm-ink)]" aria-live="polite">
            Listening… {mmss}
          </span>
          <Button type="button" size="sm" variant="navy" className="ml-auto" onClick={() => rec.current?.stop()}>
            <Square className="h-3.5 w-3.5" /> Stop
          </Button>
        </div>
      )}
      {phase === "working" && <p className="text-[13.5px] text-[var(--cm-muted-2)]">Turning your words into text…</p>}
      {phase === "result" && (
        <Suggestion
          name={ai.assistantName}
          useLabel="Add to my journal"
          onUse={() => {
            onText(text);
            setText("");
            setPhase("idle");
          }}
          onDismiss={() => {
            setText("");
            setPhase("idle");
          }}
        >
          <p className="whitespace-pre-line">{text}</p>
          <button
            type="button"
            onClick={tidy}
            disabled={tidying}
            className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--cm-gold-text)] hover:underline disabled:opacity-60"
          >
            <Wand2 className="h-3.5 w-3.5" /> {tidying ? "Tidying…" : "Tidy it up (keeps your words)"}
          </button>
        </Suggestion>
      )}
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}

// ─── Help me say this ──────────────────────────────────────────────────────

const TONES = [
  ["warmer", "Warmer"],
  ["clearer", "Clearer"],
  ["shorter", "Shorter"],
] as const;

// Rewrites the member's draft in their own voice. The member picks what to
// use; nothing is ever sent for them.
export function SayThis({ text, where, onUse, className }: { text: string; where: "post" | "reply" | "dm"; onUse: (t: string) => void; className?: string }) {
  const ai = useJournalAi();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!ai || text.trim().length < 8) return null;

  async function run(tone: string) {
    setBusy(tone);
    setError(null);
    try {
      const r = await askMemberAi<{ text: string }>("rewrite", { text, tone, where });
      setResult(r.text);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--cm-gold-text)] hover:underline">
          <Sparkles className="h-3.5 w-3.5" /> Help me say this
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12.5px] text-[var(--cm-muted-2)]">Make it</span>
          {TONES.map(([tone, label]) => (
            <button
              key={tone}
              type="button"
              disabled={!!busy}
              onClick={() => run(tone)}
              className="rounded-full border border-[#D4AF63]/60 bg-[var(--cm-surface)] px-2.5 py-1 text-[12.5px] font-semibold text-[var(--cm-ink)] hover:bg-[var(--cm-gold-soft)] disabled:opacity-60"
            >
              {busy === tone ? "…" : label}
            </button>
          ))}
          <button type="button" aria-label="Close" onClick={() => { setOpen(false); setResult(null); }} className="p-1 text-[var(--cm-faint)] hover:text-[var(--cm-ink)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {result && (
        <Suggestion
          name={ai.assistantName}
          onUse={() => {
            onUse(result);
            setResult(null);
            setOpen(false);
          }}
          onDismiss={() => setResult(null)}
          useLabel="Use this (I'll still review it)"
        >
          <p className="whitespace-pre-line">{result}</p>
        </Suggestion>
      )}
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}

// ─── Thread "Catch me up" ──────────────────────────────────────────────────

export const CATCH_UP_MIN_REPLIES = 6;

export function ThreadCatchUp({ postId, replies }: { postId: string; replies: number }) {
  const ai = useJournalAi();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ summary: string; points: string[]; open: string } | null>(null);
  if (!ai || replies < CATCH_UP_MIN_REPLIES) return null;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      setResult(await askMemberAi("thread", { postId }));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 space-y-2">
      {!result && (
        <Button type="button" size="sm" variant="outline" onClick={run} disabled={busy}>
          <Sparkles className="h-4 w-4 text-[var(--cm-gold-text)]" /> {busy ? "Reading the thread…" : "Catch me up"}
        </Button>
      )}
      {result && (
        <Suggestion name={ai.assistantName} onDismiss={() => setResult(null)}>
          <p>{result.summary}</p>
          {result.points.length > 0 && (
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              {result.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {result.open && <p className="mt-1.5 text-[var(--cm-muted-2)]">Still open: {result.open}</p>}
          <p className="mt-1.5 text-[11.5px] text-[var(--cm-muted)]">An AI summary — read the replies for the full picture.</p>
        </Suggestion>
      )}
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}

// ─── What you missed (Home) ────────────────────────────────────────────────

interface MissedThread {
  postId: string;
  title: string;
  isNewPost: boolean;
  newReplies: number;
  channel: { name: string; emoji: string | null };
  pathway: string;
  href: string;
}
interface MissedData {
  since: string;
  newPosts: number;
  newReplies: number;
  threads: MissedThread[];
}

let missedLoad: Promise<MissedData | null> | null = null;

export function WhatYouMissed() {
  const status = useJournalAiStatus();
  const ai = status?.enabled ? status : null;
  const [data, setData] = useState<MissedData | null>(null);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ summary: string; highlights: { line: string; href: string; title: string }[] } | null>(null);

  useEffect(() => {
    // One visit per page load (the GET marks the visit).
    missedLoad ??= fetch("/api/community/missed", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    let live = true;
    void missedLoad.then((d) => live && setData(d as MissedData | null));
    return () => {
      live = false;
    };
  }, []);

  if (hidden || !data?.threads?.length) return null;

  async function catchUp() {
    if (!data) return;
    setBusy(true);
    setError(null);
    try {
      setSummary(await askMemberAi("missed", { since: data.since }));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  const bits = [
    data.newPosts ? `${data.newPosts} new ${data.newPosts === 1 ? "post" : "posts"}` : "",
    data.newReplies ? `${data.newReplies} new ${data.newReplies === 1 ? "reply" : "replies"}` : "",
  ].filter(Boolean);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>Since your last visit</Eyebrow>
          <p className="mt-0.5 font-editorial text-[20px] font-semibold text-[var(--cm-ink)]">What you missed</p>
          <p className="text-[13px] text-[var(--cm-muted-2)]">{bits.join(" · ")} in your channels</p>
        </div>
        <button onClick={() => setHidden(true)} aria-label="Hide what you missed" className="rounded-lg p-1.5 text-[var(--cm-faint)] hover:bg-black/5">
          <X className="h-4 w-4" />
        </button>
      </div>

      {summary ? (
        <div className="mt-3">
          <Suggestion name={ai?.assistantName ?? "Mariposa"} onDismiss={() => setSummary(null)}>
            <p>{summary.summary}</p>
            {summary.highlights.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {summary.highlights.map((h) => (
                  <li key={h.href + h.line}>
                    <Link href={h.href} className="font-semibold text-[var(--cm-ink)] underline decoration-[#D4AF63]/60 underline-offset-2 hover:decoration-[#D4AF63]">
                      {h.title}
                    </Link>{" "}
                    <span className="text-[var(--cm-muted-2)]">— {h.line}</span>
                  </li>
                ))}
              </ul>
            )}
          </Suggestion>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--cm-line-soft)]">
          {data.threads.slice(0, 5).map((t) => (
            <li key={t.postId}>
              <Link href={t.href} className="flex items-center justify-between gap-3 py-2 hover:opacity-80">
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-semibold text-[var(--cm-ink)]">{t.title}</span>
                  <span className="block truncate text-[12px] text-[var(--cm-muted)]">
                    {t.channel.emoji} {t.channel.name} › {t.pathway}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-[var(--cm-gold-soft)] px-2 py-0.5 text-[11.5px] font-semibold text-[var(--cm-gold-text)]">
                  {t.isNewPost ? "New" : `+${t.newReplies} ${t.newReplies === 1 ? "reply" : "replies"}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {ai && !summary && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="gold" onClick={catchUp} disabled={busy}>
            <Sparkles className="h-4 w-4" /> {busy ? "Catching you up…" : `Catch me up with ${ai.assistantName}`}
          </Button>
        </div>
      )}
      {status && !status.source && (
        <div className="mt-3">
          <PlusInvite compact title="Get a quick catch-up from Mariposa" what="" />
        </div>
      )}
      {!ai && status?.unavailable && <p className="mt-2 text-[12.5px] text-[var(--cm-muted)]">{status.unavailable}</p>}
      <ErrorNote>{error}</ErrorNote>
    </Card>
  );
}

// ─── Event recaps + focus notes ────────────────────────────────────────────

export interface EventRecap {
  event_id: string;
  occurrence_date: string;
  post_id: string;
}
export interface EventNote {
  id: string;
  event_id: string;
  occurrence_date: string;
  takeaway: string;
  next_step: string | null;
}

const occKey = (eventId: string, date: string) => `${eventId}:${date}`;

// Recaps (visible to everyone who can see the event) and my own focus notes,
// loaded once for a list of past sessions.
export function useEventAfterData(sessions: Session[] | null) {
  const { supabase, userId } = useCommunity();
  const [recaps, setRecaps] = useState<Record<string, EventRecap>>({});
  const [notes, setNotes] = useState<Record<string, EventNote>>({});
  const ids = Array.from(new Set((sessions ?? []).filter((s) => s.end.getTime() < Date.now()).map((s) => s.event.id))).sort().join(",");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!ids || !userId) return;
    const list = ids.split(",");
    void Promise.all([
      supabase.from("cm_event_recaps").select("event_id, occurrence_date, post_id").in("event_id", list),
      supabase.from("cm_event_notes").select("id, event_id, occurrence_date, takeaway, next_step").eq("user_id", userId).in("event_id", list),
    ]).then(([r, n]) => {
      setRecaps(Object.fromEntries(((r.data as EventRecap[] | null) ?? []).map((x) => [occKey(x.event_id, x.occurrence_date), x])));
      setNotes(Object.fromEntries(((n.data as EventNote[] | null) ?? []).map((x) => [occKey(x.event_id, x.occurrence_date), x])));
    });
  }, [supabase, userId, ids, tick]);

  return {
    recapFor: (s: Session) => recaps[occKey(s.event.id, s.date)],
    noteFor: (s: Session) => notes[occKey(s.event.id, s.date)],
    reload: () => setTick((t) => t + 1),
  };
}

// Shown on a past session's card: the recap link, "Write recap" for hosts,
// and the member's private focus note.
export function EventAfter({ s, manage, recap, note, onChanged }: { s: Session; manage: boolean; recap?: EventRecap; note?: EventNote; onChanged: () => void }) {
  const status = useJournalAiStatus();
  const native = useIsNativeApp();
  const [writing, setWriting] = useState(false);
  const [focusing, setFocusing] = useState(false);
  const showFocus = !note && (status?.enabled || (status && !status.source && !native));

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {recap && (
          <Link href={`/community/post/${recap.post_id}`}>
            <Button size="sm" variant="outline">
              <BookOpenText className="h-4 w-4" /> Read the recap
            </Button>
          </Link>
        )}
        {manage && !recap && (
          <Button size="sm" variant="outline" onClick={() => setWriting(true)}>
            <NotebookPen className="h-4 w-4" /> Write recap
          </Button>
        )}
        {showFocus && (
          <Button size="sm" variant="ghost" className="text-[var(--cm-gold-text)]" onClick={() => setFocusing(true)}>
            <Sparkles className="h-4 w-4" /> My focus note
          </Button>
        )}
      </div>
      {note && (
        <div className="rounded-2xl border border-[var(--cm-line)] bg-[var(--cm-fill)] p-3 text-[14px] text-[var(--cm-body)]">
          <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--cm-muted)]">
            <Lock className="h-3 w-3" /> Your focus note — only you see this
          </p>
          <p>{note.takeaway}</p>
          {note.next_step && <p className="mt-1 text-[var(--cm-muted-2)]">Next step: {note.next_step}</p>}
        </div>
      )}
      {writing && (
        <RecapModal
          s={s}
          onClose={() => setWriting(false)}
          onPosted={() => {
            setWriting(false);
            onChanged();
          }}
        />
      )}
      {focusing && (
        <FocusNoteModal
          s={s}
          hasRecap={!!recap}
          onClose={() => setFocusing(false)}
          onSaved={() => {
            setFocusing(false);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function FocusNoteModal({ s, hasRecap, onClose, onSaved }: { s: Session; hasRecap: boolean; onClose: () => void; onSaved: () => void }) {
  const { supabase, userId } = useCommunity();
  const ai = useJournalAi();
  const status = useJournalAiStatus();
  const [thoughts, setThoughts] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ takeaway: string; next_step: string } | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      setDraft(await askMemberAi("focus_note", { eventId: s.event.id, date: s.date, thoughts }));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!draft || !userId) return;
    setBusy(true);
    const { error: err } = await supabase.from("cm_event_notes").upsert(
      {
        user_id: userId,
        event_id: s.event.id,
        occurrence_date: s.date,
        takeaway: draft.takeaway.trim(),
        next_step: draft.next_step.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,event_id,occurrence_date" }
    );
    setBusy(false);
    if (err) return setError("Couldn't save your note — please try again.");
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="My focus note">
      {!ai ? (
        status && !status.source ? (
          <PlusInvite title="Your personal focus note" what="Turn each session into one private takeaway and a next step." />
        ) : (
          <p className="text-[14px] text-[var(--cm-muted-2)]">{status?.unavailable ?? "Loading…"}</p>
        )
      ) : (
        <div className="space-y-3">
          <p className="text-[14px] text-[var(--cm-body)]">
            {ai.assistantName} turns <strong>{s.event.title}</strong> into one private takeaway and a next step for your week.
            {hasRecap ? " It uses the host's recap and anything you add." : " There's no recap yet, so tell it what stood out to you."}
          </p>
          {!draft ? (
            <>
              <div>
                <Label htmlFor="fn-thoughts">What stood out to you? {hasRecap ? "(optional)" : ""}</Label>
                <TextArea id="fn-thoughts" value={thoughts} onChange={(e) => setThoughts(e.target.value)} placeholder="An idea, a line that landed, something you want to try…" />
              </div>
              <p className="text-[12px] text-[var(--cm-muted)]">{AI_PRIVACY_NOTE}</p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="gold" onClick={generate} disabled={busy || (!hasRecap && thoughts.trim().length < 5)}>
                  <Sparkles className="h-4 w-4" /> {busy ? "Thinking…" : "Write my focus note"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="fn-take">Takeaway</Label>
                <TextArea id="fn-take" value={draft.takeaway} onChange={(e) => setDraft({ ...draft, takeaway: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="fn-step">Next step</Label>
                <Input id="fn-step" value={draft.next_step} onChange={(e) => setDraft({ ...draft, next_step: e.target.value })} />
              </div>
              <p className="flex items-center gap-1 text-[12px] text-[var(--cm-muted)]">
                <Lock className="h-3 w-3" /> Saved privately — only you see it.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  Start over
                </Button>
                <Button variant="gold" onClick={save} disabled={busy || !draft.takeaway.trim()}>
                  {busy ? "Saving…" : "Save privately"}
                </Button>
              </div>
            </>
          )}
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
    </Modal>
  );
}

function RecapModal({ s, onClose, onPosted }: { s: Session; onClose: () => void; onPosted: () => void }) {
  const { supabase, userId, spaces, channels, isAdmin, canModerate } = useCommunity();
  const e = s.event;
  const audience = e.space_ids?.length ? e.space_ids : spaces.map((x) => x.id);
  const options = channels.filter(
    (c) => audience.includes(c.space_id) && !c.archived && (c.post_policy === "members" || isAdmin || canModerate(c.space_id))
  );
  const preferred =
    options.find((c) => /recap|replay|event|live/.test(c.slug)) ?? options.find((c) => c.kind === "announcements") ?? options[0];
  const [pathwayId, setPathwayId] = useState(preferred?.id ?? "");
  const [notes, setNotes] = useState("");
  const [draft, setDraft] = useState<{ title: string; body: string } | null>(null);
  const [assistant, setAssistant] = useState("Mariposa");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await aiPost("/api/community/event-recap", { eventId: e.id, date: s.date, notes });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.result) throw new Error(json.error || "The AI didn't respond — try again.");
      const replay = json.replayUrl as string | null;
      setAssistant(json.assistantName || "Mariposa");
      setDraft({ title: json.result.title || e.title, body: `${json.result.body}${replay ? `\n\nWatch the replay: ${replay}` : ""}` });
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  }

  async function post() {
    const ch = options.find((c) => c.id === pathwayId);
    if (!draft || !ch || !userId) return setError("Choose where to post the recap.");
    setBusy(true);
    setError(null);
    const { data, error: postErr } = await supabase
      .from("cm_posts")
      .insert({ channel_id: ch.id, space_id: ch.space_id, author_id: userId, title: draft.title.trim() || null, body: draft.body.trim(), attachments: [] })
      .select("id")
      .single();
    if (postErr || !data) {
      setBusy(false);
      return setError(postErr?.message ?? "Couldn't post the recap.");
    }
    await supabase.from("cm_event_recaps").upsert(
      { event_id: e.id, occurrence_date: s.date, post_id: (data as { id: string }).id, created_by: userId },
      { onConflict: "event_id,occurrence_date" }
    );
    setBusy(false);
    onPosted();
  }

  const spaceName = (id: string) => spaces.find((x) => x.id === id)?.name ?? "";

  return (
    <Modal open onClose={onClose} title="Write the recap" wide>
      <div className="space-y-3">
        <p className="text-[14px] text-[var(--cm-body)]">
          Paste your notes or the replay transcript from <strong>{e.title}</strong>. You&rsquo;ll get a draft recap to edit — nothing posts until you tap Post.
        </p>
        {!draft ? (
          <>
            <TextArea value={notes} onChange={(ev) => setNotes(ev.target.value)} placeholder="Notes, key moments, or the full transcript…" className="min-h-[200px]" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="gold" onClick={generate} disabled={busy || notes.trim().length < 40}>
                <Sparkles className="h-4 w-4" /> {busy ? "Drafting…" : "Draft the recap"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cm-gold-text)]">
              <Sparkles className="h-3.5 w-3.5" /> {assistant}&rsquo;s draft — edit freely
            </p>
            <div>
              <Label htmlFor="rc-title">Title</Label>
              <Input id="rc-title" value={draft.title} onChange={(ev) => setDraft({ ...draft, title: ev.target.value })} />
            </div>
            <div>
              <Label htmlFor="rc-body">Recap</Label>
              <TextArea id="rc-body" value={draft.body} onChange={(ev) => setDraft({ ...draft, body: ev.target.value })} className="min-h-[220px]" />
            </div>
            <div>
              <Label htmlFor="rc-where">Post in</Label>
              <select
                id="rc-where"
                value={pathwayId}
                onChange={(ev) => setPathwayId(ev.target.value)}
                className="w-full rounded-xl border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-3 py-2.5 text-[15px] text-[var(--cm-ink)]"
              >
                {options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {spaceName(c.space_id)} › {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Start over
              </Button>
              <Button variant="gold" onClick={post} disabled={busy || !draft.body.trim() || !pathwayId}>
                {busy ? "Posting…" : "Post recap"}
              </Button>
            </div>
          </>
        )}
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  );
}
