"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { DIMENSION_LABEL } from "@/lib/scoring/dimensionModel";

// Dynamic recharts imports to avoid SSR issues (matches the app's pattern).
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false, loading: () => <Skeleton /> });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ReferenceDot = dynamic(() => import("recharts").then((m) => m.ReferenceDot), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

function Skeleton() {
  return (
    <div className="h-[240px] flex items-center justify-center">
      <div className="w-full h-1 bg-[#e8e4f0]/30 rounded-full overflow-hidden">
        <div className="w-1/3 h-full bg-[#1a2b4a] animate-pulse" />
      </div>
    </div>
  );
}

interface HistoryPoint {
  at: string;
  type: string;
  overall: number | null;
  domains: Record<string, number>;
}

function fmt(at: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ProgressTrend({ history }: { history: HistoryPoint[] }) {
  const [dimension, setDimension] = useState<string>("overall");

  // Dimensions available across the history (union of all domain keys).
  const dims = useMemo(() => {
    const keys = new Set<string>();
    for (const p of history) for (const k of Object.keys(p.domains ?? {})) keys.add(k);
    return Array.from(keys);
  }, [history]);

  const series = useMemo(
    () =>
      history.map((p, i) => ({
        idx: i,
        date: fmt(p.at),
        type: p.type,
        value: dimension === "overall" ? p.overall : p.domains?.[dimension] ?? null,
      })),
    [history, dimension]
  );

  const points = series.filter((s) => s.value !== null && s.value !== undefined);
  const baselineIdx = series.find((s) => s.type === "baseline")?.idx;
  const baselinePoint = points.find((s) => s.idx === baselineIdx);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200/70 dark:border-[#c9a227]/20 bg-white dark:bg-[#1A1A2E] p-6 mb-8">
        <p className="text-sm text-[#b8a898]">
          Your trend line builds as you complete check-ins. Once there are a few dated points, it
          appears here.
        </p>
      </div>
    );
  }

  const label = dimension === "overall" ? "Overall" : (DIMENSION_LABEL as Record<string, string>)[dimension] ?? dimension;

  return (
    <div className="rounded-2xl border border-gray-200/70 dark:border-[#c9a227]/20 bg-white dark:bg-[#1A1A2E] p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7C7C82]">
          Trend — {label}
        </h2>
        <select
          value={dimension}
          onChange={(e) => setDimension(e.target.value)}
          className="text-xs rounded-lg border border-gray-200 dark:border-[#c9a227]/30 bg-transparent px-2 py-1.5 text-[#1a2b4a] dark:text-[#F8F5F0]"
        >
          <option value="overall">Overall</option>
          {dims.map((k) => (
            <option key={k} value={k}>
              {(DIMENSION_LABEL as Record<string, string>)[k] ?? k}
            </option>
          ))}
        </select>
      </div>

      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e4f0" strokeOpacity={0.3} vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#7b6b8d", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "#7b6b8d", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#F8F5F0", border: "1px solid #c9a227", borderRadius: "8px" }}
              labelStyle={{ color: "#1a2b4a" }}
              itemStyle={{ color: "#7b6b8d" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              name={label}
              stroke="#2E7C83"
              strokeWidth={2}
              dot={{ fill: "#2E7C83", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: "#c9a227" }}
            />
            {baselinePoint && (
              <ReferenceDot
                x={baselinePoint.date}
                y={baselinePoint.value as number}
                r={5}
                fill="#c9a227"
                stroke="#1a2b4a"
                strokeWidth={1}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] text-[#b8a898]">
        Gold marker = your baseline. Each point is a recorded check-in or recompute.
      </p>
    </div>
  );
}
