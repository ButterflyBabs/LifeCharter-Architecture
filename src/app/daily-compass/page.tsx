"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Compass,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  MessageSquare,
  Phone,
  Share2,
  Sparkles,
  Calendar,
  Zap,
  ArrowRight,
  Plus,
  AlertCircle,
  Battery,
  BatteryMedium,
  BatteryLow,
  X,
  RefreshCw,
  Link2,
} from "lucide-react";
import Link from "next/link";

// A task as returned by /api/tasks.
interface RealTask {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  business: { name: string; color: string } | null;
  segment: { name: string; color: string } | null;
}

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const priorityColor = (p: string) => {
  switch (p) {
    case "critical":
    case "high":
      return "text-[#c98a27] bg-[#f4e6c9]/60 border-[#e6cf97]";
    case "medium":
      return "text-[#1c5a60] bg-[#d3ebee]/60 border-[#a9d4d9]";
    default:
      return "text-[#5c6b3f] bg-[#e2eccf]/60 border-[#c3d6a3]";
  }
};

const isToday = (iso: string | null) => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

export default function DailyCompassPage() {
  const [now, setNow] = useState<Date | null>(null);
  const [greeting, setGreeting] = useState("Good morning");
  const [firstName, setFirstName] = useState("");
  const [assistantName, setAssistantName] = useState("Mariposa");
  const [hasAiKey, setHasAiKey] = useState(false);

  const [tasks, setTasks] = useState<RealTask[]>([]);
  const [schedule, setSchedule] = useState<{ connected: boolean; events: { id: string; title: string; time: string }[] } | null>(null);
  const [dataReady, setDataReady] = useState(false);

  const [aiInsights, setAiInsights] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [showEnergyInfo, setShowEnergyInfo] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<string>("medium");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const d = new Date();
    setNow(d);
    const hour = d.getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Load the day's data.
  useEffect(() => {
    const tz =
      (typeof window !== "undefined" &&
        (localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone)) ||
      "UTC";
    Promise.all([
      fetch("/api/profile").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/tasks").then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/schedule?tz=${encodeURIComponent(tz)}`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([p, t, s]) => {
        if (p?.firstName) setFirstName(p.firstName);
        if (p?.assistantName) setAssistantName(p.assistantName);
        setHasAiKey(Boolean(p?.hasOpenAiKey));
        if (t?.tasks) setTasks(t.tasks as RealTask[]);
        if (s) setSchedule(s);
      })
      .catch(() => {})
      .finally(() => setDataReady(true));
  }, []);

  const byPriority = (a: RealTask, b: RealTask) =>
    (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);

  // Today's focus = tasks flagged today or in progress, plus anything completed
  // today (so it stays visible, checked, and counts toward progress).
  const openFocus = tasks
    .filter((t) => t.status === "today" || t.status === "in_progress")
    .sort(byPriority);
  const doneToday = tasks.filter((t) => t.status === "done" && isToday(t.completed_at));
  const focusItems = [...openFocus, ...doneToday];

  const completedCount = doneToday.length;
  const totalCount = focusItems.length;
  const progress = totalCount ? (completedCount / totalCount) * 100 : 0;

  // Toggle a task done/reopen and persist it.
  const toggleComplete = async (t: RealTask) => {
    const nextStatus = t.status === "done" ? "today" : "done";
    setTasks((prev) =>
      prev.map((x) =>
        x.id === t.id
          ? { ...x, status: nextStatus, completed_at: nextStatus === "done" ? new Date().toISOString() : null }
          : x
      )
    );
    try {
      await fetch(`/api/tasks/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      /* optimistic */
    }
  };

  const addTask = async (title: string, priority = "medium") => {
    const clean = title.trim();
    if (!clean) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: clean, priority, status: "today" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.task) setTasks((prev) => [...prev, data.task as RealTask]);
    } catch {
      /* best effort */
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async () => {
    await addTask(newTaskTitle, newTaskPriority);
    setNewTaskTitle("");
    setShowAddTask(false);
  };

  const getTypeIcon = (t: RealTask) => {
    const label = (t.business?.name || t.segment?.name || "").toLowerCase();
    if (label.includes("sale")) return <Phone className="w-4 h-4" />;
    if (label.includes("content") || label.includes("market")) return <Share2 className="w-4 h-4" />;
    return <Target className="w-4 h-4" />;
  };

  // Ask the client's AI bot for 3 short, specific insights from today's data.
  const buildInsights = useCallback(async () => {
    setAiLoading(true);
    setAiInsights(null);
    const todayList = tasks
      .filter((t) => t.status === "today" || t.status === "in_progress")
      .map((t) => t.title);
    const openOther = tasks
      .filter((t) => t.status !== "done" && t.status !== "today" && t.status !== "in_progress")
      .map((t) => t.title);
    const meetings = schedule?.connected
      ? schedule.events.length
        ? `${schedule.events.length} meeting(s), next "${schedule.events[0].title}" at ${schedule.events[0].time}`
        : "no meetings today"
      : "calendar not connected";
    const message =
      `Give me exactly 3 short coaching insights for today, one per line, no preamble or numbering. ` +
      `Speak directly to me${firstName ? ` (${firstName})` : ""}. Start each line with a single relevant emoji. ` +
      `Base them on: today's focus tasks: ${todayList.length ? todayList.slice(0, 8).join("; ") : "none flagged"}. ` +
      (openOther.length ? `Other open tasks: ${openOther.slice(0, 6).join("; ")}. ` : "") +
      `Meetings: ${meetings}. ` +
      `Make one about where to focus first, one about a risk or something slipping, and one encouraging. Keep each under 20 words.`;
    try {
      const res = await fetch("/api/mariposa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      const lines = String(data.reply || "")
        .split("\n")
        .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
      setAiInsights(lines.length ? lines : ["I couldn't put your insights together right now."]);
    } catch {
      setAiInsights(["I couldn't put your insights together right now."]);
    }
    setAiLoading(false);
  }, [tasks, schedule, firstName]);

  // Generate once data has loaded and a key exists.
  useEffect(() => {
    if (dataReady && hasAiKey && aiInsights === null && !aiLoading) buildInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataReady, hasAiKey]);

  const dateLabel = now
    ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";

  return (
    <div className="py-6 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a227] to-[#4a9b9b] flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Daily Compass</h1>
              <p className="text-[#b8a898]">
                {greeting}
                {firstName ? `, ${firstName}` : ""} • {dateLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#c9a227]/10 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-[#c9a227]" />
              <span className="font-semibold text-[#c9a227]">{completedCount} done today</span>
            </div>
            <Link href="/daily-compass/weekly">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Weekly View
              </Button>
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-[#1a2b4a] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
              Today&apos;s Progress
            </span>
            <span className="text-sm text-[#b8a898]">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <div className="w-full bg-[#1a2b4a]/10 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-[#4a9b9b] to-[#c9a227] h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Focus Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Today&apos;s Focus</h2>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  className="text-sm p-2 pr-8 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(Number(e.target.value))}
                >
                  <option value={3}>High Energy</option>
                  <option value={2}>Medium Energy</option>
                  <option value={1}>Low Energy</option>
                </select>
                <button
                  onClick={() => setShowEnergyInfo(true)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-[#1a2b4a]/10 rounded"
                >
                  <AlertCircle className="w-3 h-3 text-[#b8a898]" />
                </button>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowAddTask(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>

          {/* Energy Level Info */}
          {showEnergyInfo && (
            <Card className="border-[#c9a227]/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#c9a227]" />
                  Energy Levels Guide
                </CardTitle>
                <button onClick={() => setShowEnergyInfo(false)}>
                  <X className="w-4 h-4 text-[#b8a898]" />
                </button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Battery className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">High Energy</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Firing on all cylinders. Perfect for sales calls, content, strategic planning, and
                      your hardest tasks. Aim for 5+ meaningful activities.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <BatteryMedium className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Medium Energy</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Steady and sustainable. Good for follow-ups, scheduling, light content, and admin.
                      Aim for 3-4 focused activities.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <BatteryLow className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">Low Energy</p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Rest and recharge mode. Quick wins, reviewing your Domain Scores, light planning, or
                      self-care. Aim for 1-2 small wins and permission to rest.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Task */}
          {showAddTask && (
            <Card className="border-[#4a9b9b]/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#4a9b9b]" />
                  Add New Task
                </CardTitle>
                <button onClick={() => setShowAddTask(false)}>
                  <X className="w-4 h-4 text-[#b8a898]" />
                </button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm text-[#b8a898] mb-1 block">Task Title</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                    placeholder="What needs to be done?"
                    className="w-full p-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                      className="w-full p-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a] text-sm"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddTask} disabled={saving || !newTaskTitle.trim()} className="w-full">
                      {saving ? "Adding…" : "Add Task"}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-[#b8a898]">
                  Adds to your Tasks board (flagged for today) — it&apos;ll also show on your Morning Brief.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Focus Items */}
          <div className="space-y-3">
            {!dataReady ? (
              <p className="text-sm text-[#b8a898] px-1">Loading your day…</p>
            ) : focusItems.length === 0 ? (
              <div className="p-6 rounded-lg border border-dashed border-[#1a2b4a]/20 text-center">
                <p className="text-sm text-[#b8a898]">
                  Nothing flagged for today yet. Add a task above, or generate a plan and flag items for today
                  from your Tasks board.
                </p>
                <Link href="/tasks">
                  <Button variant="outline" size="sm" className="mt-3">
                    Open Tasks
                  </Button>
                </Link>
              </div>
            ) : (
              focusItems.map((item) => {
                const done = item.status === "done";
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border transition-all ${
                      done
                        ? "bg-[#1a2b4a]/5 border-[#1a2b4a]/10 opacity-60"
                        : "bg-white dark:bg-[#1a2b4a]/50 border-[#1a2b4a]/20 hover:border-[#c9a227]/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button onClick={() => toggleComplete(item)} className="mt-1" aria-label="Toggle done">
                        {done ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#b8a898] hover:text-[#c9a227]" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`p-1 rounded border ${priorityColor(item.priority)}`}>
                            {getTypeIcon(item)}
                          </span>
                          <span
                            className={`font-medium ${
                              done ? "line-through text-[#b8a898]" : "text-[#1a2b4a] dark:text-[#F8F5F0]"
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-[#b8a898] mb-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs px-2 py-0.5 bg-[#1a2b4a]/10 text-[#7b6b8d] dark:text-[#e8e4f0] rounded-full capitalize">
                            {item.priority} priority
                          </span>
                          {item.status === "in_progress" && (
                            <span className="text-xs px-2 py-0.5 bg-[#4a9b9b]/15 text-[#2E7C83] rounded-full">
                              In progress
                            </span>
                          )}
                          {item.business?.name && (
                            <span className="text-xs text-[#b8a898] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.business.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link href="/tasks">
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/daily-compass/content-studio">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center mx-auto mb-2">
                    <Share2 className="w-5 h-5 text-[#4a9b9b]" />
                  </div>
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] text-sm">Create Content</p>
                  <p className="text-xs text-[#b8a898]">Social post, script</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/daily-compass/sales-activities">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#7b6b8d]/20 flex items-center justify-center mx-auto mb-2">
                    <Phone className="w-5 h-5 text-[#7b6b8d]" />
                  </div>
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] text-sm">Sales Activities</p>
                  <p className="text-xs text-[#b8a898]">Calls, follow-ups</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/daily-compass/calendar">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#c9a227]/20 flex items-center justify-center mx-auto mb-2">
                    <Calendar className="w-5 h-5 text-[#c9a227]" />
                  </div>
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] text-sm">Content Calendar</p>
                  <p className="text-xs text-[#b8a898]">Schedule posts</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/daily-compass/scripts">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-5 h-5 text-[#4a9b9b]" />
                  </div>
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] text-sm">Scripts &amp; Templates</p>
                  <p className="text-xs text-[#b8a898]">Sales, emails</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Activity — sourced from Global Control & PostStream */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#c9a227]" />
                Today&apos;s Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Sales Calls", source: "Global Control", icon: <Phone className="w-3.5 h-3.5" /> },
                { label: "Follow-ups", source: "Global Control", icon: <MessageSquare className="w-3.5 h-3.5" /> },
                { label: "Posts", source: "PostStream", icon: <Share2 className="w-3.5 h-3.5" /> },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#7b6b8d]">{row.icon}</span>
                    <span className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{row.label}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8a7f74] bg-[#1a2b4a]/5 px-2 py-1 rounded-full">
                    <Link2 className="w-3 h-3" />
                    {row.source}
                  </span>
                </div>
              ))}
              <p className="text-xs text-[#b8a898] pt-3 border-t border-[#1a2b4a]/10">
                Once <strong>Global Control</strong> is connected, this client&apos;s contact records appear
                here — log a call or follow-up with a checkbox and add notes right on the Compass (no need to
                open Global Control), and these counts calculate automatically. Posts sync the same way from{" "}
                <strong>PostStream</strong>.
              </p>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#c9a227]" />
                  Insights from {assistantName}
                </h3>
                {dataReady && hasAiKey && (
                  <button
                    onClick={buildInsights}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1 text-xs text-[#e8e4f0] hover:text-white disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
                  </button>
                )}
              </div>

              {dataReady && !hasAiKey ? (
                <div className="space-y-3 text-sm">
                  <p className="text-[#e8e4f0]">
                    Bring {assistantName} online with your OpenAI key and your insights write themselves from
                    today&apos;s tasks and schedule.
                  </p>
                  <Link href="/settings?tab=ai">
                    <Button
                      variant="outline"
                      className="w-full border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227]/10"
                    >
                      Set up your AI assistant
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 text-sm min-h-[3rem]">
                  {aiLoading || !dataReady ? (
                    <p className="text-[#e8e4f0]">Reading your day…</p>
                  ) : (
                    (aiInsights ?? []).map((line, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[#c9a227] mt-0.5 flex-shrink-0">
                          <Zap className="w-4 h-4" />
                        </span>
                        <p className="text-[#e8e4f0]">{line}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="w-full mt-4 border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227]/10"
                >
                  View Business Health
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Wins — create real tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#c9a227]" />
                Quick Wins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                disabled={saving}
                onClick={() => addTask("Send a testimonial request to your best client", "high")}
              >
                <span className="text-2xl mr-3">💬</span>
                <div>
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Send a testimonial request</p>
                  <p className="text-xs text-[#b8a898]">Adds a task for today</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                disabled={saving}
                onClick={() => addTask("Share a client win on social media", "medium")}
              >
                <span className="text-2xl mr-3">📱</span>
                <div>
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Share a client win</p>
                  <p className="text-xs text-[#b8a898]">Adds a 5-minute task</p>
                </div>
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full justify-start text-left h-auto py-3">
                  <span className="text-2xl mr-3">✅</span>
                  <div>
                    <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Review your Domain Scores</p>
                    <p className="text-xs text-[#b8a898]">2-minute check-in</p>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
