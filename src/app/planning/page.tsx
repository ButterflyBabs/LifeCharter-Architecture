"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Target,
  Briefcase,
  Megaphone,
  TrendingUp,
  LineChart,
  DollarSign,
  Calendar,
  Plus,
  Download,
  History,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  X,
  Trash2,
  FileSignature,
} from "lucide-react";
import ProposalModal from "@/components/plans/ProposalModal";

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

function ago(iso: string | null): string {
  if (!iso) return "not yet";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

interface PlanCard {
  hasPlan: boolean;
  status: string;
  title: string;
  updatedAt: string | null;
  goals: { total: number; done: number };
}

interface Rollup {
  connected: boolean;
  plans: { business: PlanCard; marketing: PlanCard; sales: PlanCard };
  finance: { mtdNet: number; ytdNet: number; ytdIncome: number; ytdExpense: number };
  pipeline: { value: number; openCount: number };
  forecast: { horizonMonths: number; expectedNet: number; baseMonthlyRevenue: number } | null;
  nextReview: { title: string; scheduledFor: string | null } | null;
}

interface Review {
  id: string;
  title: string;
  sectionKey: string;
  scheduledFor: string | null;
  status: string;
  completedAt: string | null;
  calendarEventId?: string | null;
}

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#2c6b3f", bg: "#d8efdd" },
  draft: { label: "Draft", color: "#8a6a15", bg: "#f4e6c9" },
  review: { label: "Review", color: "#1c5a60", bg: "#d3ebee" },
  not_started: { label: "Not started", color: "#8a7f74", bg: "#eee9e2" },
};

const SECTIONS = [
  { id: "business", label: "Business Plan" },
  { id: "marketing", label: "Marketing Plan" },
  { id: "sales", label: "Sales Plan" },
  { id: "forecasting", label: "Forecasting" },
  { id: "finance", label: "Finance" },
  { id: "general", label: "General" },
];

export default function PlanningHubPage() {
  const [data, setData] = useState<Rollup | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [upcoming, setUpcoming] = useState<Review[]>([]);
  const [history, setHistory] = useState<Review[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [sessionOpen, setSessionOpen] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", sectionKey: "general", scheduledFor: "", scheduledTime: "09:00", notes: "" });
  const [saving, setSaving] = useState(false);
  const [calMsg, setCalMsg] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/planning").then((r) => r.json()).catch(() => null),
        fetch("/api/planning/reviews").then((r) => r.json()).catch(() => ({})),
      ]);
      if (r1) setData(r1);
      if (Array.isArray(r2.upcoming)) setUpcoming(r2.upcoming);
      if (Array.isArray(r2.history)) setHistory(r2.history);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Open the New Planning Session modal directly from the quick-add menu (?session=1).
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("session") === "1") {
      setSessionOpen(true);
    }
  }, []);

  const saveSession = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    setCalMsg(null);
    try {
      const res = await fetch("/api/planning/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draft.title, sectionKey: draft.sectionKey, scheduledFor: draft.scheduledFor, notes: draft.notes }),
      });
      const d = await res.json().catch(() => ({}));
      if (!d.review) return;

      let review: Review = d.review;

      // Put it on the connected calendar on the chosen day (if a date was set).
      if (draft.scheduledFor) {
        try {
          const startISO = new Date(`${draft.scheduledFor}T${draft.scheduledTime || "09:00"}:00`).toISOString();
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
          const calRes = await fetch("/api/calendar/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject: draft.title.trim(), startISO, durationMin: 60, note: draft.notes || "Planning session", timeZone: tz }),
          });
          const cal = await calRes.json().catch(() => ({}));
          if (cal.ok && cal.eventId) {
            review = { ...review, calendarEventId: cal.eventId };
            fetch("/api/planning/reviews", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: review.id, calendarEventId: cal.eventId }),
            });
            setCalMsg({ kind: "ok", text: "Added to your calendar." });
          } else if (cal.needsScope) {
            setCalMsg({ kind: "warn", text: "Scheduled here. To add it to Google Calendar, reconnect Google with calendar access in Settings." });
          } else {
            setCalMsg({ kind: "warn", text: "Scheduled here. Connect a calendar (Settings) to auto-add these events." });
          }
        } catch {
          setCalMsg({ kind: "warn", text: "Scheduled here, but couldn't reach your calendar just now." });
        }
      }

      setUpcoming((prev) =>
        [...prev, review].sort((a, b) => (a.scheduledFor || "9999").localeCompare(b.scheduledFor || "9999"))
      );
      setDraft({ title: "", sectionKey: "general", scheduledFor: "", scheduledTime: "09:00", notes: "" });
      setSessionOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const completeReview = async (id: string) => {
    const r = upcoming.find((x) => x.id === id);
    setUpcoming((prev) => prev.filter((x) => x.id !== id));
    if (r) setHistory((prev) => [{ ...r, status: "completed", completedAt: new Date().toISOString() }, ...prev]);
    await fetch("/api/planning/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "complete" }),
    });
  };

  const deleteReview = async (id: string, fromHistory: boolean) => {
    if (fromHistory) setHistory((prev) => prev.filter((x) => x.id !== id));
    else setUpcoming((prev) => prev.filter((x) => x.id !== id));
    await fetch(`/api/planning/reviews?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  };

  const planStatus = (p: PlanCard) => (p.hasPlan ? p.status || "active" : "not_started");

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7b6b8d] to-[#2E7C83] flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Planning Hub</h1>
            <p className="text-[#b8a898]">Strategic planning and long-term vision — everything rolls up here.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSessionOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-xl bg-[#2E7C83] text-white hover:bg-[#256b71]"
          >
            <Plus className="w-4 h-4" /> New Planning Session
          </button>
          <a
            href="/api/planning/export"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-xl border border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
          >
            <Download className="w-4 h-4" /> Export All Plans
          </a>
          <button
            onClick={() => setProposalOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-xl bg-[#7b6b8d] text-white hover:bg-[#6a5c7b]"
          >
            <FileSignature className="w-4 h-4" /> Create Proposal
          </button>
        </div>
      </div>

      {proposalOpen && <ProposalModal onClose={() => setProposalOpen(false)} />}

      {/* Rollup cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Business Plan */}
        <PlanRollupCard
          icon={<Briefcase className="w-5 h-5" />}
          title="Business Plan"
          description="Vision, mission, values, and strategic objectives"
          href="/business-plan"
          status={data ? planStatus(data.plans.business) : "not_started"}
          updatedAt={data?.plans.business.updatedAt ?? null}
          metric={
            data && data.plans.business.goals.total > 0
              ? `${data.plans.business.goals.done}/${data.plans.business.goals.total} goals`
              : data?.plans.business.hasPlan
              ? "Active"
              : "Not created yet"
          }
        />
        {/* Marketing Plan */}
        <PlanRollupCard
          icon={<Megaphone className="w-5 h-5" />}
          title="Marketing Plan"
          description="Positioning, ideal client, channels, and content"
          href="/marketing-plan"
          status={data ? planStatus(data.plans.marketing) : "not_started"}
          updatedAt={data?.plans.marketing.updatedAt ?? null}
          metric={
            data && data.plans.marketing.goals.total > 0
              ? `${data.plans.marketing.goals.done}/${data.plans.marketing.goals.total} goals`
              : data?.plans.marketing.hasPlan
              ? "Active"
              : "Not created yet"
          }
        />
        {/* Sales Plan */}
        <PlanRollupCard
          icon={<TrendingUp className="w-5 h-5" />}
          title="Sales Plan"
          description="Pipeline, targets, processes, and conversion"
          href="/sales"
          status={data ? planStatus(data.plans.sales) : "not_started"}
          updatedAt={data?.plans.sales.updatedAt ?? null}
          metric={data ? `${usd(data.pipeline.value)} pipeline · ${data.pipeline.openCount} open` : "—"}
        />
        {/* Forecasting */}
        <PlanRollupCard
          icon={<LineChart className="w-5 h-5" />}
          title="Financial Forecasting"
          description="Revenue projections, budgeting, scenario planning"
          href="/planning/forecast"
          status="review"
          updatedAt={null}
          hideUpdated
          metric={
            data?.forecast
              ? `${usd(data.forecast.expectedNet)} net (${data.forecast.horizonMonths} mo, expected)`
              : "Set your assumptions"
          }
        />
        {/* Finance */}
        <PlanRollupCard
          icon={<DollarSign className="w-5 h-5" />}
          title="Finance"
          description="Live ledger, budgets, P&L, and tax prep"
          href="/finance"
          status={data && data.finance.ytdNet >= 0 ? "active" : "review"}
          updatedAt={null}
          hideUpdated
          metric={data ? `${usd(data.finance.mtdNet)} MTD · ${usd(data.finance.ytdNet)} YTD net` : "—"}
        />
        {/* Add-a-session prompt card */}
        <button
          onClick={() => setSessionOpen(true)}
          className="rounded-2xl border border-dashed border-[#2E7C83]/40 text-[#2E7C83] hover:bg-[#2E7C83]/5 flex flex-col items-center justify-center gap-1 p-6 min-h-[140px]"
        >
          <Plus className="w-6 h-6" />
          <span className="text-sm font-medium">Schedule a planning session</span>
        </button>
      </div>

      {/* Upcoming Reviews */}
      <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2E7C83]" />
            <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Upcoming Reviews</h2>
          </div>
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
          >
            <History className="w-3.5 h-3.5" /> {showHistory ? "Hide history" : "Review History"}
          </button>
        </div>

        {calMsg && (
          <p className={`text-xs mb-2 ${calMsg.kind === "ok" ? "text-[#2c6b3f]" : "text-[#8a6a15]"}`}>{calMsg.text}</p>
        )}

        {!loaded ? (
          <p className="text-sm text-[#b8a898]">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-[#b8a898]">
            No reviews scheduled. Use <strong>New Planning Session</strong> to set one.
          </p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-[#1a2b4a]/8 p-3">
                <Clock className="w-4 h-4 text-[#2E7C83] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] truncate">{r.title}</p>
                  <p className="text-xs text-[#b8a898] flex items-center gap-1.5">
                    <span>{r.scheduledFor || "No date"} · {SECTIONS.find((s) => s.id === r.sectionKey)?.label || "General"}</span>
                    {r.calendarEventId && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[#2E7C83]/12 text-[#2E7C83]">
                        <Calendar className="w-2.5 h-2.5" /> On calendar
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => completeReview(r.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </button>
                <button
                  onClick={() => deleteReview(r.id, false)}
                  className="p-1.5 rounded-lg border border-[#8a2f2f]/25 text-[#8a2f2f] hover:bg-[#8a2f2f]/5"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showHistory && (
          <div className="mt-4 pt-4 border-t border-[#1a2b4a]/10">
            <h3 className="text-sm font-semibold text-[#7a8a99] mb-2">Review History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-[#b8a898]">No completed reviews yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#2c6b3f] flex-shrink-0" />
                    <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{r.title}</span>
                    <span className="text-xs text-[#b8a898]">completed {ago(r.completedAt)}</span>
                    <button
                      onClick={() => deleteReview(r.id, true)}
                      className="ml-auto p-1 rounded hover:bg-[#1a2b4a]/10"
                      aria-label="Delete"
                    >
                      <X className="w-3.5 h-3.5 text-[#b8a898]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Planning Session modal */}
      {sessionOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-[#111d33] rounded-2xl shadow-2xl w-full max-w-md my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2b4a]/10">
              <h2 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">New Planning Session</h2>
              <button onClick={() => setSessionOpen(false)} aria-label="Close">
                <X className="w-5 h-5 text-[#b8a898]" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Q3 Marketing Review"
                className="w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={draft.sectionKey}
                  onChange={(e) => setDraft({ ...draft, sectionKey: e.target.value })}
                  className="h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                >
                  {SECTIONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={draft.scheduledFor}
                  onChange={(e) => setDraft({ ...draft, scheduledFor: e.target.value })}
                  className="h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                />
                <input
                  type="time"
                  value={draft.scheduledTime}
                  onChange={(e) => setDraft({ ...draft, scheduledTime: e.target.value })}
                  title="Time for the calendar event"
                  className="h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                />
              </div>
              <p className="text-[11px] text-[#b8a898]">
                With a date set, this is added to your connected calendar on that day.
              </p>
              <textarea
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                rows={2}
                placeholder="Agenda / notes (optional)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setSessionOpen(false)}
                  className="text-sm font-medium px-4 py-2 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSession}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanRollupCard({
  icon,
  title,
  description,
  href,
  status,
  updatedAt,
  metric,
  hideUpdated,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  status: string;
  updatedAt: string | null;
  metric: string;
  hideUpdated?: boolean;
}) {
  const badge = STATUS_BADGE[status] || STATUS_BADGE.not_started;
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-5 hover:border-[#2E7C83]/50 hover:shadow-md transition block"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[#2E7C83]/10 text-[#2E7C83] flex items-center justify-center">{icon}</div>
          <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{title}</h3>
        </div>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ color: badge.color, backgroundColor: badge.bg }}
        >
          {badge.label}
        </span>
      </div>
      <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf] mb-3">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{metric}</span>
        <span className="flex items-center gap-1 text-xs text-[#b8a898]">
          {!hideUpdated && <>Updated {ago(updatedAt)}</>}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
