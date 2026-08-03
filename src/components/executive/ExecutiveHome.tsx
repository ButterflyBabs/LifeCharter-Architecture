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
} from "lucide-react";
import DimensionCards from "@/components/executive/DimensionCards";

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
}

interface MailAccount {
  provider: Provider;
  email: string;
  label: string;
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
  business: { name: string; color: string } | null;
  segment: { name: string; color: string } | null;
}

export default function ExecutiveHome() {
  const [aiInput, setAiInput] = useState("");
  const [tasks, setTasks] = useState<RealTask[]>([]);
  const [finance, setFinance] = useState<{
    hasData: boolean;
    thisMonth: number;
    changePct: number | null;
    weekly: number[];
  } | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState("today");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [userTimezone, setUserTimezone] = useState("America/Denver"); // Default to Babs' timezone
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
  const [providers, setProviders] = useState<{ google: boolean; microsoft: boolean }>({
    google: false,
    microsoft: false,
  });
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [composeProvider, setComposeProvider] = useState<Provider>("google");
  const [readingSource, setReadingSource] = useState<Email | null>(null);
  const [reading, setReading] = useState<{
    subject: string;
    from: string;
    fromEmail: string;
    date: string;
    bodyHtml: string | null;
    bodyText: string | null;
  } | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [inboxLimit, setInboxLimit] = useState(12);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [accountFilter, setAccountFilter] = useState<Provider | null>(null);
  const [schedule, setSchedule] = useState<{ connected: boolean; events: ScheduleEvent[] } | null>(null);
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
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

  // Load user's timezone preference
  useEffect(() => {
    const savedTimezone = localStorage.getItem("userTimezone");
    if (savedTimezone) {
      setUserTimezone(savedTimezone);
    }
  }, []);

  // Fetch real tasks
  useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch live financial pulse
  useEffect(() => {
    fetch("/api/financial-pulse")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setFinance(d))
      .catch(() => {});
  }, []);

  // Fetch owner name for the greeting (from the profile)
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.firstName && setFirstName(d.firstName))
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
        if (d.providers) setProviders(d.providers);
        if (Array.isArray(d.accounts)) {
          setAccounts(d.accounts);
          // Default the compose "From" to the first connected account, but keep
          // the user's pick if it's still a connected account.
          setComposeProvider((prev) =>
            d.accounts.some((a: MailAccount) => a.provider === prev)
              ? prev
              : (d.accounts[0]?.provider ?? prev)
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
    const tz =
      (typeof window !== "undefined" &&
        (localStorage.getItem("userTimezone") ||
          Intl.DateTimeFormat().resolvedOptions().timeZone)) ||
      "UTC";
    fetch(`/api/schedule?tz=${encodeURIComponent(tz)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSchedule(d))
      .catch(() => {});
  }, []);

  const unreadCount = emails.filter((e) => e.unread).length;
  const visibleEmails = emails.filter(
    (e) => (!unreadOnly || e.unread) && (!accountFilter || (e.provider ?? "google") === accountFilter)
  );
  const chipCls = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
      active
        ? "bg-[#6F4A7C] text-white border-[#6F4A7C]"
        : "bg-white text-[#6b7280] border-gray-200 hover:border-[#84AEB2]"
    }`;

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
        body: JSON.stringify({ provider: firstUnread.provider ?? "google", id: firstUnread.id }),
      });
    } catch {
      /* optimistic — leave marked read locally */
    }
  };

  // Open a message in the reader: fetch its full body, and mark it read.
  const openEmail = async (email: Email) => {
    setSelectedEmail(email.id);
    setReadingSource(email);
    setReading(null);
    setReadingLoading(true);
    if (email.unread) {
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, unread: false } : e)));
      fetch("/api/inbox/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: email.provider ?? "google", id: email.id }),
      }).catch(() => {});
    }
    try {
      const res = await fetch(
        `/api/inbox/message?provider=${email.provider ?? "google"}&id=${encodeURIComponent(email.id)}`
      );
      if (res.ok) setReading(await res.json());
    } catch {
      /* leave reading null — the modal shows a fallback */
    }
    setReadingLoading(false);
  };

  const closeReader = () => {
    setReadingSource(null);
    setReading(null);
  };

  // Reply to the message currently open in the reader.
  const replyFromReader = () => {
    if (!readingSource) return;
    setReplyingTo(readingSource);
    setReplyText("");
    closeReader();
    setShowReplyModal(true);
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
        body: JSON.stringify({ provider: email.provider ?? "google", id: email.id, action }),
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

  const handleSendReply = async () => {
    if (!replyingTo || !replyText.trim()) return;
    try {
      const res = await fetch("/api/inbox/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: replyingTo.provider ?? "google",
          id: replyingTo.id,
          threadId: replyingTo.threadId,
          to: replyingTo.fromEmail,
          subject: replyingTo.subject,
          inReplyTo: replyingTo.messageId,
          body: replyText,
        }),
      });
      if (!res.ok) {
        alert("Reply failed to send.");
        return;
      }
      setEmails((prev) => prev.map((e) => (e.id === replyingTo.id ? { ...e, unread: false } : e)));
      setReplyText("");
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
    setShowReplyModal(true);
  };

  const handleSendCompose = async () => {
    if (!composeTo.trim() || !composeBody.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: composeProvider,
          to: composeTo.trim(),
          subject: composeSubject.trim() || "(no subject)",
          body: composeBody,
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
        body: JSON.stringify({ message }),
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
          dueDate: null,
        }),
      });

      if (res.ok) {
        setNewTaskTitle("");
        setShowAddTask(false);
        fetchTasks(); // Refresh the task list
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  // Get tasks for each column
  const todayTasks = tasks.filter(t => t.status === "today").slice(0, 3);
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").slice(0, 3);
  const waitingTasks = tasks.filter(t => t.status === "waiting").slice(0, 3);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Header - EXACT from image */}
      <header className="mb-6 flex items-start justify-between">
        {/* Left side - Text */}
        <div>
          <h1 className="text-3xl font-serif font-bold text-indigo-900 mb-0.5">
            {firstName ? `Good morning, ${firstName}` : "Good morning"}
          </h1>
          <p className="text-sm text-gray-500 mb-0.5">
            {currentTime ? new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              timeZone: userTimezone,
            }).format(currentTime) : "Loading..."}
          </p>
          <p className="text-sm text-gray-400">
            Here&apos;s your executive briefing for today
          </p>
        </div>

        {/* Right side - Action Buttons */}
        <div className="flex items-center gap-2 mt-2">
          {/* Start My Day - Gold */}
          <button 
            onClick={() => alert("Starting your day! 🌅")}
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
        <Link href="/business-plan" className="block">
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
                  <span className="text-sm text-[#3F4654]">{tasks.length} {tasks.length === 1 ? "task requires" : "tasks require"} attention</span>
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
            {schedule && !schedule.connected ? (
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
            ) : schedule && schedule.events.length === 0 ? (
              <p className="text-sm text-gray-400">No meetings today</p>
            ) : (
              (schedule?.events ?? []).map((ev, i) => {
                const dots = ["#2E7C83", "#7B6B8D", "#c9a227", "#1a2b4a"];
                return (
                  <div key={ev.id} className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dots[i % dots.length] }}
                    />
                    <span className="text-sm text-[#3F4654]">
                      {ev.time} - {ev.title}
                    </span>
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
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <h3 className="font-serif text-base text-indigo-900">Financial Pulse</h3>
            <Link href="/finance">
              <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </Link>
          </div>

          <div className="px-6 pb-6 space-y-4">
            {/* Main Balance (live) */}
            <div>
              <p className="text-3xl font-serif text-[#c9a227]">
                {finance?.hasData ? currency(finance.thisMonth) : "$0"}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {finance?.hasData && finance.changePct !== null ? (
                  <>
                    <span
                      className={
                        finance.changePct >= 0
                          ? "text-[#2E7C83] font-medium"
                          : "text-[#D83A34] font-medium"
                      }
                    >
                      {finance.changePct >= 0 ? "+" : ""}
                      {finance.changePct}%
                    </span>{" "}
                    from last month
                  </>
                ) : (
                  "This month · no revenue recorded yet"
                )}
              </p>
            </div>

            {/* Bar Chart (weekly actuals) */}
            <div className="space-y-2">
              <div className="flex items-end gap-1 h-24">
                {(() => {
                  const weekly = finance?.weekly ?? [0, 0, 0, 0];
                  const max = Math.max(1, ...weekly);
                  return weekly.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#2E7C83] rounded-t"
                      style={{
                        height: `${Math.max(4, (v / max) * 100)}%`,
                        opacity: finance?.hasData ? 0.4 + (v / max) * 0.5 : 0.15,
                      }}
                    />
                  ));
                })()}
              </div>
              <div className="flex justify-between text-xs text-gray-400 px-1">
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Week 4</span>
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
          <div className="p-6 grid grid-cols-3 gap-0 divide-x divide-dashed divide-gray-300">
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
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <Link href="/tasks">
                  <div className="bg-[#F8F5F0] rounded-xl p-3 border border-[#E8E4E0] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#D83A34]" />
                        </div>
                        <p className="text-sm text-[#3F4654] leading-snug">Review LifeCharter Circle applications</p>
                      </div>
                    </div>
                  </div>
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
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <Link href="/tasks">
                  <div className="bg-[#F8F5F0] rounded-xl p-3 border border-[#E8E4E0] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#F0B400]" />
                        </div>
                        <p className="text-sm text-[#3F4654] leading-snug">Draft newsletter for Letterman</p>
                      </div>
                    </div>
                  </div>
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
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <Link href="/tasks">
                  <div className="bg-[#F8F5F0] rounded-xl p-3 border border-[#E8E4E0] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#54A33B]" />
                        </div>
                        <p className="text-sm text-[#3F4654] leading-snug">Approve social media posts</p>
                      </div>
                    </div>
                  </div>
                </Link>
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
                onClick={() => setShowCompose(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6F4A7C] text-white rounded-lg text-sm hover:bg-[#6F4A7C]/90 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Compose
              </button>
            )}
          </div>

          {/* Add-another-account chips (shown when at least one account is connected) */}
          {googleConnected && (!providers.google || !providers.microsoft) && (
            <div className="px-6 pt-4 flex flex-wrap gap-2">
              {!providers.google && (
                <a
                  href="/api/google/auth"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#84AEB2] text-[#2E7C83] text-xs hover:bg-[#84AEB2]/5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" /> Connect Gmail
                </a>
              )}
              {!providers.microsoft && (
                <a
                  href="/api/microsoft/auth"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#84AEB2] text-[#2E7C83] text-xs hover:bg-[#84AEB2]/5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" /> Connect Microsoft 365
                </a>
              )}
            </div>
          )}

          {/* Filters */}
          {googleConnected && emails.length > 0 && (
            <div className="px-6 pt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setUnreadOnly(false);
                  setAccountFilter(null);
                }}
                className={chipCls(!unreadOnly && !accountFilter)}
              >
                All
              </button>
              <button onClick={() => setUnreadOnly((v) => !v)} className={chipCls(unreadOnly)}>
                Unread{unreadCount ? ` (${unreadCount})` : ""}
              </button>
              {accounts.length > 1 &&
                accounts.map((a) => (
                  <button
                    key={a.provider}
                    onClick={() => setAccountFilter((p) => (p === a.provider ? null : a.provider))}
                    className={chipCls(accountFilter === a.provider)}
                  >
                    {a.label}
                  </button>
                ))}
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
            ) : emails.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                {googleConnected ? "Inbox zero — nothing new" : "Loading…"}
              </p>
            ) : visibleEmails.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No messages match this filter.</p>
            ) : (
              <>
                {visibleEmails.map((email) => (
                  <div
                    key={`${email.provider ?? "google"}-${email.id}`}
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
                ))}
                {!unreadOnly && !accountFilter && emails.length >= inboxLimit && (
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
          <span className="text-xs text-gray-400">Powered by Mariposa</span>
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
                placeholder="Ask Mariposa anything about your business..."
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
              {aiLoading ? "Mariposa is thinking…" : aiReply}
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
                  {reading?.subject ?? readingSource.subject}
                </h3>
                <p className="text-xs text-[#7C7C82] mt-1 break-words">
                  {reading?.from ?? readingSource.from}
                  {(reading?.fromEmail ?? readingSource.fromEmail)
                    ? ` <${reading?.fromEmail ?? readingSource.fromEmail}>`
                    : ""}
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

            {/* Body */}
            <div className="flex-1 min-h-[280px] overflow-hidden bg-white">
              {readingLoading ? (
                <p className="p-6 text-sm text-gray-400">Loading message…</p>
              ) : reading ? (
                <iframe
                  title="Email body"
                  sandbox=""
                  className="w-full h-full min-h-[280px] border-0"
                  srcDoc={readerSrcDoc(reading)}
                />
              ) : (
                <p className="p-6 text-sm text-gray-500">
                  Couldn&apos;t load the full message. Preview: {readingSource.preview}
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
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6F4A7C] text-white rounded-lg text-sm hover:bg-[#6F4A7C]/90 transition-colors"
                >
                  <CornerUpLeft className="w-4 h-4" />
                  Reply
                </button>
                <button
                  onClick={closeReader}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Close
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
                    value={composeProvider}
                    onChange={(e) => setComposeProvider(e.target.value as Provider)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-indigo-900 outline-none focus:border-[#84AEB2] focus:ring-1 focus:ring-[#84AEB2]"
                  >
                    {accounts.map((a) => (
                      <option key={a.provider} value={a.provider}>
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
