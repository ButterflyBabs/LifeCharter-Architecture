"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { FinanceOverview } from "@/lib/finance/overview";
import { useMoney, otherText, type OtherBlock } from "@/components/finance/money";
const niceDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

type Variant = "pulse" | "expenses" | "income" | "bills" | "budget" | "tax" | "tech" | "reports";
type Item = { href: string; label: string; value: string; note?: string; warn?: boolean };

// Amounts are the home currency (the overview counts only those); the other currency's money, when there is any,
// is added to the note as its own amount.
function itemsFor(v: Variant, o: FinanceOverview, usd: (n: number) => string, alsoText: (path: string, signed?: boolean) => string | null): Item[] {
  const also = (note: string | undefined, path: string, signed?: boolean) => {
    const t = alsoText(path, signed);
    return t ? [note, `${t} kept separate`].filter(Boolean).join(" · ") : note;
  };
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
    note: also(o.bills.next14.length ? o.bills.next14.slice(0, 3).map((b) => `${b.name} ${niceDate(b.date)}`).join(" · ") : undefined, o.bills.overdueCount ? "bills.overdueTotal" : "bills.next7Total"),
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
    note: also(`${usd(o.month.income)} in · ${usd(o.month.expense)} out`, "month.net", true),
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
  const { home, money } = useMoney();
  if (!overview) return null;
  const other = (overview as { other?: OtherBlock }).other;
  const items = itemsFor(variant, overview, (n) => money(n), (path, signed) => otherText(other, home, [path, path.replace(/^month\./, "mtd.")], { signed }));
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
