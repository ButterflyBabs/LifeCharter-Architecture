"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface RevenueData {
  month: string;
  revenue: number;
  profit: number;
}

interface RevenueSnapshotProps {
  revenue?: number;
  profit?: number;
  profitMargin?: number;
  changePercent?: number;
  data?: RevenueData[];
}

const defaultData: RevenueData[] = [
  { month: "Jan", revenue: 28000, profit: 8500 },
  { month: "Feb", revenue: 32000, profit: 10200 },
  { month: "Mar", revenue: 35000, profit: 11500 },
  { month: "Apr", revenue: 31000, profit: 9800 },
  { month: "May", revenue: 36000, profit: 12000 },
  { month: "Jun", revenue: 38450, profit: 12760 },
];

export function RevenueSnapshot({
  revenue = 38450,
  profit = 12760,
  profitMargin = 33,
  changePercent = 12,
  data = defaultData,
}: RevenueSnapshotProps) {
  const isPositiveChange = changePercent >= 0;

  return (
    <Card className="h-full border-[#D4AF63]/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Revenue Snapshot</CardTitle>
        <div className="flex items-center gap-1 text-xs">
          {isPositiveChange ? (
            <>
              <TrendingUp className="w-3 h-3 text-[#2E7C83]" />
              <span className="text-[#2E7C83]">+{changePercent}%</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-3 h-3 text-red-500" />
              <span className="text-red-500">{changePercent}%</span>
            </>
          )}
          <span className="text-[#B9A9A9] ml-1">vs last month</span>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-5">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Revenue */}
          <div className="p-4 rounded-xl bg-[#1F315B]/5 dark:bg-[#CDBED6]/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#5E3B6C] flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#F6F1E8]" />
              </div>
              <span className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
                Revenue
              </span>
            </div>
            <p className="text-xl font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              ${revenue.toLocaleString()}
            </p>
            <p className="text-xs text-[#B9A9A9]">Monthly recurring</p>
          </div>

          {/* Profit */}
          <div className="p-4 rounded-xl bg-[#1F315B]/5 dark:bg-[#CDBED6]/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#2E7C83] flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[#F6F1E8]" />
              </div>
              <span className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
                Profit
              </span>
            </div>
            <p className="text-xl font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              ${profit.toLocaleString()}
            </p>
            <p className="text-xs text-[#B9A9A9]">{profitMargin}% margin</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#CDBED6"
                strokeOpacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "#5E3B6C", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#5E3B6C", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#F6F1E8",
                  border: "1px solid #D4AF63",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#1F315B" }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#5E3B6C"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="profit"
                name="Profit"
                fill="#2E7C83"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#5E3B6C]" />
            <span className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
              Revenue
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#2E7C83]" />
            <span className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
              Profit
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
