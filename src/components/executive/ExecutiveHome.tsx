"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckSquare,
  DollarSign,
  Mail,
  Sparkles,
  Calendar,
  ArrowRight,
  MoreHorizontal,
  Bell,
  ChevronRight,
  Plus,
  MoreVertical,
  GripVertical,
  X,
  CornerUpLeft,
  Check,
  Sun,
  Archive,
  Trash2,
  Forward,
  Paperclip,
  Download,
  Tag,
} from "lucide-react";
import DimensionCards from "@/components/executive/DimensionCards";
import { timezoneOptions } from "@/lib/timezones";
import { dueInfo, TONE_CLASS } from "@/lib/taskDue";
import { dayInTz, timeInTz } from "@/lib/tz";

// Types
type Provider = "google" | "microsoft";

interface Email {
  id: string;
  threadId: string;
  from: string;
  fromEmail: string;
  messageId: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  provider?: Provider;
  account?: string;
  accountKey?: string;
  labels?: MailLabel[];
}

interface MailAccount {
  provider: Provider;
  email: string;
  label: string;
  accountKey: string;
}

interface AttachmentMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

interface MailLabel {
  id: string;
  name: string;
  color?: string;
}

interface FileDraft {
  name: string;
  mimeType: string;
  contentBase64: string;
  size: number;
}

interface MsgDetail {
  id: string;
  from: string;
  fromEmail: string;
  date: string;
  subject: string;
  bodyHtml: string | null;
  bodyText: string | null;
  attachments?: AttachmentMeta[];
  labels?: MailLabel[];
}

interface ScheduleEvent {
  id: string;
  title: string;
  time: string;
  start: string | null;
  account?: string;
}

// Real task from API
interface RealTask {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_at?: string | null;
  due_has_time?: boolean | null;
  time_kind?: "deadline" | "scheduled" | null;
  business: { name: string; color: string } | null;
  segment: { name: string; color: string } | null;
}

interface RecurringTask {
  id: string;
  title: string;
  priority: string;
  cadence: "daily" | "weekly" | "monthly";
  daysOfWeek: number[];
  dayOfMonth: number | null;
  schedule: string;
  timeOfDay?: string | null;
  timeLabel?: string | null;
  timeKind?: "deadline" | "scheduled";
  dueAt?: string | null;
  dueToday: boolean;
  doneToday: boolean;
}
const WEEKDAY_CHIPS = [
  { d: 0, l: "S", n: "Sunday" },
  { d: 1, l: "M", n: "Monday" },
  { d: 2, l: "T", n: "Tuesday" },
  { d: 3, l: "W", n: "Wednesday" },
  { d: 4, l: "T", n: "Thursday" },
  { d: 5, l: "F", n: "Friday" },
  { d: 6, l: "S", n: "Saturday" },
];

type PulsePeriod = "week" | "month" | "year";
interface PulseStats {
  income: number;
  prevIncome: number;
  changePct: number | null;
  goal: number | null;
  goalSource: "set" | "derived" | null;
  pct: number | null;
  series: { label: string; value: number }[];
}
const PULSE_LABELS: Record<PulsePeriod, { name: string; prev: string; noun: string }> = {
  week: { name: "This week", prev: "last week", noun: "weekly" },
  month: { name: "This month", prev: "last month", noun: "monthly" },
  year: { name: "This year", prev: "last year", noun: "yearly" },
};

export default function ExecutiveHome() {
  const [aiInput, setAiInput] = useState("");
  const [tasks, setTasks] = useState<RealTask[]>([]);
  const [finance, setFinance] = useState<{
    hasData: boolean;
    thisMonth: number;
    changePct: number | null;
    weekly: number[];
    periods?: Record<PulsePeriod, PulseStats>;
  } | null>(null);
  const [recurring, setRecurring] = useState<RecurringTask[]>([]);
  const [showRecurring, setShowRecurring] = useState(false);
  const [rtTitle, setRtTitle] = useState("");
  const [rtPriority, setRtPriority] = useState("medium");
  const [rtCadence, setRtCadence] = useState<"daily" | "weekly" | "monthly">("daily");
  const [rtDays, setRtDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [rtDom, setRtDom] = useState("1");
  const [rtTime, setRtTime] = useState("");
  const [rtKind, setRtKind] = useState<"deadline" | "scheduled">("deadline");
  const [rtError, setRtError] = useState("");
  const [pulsePeriod, setPulsePeriod] = useState<PulsePeriod>("month");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState("today");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDay, setNewTaskDay] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [newTaskKind, setNewTaskKind] = useState<"deadline" | "scheduled">("deadline");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [userTimezone, setUserTimezone] = useState<string>(""); // chosen zone, else the browser's
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [replyingTo, setReplyingTo] = useState<Email | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [composeAccountKey, setComposeAccountKey] = useState<string>("");
  const [mailLimit, setMailLimit] = useState<number | null>(null);
  const [composeFiles, setComposeFiles] = useState<FileDraft[]>([]);
  const [replyFiles, setReplyFiles] = useState<FileDraft[]>([]);
  const [forwardFiles, setForwardFiles] = useState<FileDraft[]>([]);
  const [readingSource, setReadingSource] = useState<Email | null>(null);
  const [thread, setThread] = useState<MsgDetail[] | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [readingLoading, setReadingLoading] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<MailLabel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Email[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [inboxLimit, setInboxLimit] = useState(12);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [newLabelFor, setNewLabelFor] = useState<string | null>(null);
  const [newLabelName, setNewLabelName] = useState("");
  const [forwarding, setForwarding] = useState(false);
  const [forwardSource, setForwardSource] = useState<Email | null>(null);
  const [forwardTo, setForwardTo] = useState("");
  const [forwardNote, setForwardNote] = useState("");
  const [sendingForward, setSendingForward] = useState(false);
  const [schedule, setSchedule] = useState<{ connected: boolean; events: ScheduleEvent[] } | null>(null);
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  const [assistantName, setAssistantName] = useState<string>("Mariposa");
  const [briefOrder, setBriefOrder] = useState<string[]>([
    "brief",
    "schedule",
    "financial",
    "tasks",
    "inbox",
  ]);
  const [dragId, setDragId] = useState<string | null>(null);

  // Initialize time on client side only
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Time zone: this device's saved choice, else the browser's own zone. The
  // profile fetch below overrides with the zone saved to the account.
  useEffect(() => {
    setUserTimezone(
      localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    );
  }, []);

  const changeTimezone = (tz: string) => {
    setUserTimezone(tz);
    localStorage.setItem("userTimezone", tz);
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: tz }),
    }).catch(() => {});
  };

  // Fetch real tasks (and again when one is added from the quick-add menu)
  useEffect(() => {
    fetchTasks();
    const refresh = () => fetchTasks();
    window.addEventListener("tasks-changed", refresh);
    return () => window.removeEventListener("tasks-changed", refresh);
  }, []);

  // How many email accounts the plan allows (null = unlimited)
  useEffect(() => {
    fetch("/api/mail/accounts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMailLimit(typeof d.limit === "number" ? d.limit : null))
      .catch(() => {});
  }, []);

  // Fetch live financial pulse (month boundaries follow the chosen time zone)
  useEffect(() => {
    if (!userTimezone) return;
    fetch(`/api/financial-pulse?tz=${encodeURIComponent(userTimezone)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setFinance(d))
      .catch(() => {});
  }, [userTimezone]);

  // Recurring tasks: what's due today in the chosen time zone. Refreshed every
  // few minutes and when the tab regains focus so a new day rolls over on its own.
  const loadRecurring = useCallback(() => {
    if (!userTimezone) return;
    fetch(`/api/recurring-tasks?tz=${encodeURIComponent(userTimezone)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && Array.isArray(d.tasks) && setRecurring(d.tasks))
      .catch(() => {});
  }, [userTimezone]);

  useEffect(() => {
    loadRecurring();
    const timer = setInterval(loadRecurring, 5 * 60 * 1000);
    const onVisible = () => document.visibilityState === "visible" && loadRecurring();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadRecurring]);

  const toggleRecurring = async (t: RecurringTask) => {
    const done = !t.doneToday;
    setRecurring((prev) => prev.map((x) => (x.id === t.id ? { ...x, doneToday: done } : x)));
    try {
      const res = await fetch(`/api/recurring-tasks/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done, tz: userTimezone }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      setRecurring((prev) => prev.map((x) => (x.id === t.id ? { ...x, doneToday: t.doneToday } : x)));
    }
  };

  const addRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    setRtError("");
    try {
      const res = await fetch("/api/recurring-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: rtTitle,
          priority: rtPriority,
          cadence: rtCadence,
          daysOfWeek: rtDays,
          dayOfMonth: Number(rtDom),
          timeOfDay: rtTime || undefined,
          timeKind: rtKind,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRtError(d.error || "Couldn't save that.");
        return;
      }
      setRtTitle("");
      setRtTime("");
      setRtKind("deadline");
      loadRecurring();
    } catch {
      setRtError("Couldn't save that.");
    }
  };

  const deleteRecurring = async (t: RecurringTask) => {
    if (!confirm(`Stop repeating "${t.title}"?`)) return;
    setRecurring((prev) => prev.filter((x) => x.id !== t.id));
    await fetch(`/api/recurring-tasks/${t.id}`, { method: "DELETE" }).catch(() => {});
  };

  // Remember which period the Financial Pulse was last showing.
  useEffect(() => {
    const saved = localStorage.getItem("exec-pulse-period");
    if (saved === "week" || saved === "month" || saved === "year") setPulsePeriod(saved);
  }, []);

  const choosePulsePeriod = (p: PulsePeriod) => {
    setPulsePeriod(p);
    setEditingGoal(false);
    setGoalInput("");
    localStorage.setItem("exec-pulse-period", p);
  };

  // Save (or clear, with 0) the goal for the selected period, then refresh the card.
  const savePulseGoal = async () => {
    const amount = Number(goalInput.replace(/[^0-9.]/g, "")) || 0;
    try {
      await fetch(pulsePeriod === "month" ? "/api/finance/budgets" : "/api/finance/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          pulsePeriod === "month"
            ? { type: "income", category: "", amount }
            : { period: pulsePeriod, amount }
        ),
      });
      const r = await fetch(`/api/financial-pulse?tz=${encodeURIComponent(userTimezone)}`);
      if (r.ok) setFinance(await r.json());
    } catch {
      /* leave the card as it was */
    }
    setEditingGoal(false);
  };

  // Fetch owner name + assistant name for the greeting/AI card (from the profile)
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.firstName) setFirstName(d.firstName);
        if (d?.assistantName) setAssistantName(d.assistantName);
        if (d?.timezone) {
          setUserTimezone(d.timezone);
          localStorage.setItem("userTimezone", d.timezone);
        }
      })
      .catch(() => {});
  }, []);

  // Restore saved briefing-card order
  useEffect(() => {
    const saved = localStorage.getItem("exec-brief-order");
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) setBriefOrder(arr);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setBriefOrder((order) => {
      const next = order.filter((x) => x !== dragId);
      const idx = next.indexOf(targetId);
      next.splice(idx < 0 ? next.length : idx, 0, dragId);
      localStorage.setItem("exec-brief-order", JSON.stringify(next));
      return next;
    });
    setDragId(null);
  };

  // Wrapper props that make a briefing card a draggable, drop-target grid item.
  const briefCardProps = (id: string, extra = "") => ({
    style: { order: briefOrder.indexOf(id) },
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: () => dropOn(id),
    className: `relative group ${extra}`.trim(),
  });

  // Load the merged inbox (Gmail + M365) at a given size.
  const loadInbox = useCallback((limit: number) => {
    return fetch(`/api/inbox?limit=${limit}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setGoogleConnected(Boolean(d.connected));
        if (Array.isArray(d.accounts)) {
          setAccounts(d.accounts);
          // Default the compose "From" to the first connected account, but keep
          // the user's pick if it's still a connected account.
          setComposeAccountKey((prev) =>
            d.accounts.some((a: MailAccount) => a.accountKey === prev)
              ? prev
              : (d.accounts[0]?.accountKey ?? prev)
          );
        }
        if (Array.isArray(d.emails)) setEmails(d.emails);
      })
      .catch(() => setGoogleConnected(false));
  }, []);

  useEffect(() => {
    loadInbox(inboxLimit);
  }, [loadInbox, inboxLimit]);

  const loadMore = async () => {
    setLoadingMore(true);
    const next = inboxLimit + 12;
    setInboxLimit(next); // triggers the effect to refetch
    setLoadingMore(false);
  };

  // Fetch live calendars (today), merged across providers. Anchor "today" and
  // the times to the viewer's timezone: their saved choice, else auto-detected.
  useEffect(() => {
    if (!userTimezone) return;
    fetch(`/api/schedule?tz=${encodeURIComponent(userTimezone)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSchedule(d))
      .catch(() => {});
  }, [userTimezone]);

  const unreadCount = emails.filter((e) => e.unread).length;
  const visibleEmails = emails.filter(
    (e) =>
      (!unreadOnly || e.unread) &&
      (!accountFilter || e.accountKey === accountFilter) &&
      (!labelFilter || (e.labels ?? []).some((l) => l.id === labelFilter))
  );
  // Distinct labels present across the loaded inbox, for the label filter.
  const inboxLabels = Array.from(
    new Map(emails.flatMap((e) => e.labels ?? []).map((l) => [l.id, l])).values()
  );
  const chipCls = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
      active
        ? "bg-[#6F4A7C] text-white border-[#6F4A7C]"
        : "bg-white text-[#6b7280] border-gray-200 hover:border-[#84AEB2]"
    }`;

  const emailRow = (email: Email) => (
    <div
      key={`${email.accountKey ?? email.provider ?? "google"}-${email.id}`}
      onClick={() => openEmail(email)}
      className={`flex items-start gap-3 p-3 rounded-xl border border-[#E8E4E0] cursor-pointer transition-all ${
        selectedEmail === email.id ? "bg-white ring-2 ring-[#84AEB2]" : "bg-[#F8F5F0] hover:bg-white"
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-[#EDE5F1] flex items-center justify-center flex-shrink-0">
        <Mail className="w-4 h-4 text-[#7A5D84]" />
      </div>
      <div className="flex-1 min-w-0">
        {email.unread && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#c9a227]" />
            <span className="text-[10px] text-[#7C7C82] font-medium">Unread</span>
          </div>
        )}
        <p className={`text-sm truncate ${email.unread ? "font-medium text-indigo-900" : "text-[#3F4654]"}`}>
          {email.subject}
        </p>
        <p className="text-xs text-[#7C7C82] mt-0.5">From: {email.from} • {email.time}</p>
        {accounts.length > 1 && email.account && (
          <span
            className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              email.provider === "microsoft"
                ? "bg-[#E5EEF6] text-[#1a56a8]"
                : "bg-[#FCE8E6] text-[#b23b32]"
            }`}
          >
            {email.account}
          </span>
        )}
      </div>
    </div>
  );

  const handleMarkRead = async () => {
    const firstUnread = emails.find((e) => e.unread);
    if (!firstUnread) {
      alert("No unread emails!");
      return;
    }
    setEmails((prev) => prev.map((e) => (e.id === firstUnread.id ? { ...e, unread: false } : e)));
    try {
      await fetch("/api/inbox/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: firstUnread.provider ?? "google", accountKey: firstUnread.accountKey, id: firstUnread.id }),
      });
    } catch {
      /* optimistic — leave marked read locally */
    }
  };

  // Open a message in the reader: fetch its whole thread, and mark it read.
  const openEmail = async (email: Email) => {
    const prov = email.provider ?? "google";
    setSelectedEmail(email.id);
    setReadingSource(email);
    setThread(null);
    setExpandedIds(new Set());
    setReadingLoading(true);
    if (email.unread) {
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, unread: false } : e)));
      fetch("/api/inbox/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: prov, accountKey: email.accountKey, id: email.id }),
      }).catch(() => {});
    }
    try {
      let msgs: MsgDetail[] = [];
      if (email.threadId) {
        const res = await fetch(
          `/api/inbox/thread?provider=${prov}&accountKey=${encodeURIComponent(email.accountKey ?? "")}&id=${encodeURIComponent(email.threadId)}`
        );
        if (res.ok) msgs = (await res.json()).messages ?? [];
      }
      if (msgs.length === 0) {
        const res = await fetch(
          `/api/inbox/message?provider=${prov}&accountKey=${encodeURIComponent(email.accountKey ?? "")}&id=${encodeURIComponent(email.id)}`
        );
        if (res.ok) msgs = [await res.json()];
      }
      setThread(msgs);
      if (msgs.length) setExpandedIds(new Set([msgs[msgs.length - 1].id])); // latest open
    } catch {
      setThread([]);
    }
    setReadingLoading(false);
    // Load this provider's labels/categories for the add-label menu.
    fetch(`/api/inbox/labels?provider=${prov}&accountKey=${encodeURIComponent(email.accountKey ?? "")}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && Array.isArray(d.labels) && setAvailableLabels(d.labels))
      .catch(() => {});
  };

  // Add or remove a label/category on a message, updating the reader in place.
  const changeLabel = async (msg: MsgDetail, label: MailLabel, action: "add" | "remove") => {
    const provider = readingSource?.provider ?? "google";
    setThread((prev) =>
      (prev ?? []).map((m) =>
        m.id === msg.id
          ? {
              ...m,
              labels:
                action === "add"
                  ? [...(m.labels ?? []).filter((l) => l.id !== label.id), label]
                  : (m.labels ?? []).filter((l) => l.id !== label.id),
            }
          : m
      )
    );
    try {
      await fetch("/api/inbox/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          accountKey: readingSource?.accountKey,
          id: msg.id,
          add: action === "add" ? [label.id] : [],
          remove: action === "remove" ? [label.id] : [],
        }),
      });
    } catch {
      /* optimistic — leave the local change */
    }
  };

  // Create a new label/category, then apply it to the message.
  const createAndApplyLabel = async (msg: MsgDetail, rawName: string) => {
    const name = rawName.trim();
    if (!name) return;
    const provider = readingSource?.provider ?? "google";
    setNewLabelFor(null);
    setNewLabelName("");
    try {
      const res = await fetch("/api/inbox/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, accountKey: readingSource?.accountKey, name }),
      });
      if (!res.ok) {
        alert("Couldn't create that label.");
        return;
      }
      const label = (await res.json())?.label as MailLabel | undefined;
      if (!label) return;
      setAvailableLabels((prev) => (prev.some((l) => l.id === label.id) ? prev : [...prev, label]));
      changeLabel(msg, label, "add");
    } catch {
      alert("Couldn't create that label.");
    }
  };

  const toggleMsg = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const closeReader = () => {
    setReadingSource(null);
    setThread(null);
  };

  const runSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/inbox/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.ok ? ((await res.json()).emails ?? []) : []);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  // Reply to the message currently open in the reader.
  const replyFromReader = () => {
    if (!readingSource) return;
    setReplyingTo(readingSource);
    setReplyText("");
    setReplyFiles([]);
    closeReader();
    setShowReplyModal(true);
  };

  // Open the forward composer for the message currently in the reader.
  const openForward = () => {
    if (!readingSource) return;
    setForwardSource(readingSource);
    setForwardTo("");
    setForwardNote("");
    setForwardFiles([]);
    closeReader();
    setForwarding(true);
  };

  const handleSendForward = async () => {
    if (!forwardSource || !forwardTo.trim()) return;
    setSendingForward(true);
    try {
      const res = await fetch("/api/inbox/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: forwardSource.provider ?? "google",
          accountKey: forwardSource.accountKey,
          id: forwardSource.id,
          to: forwardTo.trim(),
          comment: forwardNote,
          attachments: forwardFiles.map(({ name, mimeType, contentBase64 }) => ({
            name,
            mimeType,
            contentBase64,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error === "not connected" ? "That account isn't connected." : "Forward failed to send.");
        setSendingForward(false);
        return;
      }
      setForwarding(false);
      setForwardSource(null);
      setForwardFiles([]);
    } catch {
      alert("Forward failed to send.");
    }
    setSendingForward(false);
  };

  // Archive / trash (reversible) / mark-unread / mark-read on a message.
  const mailAction = async (email: Email, action: "archive" | "trash" | "unread" | "read") => {
    if (action === "archive" || action === "trash") {
      setEmails((prev) => prev.filter((e) => e.id !== email.id));
      closeReader();
    } else {
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, unread: action === "unread" } : e))
      );
      if (action === "unread") closeReader();
    }
    try {
      await fetch("/api/inbox/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: email.provider ?? "google", accountKey: email.accountKey, id: email.id, action }),
      });
    } catch {
      /* optimistic — leave the local change in place */
    }
  };

  // Build a sandboxed HTML document for the reader iframe (scripts disabled).
  const readerSrcDoc = (r: { bodyHtml: string | null; bodyText: string | null }) => {
    const base =
      "<style>body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2430;font-size:14px;line-height:1.55;margin:0;padding:16px;}img{max-width:100%;height:auto;}a{color:#2E7C83;}blockquote{border-left:3px solid #E8E4E0;margin:0;padding-left:12px;color:#6b7280;}</style>";
    if (r.bodyHtml) {
      return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${base}</head><body>${r.bodyHtml}</body></html>`;
    }
    const escaped = (r.bodyText ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<!doctype html><html><head><meta charset="utf-8">${base}</head><body><pre style="white-space:pre-wrap;font-family:inherit;margin:0;">${escaped}</pre></body></html>`;
  };

  const formatBytes = (n: number) => {
    if (!n) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const attachmentHref = (provider: Provider, accountKey: string | undefined, messageId: string, a: AttachmentMeta) =>
    `/api/inbox/attachment?provider=${provider}&accountKey=${encodeURIComponent(accountKey ?? "")}&messageId=${encodeURIComponent(messageId)}` +
    `&attachmentId=${encodeURIComponent(a.id)}&name=${encodeURIComponent(a.name)}` +
    `&mime=${encodeURIComponent(a.mimeType)}`;

  const handleSendReply = async () => {
    if (!replyingTo || !replyText.trim()) return;
    try {
      const res = await fetch("/api/inbox/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: replyingTo.provider ?? "google",
          accountKey: replyingTo.accountKey,
          id: replyingTo.id,
          threadId: replyingTo.threadId,
          to: replyingTo.fromEmail,
          subject: replyingTo.subject,
          inReplyTo: replyingTo.messageId,
          body: replyText,
          attachments: replyFiles.map(({ name, mimeType, contentBase64 }) => ({
            name,
            mimeType,
            contentBase64,
          })),
        }),
      });
      if (!res.ok) {
        alert("Reply failed to send.");
        return;
      }
      setEmails((prev) => prev.map((e) => (e.id === replyingTo.id ? { ...e, unread: false } : e)));
      setReplyText("");
      setReplyFiles([]);
      setShowReplyModal(false);
    } catch {
      alert("Reply failed to send.");
    }
  };

  // Open the reply modal for a specific email (the one the user opened, else the
  // first unread).
  const openReply = () => {
    const target = emails.find((e) => e.id === selectedEmail) ?? emails.find((e) => e.unread) ?? emails[0];
    if (!target) {
      alert("No emails to reply to yet.");
      return;
    }
    setReplyingTo(target);
    setReplyText("");
    setReplyFiles([]);
    setShowReplyModal(true);
  };

  // Read a File into base64 (no data-URL prefix), for sending as an attachment.
  const readFileBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Read picked files into base64 and append into the given attachment state.
  const readFilesInto = async (
    files: FileList | null,
    setter: React.Dispatch<React.SetStateAction<FileDraft[]>>
  ) => {
    if (!files || files.length === 0) return;
    const added: FileDraft[] = [];
    for (const f of Array.from(files)) {
      const contentBase64 = await readFileBase64(f);
      added.push({ name: f.name, mimeType: f.type || "application/octet-stream", contentBase64, size: f.size });
    }
    setter((prev) => {
      const next = [...prev, ...added];
      if (next.reduce((s, a) => s + a.size, 0) > 4_300_000) {
        alert("Attachments are too large — keep the total under about 4 MB for now.");
        return prev;
      }
      return next;
    });
  };

  // Small reusable attachment picker + chips for the send modals.
  const AttachmentPicker = ({
    files,
    setter,
  }: {
    files: FileDraft[];
    setter: React.Dispatch<React.SetStateAction<FileDraft[]>>;
  }) => (
    <div>
      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#84AEB2] text-[#2E7C83] text-sm cursor-pointer hover:bg-[#84AEB2]/5 transition-colors">
        <Paperclip className="w-4 h-4" />
        Attach files
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            readFilesInto(e.target.files, setter);
            e.target.value = "";
          }}
        />
      </label>
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span
              key={`${f.name}-${i}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E8E4E0] bg-gray-50 text-xs text-[#3F4654]"
            >
              <Paperclip className="w-3.5 h-3.5 text-[#7A5D84]" />
              <span className="max-w-[160px] truncate">{f.name}</span>
              {f.size ? <span className="text-gray-400">{formatBytes(f.size)}</span> : null}
              <button
                onClick={() => setter((prev) => prev.filter((_, j) => j !== i))}
                className="text-gray-400 hover:text-red-600"
                aria-label="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const onComposeFiles = (files: FileList | null) => readFilesInto(files, setComposeFiles);

  const composeAccount = accounts.find((a) => a.accountKey === composeAccountKey) ?? accounts[0];

  const handleSendCompose = async () => {
    if (!composeTo.trim() || !composeBody.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: composeAccount?.provider ?? "google",
          accountKey: composeAccount?.accountKey,
          to: composeTo.trim(),
          subject: composeSubject.trim() || "(no subject)",
          body: composeBody,
          attachments: composeFiles.map(({ name, mimeType, contentBase64 }) => ({
            name,
            mimeType,
            contentBase64,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error === "not connected" ? "Connect an email account first to send." : "Message failed to send.");
        setSending(false);
        return;
      }
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setComposeFiles([]);
      setShowCompose(false);
    } catch {
      alert("Message failed to send.");
    }
    setSending(false);
  };

  const currency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const askMariposa = async (q?: string) => {
    const message = (q ?? aiInput).trim();
    if (!message || aiLoading) return;
    setAiLoading(true);
    setAiReply(null);
    try {
      const res = await fetch("/api/mariposa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, page: "Executive Home", tz: userTimezone }),
      });
      const data = await res.json();
      setAiReply(data.reply ?? "Sorry, I couldn't respond right now.");
    } catch {
      setAiReply("Sorry, I couldn't respond right now.");
    }
    setAiLoading(false);
    if (!q) setAiInput("");
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-[#D83A34]";
      case "high": return "bg-[#F0B400]";
      case "medium": return "bg-[#54A33B]";
      default: return "bg-gray-400";
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          status: newTaskStatus,
          priority: newTaskPriority,
          description: "",
          businessId: null,
          segmentId: null,
          dimensions: [],
          // A time with no date means today. tz keeps "3:00 PM" in the user's zone.
          ...(newTaskDay || newTaskTime
            ? {
                dueDay: newTaskDay || dayInTz(new Date(), userTimezone || "UTC"),
                dueTime: newTaskTime || undefined,
                timeKind: newTaskKind,
                tz: userTimezone,
              }
            : {}),
        }),
      });

      if (res.ok) {
        setNewTaskTitle("");
        setNewTaskDay("");
        setNewTaskTime("");
        setNewTaskKind("deadline");
        setShowAddTask(false);
        fetchTasks(); // Refresh the task list
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  // Greeting follows the hour in the user's own time zone.
  const hour =
    currentTime && userTimezone
      ? Number(
          new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: userTimezone }).format(currentTime)
        ) % 24
      : null;
  const greeting = hour === null ? "" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Get tasks for each column
  const openTaskCount = tasks.filter(t => t.status !== "done").length;
  // Tasks with a due date/time come first, soonest first; the rest keep board order.
  const byDue = (a: RealTask, b: RealTask) =>
    (a.due_at ? new Date(a.due_at).getTime() : Infinity) - (b.due_at ? new Date(b.due_at).getTime() : Infinity);
  const todayTasks = tasks.filter(t => t.status === "today").sort(byDue).slice(0, 3);
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").sort(byDue).slice(0, 3);
  const waitingTasks = tasks.filter(t => t.status === "waiting").sort(byDue).slice(0, 3);

  const dueBadge = (task: RealTask) => {
    const info = dueInfo(
      { status: task.status, due_at: task.due_at ?? null, due_has_time: task.due_has_time, time_kind: task.time_kind },
      userTimezone || "UTC"
    );
    return info ? (
      <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full ${TONE_CLASS[info.tone]}`}>{info.label}</span>
    ) : null;
  };

  // Timed tasks due today sit in Today's Schedule alongside calendar events.
  const todayKey = userTimezone && currentTime ? dayInTz(currentTime, userTimezone) : "";
  const timedTasks = tasks.filter(
    (t) => t.status !== "done" && t.due_has_time && t.due_at && todayKey && dayInTz(t.due_at, userTimezone) === todayKey
  );
  const scheduleItems = [
    ...(schedule?.events ?? []).map((ev) => ({ key: `e-${ev.id}`, time: ev.time, title: ev.title, start: ev.start as string | null, chip: null as string | null })),
    ...timedTasks.map((t) => ({
      key: `t-${t.id}`,
      time: timeInTz(t.due_at as string, userTimezone),
      title: t.title,
      start: t.due_at as string | null,
      chip: (t.time_kind === "scheduled" ? "Task" : "Due by") as string | null,
    })),
    ...recurring
      .filter((r) => r.dueToday && !r.doneToday && r.dueAt)
      .map((r) => ({
        key: `r-${r.id}`,
        time: timeInTz(r.dueAt as string, userTimezone),
        title: r.title,
        start: r.dueAt as string | null,
        chip: (r.timeKind === "scheduled" ? "Recurring" : "Recurring · due by") as string | null,
      })),
  ].sort(
    (a, b) => (a.start ? new Date(a.start).getTime() : Infinity) - (b.start ? new Date(b.start).getTime() : Infinity)
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Header - EXACT from image */}
      <header className="mb-6 flex items-start justify-between">
        {/* Left side - Text */}
        <div>
          <h1 className="text-3xl font-serif font-bold text-indigo-900 mb-0.5">
            {greeting ? (firstName ? `${greeting}, ${firstName}` : greeting) : firstName ? `Hello, ${firstName}` : "Hello"}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-500 mb-0.5">
            <span>
              {currentTime && userTimezone
                ? `${new Intl.DateTimeFormat("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    timeZone: userTimezone,
                  }).format(currentTime)} · ${new Intl.DateTimeFormat("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZoneName: "short",
                    timeZone: userTimezone,
                  }).format(currentTime)}`
                : "Loading..."}
            </span>
            {userTimezone && (
              <select
                value={userTimezone}
                onChange={(e) => changeTimezone(e.target.value)}
                aria-label="Time zone"
                title="Change your time zone"
                className="text-xs text-[#2E7C83] bg-transparent border border-gray-200 rounded-md px-1.5 py-0.5 max-w-[200px] cursor-pointer hover:border-[#84AEB2] focus:outline-none focus:border-[#84AEB2]"
              >
                {timezoneOptions(userTimezone).map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="text-sm text-gray-400">
            Here&apos;s your executive briefing for today
          </p>
        </div>

        {/* Right side - Action Buttons */}
        <div className="flex items-center gap-2 mt-2">
          {/* Start My Day - Gold */}
          <button
            onClick={() => {
              window.location.href = "/daily-compass";
            }}
            className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-r from-[#d8a63f] to-[#e0b24d] text-white rounded-md text-xs font-medium shadow-sm hover:shadow-md transition-all"
          >
            <Sun className="w-3 h-3" />
            Start My Day
          </button>

          {/* Create Content - Lavender */}
          <button 
            onClick={() => window.location.href = "/daily-compass/content-studio"}
            className="flex items-center gap-1 px-2 py-1.5 bg-[#f8f4fb] text-[#6b4b7c] border border-[#e8e0f0] rounded-md text-xs font-medium hover:bg-[#f0e8f8] transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5zM16 8l2 2M12 12l-2 2M8 16l-2 2"/>
            </svg>
            Create Content
          </button>

          {/* Add Task - Teal */}
          <button 
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-1 px-2 py-1.5 bg-[#fbf9f6] text-[#2d6f7c] border border-[#e0e8e8] rounded-md text-xs font-medium hover:bg-[#f0f8f8] transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Task
          </button>
        </div>
      </header>

      {/* Executive Briefing — draggable cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Your Morning Brief */}
        <div {...briefCardProps("brief")}>
          <button draggable onDragStart={() => setDragId("brief")} className="absolute top-2 right-2 z-20 p-1 rounded-md bg-white/80 shadow-sm opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-400" aria-label="Drag to reorder"><GripVertical className="w-4 h-4" /></button>
        <Link href="/morning-brief" className="block">
          <div className="relative h-full">
            {/* Lavender sidebar panel with botanical art */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-[#E8E4F0]/60 rounded-l-2xl overflow-hidden">
              {/* Botanical line drawing */}
              <svg className="absolute bottom-0 left-0 w-full h-32 opacity-50" viewBox="0 0 80 120" fill="none">
                <path d="M10 100 Q 25 70, 45 80 T 75 60" stroke="#9B8AA5" strokeWidth="1" fill="none"/>
                <path d="M15 110 Q 30 80, 50 90" stroke="#8B7B9D" strokeWidth="0.8" fill="none"/>
                <path d="M20 120 Q 35 95, 55 105" stroke="#A99BB0" strokeWidth="0.6" fill="none"/>
                <ellipse cx="40" cy="75" rx="3" ry="5" fill="#c9a227" opacity="0.2"/>
                <circle cx="25" cy="95" r="1.5" fill="#9B8AA5" opacity="0.3"/>
              </svg>
            </div>
            
            {/* Main white card overlapping sidebar */}
            <div className="relative ml-6 bg-[#FFFFFF] rounded-2xl shadow-sm overflow-hidden h-full hover:shadow-md transition-shadow cursor-pointer">
              {/* Card Header */}
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <h3 className="font-serif text-xl text-indigo-900">Your Morning Brief</h3>
                {/* Gold butterfly icon */}
                <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none">
                  <path d="M14 23C14 23 9 19, 9 14C9 10, 11 8, 14 8C17 8, 19 10, 19 14C19 19, 14 23, 14 23Z" stroke="#c9a227" strokeWidth="1.5" fill="none"/>
                  <path d="M14 8C14 8 6 10, 6 16C6 20, 10 22, 14 23C18 22, 22 20, 22 16C22 10, 14 8, 14 8Z" stroke="#c9a227" strokeWidth="1" fill="none"/>
                  <ellipse cx="10.5" cy="14" rx="3" ry="5" fill="#c9a227" opacity="0.3"/>
                  <ellipse cx="17.5" cy="14" rx="3" ry="5" fill="#c9a227" opacity="0.3"/>
                  <line x1="14" y1="8" x2="14" y2="23" stroke="#c9a227" strokeWidth="0.5"/>
                </svg>
              </div>

              {/* Content Rows */}
              <div className="px-5 pb-5 space-y-0">
                {/* Row 1 - Calendar */}
                <div className="flex items-center gap-4 py-3 border-b border-gray-100">
                  <div className="w-11 h-11 rounded-full bg-[#EDE5F1] flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[#7B6B8D]" />
                  </div>
                  <span className="text-sm text-[#3F4654]">
                    {schedule?.connected
                      ? schedule.events.length > 0
                        ? `${schedule.events.length} ${schedule.events.length === 1 ? "meeting" : "meetings"} today — first at ${schedule.events[0].time}`
                        : "No meetings today"
                      : "Connect your calendar to see meetings"}
                  </span>
                </div>

                {/* Row 2 - Tasks */}
                <div className="flex items-center gap-4 py-3 border-b border-gray-100">
                  <div className="w-11 h-11 rounded-full bg-[#EDE5F1] flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="w-5 h-5 text-[#7B6B8D]" />
                  </div>
                  <span className="text-sm text-[#3F4654]">{openTaskCount} {openTaskCount === 1 ? "task requires" : "tasks require"} attention</span>
                </div>

                {/* Row 3 - Revenue */}
                <div className="flex items-center gap-4 py-3">
                  <div className="w-11 h-11 rounded-full bg-[#EDE5F1] flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-[#7B6B8D]" />
                  </div>
                  <span className="text-sm text-[#3F4654]">
                    {finance?.hasData
                      ? `${currency(finance.thisMonth)} revenue this month`
                      : "No revenue recorded yet"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
        </div>

        {/* Today's Schedule */}
        <div {...briefCardProps("schedule")}>
          <button draggable onDragStart={() => setDragId("schedule")} className="absolute top-2 right-2 z-20 p-1 rounded-md bg-white/80 shadow-sm opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-400" aria-label="Drag to reorder"><GripVertical className="w-4 h-4" /></button>
        <div className="bg-[#FFFFFF] rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden h-full">
          {/* Card Header */}
          <div className="px-6 pt-5 pb-3">
            <h3 className="font-serif text-base text-indigo-900">Today&apos;s Schedule</h3>
          </div>
          
          {/* Schedule Items (live Google Calendar) */}
          <div className="px-6 pb-4 space-y-4">
            {schedule && !schedule.connected && (
              <div className="space-y-2">
                <a
                  href="/api/google/auth"
                  className="flex items-center gap-2 text-sm text-[#2E7C83] hover:underline"
                >
                  <Calendar className="w-4 h-4" /> Connect Google Calendar
                </a>
                <a
                  href="/api/microsoft/auth"
                  className="flex items-center gap-2 text-sm text-[#2E7C83] hover:underline"
                >
                  <Calendar className="w-4 h-4" /> Connect Microsoft 365 Calendar
                </a>
              </div>
            )}
            {scheduleItems.length === 0 ? (
              schedule?.connected ? <p className="text-sm text-gray-400">No meetings or timed tasks today</p> : null
            ) : (
              scheduleItems.map((item, i) => {
                const dots = ["#2E7C83", "#7B6B8D", "#c9a227", "#1a2b4a"];
                return (
                  <div key={item.key} className="flex items-center gap-3">
                    {item.chip ? (
                      <CheckSquare className="w-3.5 h-3.5 flex-shrink-0 text-[#2B5F8A]" aria-label="Task" />
                    ) : (
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dots[i % dots.length] }} />
                    )}
                    <span className="text-sm text-[#3F4654]">
                      {item.time} - {item.title}
                    </span>
                    {item.chip && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E6EFF6] text-[#2B5F8A]">{item.chip}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* View Full Calendar Link — opens the user's real Google Calendar */}
          <div className="px-6 pb-5">
            <a
              href="https://calendar.google.com/calendar/r"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#2E7C83] hover:text-[#2E7C83]/80 transition-colors font-medium"
            >
              Open Google Calendar
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
        </div>

        {/* Financial Pulse */}
        <div {...briefCardProps("financial")}>
          <button draggable onDragStart={() => setDragId("financial")} className="absolute top-2 right-2 z-20 p-1 rounded-md bg-white/80 shadow-sm opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-400" aria-label="Drag to reorder"><GripVertical className="w-4 h-4" /></button>
        <div className="bg-[#FFFFFF] rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden h-full">
          {/* Card Header */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-2">
            <h3 className="font-serif text-base text-indigo-900">Financial Pulse</h3>
            <div className="flex items-center gap-1">
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 text-xs" role="tablist" aria-label="Period">
                {(["week", "month", "year"] as PulsePeriod[]).map((p) => (
                  <button
                    key={p}
                    role="tab"
                    aria-selected={pulsePeriod === p}
                    onClick={() => choosePulsePeriod(p)}
                    className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                      pulsePeriod === p ? "bg-[#2E7C83] text-white" : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <Link href="/finance">
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
              </Link>
            </div>
          </div>

          {(() => {
            const ps = finance?.periods?.[pulsePeriod];
            const lbl = PULSE_LABELS[pulsePeriod];
            const series = ps?.series ?? [];
            const max = Math.max(1, ...series.map((b) => b.value));
            return (
          <div className="px-6 pb-6 space-y-4">
            {/* Income for the selected period (live) */}
            <div>
              <p className="text-3xl font-serif text-[#c9a227]">{currency(ps?.income ?? 0)}</p>
              <p className="text-sm text-gray-600 mt-1">
                {ps && ps.changePct !== null ? (
                  <>
                    <span className={ps.changePct >= 0 ? "text-[#2E7C83] font-medium" : "text-[#D83A34] font-medium"}>
                      {ps.changePct >= 0 ? "+" : ""}
                      {ps.changePct}%
                    </span>{" "}
                    vs {lbl.prev}
                  </>
                ) : finance?.hasData ? (
                  `${lbl.name} · income to date`
                ) : (
                  `${lbl.name} · no revenue recorded yet`
                )}
              </p>
            </div>

            {/* % of goal reached */}
            <div className="rounded-xl bg-[#F8F5F0] border border-[#E8E4E0] p-3">
              {editingGoal || !ps?.goal ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">
                    {ps?.goal ? `Edit your ${lbl.noun} income goal` : `Set a ${lbl.noun} income goal to track your progress`}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && savePulseGoal()}
                      placeholder="Goal in dollars"
                      aria-label={`${lbl.noun} income goal`}
                      className="flex-1 min-w-0 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-[#84AEB2]"
                    />
                    <button
                      onClick={savePulseGoal}
                      className="px-3 py-1.5 text-sm rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71]"
                    >
                      Set
                    </button>
                    {editingGoal && (
                      <button onClick={() => setEditingGoal(false)} className="px-2 text-xs text-gray-400 hover:text-gray-600">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-serif text-[#1a2b4a]">{ps.pct ?? 0}%</span>
                    <button
                      onClick={() => {
                        setGoalInput(String(ps.goal));
                        setEditingGoal(true);
                      }}
                      className="text-xs text-[#2E7C83] hover:underline"
                    >
                      Edit goal
                    </button>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-gray-200 overflow-hidden" aria-hidden="true">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, ps.pct ?? 0)}%`, backgroundColor: (ps.pct ?? 0) >= 100 ? "#2c6b3f" : "#2E7C83" }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    of your {currency(ps.goal)} {lbl.noun} goal
                    {ps.goalSource === "derived" ? " (worked out from your goals)" : ""}
                  </p>
                </div>
              )}
            </div>

            {/* Bar chart for the selected period */}
            <div className="space-y-2">
              <div className="flex items-end gap-1 h-20">
                {(series.length ? series : [{ label: "", value: 0 }]).map((b, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[#2E7C83] rounded-t"
                    title={`${b.label}: ${currency(b.value)}`}
                    style={{
                      height: `${Math.max(4, (b.value / max) * 100)}%`,
                      opacity: finance?.hasData ? 0.4 + (b.value / max) * 0.5 : 0.15,
                    }}
                  />
                ))}
              </div>
              <div className="flex text-[10px] text-gray-400">
                {series.map((b) => (
                  <span key={b.label} className="flex-1 text-center truncate">
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Notification Banner */}
            <Link href="/revenue">
              <div className="flex items-center gap-3 p-3 bg-[#F8F5F0] rounded-xl border border-[#e8e4e0] hover:bg-[#f5f3ef] transition-colors cursor-pointer">
                <Bell className="w-4 h-4 text-[#c9a227]" />
                <span className="text-sm text-[#3F4654] flex-1">
                  {finance?.hasData ? "View revenue by segment" : "Add revenue to see your pulse"}
                </span>
                <ChevronRight className="w-4 h-4 text-[#c9a227]" />
              </div>
            </Link>
          </div>
            );
          })()}
        </div>
        </div>

        {/* Priority Tasks */}
        <div {...briefCardProps("tasks", "lg:col-span-3")}>
          <button draggable onDragStart={() => setDragId("tasks")} className="absolute top-2 right-2 z-20 p-1 rounded-md bg-white/80 shadow-sm opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-400" aria-label="Drag to reorder"><GripVertical className="w-4 h-4" /></button>
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8E4E0] overflow-hidden h-full">
          {/* Header with lighter background */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-[#E8E4E0] bg-[#FFFFFF]">
            <h3 className="font-serif text-base text-indigo-900">Priority Tasks</h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#84AEB2] text-[#6A9EA4] rounded-lg text-sm hover:bg-[#84AEB2]/5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
              <Link 
                href="/tasks"
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Three Columns with dotted dividers */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 lg:gap-y-0 lg:divide-x lg:divide-dashed lg:divide-gray-300">
            {/* TODAY Column */}
            <div className="px-4 first:pl-0 last:pr-0">
              <h4 className="text-xs font-medium text-[#5E8C97] uppercase tracking-wider mb-4 text-center">TODAY</h4>
              {todayTasks.length > 0 ? (
                todayTasks.map((task) => (
                  <Link key={task.id} href={`/tasks?edit=${task.id}`} className="block mb-2.5 last:mb-0">
                    <div className="bg-[#F8F5F0] rounded-xl p-3 border border-[#E8E4E0] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          </div>
                          <p className="text-sm text-[#3F4654] leading-snug break-words">{task.title}</p>
                          {dueBadge(task)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <Link href="/tasks" className="block text-center text-sm text-gray-400 hover:text-[#6A9EA4] py-3">
                  Nothing here yet
                </Link>
              )}
            </div>

            {/* IN PROGRESS Column */}
            <div className="px-4 first:pl-0 last:pr-0">
              <h4 className="text-xs font-medium text-[#7C5D7A] uppercase tracking-wider mb-4 text-center">IN PROGRESS</h4>
              {inProgressTasks.length > 0 ? (
                inProgressTasks.map((task) => (
                  <Link key={task.id} href={`/tasks?edit=${task.id}`} className="block mb-2.5 last:mb-0">
                    <div className="bg-[#F8F5F0] rounded-xl p-3 border border-[#E8E4E0] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          </div>
                          <p className="text-sm text-[#3F4654] leading-snug break-words">{task.title}</p>
                          {dueBadge(task)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <Link href="/tasks" className="block text-center text-sm text-gray-400 hover:text-[#6A9EA4] py-3">
                  Nothing here yet
                </Link>
              )}
            </div>

            {/* WAITING Column */}
            <div className="px-4 first:pl-0 last:pr-0">
              <h4 className="text-xs font-medium text-[#8A8078] uppercase tracking-wider mb-4 text-center">WAITING</h4>
              {waitingTasks.length > 0 ? (
                waitingTasks.map((task) => (
                  <Link key={task.id} href={`/tasks?edit=${task.id}`} className="block mb-2.5 last:mb-0">
                    <div className="bg-[#F8F5F0] rounded-xl p-3 border border-[#E8E4E0] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          </div>
                          <p className="text-sm text-[#3F4654] leading-snug break-words">{task.title}</p>
                          {dueBadge(task)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <Link href="/tasks" className="block text-center text-sm text-gray-400 hover:text-[#6A9EA4] py-3">
                  Nothing here yet
                </Link>
              )}
            </div>

            {/* RECURRING Column — due today, checked off day by day */}
            <div className="px-4 first:pl-0 last:pr-0">
              <div className="mb-4 flex items-center justify-center gap-2">
                <h4 className="text-xs font-medium text-[#2E7C83] uppercase tracking-wider text-center">RECURRING</h4>
                {recurring.some((t) => t.dueToday) && (
                  <span className="text-[10px] text-gray-400">
                    {recurring.filter((t) => t.dueToday && t.doneToday).length}/{recurring.filter((t) => t.dueToday).length}
                  </span>
                )}
                <button
                  onClick={() => setShowRecurring(true)}
                  className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-[#2E7C83]"
                  aria-label="Add or manage recurring tasks"
                  title="Add or manage recurring tasks"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {recurring.filter((t) => t.dueToday).length > 0 ? (
                recurring
                  .filter((t) => t.dueToday)
                  .sort((a, b) => (a.dueAt ? new Date(a.dueAt).getTime() : Infinity) - (b.dueAt ? new Date(b.dueAt).getTime() : Infinity))
                  .map((t) => (
                    <div
                      key={t.id}
                      className={`mb-2.5 last:mb-0 bg-[#F8F5F0] rounded-xl p-3 border border-[#E8E4E0] shadow-sm transition-opacity ${
                        t.doneToday ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => toggleRecurring(t)}
                          role="checkbox"
                          aria-checked={t.doneToday}
                          aria-label={`${t.doneToday ? "Uncheck" : "Check off"} ${t.title}`}
                          className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
                            t.doneToday ? "bg-[#2E7C83] border-[#2E7C83] text-white" : "bg-white border-gray-300 hover:border-[#2E7C83]"
                          }`}
                        >
                          {t.doneToday && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(t.priority)}`} />
                            <span className="text-[10px] text-gray-400">{t.schedule}</span>
                          </div>
                          <p className={`text-sm text-[#3F4654] leading-snug break-words ${t.doneToday ? "line-through" : ""}`}>
                            {t.title}
                          </p>
                          {t.dueAt &&
                            (() => {
                              const info = dueInfo(
                                { status: t.doneToday ? "done" : "today", due_at: t.dueAt, due_has_time: true, time_kind: t.timeKind },
                                userTimezone || "UTC"
                              );
                              return info ? (
                                <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full ${TONE_CLASS[t.doneToday ? "later" : info.tone]}`}>
                                  {t.doneToday ? (t.timeKind === "scheduled" ? `At ${t.timeLabel}` : `Due by ${t.timeLabel}`) : info.label}
                                </span>
                              ) : null;
                            })()}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <button
                  onClick={() => setShowRecurring(true)}
                  className="block w-full text-center text-sm text-gray-400 hover:text-[#6A9EA4] py-3"
                >
                  {recurring.length > 0 ? "Nothing recurring today" : "Add a recurring task"}
                </button>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Inbox */}
        <div {...briefCardProps("inbox", "lg:col-span-3")}>
          <button draggable onDragStart={() => setDragId("inbox")} className="absolute top-2 right-2 z-20 p-1 rounded-md bg-white/80 shadow-sm opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-400" aria-label="Drag to reorder"><GripVertical className="w-4 h-4" /></button>
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8E4E0] overflow-hidden h-full">
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-[#E8E4E0]">
            <div className="flex items-center gap-3">
              <h3 className="font-serif text-base text-indigo-900">Inbox</h3>
              {googleConnected && (
                <span className="px-2.5 py-1 bg-[#6F4A7C] text-white text-xs font-medium rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {googleConnected && (
              <button
                onClick={() => {
                  setComposeFiles([]);
                  setShowCompose(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6F4A7C] text-white rounded-lg text-sm hover:bg-[#6F4A7C]/90 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Compose
              </button>
            )}
          </div>

          {/* Add-another-account chips (shown while the plan has room for more email accounts) */}
          {googleConnected && (
            <div className="px-6 pt-4 flex flex-wrap items-center gap-2">
              {mailLimit === null || accounts.length < mailLimit ? (
                <>
                  <a
                    href="/api/google/auth"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#84AEB2] text-[#2E7C83] text-xs hover:bg-[#84AEB2]/5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Add Gmail
                  </a>
                  <a
                    href="/api/microsoft/auth"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#84AEB2] text-[#2E7C83] text-xs hover:bg-[#84AEB2]/5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Add Microsoft 365
                  </a>
                </>
              ) : (
                <span className="text-xs text-gray-400">Your plan&apos;s email account limit is reached.</span>
              )}
              {mailLimit !== null && (
                <span className="text-xs text-gray-400">
                  {accounts.length} of {mailLimit} email {mailLimit === 1 ? "account" : "accounts"}
                </span>
              )}
            </div>
          )}

          {/* Search */}
          {googleConnected && (
            <div className="px-6 pt-3 flex items-center gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch();
                  if (e.key === "Escape") clearSearch();
                }}
                placeholder="Search mail across all accounts…"
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 placeholder-gray-400 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2]"
              />
              {searchResults !== null ? (
                <button
                  onClick={clearSearch}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear
                </button>
              ) : (
                <button
                  onClick={runSearch}
                  disabled={!searchQuery.trim()}
                  className="px-3 py-2 text-sm text-[#2E7C83] hover:bg-[#84AEB2]/5 rounded-lg transition-colors disabled:opacity-40"
                >
                  Search
                </button>
              )}
            </div>
          )}

          {/* Filters (hidden while searching) */}
          {googleConnected && searchResults === null && emails.length > 0 && (
            <div className="px-6 pt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setUnreadOnly(false);
                  setAccountFilter(null);
                  setLabelFilter(null);
                }}
                className={chipCls(!unreadOnly && !accountFilter && !labelFilter)}
              >
                All
              </button>
              <button onClick={() => setUnreadOnly((v) => !v)} className={chipCls(unreadOnly)}>
                Unread{unreadCount ? ` (${unreadCount})` : ""}
              </button>
              {accounts.length > 1 &&
                accounts.map((a) => (
                  <button
                    key={a.accountKey}
                    onClick={() => setAccountFilter((p) => (p === a.accountKey ? null : a.accountKey))}
                    className={chipCls(accountFilter === a.accountKey)}
                  >
                    {a.label}
                  </button>
                ))}
              {inboxLabels.length > 0 && (
                <select
                  value={labelFilter ?? ""}
                  onChange={(e) => setLabelFilter(e.target.value || null)}
                  className={`text-xs font-medium border rounded-full px-3 py-1 outline-none ${
                    labelFilter
                      ? "bg-[#6F4A7C] text-white border-[#6F4A7C]"
                      : "bg-white text-[#6b7280] border-gray-200"
                  }`}
                >
                  <option value="">Label: all</option>
                  {inboxLabels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Email List (live Gmail + Microsoft 365) */}
          <div className="px-6 py-4 space-y-3 max-h-[420px] overflow-y-auto">
            {googleConnected === false ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <Mail className="w-6 h-6 text-[#7A5D84]" />
                <span className="text-sm text-[#7C7C82]">Connect an account to see your inbox</span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <a
                    href="/api/google/auth"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#84AEB2] text-[#2E7C83] text-xs font-medium hover:bg-[#84AEB2]/5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Connect Gmail
                  </a>
                  <a
                    href="/api/microsoft/auth"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#84AEB2] text-[#2E7C83] text-xs font-medium hover:bg-[#84AEB2]/5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Connect Microsoft 365
                  </a>
                </div>
              </div>
            ) : searching ? (
              <p className="text-sm text-gray-400 py-6 text-center">Searching…</p>
            ) : searchResults !== null ? (
              searchResults.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">
                  No matches for “{searchQuery.trim()}”.
                </p>
              ) : (
                <>
                  <p className="text-xs text-gray-400 px-1">
                    {searchResults.length} result{searchResults.length === 1 ? "" : "s"} for “
                    {searchQuery.trim()}”
                  </p>
                  {searchResults.map((email) => emailRow(email))}
                </>
              )
            ) : emails.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                {googleConnected ? "Inbox zero — nothing new" : "Loading…"}
              </p>
            ) : visibleEmails.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No messages match this filter.</p>
            ) : (
              <>
                {visibleEmails.map((email) => emailRow(email))}
                {!unreadOnly && !accountFilter && !labelFilter && emails.length >= inboxLimit && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-2 text-sm text-[#2E7C83] hover:bg-[#84AEB2]/5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={openReply}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#84AEB2] text-[#6A9EA4] rounded-lg text-sm hover:bg-[#84AEB2]/5 transition-colors bg-[#F8F5F0]"
            >
              <CornerUpLeft className="w-4 h-4" />
              Reply
            </button>
            <button 
              onClick={handleMarkRead}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#6F4A7C] text-white rounded-lg text-sm hover:bg-[#6F4A7C]/90 transition-colors"
            >
              <Check className="w-4 h-4" />
              Mark Read
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* BOTTOM - AI Assistant Full Width (live Mariposa) */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5E3B6C] to-[#2E7C83] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-serif text-base text-indigo-900">AI Assistant</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <button
              onClick={async () => {
                if (!confirm(`Clear what ${assistantName} remembers from your conversations? Your assessments aren't affected.`)) return;
                await fetch("/api/mariposa", { method: "DELETE" }).catch(() => {});
                setAiReply(null);
              }}
              className="hover:text-[#2E7C83] hover:underline"
              title="Clear the conversation history"
            >
              Clear memory
            </button>
            <span>Powered by {assistantName}</span>
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Input */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") askMariposa();
                }}
                placeholder={`Ask ${assistantName} anything about your business...`}
                className="w-full px-4 py-3 bg-white rounded-xl text-sm text-indigo-900 placeholder-gray-400 outline-none border border-gray-200/60 focus:border-[#c9a227]/50"
              />
            </div>
            <button
              onClick={() => askMariposa()}
              disabled={aiLoading || !aiInput.trim()}
              className="w-11 h-11 rounded-xl bg-[#1a2b4a] flex items-center justify-center hover:bg-[#1a2b4a]/90 transition-colors disabled:opacity-50"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Reply */}
          {(aiLoading || aiReply) && (
            <div className="mb-4 p-4 rounded-xl bg-[#F8F5F0] border border-gray-200/60 text-sm text-[#3F4654] whitespace-pre-wrap">
              {aiLoading ? `${assistantName} is thinking…` : aiReply}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {[
              "What's my focus today?",
              "Schedule focus time",
              "Draft email to team",
              "Review weekly goals",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => askMariposa(suggestion)}
                disabled={aiLoading}
                className="px-4 py-2 bg-[#F8F5F0] border border-gray-200/60 text-gray-600 rounded-full text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 12 Business Dimensions (draggable) */}
      <DimensionCards />

      {/* Recurring Tasks Modal */}
      {showRecurring && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowRecurring(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif text-indigo-900">Recurring tasks</h3>
              <button onClick={() => setShowRecurring(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {recurring.length > 0 && (
              <ul className="mb-5 divide-y divide-gray-100 border border-gray-100 rounded-xl">
                {recurring.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(t.priority)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#3F4654] truncate">{t.title}</p>
                      <p className="text-xs text-gray-400">
                        {t.schedule}
                        {t.timeLabel ? ` · ${t.timeKind === "scheduled" ? "at" : "by"} ${t.timeLabel}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteRecurring(t)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-[#D83A34] hover:bg-gray-50"
                      aria-label={`Delete ${t.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={addRecurring} className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Add a recurring task</p>
              <input
                type="text"
                value={rtTitle}
                onChange={(e) => setRtTitle(e.target.value)}
                placeholder="e.g. Review yesterday's sales"
                aria-label="Recurring task title"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 placeholder-gray-400 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2]"
              />

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Repeats</label>
                <select
                  value={rtCadence}
                  onChange={(e) => setRtCadence(e.target.value as "daily" | "weekly" | "monthly")}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2]"
                >
                  <option value="daily">Every day</option>
                  <option value="weekly">On certain days of the week</option>
                  <option value="monthly">Once a month</option>
                </select>
              </div>

              {rtCadence === "weekly" && (
                <div>
                  <div className="flex gap-1.5" role="group" aria-label="Days of the week">
                    {WEEKDAY_CHIPS.map((c) => (
                      <button
                        key={c.d}
                        type="button"
                        aria-label={c.n}
                        aria-pressed={rtDays.includes(c.d)}
                        onClick={() => setRtDays((prev) => (prev.includes(c.d) ? prev.filter((x) => x !== c.d) : [...prev, c.d]))}
                        className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${
                          rtDays.includes(c.d) ? "bg-[#2E7C83] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {c.l}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setRtDays([1, 2, 3, 4, 5])} className="mt-1.5 text-xs text-[#2E7C83] hover:underline">
                    Weekdays only
                  </button>
                </div>
              )}

              {rtCadence === "monthly" && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  On day
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={rtDom}
                    onChange={(e) => setRtDom(e.target.value)}
                    aria-label="Day of the month"
                    className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 outline-none focus:border-[#84AEB2]"
                  />
                  of each month
                  <span className="text-xs text-gray-400">(shorter months use their last day)</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Time of day <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={rtTime}
                    onChange={(e) => setRtTime(e.target.value)}
                    aria-label="Time of day"
                    className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 outline-none focus:border-[#84AEB2]"
                  />
                  {rtTime && (
                    <button type="button" onClick={() => setRtTime("")} className="text-xs text-gray-400 hover:text-gray-600">
                      Clear
                    </button>
                  )}
                </div>
                {rtTime && (
                  <div className="flex gap-2 mt-2" role="group" aria-label="What the time means">
                    {[
                      { id: "deadline", label: "Due by this time" },
                      { id: "scheduled", label: "Do it at this time" },
                    ].map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        aria-pressed={rtKind === k.id}
                        onClick={() => setRtKind(k.id as "deadline" | "scheduled")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          rtKind === k.id ? "bg-[#2E7C83] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {k.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Priority</label>
                <div className="flex gap-2">
                  {[
                    { id: "critical", label: "Critical", color: "bg-red-500" },
                    { id: "high", label: "High", color: "bg-orange-500" },
                    { id: "medium", label: "Medium", color: "bg-yellow-500" },
                    { id: "low", label: "Low", color: "bg-blue-500" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setRtPriority(p.id)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        rtPriority === p.id ? `${p.color} text-white` : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {rtError && <p className="text-sm text-[#D83A34]">{rtError}</p>}
              <button
                type="submit"
                disabled={!rtTitle.trim()}
                className="w-full py-2.5 rounded-lg bg-[#2E7C83] text-white text-sm font-medium hover:bg-[#256b71] disabled:opacity-50 transition-colors"
              >
                Add recurring task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAddTask(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-indigo-900">Add New Task</h3>
              <button 
                onClick={() => setShowAddTask(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 placeholder-gray-400 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2]"
                  autoFocus
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={newTaskStatus}
                  onChange={(e) => setNewTaskStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2]"
                >
                  <option value="today">Today</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting">Waiting</option>
                  <option value="backlog">Backlog</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <div className="flex gap-2">
                  {[
                    { id: "critical", label: "Critical", color: "bg-red-500" },
                    { id: "high", label: "High", color: "bg-orange-500" },
                    { id: "medium", label: "Medium", color: "bg-yellow-500" },
                    { id: "low", label: "Low", color: "bg-blue-500" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewTaskPriority(p.id)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        newTaskPriority === p.id
                          ? `${p.color} text-white`
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* When */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  When <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newTaskDay}
                    onChange={(e) => setNewTaskDay(e.target.value)}
                    aria-label="Due date"
                    className="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2]"
                  />
                  <input
                    type="time"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    aria-label="Time of day"
                    className="w-32 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2]"
                  />
                </div>
                {newTaskTime && (
                  <div className="flex gap-2 mt-2" role="group" aria-label="What the time means">
                    {[
                      { id: "deadline", label: "Due by this time" },
                      { id: "scheduled", label: "Do it at this time" },
                    ].map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        aria-pressed={newTaskKind === k.id}
                        onClick={() => setNewTaskKind(k.id as "deadline" | "scheduled")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          newTaskKind === k.id ? "bg-[#2E7C83] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {k.label}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {newTaskTime ? "Timed tasks also appear in Today's Schedule on their day." : "A date alone means it's due by the end of that day."}
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="w-full py-3 bg-[#1a2b4a] text-white rounded-xl font-medium hover:bg-[#1a2b4a]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Reply Modal */}
      {showReplyModal && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowReplyModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-indigo-900">Quick Reply</h3>
              <button 
                onClick={() => setShowReplyModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Original Email */}
              <div className="bg-[#F8F5F0] rounded-xl p-4 border border-[#E8E4E0]">
                <p className="text-sm font-medium text-indigo-900">{replyingTo?.subject || "RE: Speaking opportunity - Denver Conference"}</p>
                <p className="text-xs text-[#7C7C82] mt-1">From: {replyingTo?.from || "Sarah Johnson"}</p>
                <p className="text-sm text-[#3F4654] mt-2">{replyingTo?.preview || ""}</p>
              </div>

              {/* Reply Text Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Reply</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 placeholder-gray-400 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2] resize-none"
                  autoFocus
                />
              </div>

              <AttachmentPicker files={replyFiles} setter={setReplyFiles} />

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="flex-1 py-2.5 bg-indigo-900 text-white rounded-lg text-sm hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Reader Modal */}
      {readingSource && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={closeReader}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E8E4E0] flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-serif text-lg text-indigo-900 break-words">
                  {thread?.[0]?.subject ?? readingSource.subject}
                </h3>
                <p className="text-xs text-[#7C7C82] mt-1 break-words">
                  {thread && thread.length > 1
                    ? `${thread.length} messages in this conversation`
                    : `${thread?.[0]?.from ?? readingSource.from}${
                        thread?.[0]?.fromEmail ?? readingSource.fromEmail
                          ? ` <${thread?.[0]?.fromEmail ?? readingSource.fromEmail}>`
                          : ""
                      }`}
                </p>
                {readingSource.account && (
                  <span
                    className={`inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      readingSource.provider === "microsoft"
                        ? "bg-[#E5EEF6] text-[#1a56a8]"
                        : "bg-[#FCE8E6] text-[#b23b32]"
                    }`}
                  >
                    {readingSource.account}
                  </span>
                )}
              </div>
              <button
                onClick={closeReader}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Body — full thread, latest expanded */}
            <div className="flex-1 min-h-[280px] overflow-y-auto bg-white">
              {readingLoading ? (
                <p className="p-6 text-sm text-gray-400">Loading conversation…</p>
              ) : thread && thread.length > 0 ? (
                thread.map((m, i) => {
                  const expanded = expandedIds.has(m.id);
                  const single = thread.length === 1;
                  return (
                    <div key={m.id || i} className="border-b border-[#E8E4E0] last:border-b-0">
                      {!single && (
                        <button
                          onClick={() => toggleMsg(m.id)}
                          className="w-full text-left px-5 py-3 hover:bg-gray-50 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-indigo-900 truncate">
                              {m.from || m.fromEmail || "(unknown sender)"}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {m.date ? new Date(m.date).toLocaleString() : ""}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0 mt-1">
                            {expanded ? "▾" : "▸"}
                          </span>
                        </button>
                      )}
                      {(expanded || single) && (
                        <>
                          <iframe
                            title={`Message ${i + 1}`}
                            sandbox=""
                            className="w-full h-[48vh] border-0"
                            srcDoc={readerSrcDoc(m)}
                          />
                          {m.attachments && m.attachments.length > 0 && (
                            <div className="px-5 py-3 border-t border-[#E8E4E0] flex flex-wrap items-center gap-2 bg-[#F8F5F0]">
                              <Paperclip className="w-4 h-4 text-[#7A5D84]" />
                              {m.attachments.map((a) => (
                                <a
                                  key={a.id}
                                  href={attachmentHref(readingSource?.provider ?? "google", readingSource?.accountKey, m.id, a)}
                                  download={a.name}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E8E4E0] bg-white text-xs text-[#3F4654] hover:border-[#84AEB2] transition-colors"
                                >
                                  <span className="max-w-[180px] truncate">{a.name}</span>
                                  {a.size ? <span className="text-gray-400">{formatBytes(a.size)}</span> : null}
                                  <Download className="w-3.5 h-3.5 text-[#2E7C83]" />
                                </a>
                              ))}
                            </div>
                          )}
                          {((m.labels && m.labels.length > 0) || availableLabels.length > 0) && (
                            <div className="px-5 py-3 border-t border-[#E8E4E0] flex flex-wrap items-center gap-2">
                              <Tag className="w-4 h-4 text-[#7A5D84]" />
                              {(m.labels ?? []).map((l) => (
                                <span
                                  key={l.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#EDE5F1] text-[#5E3B6C] text-[11px]"
                                >
                                  {l.name}
                                  <button
                                    onClick={() => changeLabel(m, l, "remove")}
                                    className="hover:text-red-600"
                                    aria-label={`Remove ${l.name}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                              {availableLabels.filter(
                                (l) => !(m.labels ?? []).some((ml) => ml.id === l.id)
                              ).length > 0 && (
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const lbl = availableLabels.find((l) => l.id === e.target.value);
                                    if (lbl) changeLabel(m, lbl, "add");
                                    e.currentTarget.value = "";
                                  }}
                                  className="text-[11px] border border-gray-200 rounded-full px-2 py-1 text-gray-500 bg-white outline-none"
                                >
                                  <option value="">+ Label</option>
                                  {availableLabels
                                    .filter((l) => !(m.labels ?? []).some((ml) => ml.id === l.id))
                                    .map((l) => (
                                      <option key={l.id} value={l.id}>
                                        {l.name}
                                      </option>
                                    ))}
                                </select>
                              )}
                              {newLabelFor === m.id ? (
                                <span className="inline-flex items-center gap-1">
                                  <input
                                    value={newLabelName}
                                    onChange={(e) => setNewLabelName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") createAndApplyLabel(m, newLabelName);
                                      if (e.key === "Escape") {
                                        setNewLabelFor(null);
                                        setNewLabelName("");
                                      }
                                    }}
                                    placeholder="New label…"
                                    autoFocus
                                    className="text-[11px] border border-gray-200 rounded-full px-2 py-1 outline-none focus:border-[#84AEB2]"
                                  />
                                  <button
                                    onClick={() => createAndApplyLabel(m, newLabelName)}
                                    className="text-[11px] text-[#2E7C83] hover:underline"
                                  >
                                    Add
                                  </button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setNewLabelFor(m.id);
                                    setNewLabelName("");
                                  }}
                                  className="text-[11px] text-gray-500 border border-dashed border-gray-300 rounded-full px-2 py-1 hover:border-[#84AEB2] hover:text-[#2E7C83] transition-colors"
                                >
                                  + New
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="p-6 text-sm text-gray-500">
                  Couldn&apos;t load the message. Preview: {readingSource.preview}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E8E4E0] flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => readingSource && mailAction(readingSource, "unread")}
                  title="Mark as unread"
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  onClick={() => readingSource && mailAction(readingSource, "archive")}
                  title="Archive"
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={() => readingSource && mailAction(readingSource, "trash")}
                  title="Move to Trash"
                  className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={replyFromReader}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6F4A7C] text-white rounded-lg text-sm hover:bg-[#6F4A7C]/90 transition-colors"
                >
                  <CornerUpLeft className="w-4 h-4" />
                  Reply
                </button>
                <button
                  onClick={openForward}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#84AEB2] text-[#2E7C83] rounded-lg text-sm hover:bg-[#84AEB2]/5 transition-colors"
                >
                  <Forward className="w-4 h-4" />
                  Forward
                </button>
                <button
                  onClick={closeReader}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {forwarding && forwardSource && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setForwarding(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif text-indigo-900">Forward</h3>
              <button
                onClick={() => setForwarding(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-xs text-[#7C7C82] mb-4 truncate">
              Forwarding: <span className="text-[#3F4654]">{forwardSource.subject}</span>
              {forwardSource.account ? ` · from ${forwardSource.account}` : ""}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">To</label>
                <input
                  type="email"
                  value={forwardTo}
                  onChange={(e) => setForwardTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 placeholder-gray-400 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Add a note (optional)
                </label>
                <textarea
                  value={forwardNote}
                  onChange={(e) => setForwardNote(e.target.value)}
                  placeholder="Say something before the forwarded message…"
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 placeholder-gray-400 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2] resize-none"
                />
              </div>

              <AttachmentPicker files={forwardFiles} setter={setForwardFiles} />

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setForwarding(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendForward}
                  disabled={sendingForward || !forwardTo.trim()}
                  className="flex-1 py-2.5 bg-indigo-900 text-white rounded-lg text-sm hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingForward ? "Sending…" : "Forward"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setShowCompose(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-indigo-900">New message</h3>
              <button
                onClick={() => setShowCompose(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              {accounts.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">From</label>
                  <select
                    value={composeAccount?.accountKey ?? ""}
                    onChange={(e) => setComposeAccountKey(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2]"
                  >
                    {accounts.map((a) => (
                      <option key={a.accountKey} value={a.accountKey}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">To</label>
                <input
                  type="email"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 placeholder-gray-400 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 placeholder-gray-400 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your message…"
                  rows={6}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 placeholder-gray-400 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2] resize-none"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#84AEB2] text-[#2E7C83] text-sm cursor-pointer hover:bg-[#84AEB2]/5 transition-colors">
                  <Paperclip className="w-4 h-4" />
                  Attach files
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      onComposeFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
                {composeFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {composeFiles.map((f, i) => (
                      <span
                        key={`${f.name}-${i}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E8E4E0] bg-gray-50 text-xs text-[#3F4654]"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-[#7A5D84]" />
                        <span className="max-w-[160px] truncate">{f.name}</span>
                        {f.size ? <span className="text-gray-400">{formatBytes(f.size)}</span> : null}
                        <button
                          onClick={() => setComposeFiles((prev) => prev.filter((_, j) => j !== i))}
                          className="text-gray-400 hover:text-red-600"
                          aria-label="Remove attachment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowCompose(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendCompose}
                  disabled={sending || !composeTo.trim() || !composeBody.trim()}
                  className="flex-1 py-2.5 bg-indigo-900 text-white rounded-lg text-sm hover:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
