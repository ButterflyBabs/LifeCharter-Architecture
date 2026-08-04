"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, Flag, Calendar } from "lucide-react";

interface Report {
  summary: string;
  strengths: { area: string; detail: string }[];
  attention: { area: string; detail: string; suggestion: string }[];
  focus: string;
  cadence: string;
  generatedAt?: string;
}
interface StoredReview {
  id: string;
  cadence: string;
  report: Report;
  created_at: string;
}

const CADENCES = [
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "semiannual", label: "Semi-annual" },
  { id: "annual", label: "Annual" },
];

export default function ReviewsPanel({ planType }: { planType: string }) {
  const [history, setHistory] = useState<StoredReview[]>([]);
  const [cadence, setCadence] = useState("quarterly");
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<Report | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/plans/review?type=${planType}`);
    const d = await res.json().catch(() => ({}));
    if (Array.isArray(d.reviews)) setHistory(d.reviews);
  }, [planType]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async () => {
    setBusy(true);
    setErr("");
    setNeedsKey(false);
    setCurrent(null);
    try {
      const res = await fetch("/api/plans/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: planType, cadence }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.needsKey) setNeedsKey(true);
      else if (d.report) {
        setCurrent(d.report);
        load();
      } else setErr(d.error || "Couldn't generate the review.");
    } catch {
      setErr("Couldn't reach the AI.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="rounded-2xl border border-[#2E7C83]/25 bg-[#F1F7F7] dark:bg-[#12303a] p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-[#2E7C83]" />
          <h2 className="text-lg font-semibold text-[#12303a] dark:text-[#F8F5F0]">AI Plan Review</h2>
        </div>
        <p className="text-sm text-[#3a3630] dark:text-[#d8d2c8] mb-3">
          A candid read on how this plan is tracking against your real numbers and goals — strengths to celebrate and
          specific areas that need attention.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={cadence}
            onChange={(e) => setCadence(e.target.value)}
            className="h-9 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
          >
            {CADENCES.map((c) => (
              <option key={c.id} value={c.id}>{c.label} review</option>
            ))}
          </select>
          <button
            onClick={run}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 h-9 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate review
          </button>
        </div>
        {needsKey && <p className="text-xs text-[#8a6a15] mt-2">Connect your AI key in settings to run reviews.</p>}
        {err && <p className="text-xs text-[#8a2f2f] mt-2">{err}</p>}
      </div>

      {current && <ReportCard report={current} highlight />}

      {history.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-[#7a8a99] mb-2">Past reviews</h3>
          <div className="space-y-3">
            {history.map((h) => (
              <ReportCard key={h.id} report={h.report} date={h.created_at} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, highlight, date }: { report: Report; highlight?: boolean; date?: string }) {
  const label = CADENCES.find((c) => c.id === report.cadence)?.label || "";
  return (
    <div
      className={`rounded-2xl border p-5 bg-white dark:bg-[#1a2b4a]/20 ${
        highlight ? "border-[#2E7C83]/50 shadow-md" : "border-[#1a2b4a]/10"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-[#2E7C83]" />
        <span className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{label} review</span>
        {date && <span className="text-xs text-[#b8a898]">{new Date(date).toISOString().slice(0, 10)}</span>}
      </div>
      {report.summary && <p className="text-sm text-[#3a3630] dark:text-[#d8d2c8] mb-3 leading-relaxed">{report.summary}</p>}

      {report.strengths?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2c6b3f] mb-1.5">Celebrate</p>
          <div className="space-y-1.5">
            {report.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#2c6b3f] mt-0.5 flex-shrink-0" />
                <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">
                  <strong>{s.area}:</strong> {s.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.attention?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6a15] mb-1.5">Needs attention</p>
          <div className="space-y-2">
            {report.attention.map((a, i) => (
              <div key={i} className="rounded-lg bg-[#c9a227]/8 p-2.5">
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-[#8a6a15] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[#1a2b4a] dark:text-[#F8F5F0]">
                      <strong>{a.area}:</strong> {a.detail}
                    </p>
                    {a.suggestion && (
                      <p className="text-sm text-[#2c6b3f] mt-1">
                        <strong>Do this:</strong> {a.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.focus && (
        <div className="flex items-start gap-2 text-sm rounded-lg bg-[#2E7C83]/8 p-2.5">
          <Flag className="w-4 h-4 text-[#2E7C83] mt-0.5 flex-shrink-0" />
          <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">
            <strong>Highest-leverage next move:</strong> {report.focus}
          </span>
        </div>
      )}
    </div>
  );
}
