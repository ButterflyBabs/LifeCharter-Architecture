"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sun,
  Calendar,
  CheckSquare,
  DollarSign,
  Sparkles,
  ArrowRight,
  Clock,
  RefreshCw,
} from "lucide-react";

interface ScheduleEvent {
  id: string;
  title: string;
  time: string;
  start: string | null;
  account?: string;
}

interface RealTask {
  id: number;
  title: string;
  status: string;
  priority: string;
  business: { name: string; color: string } | null;
  segment: { name: string; color: string } | null;
}

interface Finance {
  hasData: boolean;
  thisMonth: number;
  changePct: number | null;
  weekly: number[];
}

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export default function MorningBriefPage() {
  const [firstName, setFirstName] = useState("");
  const [schedule, setSchedule] = useState<{ connected: boolean; events: ScheduleEvent[] } | null>(null);
  const [tasks, setTasks] = useState<RealTask[]>([]);
  const [finance, setFinance] = useState<Finance | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    setNow(new Date());
  }, []);

  // Load the day's data.
  useEffect(() => {
    const tz =
      (typeof window !== "undefined" &&
        (localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone)) ||
      "UTC";
    Promise.all([
      fetch("/api/profile").then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/schedule?tz=${encodeURIComponent(tz)}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/tasks").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/financial-pulse").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([p, s, t, f]) => {
        if (p?.firstName) setFirstName(p.firstName);
        if (s) setSchedule(s);
        if (t?.tasks) setTasks(t.tasks);
        if (f) setFinance(f);
      })
      .catch(() => {})
      .finally(() => setDataReady(true));
  }, []);

  const topTasks = [...tasks]
    .sort((a, b) => {
      const aToday = a.status === "today" ? 0 : 1;
      const bToday = b.status === "today" ? 0 : 1;
      if (aToday !== bToday) return aToday - bToday;
      return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
    })
    .slice(0, 5);

  const nextEvent = schedule?.events?.[0] ?? null;

  const greeting = (() => {
    if (!now) return "Hello";
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const dateLabel = now
    ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";

  // Ask Mariposa for a short spoken-style briefing built from the day's data.
  const buildAiSummary = useCallback(async () => {
    setAiLoading(true);
    setAiSummary(null);
    const meetings = schedule?.connected
      ? schedule.events.length
        ? `${schedule.events.length} meeting(s), next "${schedule.events[0].title}" at ${schedule.events[0].time}`
        : "no meetings today"
      : "calendar not connected";
    const taskLine = tasks.length
      ? `${tasks.length} open task(s); top: ${topTasks.map((t) => t.title).slice(0, 3).join("; ")}`
      : "no open tasks";
    const revLine = finance?.hasData
      ? `${currency(finance.thisMonth)} revenue this month`
      : "no revenue recorded yet";
    const message =
      `Give me my morning briefing in 2-3 warm, focused sentences (speak to me directly as ${firstName || "the founder"}). ` +
      `Today: ${meetings}. Tasks: ${taskLine}. Finance: ${revLine}. ` +
      `End with one clear suggestion for where to focus first. Keep it encouraging, not fluffy.`;
    try {
      const res = await fetch("/api/mariposa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setAiSummary(data.reply ?? "I couldn't put your briefing together right now.");
    } catch {
      setAiSummary("I couldn't put your briefing together right now.");
    }
    setAiLoading(false);
  }, [schedule, tasks, finance, firstName, topTasks]);

  // Generate the AI summary once the day's data has loaded.
  useEffect(() => {
    if (dataReady && aiSummary === null && !aiLoading) {
      buildAiSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataReady]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#c9a227] mb-1">
            <Sun className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wide">{dateLabel}</span>
          </div>
          <h1 className="font-serif text-3xl text-indigo-900">
            {greeting}
            {firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="text-gray-500 mt-1">Here&apos;s your briefing for the day.</p>
        </div>
        <Link
          href="/daily-compass"
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#d8a63f] to-[#e0b24d] text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all flex-shrink-0"
        >
          Open Daily Compass
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* AI Briefing */}
      <div className="bg-gradient-to-br from-[#f6f1fa] to-[#eef4f4] rounded-2xl border border-[#E8E4F0] p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5E3B6C] to-[#2E7C83] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-serif text-lg text-indigo-900">Your briefing from Mariposa</h2>
          </div>
          <button
            onClick={buildAiSummary}
            disabled={aiLoading}
            className="inline-flex items-center gap-1.5 text-xs text-[#2E7C83] hover:text-[#2E7C83]/80 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        <p className="text-[#3F4654] leading-relaxed whitespace-pre-wrap min-h-[3rem]">
          {aiLoading || !dataReady
            ? "Putting your briefing together…"
            : aiSummary || "No briefing yet."}
        </p>
      </div>

      {/* At a glance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Next meeting */}
        <Link
          href="/daily-compass/calendar"
          className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 text-[#7B6B8D] mb-3">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Next meeting</span>
          </div>
          {schedule && !schedule.connected ? (
            <p className="text-sm text-gray-400">Connect your calendar</p>
          ) : nextEvent ? (
            <div>
              <p className="text-indigo-900 font-medium leading-snug">{nextEvent.title}</p>
              <p className="text-sm text-[#7C7C82] mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {nextEvent.time}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No meetings today — open runway.</p>
          )}
        </Link>

        {/* Tasks */}
        <Link
          href="/tasks"
          className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 text-[#7B6B8D] mb-3">
            <CheckSquare className="w-5 h-5" />
            <span className="text-sm font-medium">Tasks</span>
          </div>
          <p className="text-2xl font-serif text-indigo-900">{tasks.length}</p>
          <p className="text-sm text-[#7C7C82] mt-1">
            {tasks.length === 1 ? "task needs attention" : "tasks need attention"}
          </p>
        </Link>

        {/* Revenue */}
        <Link
          href="/finance"
          className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 text-[#7B6B8D] mb-3">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Revenue this month</span>
          </div>
          {finance?.hasData ? (
            <>
              <p className="text-2xl font-serif text-indigo-900">{currency(finance.thisMonth)}</p>
              {finance.changePct !== null && (
                <p
                  className={`text-sm mt-1 ${
                    finance.changePct >= 0 ? "text-[#54A33B]" : "text-[#D83A34]"
                  }`}
                >
                  {finance.changePct >= 0 ? "▲" : "▼"} {Math.abs(finance.changePct)}% vs last month
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">No revenue recorded yet.</p>
          )}
        </Link>
      </div>

      {/* Two columns: schedule + top tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's schedule */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
          <h3 className="font-serif text-base text-indigo-900 mb-4">Today&apos;s schedule</h3>
          {schedule && !schedule.connected ? (
            <a href="/api/google/auth" className="text-sm text-[#2E7C83] hover:underline">
              Connect a calendar to see today&apos;s meetings
            </a>
          ) : schedule && schedule.events.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing scheduled — a clear day.</p>
          ) : (
            <div className="space-y-3">
              {(schedule?.events ?? []).map((ev, i) => {
                const dots = ["#2E7C83", "#7B6B8D", "#c9a227", "#1a2b4a"];
                return (
                  <div key={ev.id} className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dots[i % dots.length] }}
                    />
                    <span className="text-sm text-[#3F4654]">
                      {ev.time} — {ev.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top tasks */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base text-indigo-900">Where to focus</h3>
            <Link href="/tasks" className="text-xs text-[#2E7C83] hover:underline">
              All tasks
            </Link>
          </div>
          {topTasks.length === 0 ? (
            <p className="text-sm text-gray-400">No open tasks — nicely done.</p>
          ) : (
            <div className="space-y-2.5">
              {topTasks.map((t) => {
                const dot =
                  t.priority === "critical"
                    ? "#D83A34"
                    : t.priority === "high"
                      ? "#F0B400"
                      : t.priority === "medium"
                        ? "#54A33B"
                        : "#9CA3AF";
                return (
                  <div key={t.id} className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: dot }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-[#3F4654] leading-snug break-words">{t.title}</p>
                      {t.business?.name && (
                        <span className="text-[11px] text-gray-400">{t.business.name}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile CTA */}
      <Link
        href="/daily-compass"
        className="sm:hidden mt-6 inline-flex items-center justify-center gap-1.5 w-full py-3 bg-gradient-to-r from-[#d8a63f] to-[#e0b24d] text-white rounded-lg text-sm font-medium shadow-sm"
      >
        Open Daily Compass
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
