"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import QuickWins from "@/components/QuickWins";
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
  const [assistantName, setAssistantName] = useState("Mariposa");
  const [hasAiKey, setHasAiKey] = useState(false);
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
        if (p?.assistantName) setAssistantName(p.assistantName);
        setHasAiKey(Boolean(p?.hasOpenAiKey));
        if (s) setSchedule(s);
        if (t?.tasks) setTasks(t.tasks);
        if (f) setFinance(f);
      })
      .catch(() => {})
      .finally(() => setDataReady(true));
  }, []);

  const byPriority = (a: RealTask, b: RealTask) =>
    (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);

  // Active = not done. Today's focus vs anything carried over (still open from
  // earlier). Completed tasks drop off entirely.
  const activeTasks = tasks.filter((t) => t.status !== "done");
  const todayFocus = activeTasks.filter((t) => t.status === "today").sort(byPriority).slice(0, 6);
  const overflow = activeTasks.filter((t) => t.status !== "today").sort(byPriority).slice(0, 6);

  // Check a task done: stamp it complete and drop it from the day.
  const completeTask = async (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
    } catch {
      /* optimistic */
    }
  };

  const dotFor = (p: string) =>
    p === "critical" ? "#D83A34" : p === "high" ? "#F0B400" : p === "medium" ? "#54A33B" : "#9CA3AF";

  // A checkable task row — checking it marks the task done.
  const taskRow = (t: RealTask) => (
    <div key={t.id} className="flex items-start gap-3">
      <button
        onClick={() => completeTask(t.id)}
        title="Mark done"
        className="mt-0.5 w-4 h-4 rounded-full border-2 border-gray-300 hover:border-[#54A33B] hover:bg-[#54A33B]/10 transition-colors flex-shrink-0"
        aria-label={`Mark "${t.title}" done`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: dotFor(t.priority) }}
          />
          <p className="text-sm text-[#3F4654] leading-snug break-words">{t.title}</p>
        </div>
        {t.business?.name && (
          <span className="text-[11px] text-gray-400 ml-4">{t.business.name}</span>
        )}
      </div>
    </div>
  );

  // The next meeting is the first event still ahead of the current time — so it
  // advances through the day as meetings pass, and shows "done" once they're over.
  const nowMs = now ? now.getTime() : Date.now();
  const upcomingEvents = (schedule?.events ?? []).filter((ev) =>
    ev.start ? new Date(ev.start).getTime() >= nowMs : true
  );
  const nextEvent = upcomingEvents[0] ?? null;
  const allMeetingsDone = Boolean(
    schedule?.connected && (schedule.events?.length ?? 0) > 0 && upcomingEvents.length === 0
  );

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
    const active = tasks.filter((t) => t.status !== "done");
    const todayList = active.filter((t) => t.status === "today").map((t) => t.title);
    const overflowList = active.filter((t) => t.status !== "today").map((t) => t.title);
    const todayLine = todayList.length ? todayList.slice(0, 6).join("; ") : "none flagged for today";
    const overflowLine = overflowList.length ? overflowList.slice(0, 6).join("; ") : "";
    const revLine = finance?.hasData
      ? `${currency(finance.thisMonth)} revenue this month`
      : "no revenue recorded yet";
    const message =
      `Give me my morning briefing in 3-4 warm, focused sentences (speak to me directly as ${firstName || "the founder"}). ` +
      `Today's meetings: ${meetings}. Today's tasks: ${todayLine}. Finance: ${revLine}. ` +
      (overflowLine ? `Still open from earlier (carried over, not yet done): ${overflowLine}. ` : "") +
      `Structure it: lead with today's meetings and today's tasks and where to focus first. ` +
      (overflowLine
        ? `Then, at the END, add one short line surfacing the carried-over items as still open from earlier. `
        : "") +
      `Keep it encouraging, not fluffy.`;
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
  }, [schedule, tasks, finance, firstName]);

  // Generate the AI summary once the day's data has loaded (needs a key).
  useEffect(() => {
    if (dataReady && hasAiKey && aiSummary === null && !aiLoading) {
      buildAiSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataReady, hasAiKey]);

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
            <h2 className="font-serif text-lg text-indigo-900">Your briefing from {assistantName}</h2>
          </div>
          {dataReady && hasAiKey && (
            <button
              onClick={buildAiSummary}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 text-xs text-[#2E7C83] hover:text-[#2E7C83]/80 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          )}
        </div>
        {dataReady && !hasAiKey ? (
          <div>
            <p className="text-[#3F4654] leading-relaxed mb-3">
              Add your OpenAI key to bring {assistantName} online — then this briefing writes itself
              from your day.
            </p>
            <Link
              href="/settings?tab=ai"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-900 text-white rounded-lg text-sm font-medium hover:bg-indigo-800 transition-colors"
            >
              Set up your AI assistant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <p className="text-[#3F4654] leading-relaxed whitespace-pre-wrap min-h-[3rem]">
            {aiLoading || !dataReady
              ? "Putting your briefing together…"
              : aiSummary || "No briefing yet."}
          </p>
        )}
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
          ) : allMeetingsDone ? (
            <p className="text-sm text-gray-400">All meetings done for today — nice work.</p>
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
          <p className="text-2xl font-serif text-indigo-900">{activeTasks.length}</p>
          <p className="text-sm text-[#7C7C82] mt-1">
            {activeTasks.length === 1 ? "task open" : "tasks open"}
            {overflow.length ? ` · ${overflow.length} carried over` : ""}
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

        {/* Where to focus — today's tasks, checkable */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base text-indigo-900">Where to focus today</h3>
            <Link href="/tasks" className="text-xs text-[#2E7C83] hover:underline">
              All tasks
            </Link>
          </div>
          {todayFocus.length === 0 ? (
            <p className="text-sm text-gray-400">
              Nothing flagged for today. {overflow.length ? "See what's carried over below." : "Clear slate."}
            </p>
          ) : (
            <div className="space-y-2.5">{todayFocus.map(taskRow)}</div>
          )}
        </div>
      </div>

      {/* Carried over — anything still open from earlier */}
      {overflow.length > 0 && (
        <div className="mt-4 bg-[#FBF6EE] rounded-2xl border border-[#EADFC9] shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-serif text-base text-indigo-900">Carried over from earlier</h3>
            <Link href="/tasks" className="text-xs text-[#2E7C83] hover:underline">
              All tasks
            </Link>
          </div>
          <p className="text-xs text-[#9a8c73] mb-4">
            Still open, not yet checked done — rolled forward to today. Check any off as you finish.
          </p>
          <div className="space-y-2.5">{overflow.map(taskRow)}</div>
        </div>
      )}

      {/* Quick Wins — one-tap actions that become real tasks */}
      <div className="mt-4 bg-[#FBF6EE] rounded-2xl border border-[#EADFC9] shadow-sm p-6">
        <QuickWins mode="compact" compactLimit={4} />
        <Link href="/daily-compass" className="mt-3 inline-block text-xs text-[#2E7C83] hover:underline">
          Manage your quick wins in Daily Compass →
        </Link>
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
