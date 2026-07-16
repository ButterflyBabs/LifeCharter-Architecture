"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with recharts
const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const Line = dynamic(
  () => import("recharts").then((mod) => mod.Line),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

// Loading skeleton for chart
function ChartSkeleton() {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <div className="w-full h-1 bg-[#CDBED6]/30 rounded-full overflow-hidden">
        <div className="w-1/3 h-full bg-[#1F315B] animate-pulse" />
      </div>
    </div>
  );
}

const data = [
  { date: "Apr 1", score: 58 },
  { date: "Apr 15", score: 60 },
  { date: "May 1", score: 62 },
  { date: "May 15", score: 63 },
  { date: "May 31", score: 65 },
  { date: "Jun 14", score: 66 },
  { date: "Jun 28", score: 68 },
];

interface BusinessHealthTrendProps {
  period?: string;
}

export function BusinessHealthTrend({ period = "90 Days" }: BusinessHealthTrendProps) {
  return (
    <Card className="h-full border-[#D4AF63]/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Business Health Trend</CardTitle>
        <button className="px-3 py-1.5 rounded-lg bg-[#1F315B]/5 dark:bg-[#CDBED6]/10 text-xs font-medium text-[#1F315B] dark:text-[#F6F1E8] hover:bg-[#1F315B]/10 dark:hover:bg-[#CDBED6]/20 transition-colors">
          {period}
        </button>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#CDBED6"
                strokeOpacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#5E3B6C", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[50, 75]}
                tick={{ fill: "#5E3B6C", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#F6F1E8",
                  border: "1px solid #D4AF63",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#1F315B" }}
                itemStyle={{ color: "#5E3B6C" }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#5E3B6C"
                strokeWidth={2}
                dot={{ fill: "#5E3B6C", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#D4AF63" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
