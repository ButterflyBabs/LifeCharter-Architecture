"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";

interface SegmentRow {
  id: number;
  name: string;
  color: string | null;
  thisMonth: number;
  target: number;
  lastMonth: number;
}
interface BusinessRow {
  id: number;
  name: string;
  color: string | null;
  thisMonth: number;
  target: number;
  segments: SegmentRow[];
}
interface RevenueData {
  thisMonthTotal: number;
  lastMonthTotal: number;
  changePct: number | null;
  businesses: BusinessRow[];
}

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

interface SegmentOption {
  id: number;
  name: string;
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [segments, setSegments] = useState<SegmentOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [segmentId, setSegmentId] = useState("");
  const [month, setMonth] = useState("");
  const [actual, setActual] = useState("");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = () =>
    fetch("/api/revenue-by-segment")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d ?? { thisMonthTotal: 0, lastMonthTotal: 0, changePct: null, businesses: [] }))
      .catch(() => setData({ thisMonthTotal: 0, lastMonthTotal: 0, changePct: null, businesses: [] }));

  useEffect(() => {
    loadData();
    fetch("/api/segments")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const opts: SegmentOption[] = [];
        for (const b of d?.businesses ?? []) {
          for (const s of b.segments ?? []) opts.push({ id: s.id, name: `${b.name} — ${s.name}` });
        }
        setSegments(opts);
      })
      .catch(() => {});
  }, []);

  const submitRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segmentId || !month) return;
    setSaving(true);
    const [y, m] = month.split("-").map(Number);
    const periodStart = `${month}-01`;
    const periodEnd = new Date(y, m, 0).toISOString().slice(0, 10); // last day of month
    await fetch("/api/revenue-by-segment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        segmentId: Number(segmentId),
        periodStart,
        periodEnd,
        revenueActual: actual ? Number(actual) : null,
        revenueTarget: target ? Number(target) : null,
      }),
    }).catch(() => {});
    setActual("");
    setTarget("");
    setSaving(false);
    setShowForm(false);
    loadData();
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to Executive Home
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl lg:text-5xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">
          Revenue by Segment
        </h1>
        <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">
          This month&apos;s revenue across every business and segment.
        </p>
      </div>

      {/* Add revenue */}
      <div className="mb-6">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a2b4a] text-white rounded-lg text-sm hover:bg-[#1a2b4a]/90"
          >
            <Plus className="w-4 h-4" /> Record revenue
          </button>
        ) : (
          <form
            onSubmit={submitRevenue}
            className="bg-white dark:bg-[#1A1A2E] rounded-2xl border border-gray-200/60 dark:border-[#c9a227]/20 shadow-sm p-5 flex flex-wrap items-end gap-3"
          >
            <label className="text-sm flex flex-col gap-1">
              <span className="text-[#7b6b8d]">Segment</span>
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                required
                className="px-3 py-2 bg-[#F8F5F0] dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm min-w-[220px]"
              >
                <option value="">Select…</option>
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm flex flex-col gap-1">
              <span className="text-[#7b6b8d]">Month</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                className="px-3 py-2 bg-[#F8F5F0] dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm"
              />
            </label>
            <label className="text-sm flex flex-col gap-1">
              <span className="text-[#7b6b8d]">Actual ($)</span>
              <input
                type="number"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                placeholder="0"
                className="w-28 px-3 py-2 bg-[#F8F5F0] dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm"
              />
            </label>
            <label className="text-sm flex flex-col gap-1">
              <span className="text-[#7b6b8d]">Target ($)</span>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0"
                className="w-28 px-3 py-2 bg-[#F8F5F0] dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={saving || !segmentId || !month}
              className="px-4 py-2 bg-[#1a2b4a] text-white rounded-lg text-sm hover:bg-[#1a2b4a]/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {data === null ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : data.businesses.length === 0 ? (
        <p className="text-sm text-gray-400">
          No revenue recorded yet. Use &ldquo;Record revenue&rdquo; above to add your first entry.
        </p>
      ) : (
        <>
          {/* Total */}
          <div className="bg-white dark:bg-[#1A1A2E] rounded-2xl border border-gray-200/60 dark:border-[#c9a227]/20 shadow-sm p-6 mb-6">
            <p className="text-sm text-gray-500">This month</p>
            <p className="text-4xl font-serif text-[#c9a227]">{currency(data.thisMonthTotal)}</p>
            {data.changePct !== null && (
              <p className="text-sm text-gray-600 mt-1">
                <span className={data.changePct >= 0 ? "text-[#2E7C83] font-medium" : "text-[#D83A34] font-medium"}>
                  {data.changePct >= 0 ? "+" : ""}
                  {data.changePct}%
                </span>{" "}
                vs last month ({currency(data.lastMonthTotal)})
              </p>
            )}
          </div>

          {/* Per business */}
          <div className="space-y-6">
            {data.businesses.map((biz) => (
              <div
                key={biz.id}
                className="bg-white dark:bg-[#1A1A2E] rounded-2xl border border-gray-200/60 dark:border-[#c9a227]/20 shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-8 rounded-full" style={{ backgroundColor: biz.color ?? "#1a2b4a" }} />
                    <h2 className="text-xl font-serif font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{biz.name}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-serif text-[#c9a227]">{currency(biz.thisMonth)}</p>
                    {biz.target > 0 && <p className="text-xs text-gray-500">of {currency(biz.target)} target</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  {biz.segments.map((seg) => {
                    const pct = seg.target > 0 ? Math.min(100, Math.round((seg.thisMonth / seg.target) * 100)) : null;
                    return (
                      <div key={seg.id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-[#3F4654] dark:text-[#e8e4f0]">{seg.name}</span>
                          <span className="text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">
                            {currency(seg.thisMonth)}
                            {seg.target > 0 && <span className="text-gray-400 font-normal"> / {currency(seg.target)}</span>}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct ?? (seg.thisMonth > 0 ? 100 : 0)}%`,
                              backgroundColor: seg.color ?? "#2E7C83",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
