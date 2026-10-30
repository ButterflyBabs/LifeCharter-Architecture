"use client";

import { SegmentSelect } from "@/components/segments/SegmentSelect";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronDown, ChevronRight, GripVertical, MoreHorizontal, Plus, Trash2, Check, Clock, Archive, ArchiveRestore, Sparkles, LayoutList, LayoutGrid } from "lucide-react";
import { askAssistant } from "@/lib/assistantPopout";
import AssistantReportCard from "@/components/assistant/AssistantReportCard";
import { dueInfo, TONE_CLASS } from "@/lib/taskDue";
import { dayInTz } from "@/lib/tz";
import { FOCUS_LABEL, focusOf, matchesFocus, type FocusFilter } from "@/lib/taskFocus";

interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  due_at?: string | null;
  due_has_time?: boolean | null;
  time_kind?: "deadline" | "scheduled" | null;
  business: { name: string; color: string } | null;
  segment: { name: string; color: string } | null;
  segment_id?: number | null;
  assignee_member_id?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  today_on?: string | null;
  project_id?: string | null;
  offer_id?: string | null;
  waiting_on?: string | null;
  waiting_since?: string | null;
  check_back_on?: string | null;
}
interface Member {
  id: string;
  name: string;
}
// Open work that lives somewhere else (reminders, milestones, legal items, recurring tasks, huddle to-dos, the
// assistant's steps for you). Shown in the same lists, completed from here, linked back to where it lives.
interface Linked {
  key: string;
  kind: "reminder" | "milestone" | "legal" | "recurring" | "huddle" | "assistant";
  id: string;
  title: string;
  dueDay: string | null;
  dueLabel?: string;
  context?: string;
  href: string;
  step?: number;
}
const LINKED_LABEL: Record<Linked["kind"], string> = {
  reminder: "Reminder",
  milestone: "Milestone",
  legal: "Legal",
  recurring: "Recurring",
  huddle: "Huddle to-do",
  assistant: "Assistant step",
};

// Horizontal, collapsible lists (one per status). Today is the one with a rule: tasks dated today plus anything the
// person drags or adds into it today; see sectionOf below.
const COLUMNS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "in_progress", label: "In Progress" },
  { key: "waiting", label: "Waiting" },
  { key: "backlog", label: "Backlog" },
  { key: "done", label: "Done" },
];

// What each list includes: shown when the person hovers (or focuses) a count under the add box.
const SECTION_HELP: Record<string, string> = {
  overdue: "Open work dated before today, whatever its list, plus reminders, milestones and legal items whose date has passed. Finish it or give it a new date and it leaves this list.",
  today: "Everything for today: tasks dated today, anything you dragged here today, reminders due today, milestones due today and recurring tasks due today. It starts fresh each day.",
  in_progress: "Work you have started, not dated today or earlier.",
  waiting: "Held up by someone or something else: a reply, an approval, a delivery. Not dated today or earlier.",
  backlog: "Not started and not for now: dated later or not dated yet, plus anything left over from an earlier day's Today. It moves up on its date.",
  done: "Finished tasks. Archive them to clear the list; archived tasks still count toward your follow-through.",
};

// Overdue is a list of its own, shown before Today. It is not a status: a task lands there by its date alone.
const SECTIONS: { key: string; label: string }[] = [{ key: "overdue", label: "Overdue" }, ...COLUMNS];

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#D83A34",
  high: "#F0B400",
  medium: "#54A33B",
  low: "#9CA3AF",
  optional: "#9CA3AF",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [adding, setAdding] = useState(false);
  const [newDay, setNewDay] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newKind, setNewKind] = useState<"deadline" | "scheduled">("deadline");
  const [tz, setTz] = useState("UTC");
  // Inline due editor for one existing task.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDay, setEditDay] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editKind, setEditKind] = useState<"deadline" | "scheduled">("deadline");
  // Team: who tasks can go to, who's looking, and whose tasks are shown.
  const [members, setMembers] = useState<Member[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [view, setView] = useState<string | null>(null); // "all" | "mine" | "none" | member id
  const [newAssignee, setNewAssignee] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newOffer, setNewOffer] = useState("");
  // A Sales member sees only the tasks assigned to them, without the assistant or the team views.
  const [isSales, setIsSales] = useState(false);
  // Done tasks can be archived: they leave the board, and "Archived" lists them so they can be restored.
  const [showArchived, setShowArchived] = useState(false);
  // Which tasks have an assistant report (id -> when), and the one open in the full-width panel above the board.
  const [taskReports, setTaskReports] = useState<Record<string, string>>({});
  const [reportTask, setReportTask] = useState<{ id: number; title: string } | null>(null);
  useEffect(() => {
    fetch("/api/assistant/reports?type=task", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.items && setTaskReports(Object.fromEntries((d.items as { key: string; createdAt: string }[]).map((i) => [i.key, i.createdAt]))))
      .catch(() => {});
  }, []);
  const [archivedCount, setArchivedCount] = useState(0);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [showAllDone, setShowAllDone] = useState(false);
  const DONE_SHOWN = 12;
  // List or Cards: each person chooses. Remembered on this device straight away and saved to their account, so it
  // follows them to other devices.
  const [layout, setLayout] = useState<"list" | "cards">("list");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tasksLayout");
      if (raw === "list" || raw === "cards") setLayout(raw);
    } catch {
      /* default */
    }
    fetch("/api/me/preferences", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.tasksView === "list" || d?.tasksView === "cards") {
          setLayout(d.tasksView);
          try {
            localStorage.setItem("tasksLayout", d.tasksView);
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {});
  }, []);
  const chooseLayout = (next: "list" | "cards") => {
    setLayout(next);
    try {
      localStorage.setItem("tasksLayout", next);
    } catch {
      /* ignore */
    }
    void fetch("/api/me/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tasksView: next }) }).catch(() => {});
  };
  // Collapsed lists are remembered on this device; Done starts folded because it only grows.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ done: true });
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tasksCollapsed");
      if (raw) setCollapsed({ done: true, ...JSON.parse(raw) });
    } catch {
      /* default */
    }
  }, []);
  const toggleSection = (k: string) =>
    setCollapsed((c) => {
      const next = { ...c, [k]: !c[k] };
      try {
        localStorage.setItem("tasksCollapsed", JSON.stringify(next));
      } catch {
        /* not remembered */
      }
      return next;
    });
  const [linked, setLinked] = useState<Linked[]>([]);
  // What a task can be filed under: projects (Projects) and programs (Offers & Packages).
  // Search and filters: words in the title or notes, one project, one program ("none" = not filed under one).
  const [q, setQ] = useState("");
  const [fProject, setFProject] = useState("");
  const [fOffer, setFOffer] = useState("");
  const [fFocus, setFFocus] = useState<FocusFilter>("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [offers, setOffers] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetch("/api/tasks/lookups", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setProjects(d?.projects ?? []);
        setOffers(d?.offers ?? []);
      })
      .catch(() => {});
  }, []);
  const [openRows, setOpenRows] = useState<Record<number, boolean>>({});
  const [dragId, setDragId] = useState<number | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  useEffect(() => {
    setTz(localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);

  useEffect(() => {
    fetch("/api/tasks/assignees")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setMembers(d?.members ?? []);
        setMe(d?.me ?? null);
        setIsSales(Boolean(d?.sales));
        const asked = new URLSearchParams(window.location.search).get("view");
        // A team member lands on their own tasks; the owner sees everything.
        setView(asked || (d?.me ? "mine" : "all"));
      })
      .catch(() => setView("all"));
  }, []);

  const load = () => {
    if (view === null) return Promise.resolve();
    const qs = new URLSearchParams();
    if (view !== "all") qs.set("assignee", view);
    if (showArchived) qs.set("archived", "1");
    const url = qs.toString() ? `/api/tasks?${qs.toString()}` : "/api/tasks";
    // Everyone's view also carries the open work that lives elsewhere (not a single team member's own list).
    if (view === "all" && !showArchived) {
      fetch(`/api/tasks/linked?tz=${encodeURIComponent(tz)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setLinked(d?.items ?? []))
        .catch(() => setLinked([]));
    } else setLinked([]);
    return fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setTasks(d?.tasks ?? []);
        setArchivedCount(d?.archivedCount ?? 0);
      })
      .catch(() => setTasks([]));
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, showArchived]);

  const nameOf = (id: string | null | undefined) => (id ? members.find((m) => m.id === id)?.name ?? "Team member" : me ? "Owner" : "Me");
  const assign = async (id: number, assigneeId: string) => {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assigneeId: assigneeId || null }) }).catch(() => {});
    void load();
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        status: "today",
        todayOn: dayInTz(new Date(), tz),
        priority: newPriority,
        ...(newProject ? { projectId: newProject } : {}),
        ...(newOffer ? { offerId: newOffer } : {}),
        ...(newAssignee ? { assigneeId: newAssignee } : view && view !== "all" && view !== "none" && view !== "mine" ? { assigneeId: view } : me && view === "mine" ? { assigneeId: me } : {}),
        ...(newDay || newTime
          ? { dueDay: newDay || dayInTz(new Date(), tz), dueTime: newTime || undefined, timeKind: newKind, tz }
          : {}),
      }),
    }).catch(() => {});
    setNewTitle("");
    setNewDay("");
    setNewTime("");
    setNewKind("deadline");
    setNewAssignee("");
    setNewProject("");
    setNewOffer("");
    setAdding(false);
    load();
  };

  const fileUnder = async (id: number, field: "projectId" | "offerId", value: string) => {
    setTasks((prev) => prev?.map((t) => (t.id === id ? { ...t, [field === "projectId" ? "project_id" : "offer_id"]: value || null } : t)) ?? null);
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value || null }) }).catch(() => {});
  };
  // Notes and additional information, kept on the task (its description).
  const saveNote = async (id: number, text: string) => {
    const clean = text.trim();
    setTasks((prev) => prev?.map((t) => (t.id === id ? { ...t, description: clean || null } : t)) ?? null);
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: clean }) }).catch(() => {});
  };
  // Waiting list: who or what it waits on, and the day to check back.
  const saveWaiting = async (id: number, patch: { waitingOn?: string | null; checkBackOn?: string | null }) => {
    setTasks((prev) => prev?.map((t) => (t.id === id ? { ...t, ...("waitingOn" in patch ? { waiting_on: patch.waitingOn || null } : {}), ...("checkBackOn" in patch ? { check_back_on: patch.checkBackOn || null } : {}) } : t)) ?? null);
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).catch(() => {});
  };
  const todayStr = dayInTz(new Date(), tz);
  const setStatus = async (id: number, status: string) => {
    const todayOn = status === "today" ? todayStr : null;
    setTasks((prev) => prev?.map((t) => (t.id === id ? { ...t, status, today_on: todayOn, ...(status === "waiting" ? { waiting_since: t.waiting_since ?? new Date().toISOString() } : { waiting_on: null, waiting_since: null, check_back_on: null }) } : t)) ?? null);
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(todayOn ? { todayOn } : {}) }),
    }).catch(() => {});
  };

  // Which list a task shows in. Today = dated today, or put on Today today. A task still marked Today from an
  // earlier day is no longer for today: it waits in Backlog until it is dated or dragged back.
  const sectionOf = (t: Task): string => {
    if (t.status === "done") return "done";
    if (t.due_at && dayInTz(t.due_at, tz) < todayStr) return "overdue";
    const datedToday = Boolean(t.due_at) && dayInTz(t.due_at as string, tz) === todayStr;
    const putToday = t.status === "today" && (t.today_on ? t.today_on === todayStr : Boolean(t.created_at) && dayInTz(t.created_at as string, tz) === todayStr);
    // A waiting task comes back to Today on its check-back day, so nothing waits forever.
    const checkBack = t.status === "waiting" && Boolean(t.check_back_on) && (t.check_back_on as string) <= todayStr;
    if (datedToday || putToday || checkBack) return "today";
    return t.status === "today" ? "backlog" : t.status;
  };
  const PRIORITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, optional: 4 };
  const linkedSection = (l: Linked): string => (l.dueDay && l.dueDay < todayStr ? "overdue" : l.dueDay === todayStr ? "today" : "backlog");
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtering = words.length > 0 || Boolean(fProject) || Boolean(fOffer) || Boolean(fFocus);
  const focusOfTask = (t: Task) => focusOf(projects.find((p) => p.id === t.project_id)?.name, offers.find((o) => o.id === t.offer_id)?.name);
  const matchTask = (t: Task) => {
    if (words.length) {
      const hay = `${t.title} ${t.description ?? ""} ${projects.find((p) => p.id === t.project_id)?.name ?? ""} ${offers.find((o) => o.id === t.offer_id)?.name ?? ""}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    if (fProject === "none" ? Boolean(t.project_id) : fProject && t.project_id !== fProject) return false;
    if (fOffer === "none" ? Boolean(t.offer_id) : fOffer && t.offer_id !== fOffer) return false;
    if (!matchesFocus(fFocus, focusOfTask(t))) return false;
    return true;
  };
  const matchLinked = (l: Linked) => {
    if (words.length && !words.every((w) => `${l.title} ${l.context ?? ""}`.toLowerCase().includes(w))) return false;
    // Only milestones belong to a project (their address carries its id); nothing linked belongs to a program.
    const pid = l.kind === "milestone" ? l.href.split("/").pop() : null;
    if (fProject === "none" ? Boolean(pid) : fProject && pid !== fProject) return false;
    if (fOffer && fOffer !== "none") return false;
    // Nothing linked is filed under the Program or the Incubator, so only the "Everything else" view keeps it.
    if (fFocus === "program" || fFocus === "incubator") return false;
    return true;
  };
  const completeLinked = async (l: Linked) => {
    setLinked((prev) => prev.filter((x) => x.key !== l.key));
    const res =
      l.kind === "assistant"
        ? await fetch("/api/assistant/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: l.id, step: l.step, status: "done" }) }).catch(() => null)
        : await fetch("/api/tasks/linked", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: l.kind, id: l.id, tz }) }).catch(() => null);
    if (!res || !res.ok) void load();
  };
  const linkedDue = (l: Linked): { label: string; tone: keyof typeof TONE_CLASS } | null => {
    if (!l.dueDay) return null;
    const pretty = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", weekday: "short", timeZone: "UTC" }).format(new Date(`${l.dueDay}T12:00:00Z`));
    if (l.dueDay < todayStr) return { label: `Overdue · ${pretty}`, tone: "overdue" };
    if (l.dueDay === todayStr) return { label: l.dueLabel ? `Today · ${l.dueLabel}` : "Due today", tone: "today" };
    return { label: pretty, tone: "later" };
  };
  const byDueThenPriority = (a: Task, b: Task) => {
    const da = a.due_at ? new Date(a.due_at).getTime() : Infinity;
    const db = b.due_at ? new Date(b.due_at).getTime() : Infinity;
    if (da !== db) return da - db;
    return (PRIORITY_RANK[a.priority] ?? 5) - (PRIORITY_RANK[b.priority] ?? 5);
  };

  const openEditor = (t: Task) => {
    setEditingId(t.id);
    setEditDay(t.due_at ? dayInTz(t.due_at, tz) : "");
    setEditTime(t.due_at && t.due_has_time ? new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date(t.due_at)) : "");
    setEditKind(t.time_kind === "scheduled" ? "scheduled" : "deadline");
  };

  const saveDue = async (id: number, clear = false) => {
    const body = clear
      ? { clearDue: true }
      : { dueDay: editDay || dayInTz(new Date(), tz), dueTime: editTime || undefined, timeKind: editKind, tz };
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
    setEditingId(null);
    load();
  };

  const archiveOne = async (id: number) => {
    setTasks((prev) => prev?.filter((t) => t.id !== id) ?? null);
    setArchivedCount((n) => n + 1);
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: true }) }).catch(() => {});
  };

  const restoreOne = async (id: number) => {
    setTasks((prev) => prev?.filter((t) => t.id !== id) ?? null);
    setArchivedCount((n) => Math.max(0, n - 1));
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: false }) }).catch(() => {});
  };

  const archiveAllDone = async () => {
    setConfirmArchive(false);
    await fetch("/api/tasks/archive-done", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(view && view !== "all" ? { assignee: view } : {}),
    }).catch(() => {});
    void load();
  };

  const remove = async (id: number) => {
    setTasks((prev) => prev?.filter((t) => t.id !== id) ?? null);
    await fetch(`/api/tasks/${id}`, { method: "DELETE" }).catch(() => {});
  };

  // The count in each list (tasks plus the linked items that sit in the same lists), for the strip under the add box.
  const tally = SECTIONS.map((c) => ({
    key: c.key,
    label: c.label,
    n: (tasks ?? []).filter((t) => matchTask(t) && sectionOf(t) === c.key).length + linked.filter((l) => matchLinked(l) && linkedSection(l) === c.key).length,
  }));
  const jumpTo = (key: string) => {
    setCollapsed((c) => {
      const next = { ...c, [key]: false };
      try {
        localStorage.setItem("tasksCollapsed", JSON.stringify(next));
      } catch {
        /* not remembered */
      }
      return next;
    });
    setTimeout(() => document.getElementById(`tasks-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to Executive Home
      </Link>

      <div className="mb-6">
        <h1 className="text-4xl lg:text-5xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Tasks</h1>
        <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">Everything across your businesses, in lists you can fold away. Drag a task into another list to move it.</p>
      </div>

      {members.length > 0 && view && !isSales && (
        <div className="flex flex-wrap gap-2 mb-5">
          {[["all", "Everyone"], ["mine", "Assigned to me"], ...(me ? [] : [["none", "Unassigned (mine)"]]), ...members.filter((m) => m.id !== me).map((m) => [m.id, m.name])].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={`rounded-full px-3.5 py-1.5 text-sm ${view === k ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/10"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Add task */}
      <form onSubmit={addTask} className="flex flex-wrap gap-2 mb-8">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 min-w-[240px] px-4 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-[#84AEB2]"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm"
        >
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          type="date"
          value={newDay}
          onChange={(e) => setNewDay(e.target.value)}
          aria-label="Due date"
          className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm"
        />
        <input
          type="time"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          aria-label="Time of day"
          className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm"
        />
        {newTime && (
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as "deadline" | "scheduled")}
            aria-label="What the time means"
            className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm"
          >
            <option value="deadline">Due by this time</option>
            <option value="scheduled">Do it at this time</option>
          </select>
        )}
        {members.length > 0 && !isSales && (
          <select
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            aria-label="Assign to"
            className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm"
          >
            <option value="">{me ? "Assign to…" : "Assign to me"}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id === me ? `${m.name} (me)` : m.name}
              </option>
            ))}
          </select>
        )}
        {!isSales && projects.length > 0 && (
          <select value={newProject} onChange={(e) => setNewProject(e.target.value)} aria-label="Project" className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm max-w-[200px]">
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        {!isSales && offers.length > 0 && (
          <select value={newOffer} onChange={(e) => setNewOffer(e.target.value)} aria-label="Program (offer)" className="px-3 py-2.5 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm max-w-[200px]">
            <option value="">No program</option>
            {offers.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1a2b4a] text-white rounded-lg text-sm hover:bg-[#1a2b4a]/90 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {tasks !== null && !showArchived && (
        <div className="mb-5 flex flex-wrap gap-2" aria-label="Number of tasks in each list">
          {tally.map((c) => (
            <div key={c.key} className="group relative">
              <button
                onClick={() => jumpTo(c.key)}
                aria-describedby={`tally-help-${c.key}`}
                className={`inline-flex items-baseline gap-2 rounded-xl border px-3.5 py-2 text-left transition hover:shadow-sm ${
                  c.key === "overdue" && c.n > 0 ? "border-[#B0342C]/40 bg-[#FBECEA] text-[#B0342C]" : "border-[#1a2b4a]/10 bg-white dark:bg-[#1A1A2E] text-[#1a2b4a] dark:text-[#F8F5F0]"
                }`}
              >
                <span className="text-xl font-semibold tabular-nums leading-none">{c.n}</span>
                <span className="text-xs">{c.label}</span>
              </button>
              <div
                role="tooltip"
                id={`tally-help-${c.key}`}
                className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 hidden w-64 rounded-lg border border-[#1a2b4a]/10 bg-white p-3 text-xs leading-snug text-[#3F4654] shadow-lg group-hover:block group-focus-within:block dark:bg-[#1A1A2E] dark:text-[#e8e4f0]"
              >
                <p className="mb-1 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{c.label}</p>
                {SECTION_HELP[c.key]}
                <p className="mt-1 text-[11px] text-gray-400">Press to go to this list.</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tasks !== null && !showArchived && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks: title, notes, project or program…"
            aria-label="Search tasks"
            className="flex-1 min-w-[220px] px-4 py-2 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-[#84AEB2]"
          />
          <div role="group" aria-label="How tasks are shown" className="inline-flex overflow-hidden rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1A2E] text-sm">
            <button
              type="button"
              onClick={() => chooseLayout("list")}
              aria-pressed={layout === "list"}
              className={`inline-flex items-center gap-1.5 px-3 py-2 ${layout === "list" ? "bg-[#2E7C83] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"}`}
            >
              <LayoutList className="h-4 w-4" /> List
            </button>
            <button
              type="button"
              onClick={() => chooseLayout("cards")}
              aria-pressed={layout === "cards"}
              className={`inline-flex items-center gap-1.5 px-3 py-2 ${layout === "cards" ? "bg-[#2E7C83] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"}`}
            >
              <LayoutGrid className="h-4 w-4" /> Cards
            </button>
          </div>
          {!isSales && (
            <>
              <select value={fProject} onChange={(e) => setFProject(e.target.value)} aria-label="Filter by project" className="px-3 py-2 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm max-w-[220px]">
                <option value="">All projects</option>
                <option value="none">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select value={fOffer} onChange={(e) => setFOffer(e.target.value)} aria-label="Filter by program" className="px-3 py-2 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm max-w-[220px]">
                <option value="">All programs</option>
                <option value="none">No program</option>
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </>
          )}
          {filtering && (
            <button
              onClick={() => {
                setQ("");
                setFProject("");
                setFOffer("");
                setFFocus("");
              }}
              className="text-sm text-[#2E7C83] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {tasks !== null && !showArchived && !isSales && (() => {
        const open = tasks.filter((t) => t.status !== "done");
        const n = { program: 0, incubator: 0, other: 0 };
        for (const t of open) n[focusOfTask(t) ?? "other"]++;
        if (!n.program && !n.incubator) return null;
        const chips: { key: FocusFilter; label: string; n: number }[] = [
          { key: "", label: "All tasks", n: open.length },
          { key: "program", label: FOCUS_LABEL.program, n: n.program },
          { key: "incubator", label: FOCUS_LABEL.incubator, n: n.incubator },
          { key: "other", label: "Everything else", n: n.other },
        ];
        return (
          <div role="group" aria-label="Focus" className="-mt-2 mb-5 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button
                key={c.key || "all"}
                type="button"
                onClick={() => setFFocus(c.key)}
                aria-pressed={fFocus === c.key}
                className={`inline-flex items-baseline gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  fFocus === c.key ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/15 bg-white text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:bg-[#1A1A2E] dark:text-[#F8F5F0]"
                }`}
              >
                {c.label}
                <span className="tabular-nums text-xs opacity-70">{c.n}</span>
              </button>
            ))}
          </div>
        );
      })()}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            setShowArchived((v) => !v);
            setConfirmArchive(false);
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/15 px-3.5 py-1.5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
        >
          <Archive className="w-4 h-4" /> {showArchived ? "Back to the board" : `Archived (${archivedCount})`}
        </button>
        {showArchived && <span className="text-xs text-gray-500">Done tasks you archived. They still count toward your follow-through.</span>}
      </div>

      {reportTask && (
        <div className="mb-4 max-w-4xl">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Assistant report: {reportTask.title}</p>
            <button onClick={() => setReportTask(null)} className="text-xs text-[#2E7C83] hover:underline">Close</button>
          </div>
          <AssistantReportCard type="task" itemKey={String(reportTask.id)} />
        </div>
      )}

      {tasks === null ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : showArchived ? (
        <div className="bg-[#F8F5F0] dark:bg-white/5 rounded-2xl p-3 max-w-3xl">
          {tasks.length === 0 && <p className="text-sm text-gray-400 px-2 py-3">Nothing archived yet.</p>}
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 bg-white dark:bg-[#1A1A2E] rounded-xl border border-gray-200/60 dark:border-white/10 px-3 py-2">
                <Check className="w-3.5 h-3.5 text-[#54A33B] shrink-0" />
                <p className="flex-1 min-w-0 text-sm text-gray-500 line-through truncate" title={t.title}>{t.title}</p>
                {t.completed_at && <span className="text-[10px] text-gray-400 whitespace-nowrap">{dayInTz(t.completed_at, tz)}</span>}
                <button onClick={() => restoreOne(t.id)} className="inline-flex items-center gap-1 text-xs text-[#2E7C83] hover:underline whitespace-nowrap" title="Put it back in Done">
                  <ArchiveRestore className="w-3.5 h-3.5" /> Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {SECTIONS.map((col) => {
            const all = tasks.filter((t) => matchTask(t) && sectionOf(t) === col.key);
            const sectionLinked = linked.filter((l) => matchLinked(l) && linkedSection(l) === col.key).sort((a, b) => (a.dueDay ?? "9999").localeCompare(b.dueDay ?? "9999"));
            const total = all.length + sectionLinked.length;
            // Done is newest first and capped, so a long history never takes over the page.
            const sorted = col.key === "done" ? [...all].sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")) : [...all].sort(byDueThenPriority);
            const items = col.key === "done" && !showAllDone ? sorted.slice(0, DONE_SHOWN) : sorted;
            const folded = Boolean(collapsed[col.key]) && !filtering; // a search shows its matches even in a folded list
            const hint =
              col.key === "today"
                ? `${new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }).format(new Date())}. Tasks dated today, plus anything you drag here.`
                : col.key === "overdue"
                  ? "Dated before today and not done. Finish them or give them a new date to clear this list."
                  : "";
            if (col.key === "overdue" && total === 0) return null;
            return (
              <section
                key={col.key}
                id={`tasks-${col.key}`}
                aria-label={col.label}
                onDragOver={(e) => {
                  if (dragId === null || col.key === "overdue") return;
                  e.preventDefault();
                  setOverKey(col.key);
                }}
                onDragLeave={() => setOverKey((k) => (k === col.key ? null : k))}
                onDrop={(e) => {
                  if (col.key === "overdue") return;
                  e.preventDefault();
                  const id = dragId ?? Number(e.dataTransfer.getData("text/plain"));
                  setDragId(null);
                  setOverKey(null);
                  const t = tasks.find((x) => x.id === id);
                  if (t && sectionOf(t) !== col.key) void setStatus(id, col.key);
                }}
                className={`rounded-2xl p-3 transition-colors ${overKey === col.key ? "bg-[#2E7C83]/15 ring-2 ring-[#2E7C83]/50" : "bg-[#F8F5F0] dark:bg-white/5"}`}
              >
                <button
                  onClick={() => toggleSection(col.key)}
                  aria-expanded={!folded}
                  className="flex w-full items-center gap-2 px-2 py-1 text-left"
                >
                  {folded ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  <h2 className={`text-base font-semibold ${col.key === "overdue" ? "text-[#B0342C]" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>{col.label}</h2>
                  <span className="text-xs text-gray-400">{total}</span>
                  {hint && <span className="ml-1 hidden text-xs text-gray-500 sm:inline">{hint}</span>}
                </button>
                {!folded && (
                  <div className="mt-2">
                    {col.key === "done" && all.length > 0 && (
                      <div className="px-2 mb-2 flex flex-wrap items-center gap-2">
                        {confirmArchive ? (
                          <>
                            <span className="text-xs text-gray-600 dark:text-gray-300">Archive all {all.length}?</span>
                            <button onClick={archiveAllDone} className="text-xs px-2.5 py-1 rounded-md bg-[#2E7C83] text-white">Yes, archive</button>
                            <button onClick={() => setConfirmArchive(false)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmArchive(true)} className="inline-flex items-center gap-1 text-xs text-[#2E7C83] hover:underline">
                            <Archive className="w-3.5 h-3.5" /> Archive all done
                          </button>
                        )}
                      </div>
                    )}
                    <div className={layout === "cards" ? "grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3 items-stretch" : "space-y-1.5"}>
                      {items.map((t) => {
                        const info = dueInfo(t, tz);
                        const open = Boolean(openRows[t.id]);
                        const earlier = col.key === "backlog" && t.status === "today";
                        return (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", String(t.id));
                              e.dataTransfer.effectAllowed = "move";
                              setDragId(t.id);
                            }}
                            onDragEnd={() => {
                              setDragId(null);
                              setOverKey(null);
                            }}
                            className={`bg-white dark:bg-[#1A1A2E] border border-gray-200/60 dark:border-white/10 ${layout === "cards" ? "flex h-full flex-col rounded-2xl px-4 py-3 shadow-md" : "rounded-xl px-3 py-2 shadow-sm"} ${dragId === t.id ? "opacity-50" : ""}`}
                          >
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" aria-hidden />
                              <button
                                onClick={() => setStatus(t.id, t.status === "done" ? "today" : "done")}
                                title={t.status === "done" ? "Reopen" : "Mark done"}
                                aria-label={t.status === "done" ? "Reopen" : "Mark done"}
                                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                                  t.status === "done" ? "bg-[#54A33B] border-[#54A33B] text-white" : "border-gray-300 hover:border-[#54A33B]"
                                }`}
                              >
                                {t.status === "done" && <Check className="w-2.5 h-2.5" />}
                              </button>
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLOR[t.priority] ?? "#9CA3AF" }} title={t.priority} />
                              <div className={layout === "cards" ? "min-w-0 flex-[1_1_70%]" : "min-w-[180px] flex-1"}>
                                <p className={`${layout === "cards" ? "text-[15px] font-medium" : "text-sm"} leading-snug ${t.status === "done" ? "line-through text-gray-400" : "text-[#3F4654] dark:text-[#e8e4f0]"}`}>{t.title}</p>
                                {t.description && !open && (
                                  <button
                                    onClick={() => setOpenRows((r) => ({ ...r, [t.id]: true }))}
                                    className={`mt-0.5 block max-w-full text-left text-xs text-gray-400 hover:text-[#2E7C83] ${layout === "cards" ? "line-clamp-3" : "truncate"}`}
                                    title="Open the notes"
                                  >
                                    {t.description.replace(/\s+/g, " ").slice(0, 140)}
                                  </button>
                                )}
                              </div>
                              {info && t.status !== "done" && <span className={`text-[10px] px-2 py-0.5 rounded-full ${TONE_CLASS[info.tone]}`}>{info.label}</span>}
                              {(col.key === "today" || col.key === "overdue") && t.status !== "today" && t.status !== "done" && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{COLUMNS.find((c) => c.key === t.status)?.label ?? t.status}</span>
                              )}
                              {earlier && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500" title="It was on an earlier day's Today list">Earlier Today</span>}
                              {t.assignee_member_id && view === "all" && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2E7C83]/10 text-[#1F5E63]">{nameOf(t.assignee_member_id)}</span>
                              )}
                              {t.segment && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: t.segment.color ?? "#7b6b8d" }}>{t.segment.name}</span>
                              )}
                              {t.project_id && projects.find((p) => p.id === t.project_id) && (
                                <Link href={`/projects/${t.project_id}`} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a2b4a]/8 text-[#1a2b4a] dark:text-[#F8F5F0] hover:underline" title="The project this task belongs to">
                                  Project · {projects.find((p) => p.id === t.project_id)?.name}
                                </Link>
                              )}
                              {t.offer_id && offers.find((o) => o.id === t.offer_id) && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c9a227]/15 text-[#7a5a12]" title="The program (offer) this task belongs to">
                                  Program · {offers.find((o) => o.id === t.offer_id)?.name}
                                </span>
                              )}
                              {t.status === "done" ? (
                                <button onClick={() => archiveOne(t.id)} className="inline-flex items-center gap-1 text-[11px] text-[#2E7C83] hover:underline" title="Move to Archived">
                                  <Archive className="w-3 h-3" /> Archive
                                </button>
                              ) : isSales ? null : (
                                <button
                                  onClick={() => askAssistant(`Work on this task and report back: "${t.title}". Read the whole task first, check what you can, prepare what you can, then give me the report.`, `Work on this task: ${t.title}`)}
                                  className="inline-flex items-center gap-1 text-[11px] text-[#2E7C83] hover:underline"
                                  title="Your assistant reads the task, checks what it can, prepares what it can and reports back"
                                >
                                  <Sparkles className="w-3 h-3" /> Have my assistant work on this
                                </button>
                              )}
                              {!isSales && taskReports[String(t.id)] && (
                                <button onClick={() => setReportTask({ id: t.id, title: t.title })} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2E7C83] hover:underline" title="Open the assistant's report on this task">
                                  <Sparkles className="w-3 h-3" /> See report
                                </button>
                              )}
                              <button
                                onClick={() => setOpenRows((r) => ({ ...r, [t.id]: !r[t.id] }))}
                                aria-expanded={open}
                                className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#1a2b4a]"
                                title="Date, list, who it is assigned to, delete"
                              >
                                <MoreHorizontal className="w-4 h-4" /> More
                              </button>
                            </div>
                            {t.status === "waiting" && (
                              <div className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs ${layout === "cards" ? "pl-0" : "pl-9"}`}>
                                <label htmlFor={`wo-${t.id}`} className="font-semibold text-[#7a5a12]">Waiting on</label>
                                <input
                                  id={`wo-${t.id}`}
                                  key={`wo-${t.id}-${t.waiting_on ?? ""}`}
                                  defaultValue={t.waiting_on ?? ""}
                                  maxLength={160}
                                  placeholder="Who or what (a person, Google review, a delivery)"
                                  onBlur={(e) => {
                                    if (e.target.value.trim() !== (t.waiting_on ?? "").trim()) void saveWaiting(t.id, { waitingOn: e.target.value });
                                  }}
                                  className="min-w-[220px] flex-1 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1A2E] px-2 py-1"
                                />
                                <label htmlFor={`cb-${t.id}`} className="text-gray-500">Check back</label>
                                <input
                                  id={`cb-${t.id}`}
                                  type="date"
                                  value={t.check_back_on ?? ""}
                                  onChange={(e) => void saveWaiting(t.id, { checkBackOn: e.target.value || null })}
                                  className="rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1A2E] px-2 py-1"
                                />
                                {t.check_back_on && t.check_back_on <= todayStr && (
                                  <span className="rounded-full bg-[#F0B400]/20 px-2 py-0.5 text-[10px] font-semibold text-[#7a5a12]">Time to check</span>
                                )}
                                {t.waiting_since && <span className="text-gray-400">since {new Date(t.waiting_since).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: tz })}</span>}
                              </div>
                            )}
                            {open && (
                              <div className="mt-2 mb-1">
                                <label htmlFor={`note-${t.id}`} className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Notes and additional information</label>
                                <textarea
                                  id={`note-${t.id}`}
                                  key={`${t.id}-${t.description ?? ""}`}
                                  defaultValue={t.description ?? ""}
                                  onBlur={(e) => {
                                    if (e.target.value.trim() !== (t.description ?? "").trim()) void saveNote(t.id, e.target.value);
                                  }}
                                  rows={5}
                                  placeholder="Add anything you need to remember about this task: links, what is left, who said what. It saves when you click away."
                                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1A2E] px-3 py-2 text-sm"
                                />
                              </div>
                            )}
                            {open && (
                              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                {t.status !== "done" && (
                                  <div className="sm:col-span-2">
                                    <button
                                      onClick={() => (editingId === t.id ? setEditingId(null) : openEditor(t))}
                                      className="inline-flex items-center gap-1 text-xs text-[#2E7C83] hover:underline"
                                    >
                                      <Clock className="w-3.5 h-3.5" /> {info ? "Change date / time" : "Set date / time"}
                                    </button>
                                    {editingId === t.id && (
                                      <div className="mt-2 p-2 rounded-lg bg-[#F8F5F0] dark:bg-white/5 space-y-2">
                                        <div className="flex gap-2">
                                          <input type="date" value={editDay} onChange={(e) => setEditDay(e.target.value)} aria-label="Due date" className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md" />
                                          <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} aria-label="Time of day" className="w-24 px-2 py-1.5 text-xs bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md" />
                                        </div>
                                        {editTime && (
                                          <select value={editKind} onChange={(e) => setEditKind(e.target.value as "deadline" | "scheduled")} aria-label="What the time means" className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-md">
                                            <option value="deadline">Due by this time</option>
                                            <option value="scheduled">Do it at this time</option>
                                          </select>
                                        )}
                                        <div className="flex items-center gap-3">
                                          <button onClick={() => saveDue(t.id)} disabled={!editDay && !editTime} className="px-3 py-1 text-xs rounded-md bg-[#2E7C83] text-white disabled:opacity-50">Save</button>
                                          {t.due_at && (
                                            <button onClick={() => saveDue(t.id, true)} className="text-xs text-gray-400 hover:text-[#D83A34]">Remove date</button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {!isSales && (
                                  <label className="block text-xs text-gray-500">
                                    Project
                                    <select
                                      value={t.project_id ?? ""}
                                      onChange={(e) => fileUnder(t.id, "projectId", e.target.value)}
                                      className="mt-0.5 w-full text-xs bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-2 py-1 text-[#3F4654] dark:text-[#e8e4f0]"
                                    >
                                      <option value="">No project</option>
                                      {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))}
                                    </select>
                                  </label>
                                )}
                                {!isSales && (
                                  <label className="block text-xs text-gray-500">
                                    Program (offer)
                                    <select
                                      value={t.offer_id ?? ""}
                                      onChange={(e) => fileUnder(t.id, "offerId", e.target.value)}
                                      className="mt-0.5 w-full text-xs bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-2 py-1 text-[#3F4654] dark:text-[#e8e4f0]"
                                    >
                                      <option value="">No program</option>
                                      {offers.map((o) => (
                                        <option key={o.id} value={o.id}>{o.name}</option>
                                      ))}
                                    </select>
                                  </label>
                                )}
                                <SegmentSelect
                                  compact
                                  value={t.segment_id ?? null}
                                  onChange={async (id) => {
                                    await fetch(`/api/tasks/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ segmentId: id }) });
                                    load();
                                  }}
                                  className="w-full text-xs bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-2 py-1 text-[#7C7C82]"
                                />
                                {members.length > 0 && !isSales && (
                                  <select value={t.assignee_member_id ?? ""} onChange={(e) => assign(t.id, e.target.value)} aria-label="Assigned to" className="w-full text-xs bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-2 py-1 text-[#7C7C82]">
                                    <option value="">{me ? "Owner" : "Me"}</option>
                                    {members.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.id === me ? `${m.name} (me)` : m.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                <select value={sectionOf(t) === "overdue" ? t.status : sectionOf(t)} onChange={(e) => setStatus(t.id, e.target.value)} aria-label="Move to list" className="w-full text-xs bg-transparent border border-gray-200 dark:border-white/10 rounded-md px-2 py-1 text-[#7C7C82]">
                                  {COLUMNS.map((c) => (
                                    <option key={c.key} value={c.key}>
                                      {c.label}
                                    </option>
                                  ))}
                                </select>
                                <button onClick={() => remove(t.id)} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#D83A34] justify-self-start" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" /> Delete task
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {sectionLinked.map((l) => {
                        const due = linkedDue(l);
                        return (
                          <div key={l.key} className="bg-white dark:bg-[#1A1A2E] rounded-xl border border-dashed border-gray-300/70 dark:border-white/15 px-3 py-2">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="w-4 shrink-0" aria-hidden />
                              <button
                                onClick={() => completeLinked(l)}
                                title="Mark done"
                                aria-label={`Mark done: ${l.title}`}
                                className="w-4 h-4 rounded-full border-2 border-gray-300 hover:border-[#54A33B] flex-shrink-0"
                              />
                              <p className="min-w-[180px] flex-1 text-sm leading-snug text-[#3F4654] dark:text-[#e8e4f0]">{l.title}</p>
                              {due && <span className={`text-[10px] px-2 py-0.5 rounded-full ${TONE_CLASS[due.tone]}`}>{due.label}</span>}
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2E7C83]/10 text-[#1F5E63]" title="Lives here, and is shown in this list too">
                                {LINKED_LABEL[l.kind]}
                                {l.context ? ` · ${l.context}` : ""}
                              </span>
                              <Link href={l.href} className="text-[11px] text-[#2E7C83] hover:underline">
                                Open
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                      {col.key === "done" && all.length > DONE_SHOWN && (
                        <button onClick={() => setShowAllDone((v) => !v)} className="w-full text-xs text-[#2E7C83] hover:underline py-1.5">
                          {showAllDone ? "Show fewer" : `Show all ${all.length}`}
                        </button>
                      )}
                      {items.length === 0 && sectionLinked.length === 0 && (
                        <p className="text-xs text-gray-400 px-2 py-3">{col.key === "today" ? "Nothing for today yet. Drag a task here or give one today's date." : "Nothing here."}</p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
