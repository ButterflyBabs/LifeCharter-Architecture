/**
 * Finance Page
 * Simple revenue and expense tracking for solo-preneurs
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  PieChart,
  Calendar,
  Plus,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

export default function FinancePage() {
  const [currentMonth, setCurrentMonth] = useState({
    revenue: "",
    expenses: "",
  });

  // Demo historical data
  const [historicalData] = useState<MonthlyData[]>([
    { month: "Mar 2026", revenue: 7200, expenses: 4800, profit: 2400, margin: 33 },
    { month: "Apr 2026", revenue: 8100, expenses: 5200, profit: 2900, margin: 36 },
    { month: "May 2026", revenue: 7800, expenses: 5100, profit: 2700, margin: 35 },
    { month: "Jun 2026", revenue: 8500, expenses: 5500, profit: 3000, margin: 35 },
  ]);

  const currentRevenue = parseFloat(currentMonth.revenue) || 0;
  const currentExpenses = parseFloat(currentMonth.expenses) || 0;
  const currentProfit = currentRevenue - currentExpenses;
  const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;

  const avgRevenue = historicalData.reduce((sum, m) => sum + m.revenue, 0) / historicalData.length;
  const totalProfit = historicalData.reduce((sum, m) => sum + m.profit, 0) + currentProfit;
  const avgMargin = historicalData.reduce((sum, m) => sum + m.margin, 0) / historicalData.length;

  const handleSave = () => {
    // Save to database
    console.log("Saving:", { revenue: currentRevenue, expenses: currentExpenses });
  };

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-2">
          Finance
        </h1>
        <p className="text-[#B9A9A9]">
          Track revenue, expenses, and profitability
        </p>
      </div>

      {/* Current Month Input */}
      <Card className="mb-8 border-[#D4AF63]/20">
        <CardHeader>
          <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4AF63]" />
            July 2026 - Enter Your Numbers
          </h2>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
                Revenue (Money In)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9A9A9]">$</span>
                <Input
                  type="number"
                  value={currentMonth.revenue}
                  onChange={(e) => setCurrentMonth({ ...currentMonth, revenue: e.target.value })}
                  placeholder="0"
                  className="pl-8 text-lg"
                />
              </div>
              <p className="text-xs text-[#B9A9A9] mt-1">
                All money received this month
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
                Expenses (Money Out)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9A9A9]">$</span>
                <Input
                  type="number"
                  value={currentMonth.expenses}
                  onChange={(e) => setCurrentMonth({ ...currentMonth, expenses: e.target.value })}
                  placeholder="0"
                  className="pl-8 text-lg"
                />
              </div>
              <p className="text-xs text-[#B9A9A9] mt-1">
                All costs, subscriptions, contractor payments
              </p>
            </div>
          </div>

          {/* Live Calculation */}
          {(currentRevenue > 0 || currentExpenses > 0) && (
            <div className="mt-6 p-4 bg-[#1F315B]/5 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-[#B9A9A9]">Revenue</p>
                  <p className="text-xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                    ${currentRevenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#B9A9A9]">Expenses</p>
                  <p className="text-xl font-bold text-red-500">
                    ${currentExpenses.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#B9A9A9]">Profit</p>
                  <p className={`text-xl font-bold ${currentProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${currentProfit.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-[#B9A9A9]">
                  Profit Margin: <span className="font-bold text-[#1F315B] dark:text-[#F6F1E8]">{currentMargin.toFixed(1)}%</span>
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button onClick={handleSave}>
              <Plus className="w-4 h-4 mr-2" />
              Save July Data
            </Button>
            <Link href="/finance/monthly-review">
              <Button variant="outline">
                Complete Monthly Review
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#B9A9A9]">Avg Monthly Revenue</span>
              <DollarSign className="w-5 h-5 text-[#D4AF63]" />
            </div>
            <p className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              ${avgRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#B9A9A9]">Total Profit (4 mo)</span>
              <Wallet className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">
              ${totalProfit.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#B9A9A9]">Avg Profit Margin</span>
              <PieChart className="w-5 h-5 text-[#2E7C83]" />
            </div>
            <p className="text-2xl font-bold text-[#2E7C83]">
              {avgMargin.toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#B9A9A9]">Trend</span>
              {avgRevenue > 7500 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className={`text-2xl font-bold ${avgRevenue > 7500 ? 'text-green-500' : 'text-red-500'}`}>
              {avgRevenue > 7500 ? '↑' : '↓'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Historical Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
            Recent History
          </h2>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1F315B]/10">
                  <th className="text-left py-3 text-sm font-medium text-[#B9A9A9]">Month</th>
                  <th className="text-right py-3 text-sm font-medium text-[#B9A9A9]">Revenue</th>
                  <th className="text-right py-3 text-sm font-medium text-[#B9A9A9]">Expenses</th>
                  <th className="text-right py-3 text-sm font-medium text-[#B9A9A9]">Profit</th>
                  <th className="text-right py-3 text-sm font-medium text-[#B9A9A9]">Margin</th>
                </tr>
              </thead>
              <tbody>
                {historicalData.map((month, index) => (
                  <tr key={index} className="border-b border-[#1F315B]/5">
                    <td className="py-3 text-[#1F315B] dark:text-[#F6F1E8]">{month.month}</td>
                    <td className="py-3 text-right text-[#1F315B] dark:text-[#F6F1E8]">
                      ${month.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-red-500">
                      ${month.expenses.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-green-500">
                      ${month.profit.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-[#1F315B] dark:text-[#F6F1E8]">
                      {month.margin}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
