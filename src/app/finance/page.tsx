"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  FileText,
  Receipt,
  Zap,
  ArrowRight,
  Wallet,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { useFinanceOverview } from "@/components/finance/useFinanceOverview";
import type { FinanceOverview } from "@/lib/finance/overview";

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

interface Section {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tint: string;
}

const SECTIONS: Section[] = [
  {
    href: "/finance/income",
    title: "Income Tracker",
    description: "Log and review money coming in, by source",
    icon: <TrendingUp className="w-5 h-5 text-[#2E7C83]" />,
    tint: "#2E7C83",
  },
  {
    href: "/finance/expenses",
    title: "Expense Manager",
    description: "Track spending by category against budget",
    icon: <TrendingDown className="w-5 h-5 text-[#b06a5a]" />,
    tint: "#b06a5a",
  },
  {
    href: "/finance/pulse",
    title: "Cash Flow Dashboard",
    description: "Week, month & year-to-date income, expenses, net",
    icon: <Activity className="w-5 h-5 text-[#c9a227]" />,
    tint: "#c9a227",
  },
  {
    href: "/finance/bills",
    title: "Bills & Cash Calendar",
    description: "What's due to go out, and when",
    icon: <CalendarDays className="w-5 h-5 text-[#b06a5a]" />,
    tint: "#b06a5a",
  },
  {
    href: "/finance/budget",
    title: "Budget Planner",
    description: "Set overall or per-category budgets & targets",
    icon: <PieChart className="w-5 h-5 text-[#7b6b8d]" />,
    tint: "#7b6b8d",
  },
  {
    href: "/finance/pnl",
    title: "Financial Reports",
    description: "P&L for any period · CSV & PDF export",
    icon: <FileText className="w-5 h-5 text-[#1a2b4a]" />,
    tint: "#1a2b4a",
  },
  {
    href: "/finance/tax",
    title: "Tax Preparation",
    description: "Set-aside estimate, deductions & year export",
    icon: <Receipt className="w-5 h-5 text-[#4a9b9b]" />,
    tint: "#4a9b9b",
  },
  {
    href: "/finance/techstack",
    title: "Tech Stack Optimizer",
    description: "Review software & subscription spend",
    icon: <Zap className="w-5 h-5 text-[#c98a27]" />,
    tint: "#c98a27",
  },
];

// One live line per card, drawn from the same ledger, budgets and bills the pages themselves use.
function liveLine(href: string, o: FinanceOverview | null): { text: string; warn?: boolean } | null {
  if (!o) return null;
  switch (href) {
    case "/finance/income":
      return { text: `${usd(o.month.income)} this month · ${usd(o.ytd.income)} year to date` };
    case "/finance/expenses":
      return o.budget.monthlyExpense
        ? { text: `${usd(o.month.expense)} of ${usd(o.budget.monthlyExpense)} budget${o.uncategorizedExpenses ? ` · ${o.uncategorizedExpenses} uncategorized` : ""}`, warn: o.month.expense > o.budget.monthlyExpense }
        : { text: `${usd(o.month.expense)} this month${o.uncategorizedExpenses ? ` · ${o.uncategorizedExpenses} uncategorized` : ""}` };
    case "/finance/pulse":
      return { text: `${o.month.net >= 0 ? "+" : "−"}${usd(Math.abs(o.month.net))} net this month`, warn: o.month.net < 0 };
    case "/finance/bills":
      if (o.bills.overdueCount) return { text: `${o.bills.overdueCount} overdue · ${usd(o.bills.overdueTotal)}`, warn: true };
      if (o.bills.next7Count) return { text: `${usd(o.bills.next7Total)} due in the next 7 days (${o.bills.next7Count})` };
      return { text: o.bills.count ? `${o.bills.count} bills tracked · none due this week` : "No bills tracked yet" };
    case "/finance/budget":
      if (o.budget.left === null) return { text: "No expense budget set yet" };
      return o.budget.left >= 0
        ? { text: `${usd(o.budget.left)} left after bills this month` }
        : { text: `${usd(-o.budget.left)} over once bills are paid`, warn: true };
    case "/finance/pnl":
      return { text: `${o.ytd.net >= 0 ? "+" : "−"}${usd(Math.abs(o.ytd.net))} net so far this year` };
    case "/finance/tax":
      return { text: `About ${usd(o.tax.setAside)} to set aside · ${usd(o.tax.perQuarter)} per quarter` };
    case "/finance/techstack":
      return { text: o.tech.count ? `${usd(o.tech.monthly)}/mo across ${o.tech.count} tool${o.tech.count === 1 ? "" : "s"}` : "No software spend spotted yet" };
    default:
      return null;
  }
}

export default function FinancePage() {
  const { overview } = useFinanceOverview();
  const [health, setHealth] = useState<number | null>(null);
  const [mtd, setMtd] = useState<{ income: number; expense: number; net: number } | null>(null);

  useEffect(() => {
    const tz =
      (typeof window !== "undefined" &&
        (localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone)) ||
      "UTC";
    fetch(`/api/finance/entries?tz=${encodeURIComponent(tz)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setHealth(d.health?.score ?? null);
        if (d.mtd) setMtd(d.mtd);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2E7C83] to-[#c9a227] flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Finance Center</h1>
          <p className="text-[#b8a898]">Your money, in one place</p>
        </div>
      </div>

      {/* Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-[#b8a898] mb-1">Financial health</p>
            <p className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{health ?? "—"}</p>
            <Progress value={health ?? 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-[#2E7C83] mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Income (MTD)</span>
            </div>
            <p className="text-2xl font-bold text-[#2E7C83]">{mtd ? usd(mtd.income) : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-[#b06a5a] mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm">Expenses (MTD)</span>
            </div>
            <p className="text-2xl font-bold text-[#b06a5a]">{mtd ? usd(mtd.expense) : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-[#7b6b8d] mb-1">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Net (MTD)</span>
            </div>
            <p
              className="text-2xl font-bold"
              style={{ color: mtd && mtd.net < 0 ? "#b06a5a" : "#2c6b3f" }}
            >
              {mtd ? `${mtd.net >= 0 ? "+" : "−"}${usd(Math.abs(mtd.net))}` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sections */}
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7b6b8d] mb-3">Finance Sections</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${s.tint}22` }}
                  >
                    {s.icon}
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#b8a898]" />
                </div>
                <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.title}</h3>
                <p className="text-sm text-[#b8a898] mt-1">{s.description}</p>
                {(() => {
                  const live = liveLine(s.href, overview);
                  return live ? (
                    <p className="text-sm font-medium mt-2" style={{ color: live.warn ? "#b06a5a" : s.tint }}>
                      {live.text}
                    </p>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
