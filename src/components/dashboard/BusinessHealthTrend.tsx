"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#1F315B" }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Current Score"
                stroke="#5E3B6C"
                strokeWidth={2}
                dot={{ fill: "#5E3B6C", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#D4AF63" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#5E3B6C]" />
            <span className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
              Current Score
            </span>
          </div>
        </div>

        {/* Current score indicator */}
        <div className="mt-4 text-center">
          <span className="text-2xl font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
            68
          </span>
          <span className="text-sm text-[#B9A9A9] ml-1">current</span>
        </div>
      </CardContent>
    </Card>
  );
}
