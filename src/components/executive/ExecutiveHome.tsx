"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mic,
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
} from "lucide-react";

// Types
interface Email {
  id: number;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  hasAttachment?: boolean;
  tag?: "VIP" | "Action" | "FYI";
}

const initialEmails: Email[] = [
  { id: 1, from: "Sarah Johnson", subject: "RE: Speaking opportunity - Denver Conference", preview: "Hi Babs, I have a question about the upcoming session...", time: "2 hours ago", unread: true, tag: "VIP" },
  { id: 2, from: "Michael Chen", subject: "LifeCharter Incubator registration", preview: "I'd like to register for the Alignment Workshop on Friday...", time: "5 hours ago", unread: true, hasAttachment: true, tag: "Action" },
  { id: 3, from: "Team Slack", subject: "Your weekly analytics report", preview: "Here are the notes from today's standup meeting...", time: "Yesterday", unread: false, tag: "FYI" },
];

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
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [emails, setEmails] = useState<Email[]>(initialEmails);
  const [replyingTo, setReplyingTo] = useState<Email | null>(null);

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

  const currency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

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
  const todayTasks = tasks.filter(t => t.status === "today").slice(0, 1);
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").slice(0, 1);
  const waitingTasks = tasks.filter(t => t.status === "waiting").slice(0, 1);

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header - EXACT from image */}
      <header className="mb-8 flex items-start justify-between">
        {/* Left side - Text */}
        <div>
          <h1 className="text-5xl font-serif font-bold text-indigo-900 mb-1">
            Good morning, Babs
          </h1>
          <p className="text-xl text-gray-500 mb-1">
            {currentTime ? new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              timeZone: userTimezone,
            }).format(currentTime) : "Loading..."}
          </p>
          <p className="text-base text-gray-400">
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
            onClick={() => window.location.href = "/dashboard/social"}
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

      {/* TOP ROW - 3 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Your Morning Brief - EXACT from new image */}
        <Link href="/dashboard/planning" className="block">
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
                  <span className="text-sm text-[#3F4654]">3 meetings today - first at 9:00 AM</span>
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

        {/* Today's Schedule - EXACT from image */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden h-full">
          {/* Card Header */}
          <div className="px-6 pt-5 pb-3">
            <h3 className="font-serif text-lg text-indigo-900">Today&apos;s Schedule</h3>
          </div>
          
          {/* Schedule Items */}
          <div className="px-6 pb-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#2E7C83] flex-shrink-0" />
              <span className="text-sm text-[#3F4654]">9:00 AM - Team Standup</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#7B6B8D] flex-shrink-0" />
              <span className="text-sm text-[#3F4654]">11:00 AM - Client Call</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#c9a227] flex-shrink-0" />
              <span className="text-sm text-[#3F4654]">2:00 PM - Content Creation</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#1a2b4a] flex-shrink-0" />
              <span className="text-sm text-[#3F4654]">4:00 PM - LifeCharter Circle</span>
            </div>
          </div>

          {/* View Full Calendar Link */}
          <div className="px-6 pb-5">
            <Link 
              href="/dashboard/time"
              className="inline-flex items-center gap-1.5 text-sm text-[#2E7C83] hover:text-[#2E7C83]/80 transition-colors font-medium"
            >
              View full calendar
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Financial Pulse - EXACT from image */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden h-full">
          {/* Card Header */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <h3 className="font-serif text-lg text-indigo-900">Financial Pulse</h3>
            <Link href="/dashboard/money">
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
            <Link href="/dashboard/money">
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

      {/* SECOND ROW - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Priority Tasks - EXACT from image with real data */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8E4E0] overflow-hidden h-full">
          {/* Header with lighter background */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-[#E8E4E0] bg-[#FFFFFF]">
            <h3 className="font-serif text-lg text-indigo-900">Priority Tasks</h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#84AEB2] text-[#6A9EA4] rounded-lg text-sm hover:bg-[#84AEB2]/5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
              <Link 
                href="/dashboard/tasks"
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
                  <Link key={task.id} href={`/dashboard/tasks?edit=${task.id}`}>
                    <div className="bg-[#F8F5F0] rounded-xl p-3 border border-[#E8E4E0] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          </div>
                          <p className="text-sm text-[#3F4654] leading-snug">{task.title}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <Link href="/dashboard/tasks">
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
                  <Link key={task.id} href={`/dashboard/tasks?edit=${task.id}`}>
                    <div className="bg-[#F8F5F0] rounded-xl p-3 border border-[#E8E4E0] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          </div>
                          <p className="text-sm text-[#3F4654] leading-snug">{task.title}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <Link href="/dashboard/tasks">
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
                  <Link key={task.id} href={`/dashboard/tasks?edit=${task.id}`}>
                    <div className="bg-[#F8F5F0] rounded-xl p-3 border border-[#E8E4E0] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          </div>
                          <p className="text-sm text-[#3F4654] leading-snug">{task.title}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <Link href="/dashboard/tasks">
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

        {/* Inbox - EXACT from image */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E8E4E0] overflow-hidden h-full">
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-[#E8E4E0]">
            <div className="flex items-center gap-3">
              <h3 className="font-serif text-lg text-indigo-900">Inbox</h3>
              <span className="px-2.5 py-1 bg-[#6F4A7C] text-white text-xs font-medium rounded-full">12 unread</span>
              <span className="px-2.5 py-1 bg-[#2E7C83] text-white text-xs font-medium rounded-full">3 flagged</span>
            </div>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Email List */}
          <div className="p-6 space-y-3">
            {emails.map((email) => (
              <div 
                key={email.id}
                onClick={() => setSelectedEmail(email.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border border-[#E8E4E0] cursor-pointer transition-all ${
                  selectedEmail === email.id ? 'bg-white ring-2 ring-[#84AEB2]' : 'bg-[#F8F5F0] hover:bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#EDE5F1] flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-[#7A5D84]" />
                </div>
                <div className="flex-1 min-w-0">
                  {email.tag && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        email.tag === 'VIP' ? 'bg-[#EFE4F0] text-[#6E3F7A]' :
                        email.tag === 'Action' ? 'bg-[#DCE9EE] text-[#6A9EA4]' :
                        'bg-[#E7EAF0] text-[#7C7C82]'
                      }`}>
                        {email.tag}
                      </span>
                      {email.unread && <div className="w-2 h-2 rounded-full bg-[#c9a227]" />}
                    </div>
                  )}
                  <p className={`text-sm truncate ${email.unread ? 'font-medium text-indigo-900' : 'text-[#3F4654]'}`}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-[#7C7C82] mt-0.5">From: {email.from} • {email.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 flex gap-3">
            <button 
              onClick={() => {
                const firstUnread = emails.find(e => e.unread);
                if (firstUnread) {
                  setReplyingTo(firstUnread);
                  setShowReplyModal(true);
                } else {
                  alert("No unread emails to reply to!");
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#84AEB2] text-[#6A9EA4] rounded-lg text-sm hover:bg-[#84AEB2]/5 transition-colors bg-[#F8F5F0]"
            >
              <CornerUpLeft className="w-4 h-4" />
              Quick Reply
            </button>
            <button 
              onClick={() => {
                const firstUnreadIndex = emails.findIndex(e => e.unread);
                if (firstUnreadIndex >= 0) {
                  const updatedEmails = [...emails];
                  updatedEmails[firstUnreadIndex] = { ...updatedEmails[firstUnreadIndex], unread: false };
                  setEmails(updatedEmails);
                } else {
                  alert("No unread emails!");
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#6F4A7C] text-white rounded-lg text-sm hover:bg-[#6F4A7C]/90 transition-colors"
            >
              <Check className="w-4 h-4" />
              Mark Read
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM - AI Assistant Full Width */}
      <Link href="/dashboard/ai" className="block">
        <div className="bg-[#FFFFFF] rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5E3B6C] to-[#2E7C83] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-serif text-lg text-indigo-900">AI Assistant</h3>
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
                  placeholder="Ask me anything about your business..."
                  className="w-full px-4 py-3 bg-white rounded-xl text-sm text-indigo-900 placeholder-gray-400 outline-none border border-gray-200/60 focus:border-[#c9a227]/50"
                  onClick={(e) => e.preventDefault()}
                />
              </div>
              <button className="w-11 h-11 rounded-xl bg-[#c9a227] flex items-center justify-center hover:bg-[#b8941f] transition-colors" onClick={(e) => e.preventDefault()}>
                <Mic className="w-5 h-5 text-white" />
              </button>
              <button className="w-11 h-11 rounded-xl bg-[#1a2b4a] flex items-center justify-center hover:bg-[#1a2b4a]/90 transition-colors" onClick={(e) => e.preventDefault()}>
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </div>

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
                  className="px-4 py-2 bg-[#F8F5F0] border border-gray-200/60 text-gray-600 rounded-full text-sm hover:bg-gray-50 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Link>

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
                <p className="text-sm text-[#3F4654] mt-2">{replyingTo?.preview || "Hi Babs, I have a question about the upcoming session..."}</p>
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
                  onClick={() => {
                    if (replyingTo) {
                      // Mark as read when replying
                      const updatedEmails = emails.map(e => 
                        e.id === replyingTo.id ? { ...e, unread: false } : e
                      );
                      setEmails(updatedEmails);
                    }
                    alert("Reply sent!");
                    setReplyText("");
                    setReplyingTo(null);
                    setShowReplyModal(false);
                  }}
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
    </div>
  );
}
