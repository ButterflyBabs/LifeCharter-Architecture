"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Send,
  Trash2,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/postStreamConstants";

interface Post {
  id: string;
  title: string;
  caption: string;
  platforms: string[];
  status: string;
  scheduledAt: string | null;
  createdAt: string | null;
  publishedAt: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "#5a5148", bg: "#eee9e2" },
  scheduled: { label: "Scheduled", color: "#1c5a60", bg: "#d3ebee" },
  published: { label: "Published", color: "#2c6b3f", bg: "#d8efdd" },
  failed: { label: "Failed", color: "#8a2f2f", bg: "#f6dcdc" },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function postDate(p: Post): Date | null {
  const s = p.scheduledAt || p.publishedAt || p.createdAt;
  return s ? new Date(s) : null;
}

export default function ContentCalendarPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState({ y: 0, m: 0 }); // set on mount
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/content/posts");
      const d = await res.json().catch(() => ({}));
      setConnected(Boolean(d.connected));
      if (Array.isArray(d.posts)) setPosts(d.posts);
      if (d.error) setError(d.error);
    } catch {
      setConnected(false);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    setCursor({ y: now.getFullYear(), m: now.getMonth() });
    load();
  }, [load]);

  // Group posts by YYYY-MM-DD (local).
  const byDay = new Map<string, Post[]>();
  for (const p of posts) {
    const dt = postDate(p);
    if (!dt) continue;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(p);
  }

  const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const keyFor = (day: number) =>
    `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const move = (delta: number) => {
    setSelectedDay(null);
    setCursor((c) => {
      const nm = c.m + delta;
      const y = c.y + Math.floor(nm / 12);
      const m = ((nm % 12) + 12) % 12;
      return { y, m };
    });
  };

  const publish = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/content/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "publish" }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.post) setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...d.post } : p)));
      else if (d.error) setError(d.error);
    } finally {
      setBusyId(null);
      load();
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/content/posts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  const todayKey = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  })();

  const dayPosts = selectedDay ? byDay.get(selectedDay) || [] : [];

  const counts = posts.reduce<Record<string, number>>((m, p) => {
    m[p.status] = (m[p.status] || 0) + 1;
    return m;
  }, {});

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto">
      <Link href="/daily-compass" className="inline-flex items-center gap-1.5 text-sm text-[#2E7C83] hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Daily Compass
      </Link>

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7b6b8d] to-[#2E7C83] flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Content Calendar</h1>
            <p className="text-[#b8a898]">Your PostStream posts — drafts, scheduled, and published.</p>
          </div>
        </div>
        <Link
          href="/daily-compass/content-studio"
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-xl bg-[#2E7C83] text-white hover:bg-[#256b71]"
        >
          <Plus className="w-4 h-4" /> Create content
        </Link>
      </div>

      {connected === false && (
        <div className="mb-6 rounded-2xl border border-[#c9a227]/40 bg-[#c9a227]/10 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#8a6a15] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#8a6a15]">
            Connect PostStream in{" "}
            <Link href="/settings" className="underline font-medium">Settings → Integrations</Link>{" "}
            to see and schedule your posts here.
          </p>
        </div>
      )}
      {error && <p className="mb-4 text-xs text-[#8a2f2f]">PostStream: {error}</p>}

      {/* Status summary */}
      {connected && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(["draft", "scheduled", "published"] as const).map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ color: STATUS_META[s].color, backgroundColor: STATUS_META[s].bg }}
            >
              {STATUS_META[s].label}: {counts[s] || 0}
            </span>
          ))}
        </div>
      )}

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => move(-1)} className="p-2 rounded-lg hover:bg-[#1a2b4a]/5" aria-label="Previous month">
          <ChevronLeft className="w-5 h-5 text-[#1a2b4a] dark:text-[#F8F5F0]" />
        </button>
        <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
          {MONTHS[cursor.m]} {cursor.y}
        </h2>
        <button onClick={() => move(1)} className="p-2 rounded-lg hover:bg-[#1a2b4a]/5" aria-label="Next month">
          <ChevronRight className="w-5 h-5 text-[#1a2b4a] dark:text-[#F8F5F0]" />
        </button>
      </div>

      {!loaded ? (
        <p className="text-sm text-[#b8a898]">Loading…</p>
      ) : (
        <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#1a2b4a]/10">
            {DOW.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-[#b8a898] py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} className="min-h-[84px] border-b border-r border-[#1a2b4a]/6" />;
              const k = keyFor(day);
              const dayItems = byDay.get(k) || [];
              const isToday = k === todayKey;
              return (
                <button
                  key={k}
                  onClick={() => setSelectedDay(k)}
                  className={`min-h-[84px] border-b border-r border-[#1a2b4a]/6 p-1.5 text-left align-top hover:bg-[#2E7C83]/5 ${
                    selectedDay === k ? "bg-[#2E7C83]/10" : ""
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                      isToday ? "bg-[#2E7C83] text-white font-bold" : "text-[#1a2b4a] dark:text-[#F8F5F0]"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayItems.slice(0, 3).map((p) => {
                      const m = STATUS_META[p.status] || STATUS_META.draft;
                      return (
                        <div
                          key={p.id}
                          className="truncate text-[10px] px-1 py-0.5 rounded"
                          style={{ color: m.color, backgroundColor: m.bg }}
                          title={p.title}
                        >
                          {p.title || "(untitled)"}
                        </div>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <div className="text-[10px] text-[#b8a898]">+{dayItems.length - 3} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-4 rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{selectedDay}</h3>
            <button onClick={() => setSelectedDay(null)} aria-label="Close">
              <X className="w-4 h-4 text-[#b8a898]" />
            </button>
          </div>
          {dayPosts.length === 0 ? (
            <p className="text-sm text-[#b8a898]">
              Nothing scheduled.{" "}
              <Link href="/daily-compass/content-studio" className="text-[#2E7C83] hover:underline">Create a post</Link>.
            </p>
          ) : (
            <div className="space-y-2">
              {dayPosts.map((p) => {
                const m = STATUS_META[p.status] || STATUS_META.draft;
                return (
                  <div key={p.id} className="rounded-xl border border-[#1a2b4a]/10 p-3">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ color: m.color, backgroundColor: m.bg }}
                      >
                        {m.label}
                      </span>
                      {p.platforms.map((pl) => (
                        <span key={pl} className="text-[11px] px-2 py-0.5 rounded-full bg-[#2E7C83]/10 text-[#2E7C83]">
                          {PLATFORM_LABELS[pl] || pl}
                        </span>
                      ))}
                    </div>
                    <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{p.title || "(untitled)"}</p>
                    {p.caption && <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf] line-clamp-2 mt-0.5">{p.caption}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {p.status !== "published" && (
                        <button
                          onClick={() => publish(p.id)}
                          disabled={busyId === p.id}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
                        >
                          {busyId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Publish now
                        </button>
                      )}
                      <button
                        onClick={() => remove(p.id)}
                        disabled={busyId === p.id}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#8a2f2f]/25 text-[#8a2f2f] hover:bg-[#8a2f2f]/5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
