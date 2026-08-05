"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Sparkles,
  Wand2,
  Loader2,
  Calendar,
  Send,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { PLATFORMS, PLATFORM_LABELS } from "@/lib/postStreamConstants";

interface Account {
  id: string;
  platform: string;
  username: string;
  followersCount: number;
}

export default function CreateContentPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsError, setAccountsError] = useState("");

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [when, setWhen] = useState<"draft" | "schedule" | "now">("draft");
  const [scheduledAt, setScheduledAt] = useState("");

  const [aiIdea, setAiIdea] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/content/accounts");
      const d = await res.json().catch(() => ({}));
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

  // Platforms to offer: connected ones first; fall back to the full list.
  const connectedPlatforms = Array.from(new Set(accounts.map((a) => a.platform)));
  const offerPlatforms = connectedPlatforms.length ? connectedPlatforms : (PLATFORMS as readonly string[]);

  const togglePlatform = (p: string) =>
    setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const addMedia = () => {
    const u = mediaUrl.trim();
    if (u && !mediaUrls.includes(u)) setMediaUrls((prev) => [...prev, u]);
    setMediaUrl("");
  };

  const draftWithAi = async () => {
    if (!aiIdea.trim()) {
      setMsg({ kind: "err", text: "Add a quick idea for the post first." });
      return;
    }
    setAiBusy(true);
    setNeedsKey(false);
    setMsg(null);
    try {
      const res = await fetch("/api/content/ai-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: aiIdea, platforms: selected }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.needsKey) {
        setNeedsKey(true);
      } else if (d.caption !== undefined) {
        const tags = Array.isArray(d.hashtags) && d.hashtags.length ? "\n\n" + d.hashtags.join(" ") : "";
        setCaption((d.caption || "") + tags);
        if (!title) setTitle(aiIdea.slice(0, 60));
      } else {
        setMsg({ kind: "err", text: d.error || "Couldn't draft a caption." });
      }
    } catch {
      setMsg({ kind: "err", text: "Couldn't reach the AI." });
    } finally {
      setAiBusy(false);
    }
  };

  const submit = async () => {
    if (!title.trim()) {
      setMsg({ kind: "err", text: "Give your post a title." });
      return;
    }
    if (selected.length === 0) {
      setMsg({ kind: "err", text: "Pick at least one platform." });
      return;
    }
    if (when === "schedule" && !scheduledAt) {
      setMsg({ kind: "err", text: "Choose a date and time to schedule." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const status = when === "schedule" ? "scheduled" : "draft";
      const payload = {
        title: title.trim(),
        caption,
        platforms: selected,
        status,
        scheduledAt: when === "schedule" ? new Date(scheduledAt).toISOString() : null,
        mediaUrls,
      };
      const res = await fetch("/api/content/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || d.error) {
        setMsg({ kind: "err", text: d.error || "Couldn't create the post." });
        return;
      }
      // Publish-now: create as draft above, then push to platforms.
      if (when === "now" && d.post?.id) {
        const pub = await fetch("/api/content/posts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: d.post.id, action: "publish" }),
        });
        const pd = await pub.json().catch(() => ({}));
        if (!pub.ok || pd.error) {
          setMsg({ kind: "err", text: `Saved as draft, but publishing failed: ${pd.error || "try from the calendar"}.` });
          return;
        }
      }
      setMsg({
        kind: "ok",
        text:
          when === "now"
            ? "Published! 🎉"
            : when === "schedule"
            ? "Scheduled — it'll appear on your Content Calendar."
            : "Saved as a draft on your Content Calendar.",
      });
      setTitle("");
      setCaption("");
      setSelected([]);
      setMediaUrls([]);
      setScheduledAt("");
      setWhen("draft");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-8 px-4 max-w-3xl mx-auto">
      <Link href="/daily-compass" className="inline-flex items-center gap-1.5 text-sm text-[#2E7C83] hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Daily Compass
      </Link>

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7b6b8d] to-[#2E7C83] flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Create Content</h1>
            <p className="text-[#b8a898]">Compose, schedule, and publish social posts through PostStream.</p>
          </div>
        </div>
        <Link
          href="/daily-compass/calendar"
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-xl border border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
        >
          <Calendar className="w-4 h-4" /> Content Calendar
        </Link>
      </div>

      {connected === false && (
        <div className="mb-6 rounded-2xl border border-[#c9a227]/40 bg-[#c9a227]/10 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#8a6a15] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-[#8a6a15]">PostStream isn&apos;t connected yet.</p>
            <p className="text-sm text-[#8a6a15]/90 mt-0.5">
              Add your PostStream API key in{" "}
              <Link href="/settings" className="underline font-medium">Settings → Integrations</Link>{" "}
              to publish and schedule. You can still draft here.
            </p>
          </div>
        </div>
      )}
      {accountsError && <p className="mb-4 text-xs text-[#8a2f2f]">PostStream: {accountsError}</p>}

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Internal title for this post"
            className="w-full px-3 h-11 rounded-xl border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/30 text-[#1a2b4a] dark:text-[#F8F5F0]"
          />
        </div>

        {/* Platforms */}
        <div>
          <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
            Platforms{" "}
            {connectedPlatforms.length === 0 && (
              <span className="text-xs text-[#b8a898]">(none connected yet — showing all)</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {offerPlatforms.map((p) => {
              const on = selected.includes(p);
              const acct = accounts.find((a) => a.platform === p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    on
                      ? "bg-[#2E7C83] text-white border-[#2E7C83]"
                      : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
                  }`}
                  title={acct ? `@${acct.username}` : "Not connected"}
                >
                  {PLATFORM_LABELS[p] || p}
                </button>
              );
            })}
          </div>
        </div>

        {/* AI draft */}
        <div className="rounded-2xl border border-[#2E7C83]/25 bg-[#F1F7F7] dark:bg-[#12303a] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#2E7C83]" />
            <span className="text-sm font-semibold text-[#12303a] dark:text-[#F8F5F0]">Draft with AI</span>
          </div>
          {needsKey && (
            <p className="text-xs text-[#8a6a15] mb-2">Connect your AI key in settings to draft captions with AI.</p>
          )}
          <div className="flex items-center gap-2">
            <input
              value={aiIdea}
              onChange={(e) => setAiIdea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") draftWithAi();
              }}
              placeholder="What's the post about? (a few words)"
              className="flex-1 px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
            />
            <button
              onClick={draftWithAi}
              disabled={aiBusy}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 h-10 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
            >
              {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Draft
            </button>
          </div>
        </div>

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={6}
            placeholder="Write your caption, or draft it with AI above."
            className="w-full px-3 py-2 rounded-xl border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/30 text-[#1a2b4a] dark:text-[#F8F5F0]"
          />
        </div>

        {/* Media */}
        <div>
          <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Media (image/video URLs)</label>
          <div className="flex items-center gap-2">
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMedia();
                }
              }}
              placeholder="https://…"
              className="flex-1 px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
            />
            <button
              onClick={addMedia}
              className="inline-flex items-center gap-1 text-sm font-medium px-3 h-10 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
            >
              <ImageIcon className="w-4 h-4" /> Add
            </button>
          </div>
          {mediaUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {mediaUrls.map((u) => (
                <span
                  key={u}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[#1a2b4a]/8 text-[#1a2b4a] dark:text-[#F8F5F0] max-w-[220px]"
                >
                  <span className="truncate">{u}</span>
                  <button onClick={() => setMediaUrls((prev) => prev.filter((x) => x !== u))} aria-label="Remove">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* When */}
        <div>
          <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">When</label>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "draft", label: "Save as draft", icon: <FileText className="w-4 h-4" /> },
              { id: "schedule", label: "Schedule", icon: <Clock className="w-4 h-4" /> },
              { id: "now", label: "Publish now", icon: <Send className="w-4 h-4" /> },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setWhen(opt.id as "draft" | "schedule" | "now")}
                className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border ${
                  when === opt.id
                    ? "bg-[#1a2b4a] text-white border-[#1a2b4a]"
                    : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
            {when === "schedule" && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
              />
            )}
          </div>
          {when === "now" && connected === false && (
            <p className="text-xs text-[#8a6a15] mt-2">Publishing needs PostStream connected. It&apos;ll save as a draft otherwise.</p>
          )}
        </div>

        {msg && (
          <div
            className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2 ${
              msg.kind === "ok" ? "bg-[#d8efdd] text-[#2c6b3f]" : "bg-[#f6dcdc] text-[#8a2f2f]"
            }`}
          >
            {msg.kind === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {msg.text}
          </div>
        )}

        <button
          onClick={submit}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {when === "now" ? "Publish post" : when === "schedule" ? "Schedule post" : "Save draft"}
        </button>
      </div>
    </div>
  );
}
