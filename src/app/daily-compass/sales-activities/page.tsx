"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Presentation,
  FileText,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Pencil,
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  Download,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";
import { ACTIVITY_TYPES, OUTCOMES, PRIORITIES, typeLabel, outcomeLabel } from "@/lib/salesActivities";

interface Activity {
  id: string;
  type: string;
  contactName: string;
  contactCompany: string;
  title: string;
  priority: string;
  status: string;
  outcome: string;
  estimatedValue: number;
  occurredOn: string | null;
  notes: string;
}

interface Aggregates {
  total: number;
  openCount: number;
  completedCount: number;
  byType: Record<string, number>;
  byOutcome: Record<string, number>;
  thisWeekByType: Record<string, number>;
  pipelineValue: number;
  wonValue: number;
  wonCount: number;
  conversionRate: number;
  weekStart: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  call: <Phone className="w-4 h-4" />,
  followup: <MessageSquare className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  dm: <MessageSquare className="w-4 h-4" />,
  meeting: <Users className="w-4 h-4" />,
  demo: <Presentation className="w-4 h-4" />,
  proposal: <FileText className="w-4 h-4" />,
};

const PRIORITY_META: Record<string, string> = {
  hot: "bg-[#f6dcdc] text-[#8a2f2f]",
  warm: "bg-[#f4e6c9] text-[#8a6a15]",
  cold: "bg-[#d3ebee] text-[#1c5a60]",
};

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
const todayStr = () => new Date().toISOString().slice(0, 10);

const EMPTY = {
  id: null as string | null,
  type: "call",
  contactName: "",
  contactCompany: "",
  title: "",
  priority: "warm",
  status: "open",
  outcome: "",
  estimatedValue: "",
  occurredOn: todayStr(),
  notes: "",
};

export default function SalesActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [agg, setAgg] = useState<Aggregates | null>(null);
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  // Reporting.
  const [reportOpen, setReportOpen] = useState(false);
  const [range, setRange] = useState({ from: "", to: "" });
  const [reportBusy, setReportBusy] = useState(false);
  const [report, setReport] = useState<{ summary: string; insights: { title: string; detail: string }[]; needsKey?: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/sales-activities");
      const d = await res.json().catch(() => ({}));
      if (Array.isArray(d.activities)) setActivities(d.activities);
      if (d.aggregates) setAgg(d.aggregates);
      if (d.goals) setGoals(d.goals);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = activities.filter((a) => {
    if (filter === "open") return a.status !== "completed";
    if (filter === "completed") return a.status === "completed";
    if (filter === "all") return true;
    return a.type === filter;
  });

  const toggle = async (a: Activity) => {
    const next = a.status === "completed" ? "open" : "completed";
    setActivities((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: next } : x)));
    await fetch("/api/sales-activities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, action: "toggle" }),
    });
    load();
  };

  const setOutcome = async (a: Activity, outcome: string) => {
    setActivities((prev) => prev.map((x) => (x.id === a.id ? { ...x, outcome } : x)));
    await fetch("/api/sales-activities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, outcome }),
    });
    load();
  };

  const remove = async (id: string) => {
    setActivities((prev) => prev.filter((x) => x.id !== id));
    await fetch(`/api/sales-activities?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    load();
  };

  const openNew = () => {
    setForm({ ...EMPTY, occurredOn: todayStr() });
    setEditorOpen(true);
  };
  const openEdit = (a: Activity) => {
    setForm({
      id: a.id,
      type: a.type,
      contactName: a.contactName,
      contactCompany: a.contactCompany,
      title: a.title,
      priority: a.priority,
      status: a.status,
      outcome: a.outcome,
      estimatedValue: a.estimatedValue ? String(a.estimatedValue) : "",
      occurredOn: a.occurredOn || todayStr(),
      notes: a.notes,
    });
    setEditorOpen(true);
  };

  const save = async () => {
    if (!form.contactName.trim() && !form.title.trim()) return;
    setSaving(true);
    const payload = { ...form, estimatedValue: Number(form.estimatedValue) || 0 };
    try {
      if (form.id) {
        await fetch("/api/sales-activities", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload }),
        });
      } else {
        await fetch("/api/sales-activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setEditorOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const setGoal = async (type: string, target: number) => {
    setGoals((g) => ({ ...g, [type]: target }));
    await fetch("/api/sales-activities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "goal", activityType: type, weeklyTarget: target }),
    });
  };

  const runReport = async () => {
    setReportBusy(true);
    setReport(null);
    try {
      const qs = new URLSearchParams();
      if (range.from) qs.set("from", range.from);
      if (range.to) qs.set("to", range.to);
      const res = await fetch(`/api/sales-activities/report?${qs.toString()}`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      setReport({ summary: d.summary || "No summary.", insights: Array.isArray(d.insights) ? d.insights : [], needsKey: d.needsKey });
    } catch {
      setReport({ summary: "Couldn't generate the report — try again.", insights: [] });
    } finally {
      setReportBusy(false);
    }
  };

  const csvHref = () => {
    const qs = new URLSearchParams();
    if (range.from) qs.set("from", range.from);
    if (range.to) qs.set("to", range.to);
    return `/api/sales-activities/report?${qs.toString()}`;
  };

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <Link href="/daily-compass" className="inline-flex items-center gap-1.5 text-sm text-[#2E7C83] hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Daily Compass
      </Link>

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7b6b8d] to-[#2E7C83] flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Sales Activities</h1>
            <p className="text-[#b8a898]">Log every touch — see it aggregated and reported.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-xl border border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
          >
            <BarChart3 className="w-4 h-4" /> Report
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-xl bg-[#2E7C83] text-white hover:bg-[#256b71]"
          >
            <Plus className="w-4 h-4" /> Log activity
          </button>
        </div>
      </div>

      {/* Aggregate tiles */}
      {agg && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Tile icon={<Target className="w-4 h-4" />} label="Activities" value={String(agg.total)} sub={`${agg.openCount} open`} />
          <Tile icon={<DollarSign className="w-4 h-4" />} label="Pipeline" value={usd(agg.pipelineValue)} sub="open value" />
          <Tile icon={<CheckCircle2 className="w-4 h-4" />} label="Won" value={usd(agg.wonValue)} sub={`${agg.wonCount} deals`} />
          <Tile icon={<TrendingUp className="w-4 h-4" />} label="Conversion" value={`${agg.conversionRate}%`} sub="won / contacted" />
        </div>
      )}

      {/* This week vs goals */}
      {agg && (
        <div className="mb-6 rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-[#2E7C83]" />
            <h2 className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">This week vs. goals</h2>
            <span className="text-xs text-[#b8a898]">(week of {agg.weekStart})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {ACTIVITY_TYPES.map((t) => {
              const done = agg.thisWeekByType[t.id] || 0;
              const goal = goals[t.id] || 0;
              const pct = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0;
              return (
                <div key={t.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-[#1a2b4a] dark:text-[#F8F5F0]">
                      {TYPE_ICON[t.id]} {t.label}
                    </span>
                    <span className="text-[#7a8a99]">
                      {done}
                      {" / "}
                      <input
                        type="number"
                        min={0}
                        value={goal || ""}
                        onChange={(e) => setGoal(t.id, Math.max(0, Number(e.target.value) || 0))}
                        placeholder="0"
                        className="w-10 text-center bg-transparent border-b border-[#1a2b4a]/20 focus:outline-none focus:border-[#2E7C83]"
                      />
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1a2b4a]/8 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#4a9b9b] to-[#2E7C83]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Report panel */}
      {reportOpen && (
        <div className="mb-6 rounded-2xl border border-[#2E7C83]/25 bg-[#F1F7F7] dark:bg-[#12303a] p-4">
          <h2 className="text-sm font-semibold text-[#12303a] dark:text-[#F8F5F0] mb-3">Activity report</h2>
          <div className="flex flex-wrap items-end gap-3 mb-3">
            <div>
              <label className="block text-xs text-[#7a8a99] mb-1">From</label>
              <input
                type="date"
                value={range.from}
                onChange={(e) => setRange({ ...range, from: e.target.value })}
                className="h-9 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#7a8a99] mb-1">To</label>
              <input
                type="date"
                value={range.to}
                onChange={(e) => setRange({ ...range, to: e.target.value })}
                className="h-9 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
              />
            </div>
            <button
              onClick={runReport}
              disabled={reportBusy}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 h-9 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
            >
              {reportBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI summary
            </button>
            <a
              href={csvHref()}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 h-9 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
            >
              <Download className="w-4 h-4" /> CSV
            </a>
          </div>
          <p className="text-[11px] text-[#7a8a99] mb-2">Leave dates blank for all-time.</p>
          {report && (
            <div className="rounded-xl bg-white dark:bg-[#0f2530] border border-[#1a2b4a]/10 p-3">
              {report.needsKey && (
                <p className="text-xs text-[#8a6a15] mb-2">Connect your AI key in settings for a written summary. Showing the raw stats:</p>
              )}
              <p className="text-sm text-[#12303a] dark:text-[#F8F5F0] leading-relaxed">{report.summary}</p>
              {report.insights.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {report.insights.map((ins, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{ins.title}: </span>
                      <span className="text-[#3a3630] dark:text-[#d8d2c8]">{ins.detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "open", "completed", ...ACTIVITY_TYPES.map((t) => t.id)].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize ${
              filter === f
                ? "bg-[#2E7C83] text-white border-[#2E7C83]"
                : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
            }`}
          >
            {f === "all" || f === "open" || f === "completed" ? f : typeLabel(f)}
          </button>
        ))}
      </div>

      {/* Activity list */}
      {!loaded ? (
        <p className="text-sm text-[#b8a898]">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[#b8a898]">No activities here yet. Hit <strong>Log activity</strong> to start tracking.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const done = a.status === "completed";
            return (
              <Card key={a.id}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggle(a)} className="mt-0.5 flex-shrink-0" aria-label="Toggle complete">
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-[#2c6b3f]" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#b8a898] hover:text-[#2E7C83]" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#2E7C83]/10 text-[#2E7C83]">
                          {TYPE_ICON[a.type]} {typeLabel(a.type)}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${PRIORITY_META[a.priority] || PRIORITY_META.warm}`}>
                          {a.priority}
                        </span>
                        {a.estimatedValue > 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#c9a227]/15 text-[#8a6a15]">
                            {usd(a.estimatedValue)}
                          </span>
                        )}
                        {a.occurredOn && <span className="text-[11px] text-[#b8a898]">{a.occurredOn}</span>}
                      </div>
                      <p className={`mt-1 font-medium ${done ? "line-through text-[#b8a898]" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                        {a.contactName}
                        {a.contactCompany ? ` · ${a.contactCompany}` : ""}
                      </p>
                      {a.title && <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf]">{a.title}</p>}
                      {a.notes && <p className="text-xs text-[#b8a898] mt-1">{a.notes}</p>}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <select
                          value={a.outcome}
                          onChange={(e) => setOutcome(a, e.target.value)}
                          className="h-8 px-2 text-xs rounded-lg border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                        >
                          {OUTCOMES.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.id === "" ? "Set outcome" : outcomeLabel(o.id)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => openEdit(a)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => remove(a.id)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-[#8a2f2f]/25 text-[#8a2f2f] hover:bg-[#8a2f2f]/5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Log / edit modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-[#111d33] rounded-2xl shadow-2xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2b4a]/10">
              <h2 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{form.id ? "Edit activity" : "Log activity"}</h2>
              <button onClick={() => setEditorOpen(false)} aria-label="Close">
                <X className="w-5 h-5 text-[#b8a898]" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[#7a8a99] mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#7a8a99] mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] capitalize"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder="Contact name"
                  className="w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                />
                <input
                  value={form.contactCompany}
                  onChange={(e) => setForm({ ...form, contactCompany: e.target.value })}
                  placeholder="Company (optional)"
                  className="w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                />
              </div>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What is this about?"
                className="w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-[#7a8a99] mb-1">Date</label>
                  <input
                    type="date"
                    value={form.occurredOn}
                    onChange={(e) => setForm({ ...form, occurredOn: e.target.value })}
                    className="w-full h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#7a8a99] mb-1">Value ($)</label>
                  <input
                    type="number"
                    value={form.estimatedValue}
                    onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
                    placeholder="0"
                    className="w-full h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#7a8a99] mb-1">Outcome</label>
                  <select
                    value={form.outcome}
                    onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                    className="w-full h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  >
                    {OUTCOMES.map((o) => (
                      <option key={o.id} value={o.id}>{o.id === "" ? "—" : outcomeLabel(o.id)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Notes (optional)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditorOpen(false)}
                  className="text-sm font-medium px-4 py-2 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/30 p-3">
      <div className="flex items-center gap-1.5 text-[#2E7C83]">
        {icon}
        <span className="text-xs text-[#7a8a99]">{label}</span>
      </div>
      <p className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mt-1">{value}</p>
      <p className="text-[11px] text-[#b8a898]">{sub}</p>
    </div>
  );
}
