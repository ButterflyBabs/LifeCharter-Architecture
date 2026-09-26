"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, FileText, Loader2, Send, Sparkles, Wand2, X } from "lucide-react";
import { PLATFORMS, PLATFORM_LABELS } from "@/lib/postStreamConstants";
import { MediaPicker, type MediaValue } from "@/components/content/MediaPicker";
import { cx } from "@/components/social/ui";
import type { PlannedPost } from "@/lib/social/planner";

// Create, schedule and publish a post — one composer, opened from the Content
// Calendar. New posts land on the calendar; an existing calendar post can be
// sent through PostStream from here too (plannedIds), and the two stay linked.

export interface ComposerInitial {
  title?: string;
  caption?: string;
  platforms?: string[];
  date?: string; // YYYY-MM-DD the post belongs to
  plannedIds?: string[]; // calendar posts being sent (their platforms are fixed)
  mediaUrls?: string[];
  scheduledAt?: string; // ISO, when it's already scheduled
}

interface Account {
  id: string;
  platform: string;
  username: string;
}

// "2026-10-03T09:00" for a datetime-local box, from an ISO instant or a plain date.
function localInput(iso?: string, date?: string): string {
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      const p = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    }
  }
  return date ? `${date}T09:00` : "";
}

export function PostComposer({
  plannerOn,
  initial,
  onClose,
  onSent,
}: {
  plannerOn: boolean;
  initial: ComposerInitial;
  onClose: () => void;
  onSent: (planned: PlannedPost[]) => void;
}) {
  const fixedPlatforms = Boolean(initial.plannedIds?.length);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsError, setAccountsError] = useState("");

  const [title, setTitle] = useState(initial.title || "");
  const [caption, setCaption] = useState(initial.caption || "");
  const [selected, setSelected] = useState<string[]>(initial.platforms || []);
  const [media, setMedia] = useState<MediaValue>({ urls: [], uploading: false });
  const [when, setWhen] = useState<"draft" | "schedule" | "now">(initial.scheduledAt || initial.date ? "schedule" : "draft");
  const [scheduledAt, setScheduledAt] = useState(localInput(initial.scheduledAt, initial.date));

  const [aiIdea, setAiIdea] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const [grounded, setGrounded] = useState<{ plan: boolean; voice: boolean } | null>(null);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [sentOk, setSentOk] = useState(false);

  const loadAccounts = useCallback(async () => {
    try {
      const d = await (await fetch("/api/content/accounts")).json().catch(() => ({}));
      setConnected(Boolean(d.connected));
      if (Array.isArray(d.accounts)) setAccounts(d.accounts);
      if (d.error) setAccountsError(d.error);
    } catch {
      setConnected(false);
    }
  }, []);
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const connectedPlatforms = Array.from(new Set(accounts.map((a) => a.platform)));
  const offer = connectedPlatforms.length ? connectedPlatforms : (PLATFORMS as readonly string[]);
  const toggle = (p: string) => setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const draftWithAi = async () => {
    if (!aiIdea.trim()) return setMsg({ kind: "err", text: "Add a quick idea for the post first." });
    setAiBusy(true);
    setNeedsKey(false);
    setMsg(null);
    try {
      const d = await (
        await fetch("/api/content/ai-caption", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea: aiIdea, platforms: selected }),
        })
      )
        .json()
        .catch(() => ({}));
      if (d.needsKey) setNeedsKey(true);
      else if (d.caption !== undefined) {
        const tags = Array.isArray(d.hashtags) && d.hashtags.length ? "\n\n" + d.hashtags.join(" ") : "";
        setCaption((d.caption || "") + tags);
        setGrounded(d.grounded || null);
        if (!title) setTitle(aiIdea.slice(0, 60));
      } else setMsg({ kind: "err", text: d.error || "Couldn't draft a caption." });
    } catch {
      setMsg({ kind: "err", text: "Couldn't reach the AI." });
    } finally {
      setAiBusy(false);
    }
  };

  const submit = async () => {
    if (!title.trim()) return setMsg({ kind: "err", text: "Give your post a title." });
    if (!fixedPlatforms && selected.length === 0) return setMsg({ kind: "err", text: "Pick at least one platform." });
    if (media.uploading) return setMsg({ kind: "err", text: "Wait for your images or video to finish uploading." });
    if (when === "schedule" && !scheduledAt) return setMsg({ kind: "err", text: "Choose a date and time to schedule." });
    setSaving(true);
    setMsg(null);
    try {
      const iso = when === "schedule" ? new Date(scheduledAt).toISOString() : null;
      const res = await fetch("/api/content/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          caption,
          platforms: selected,
          when,
          scheduledAt: iso,
          // The calendar day it belongs on: the scheduled day, else the day it came from, else today.
          date: when === "schedule" ? scheduledAt.slice(0, 10) : initial.date || null,
          mediaUrls: media.urls.length ? media.urls : initial.mediaUrls || [],
          mediaType: media.mediaType,
          plannedIds: initial.plannedIds || [],
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || d.error) return setMsg({ kind: "err", text: d.error || "Couldn't send the post." });
      setSentOk(true);
      setMsg({
        kind: "ok",
        text:
          when === "now" ? "Published! 🎉" : when === "schedule" ? "Scheduled — it's on your Content Calendar." : "Saved as a draft on your Content Calendar.",
      });
      onSent(Array.isArray(d.planned) ? d.planned : []);
    } finally {
      setSaving(false);
    }
  };

  const noPs = connected === false;
  const canSchedule = !noPs;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0F1A38]/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={fixedPlatforms ? "Send with PostStream" : "Create content"}
        className="h-full w-full max-w-2xl overflow-y-auto bg-[#FAF8F3] dark:bg-[#0E162A] p-5 sm:p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={cx.eyebrow}>Content Calendar</p>
            <h2 className={cx.h2}>{fixedPlatforms ? "Schedule or publish this post" : "Create content"}</h2>
            <p className={cx.muted}>Write it, pick when it goes out, and PostStream posts it for you. It stays on your calendar.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-[#0F1A38]/5">
            <X className="h-5 w-5 text-[#64748B]" />
          </button>
        </div>

        {noPs && (
          <div className="flex items-start gap-3 rounded-2xl border border-[#c9a227]/40 bg-[#c9a227]/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8a6a15]" />
            <p className="text-sm text-[#8a6a15]">
              PostStream isn&apos;t connected yet. Add your key in <Link href="/settings" className="font-medium underline">Settings → Integrations</Link> to schedule and publish.
              {plannerOn ? " You can still save a draft on the calendar." : ""}
            </p>
          </div>
        )}
        {accountsError && <p className="text-xs text-[#8a2f2f]">PostStream: {accountsError}</p>}

        <label className="block">
          <span className={cx.label}>Title</span>
          <input className={cx.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Internal title for this post" />
        </label>

        <div>
          <span className={cx.label}>
            Platforms {!fixedPlatforms && connectedPlatforms.length === 0 && <span className="font-normal">(none connected yet — showing all)</span>}
          </span>
          <div className="flex flex-wrap gap-2">
            {(fixedPlatforms ? selected : offer).map((p) => {
              const on = selected.includes(p);
              const acct = accounts.find((a) => a.platform === p);
              return (
                <button
                  key={p}
                  type="button"
                  disabled={fixedPlatforms}
                  onClick={() => toggle(p)}
                  title={acct ? `@${acct.username}` : undefined}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    on ? "border-[#0F1A38] bg-[#0F1A38] text-white" : "border-[#0F1A38]/15 text-[#0F1A38] dark:text-[#FAF8F3] hover:bg-[#0F1A38]/5"
                  }`}
                >
                  {PLATFORM_LABELS[p] || p}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#2E7C83]/25 bg-[#F1F7F7] dark:bg-[#12303a] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2E7C83]" />
            <span className="text-sm font-semibold text-[#12303a] dark:text-[#FAF8F3]">Draft with AI</span>
          </div>
          {needsKey && <p className="mb-2 text-xs text-[#8a6a15]">Connect your AI key in Settings to draft captions with AI.</p>}
          <div className="flex items-center gap-2">
            <input
              aria-label="What's the post about?"
              className={cx.input}
              value={aiIdea}
              onChange={(e) => setAiIdea(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && draftWithAi()}
              placeholder="What's the post about? (a few words)"
            />
            <button onClick={draftWithAi} disabled={aiBusy} className={`${cx.btn} ${cx.primary} shrink-0`}>
              {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Draft
            </button>
          </div>
          {grounded && (
            <p className="mt-2 text-xs text-[#12303a]/80 dark:text-[#FAF8F3]/80" role="status">
              {grounded.plan || grounded.voice ? (
                <>Written using your {[grounded.plan && "Marketing Plan", grounded.voice && "Voice & rules"].filter(Boolean).join(" and ")}.</>
              ) : (
                <>
                  Tip: fill in your <Link href="/marketing-plan" className="underline">Marketing Plan</Link> and drafts will sound like you.
                </>
              )}
            </p>
          )}
        </div>

        <label className="block">
          <span className={cx.label}>Caption</span>
          <textarea rows={6} className={cx.input} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write your caption, or draft it with AI above." />
        </label>

        <MediaPicker onChange={setMedia} resetKey={0} />
        {initial.mediaUrls?.length && !media.urls.length ? <p className={cx.muted}>This post already has {initial.mediaUrls.length} attached — add new ones only to replace them.</p> : null}

        <div>
          <span className={cx.label}>When</span>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "draft", label: "Save as draft", icon: <FileText className="h-4 w-4" /> },
                { id: "schedule", label: "Schedule", icon: <Clock className="h-4 w-4" /> },
                { id: "now", label: "Publish now", icon: <Send className="h-4 w-4" /> },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                disabled={o.id !== "draft" && !canSchedule}
                onClick={() => setWhen(o.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50 ${
                  when === o.id ? "border-[#0F1A38] bg-[#0F1A38] text-white" : "border-[#0F1A38]/15 text-[#0F1A38] dark:text-[#FAF8F3] hover:bg-[#0F1A38]/5"
                }`}
              >
                {o.icon} {o.label}
              </button>
            ))}
            {when === "schedule" && (
              <input type="datetime-local" aria-label="Date and time" className={`${cx.input} !w-auto`} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            )}
          </div>
        </div>

        {msg && (
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${msg.kind === "ok" ? "bg-[#d8efdd] text-[#2c6b3f]" : "bg-[#f6dcdc] text-[#8a2f2f]"}`}>
            {msg.kind === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {msg.text}
          </div>
        )}

        {sentOk ? (
          <button onClick={onClose} className={`${cx.btn} ${cx.primary} w-full !py-3`}>
            Done
          </button>
        ) : (
          <button onClick={submit} disabled={saving || (noPs && !plannerOn)} className={`${cx.btn} ${cx.primary} w-full !py-3`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {when === "now" ? "Publish post" : when === "schedule" ? "Schedule post" : "Save draft"}
          </button>
        )}
      </div>
    </div>
  );
}
