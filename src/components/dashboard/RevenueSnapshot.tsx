"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Target } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with recharts
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((mod) => mod.Bar),
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
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

const revenueData = [
  { month: "Jan", revenue: 28000 },
  { month: "Feb", revenue: 32000 },
  { month: "Mar", revenue: 35000 },
  { month: "Apr", revenue: 38450 },
];

const kpis = [
  {
    label: "Monthly Revenue",
    value: "$38,450",
    change: "+12%",
    trend: "up",
    icon: DollarSign,
  },
  {
    label: "Active Clients",
    value: "24",
    change: "+3",
    trend: "up",
    icon: Users,
  },
  {
    label: "Avg Deal Size",
    value: "$4,200",
    change: "-5%",
    trend: "down",
    icon: ShoppingCart,
  },
  {
    label: "Conversion Rate",
    value: "18%",
    change: "+2%",
    trend: "up",
    icon: Target,
  },
];

export function RevenueSnapshot() {
  return (
    <Card className="h-full border-[#D4AF63]/30">
      <CardHeader>
        <CardTitle>Revenue Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            const TrendIcon = kpi.trend === "up" ? TrendingUp : TrendingDown;
            return (
              <div
                key={kpi.label}
                className="p-3 rounded-xl bg-[#1F315B]/5 dark:bg-[#CDBED6]/10"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-[#5E3B6C] dark:text-[#CDBED6]" />
                  <span className="text-xs text-[#B9A9A9]">{kpi.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                    {kpi.value}
                  </span>
                  <span
                    className={`text-xs flex items-center gap-0.5 ${
                      kpi.trend === "up"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    <TrendIcon className="w-3 h-3" />
                    {kpi.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue Chart */}
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
                }}
                labelStyle={{ color: "#1F315B" }}
                itemStyle={{ color: "#5E3B6C" }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
              />
              <Bar
                dataKey="revenue"
                fill="#5E3B6C"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
