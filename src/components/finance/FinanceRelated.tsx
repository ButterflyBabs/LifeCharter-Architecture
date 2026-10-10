"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { FinanceOverview } from "@/lib/finance/overview";

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const niceDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

type Variant = "pulse" | "expenses" | "income" | "bills" | "budget" | "tax" | "tech" | "reports";
type Item = { href: string; label: string; value: string; note?: string; warn?: boolean };

function itemsFor(v: Variant, o: FinanceOverview): Item[] {
  const bills: Item = {
    href: "/finance/bills",
    label: "Bills coming up",
    value: o.bills.overdueCount
      ? `${o.bills.overdueCount} overdue (${usd(o.bills.overdueTotal)})`
      : o.bills.next7Count
        ? `${usd(o.bills.next7Total)} due in 7 days`
        : o.bills.count
          ? "Nothing due this week"
          : "No bills tracked yet",
    note: o.bills.next14.length ? o.bills.next14.slice(0, 3).map((b) => `${b.name} ${niceDate(b.date)}`).join(" · ") : undefined,
    warn: o.bills.overdueCount > 0,
  };
  const budget: Item = {
    href: "/finance/budget",
    label: "Budget this month",
    value:
      o.budget.left === null
        ? "No expense budget set"
        : o.budget.left >= 0
          ? `${usd(o.budget.left)} left after bills`
          : `${usd(-o.budget.left)} over once bills are paid`,
    note: o.budget.monthlyExpense ? `${usd(o.budget.spentMtd)} spent + ${usd(o.budget.committed)} still due, of ${usd(o.budget.monthlyExpense)}` : undefined,
    warn: o.budget.left !== null && o.budget.left < 0,
  };
  const tax: Item = {
    href: "/finance/tax",
    label: "Tax set-aside",
    value: `${usd(o.tax.setAside)} at ${o.tax.rate}%`,
    note: o.tax.taxesPaid ? `${usd(o.tax.taxesPaid)} of taxes paid so far` : `${usd(o.tax.perQuarter)} per quarter`,
  };
  const tech: Item = {
    href: "/finance/techstack",
    label: "Software & subscriptions",
    value: o.tech.count ? `${usd(o.tech.monthly)}/mo across ${o.tech.count} tool${o.tech.count === 1 ? "" : "s"}` : "None spotted yet",
  };
  const pulse: Item = {
    href: "/finance/pulse",
    label: "Cash flow this month",
    value: `${o.month.net >= 0 ? "+" : "−"}${usd(Math.abs(o.month.net))} net`,
    note: `${usd(o.month.income)} in · ${usd(o.month.expense)} out`,
    warn: o.month.net < 0,
  };
  switch (v) {
    case "pulse":
      return [bills, budget, tax];
    case "expenses":
      return [budget, bills, tech];
    case "income":
      return [pulse, tax];
    case "bills":
      return [budget, tech, pulse];
    case "budget":
      return [bills, pulse];
    case "tax":
      return [pulse, bills];
    case "tech":
      return [bills, budget];
    case "reports":
      return [tax, budget];
  }
}

/** "Connected to" strip: what the related Finance cards say right now, each one a link. */
export function FinanceRelated({ variant, overview }: { variant: Variant; overview: FinanceOverview | null }) {
  if (!overview) return null;
  const items = itemsFor(variant, overview);
  return (
    <div className="mb-6">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d] mb-2">Connected to</p>
      <div className={`grid grid-cols-1 gap-3 ${items.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {items.map((it) => (
          <Link
            key={it.label}
            href={it.href}
            className="group rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40 p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#7b6b8d]">{it.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#b8a898] group-hover:text-[#1a2b4a]" />
            </div>
            <p className="text-sm font-semibold mt-0.5" style={{ color: it.warn ? "#b06a5a" : "#1a2b4a" }}>
              {it.value}
            </p>
            {it.note && <p className="text-[11px] text-[#b8a898] mt-0.5 truncate">{it.note}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
