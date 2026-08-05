"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with recharts
const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });

function ChartSkeleton() {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <div className="w-full h-1 bg-[#e8e4f0]/30 rounded-full overflow-hidden">
        <div className="w-1/3 h-full bg-[#1a2b4a] animate-pulse" />
      </div>
    </div>
  );
}

interface HistoryPoint {
  at: string;
  overall: number | null;
}
interface Pt {
  date: string;
  score: number;
}

function fmt(at: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function BusinessHealthTrend() {
  const [data, setData] = useState<Pt[] | null>(null);

  useEffect(() => {
    fetch("/api/progress?ts=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const hist = (d?.history ?? []) as HistoryPoint[];
        setData(
          hist
            .filter((p) => p.overall !== null && p.overall !== undefined)
            .map((p) => ({ date: fmt(p.at), score: p.overall as number }))
        );
      })
      .catch(() => setData([]));
  }, []);

  const enough = data && data.length >= 2;

  return (
    <Card className="h-full border-[#c9a227]/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Business Health Trend</CardTitle>
        <Link
          href="/progress"
          className="px-3 py-1.5 rounded-lg bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10 text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/10 transition-colors"
        >
          View progress
        </Link>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="h-[200px]">
          {data === null ? (
            <ChartSkeleton />
          ) : !enough ? (
            <div className="h-full flex items-center justify-center text-center px-4">
              <p className="text-xs text-[#b8a898]">
                Your trend builds as you complete check-ins. Once there are a couple of dated
                points, the line appears here.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  dataKey="score"
                  stroke="#7b6b8d"
                  strokeWidth={2}
                  dot={{ fill: "#7b6b8d", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "#c9a227" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
