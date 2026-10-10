"use client";

import { BudgetSuggest } from "@/components/planning/AssistantPanels";
import { CategoryInput } from "@/components/finance/CategoryInput";
import { MoneyInput } from "@/components/finance/MoneyInput";
import { FinanceRelated } from "@/components/finance/FinanceRelated";
import { useFinanceOverview } from "@/components/finance/useFinanceOverview";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, PieChart, X } from "lucide-react";
import Link from "next/link";

interface Side {
  monthly: number;
  mtdActual: number;
  ytdActual: number;
  mtdBudget: number;
  ytdBudget: number;
  generalMonthly?: number;
  monthKey?: string;
  monthOwn?: boolean;
}
interface CatRow {
  category: string;
  monthly: number;
  mtdActual: number;
  ytdActual: number;
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const tz = () =>
  (typeof window !== "undefined" &&
    (localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone)) ||
  "UTC";

export default function BudgetPlannerPage() {
  const { overview, reload: reloadOverview } = useFinanceOverview();
  const [expense, setExpense] = useState<Side | null>(null);
  const [income, setIncome] = useState<Side | null>(null);
  const [cats, setCats] = useState<CatRow[]>([]);
  const [expInput, setExpInput] = useState("");
  const [incInput, setIncInput] = useState("");
  const [weekInput, setWeekInput] = useState("");
  const [yearInput, setYearInput] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newCatAmt, setNewCatAmt] = useState("");
  const [saving, setSaving] = useState(false);
  const [monthGoals, setMonthGoals] = useState<Record<string, string>>({});
  const [savedMonthGoals, setSavedMonthGoals] = useState<Record<string, number>>({});
  const [monthMsg, setMonthMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/finance/entries?tz=${encodeURIComponent(tz())}`);
    const d = await res.json().catch(() => ({}));
    const b = d.budgetSummary;
    if (b) {
      setExpense(b.expense);
      setIncome(b.income);
      setCats(Array.isArray(b.byCategory) ? b.byCategory : []);
      setExpInput(b.expense?.monthly ? String(b.expense.monthly) : "");
      setIncInput(b.income?.generalMonthly ? String(b.income.generalMonthly) : "");
    }
    const mg = await fetch("/api/finance/month-goals", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ goals: [] }));
    const map: Record<string, number> = {};
    for (const g of mg.goals ?? []) map[g.month] = g.amount;
    setSavedMonthGoals(map);
    setMonthGoals(Object.fromEntries(Object.entries(map).map(([k, v]) => [k, String(v)])));
    const g = await fetch("/api/finance/goals", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setWeekInput(g.week ? String(g.week) : "");
    setYearInput(g.year ? String(g.year) : "");
    void reloadOverview();
  }, [reloadOverview]);

  // Weekly and yearly income goals (the monthly one is the income budget).
  const saveGoal = async (period: "week" | "year", amount: number) => {
    setSaving(true);
    try {
      await fetch("/api/finance/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, amount }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  // The next 12 months, starting with this one.
  const nextMonths = (() => {
    const out: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("en-US", { month: "long", year: "numeric" }) });
    }
    return out;
  })();
  const saveMonthGoals = async () => {
    setSaving(true);
    setMonthMsg("");
    try {
      // Everything on screen plus any later months already saved stays as it is; only the 12 shown can change here.
      const goals = nextMonths.map((m) => ({ month: m.key, amount: Number(monthGoals[m.key]) || 0 }));
      const res = await fetch("/api/finance/month-goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goals }) });
      setMonthMsg(res.ok ? "Saved. Your Financial Pulse now follows these." : "Couldn't save.");
      await load();
    } finally {
      setSaving(false);
    }
  };
  const laterSaved = Object.keys(savedMonthGoals).filter((k) => !nextMonths.some((m) => m.key === k)).length;

  // Arriving from the dashboard's "Edit goals" link: bring the goals card into view.
  useEffect(() => {
    if (window.location.hash === "#income-goals") setTimeout(() => document.getElementById("income-goals")?.scrollIntoView({ behavior: "smooth" }), 300);
  }, []);

  // Forecasting's "Use as my income goals" writes the goals too; stay in step.
  useEffect(() => {
    const onChange = () => void load();
    window.addEventListener("finance-goals-changed", onChange);
    return () => window.removeEventListener("finance-goals-changed", onChange);
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (type: "income" | "expense", category: string, amount: number) => {
    setSaving(true);
    try {
      await fetch("/api/finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, category, amount }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const bar = (actual: number, budget: number) => {
    const over = budget > 0 && actual > budget;
    const pct = budget > 0 ? Math.min(100, Math.round((actual / budget) * 100)) : 0;
    return (
      <div className="h-2 rounded-full bg-[#1a2b4a]/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: over ? "#b06a5a" : "#2c6b3f" }} />
      </div>
    );
  };

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      <Link href="/finance" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
        <ArrowLeft className="w-4 h-4" /> Finance Center
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-full bg-[#7b6b8d]/15 flex items-center justify-center">
          <PieChart className="w-6 h-6 text-[#7b6b8d]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Budget Planner</h1>
          <p className="text-[#b8a898]">As minimal or detailed as you like</p>
        </div>
      </div>

      <BudgetSuggest onApplied={load} />

      <FinanceRelated variant="budget" overview={overview} />

      {/* Income goals: the one place they're set. The dashboard's Financial
          Pulse and Forecasting read them and link back here. */}
      <div id="income-goals" className="scroll-mt-6" />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Income goals</CardTitle>
          <p className="text-xs text-[#b8a898]">Your Financial Pulse on the dashboard tracks these. Leave week or year blank and they&rsquo;re worked out from your monthly goal.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-medium text-[#b8a898] mb-1">Weekly</label>
              <div className="flex gap-2">
                <MoneyInput value={weekInput} onChange={setWeekInput} placeholder="From monthly" aria-label="Weekly income goal" />
                <Button variant="outline" size="sm" disabled={saving} onClick={() => saveGoal("week", Number(weekInput) || 0)}>
                  Set
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#b8a898] mb-1">Monthly</label>
              <div className="flex gap-2">
                <MoneyInput value={incInput} onChange={setIncInput} placeholder="Revenue goal" aria-label="Monthly income goal" />
                <Button variant="outline" size="sm" disabled={saving} onClick={() => save("income", "", Number(incInput) || 0)}>
                  Set
                </Button>
              </div>
              {income && income.monthly > 0 && (
                <div className="mt-2">
                  {bar(income.mtdActual, income.monthly)}
                  <p className="text-[11px] text-[#b8a898] mt-1">
                    {usd(income.mtdActual)} of {usd(income.monthly)} this month{income.monthOwn ? " (this month's own goal)" : ""}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#b8a898] mb-1">Yearly</label>
              <div className="flex gap-2">
                <MoneyInput value={yearInput} onChange={setYearInput} placeholder="From monthly" aria-label="Yearly income goal" />
                <Button variant="outline" size="sm" disabled={saving} onClick={() => saveGoal("year", Number(yearInput) || 0)}>
                  Set
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month-by-month goals (a ramp) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Month-by-month income goals</CardTitle>
          <p className="text-xs text-[#b8a898]">
            Growing month by month? Give each month its own goal and your Financial Pulse follows the ramp. A month you leave blank uses your monthly goal above
            {income?.generalMonthly ? ` (${usd(income.generalMonthly)})` : ""}.
            {laterSaved > 0 ? ` ${laterSaved} later month${laterSaved === 1 ? " is" : "s are"} also saved and will show here as they come up.` : ""}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {nextMonths.map((m, i) => (
              <label key={m.key} className="block text-xs font-medium text-[#b8a898]">
                {m.label}{i === 0 ? " (this month)" : ""}
                <MoneyInput className="mt-1" value={monthGoals[m.key] ?? ""} onChange={(v) => setMonthGoals((g) => ({ ...g, [m.key]: v }))} placeholder={income?.generalMonthly ? usd(income.generalMonthly) : "Goal"} aria-label={`Income goal for ${m.label}`} />
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" disabled={saving} onClick={saveMonthGoals}>Save month goals</Button>
            {monthMsg && <span role="status" className="text-xs text-[#5a6472]">{monthMsg}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Overall */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Overall monthly spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-xs font-medium text-[#b8a898] mb-1">Expense budget (monthly)</label>
              <div className="flex gap-2">
                <MoneyInput value={expInput} onChange={setExpInput} placeholder="Overall cap" aria-label="Monthly expense budget" />
                <Button variant="outline" size="sm" disabled={saving} onClick={() => save("expense", "", Number(expInput) || 0)}>
                  Set
                </Button>
              </div>
              {expense && expense.monthly > 0 && (
                <div className="mt-2">
                  {bar(expense.mtdActual, expense.monthly)}
                  <p className="text-[11px] text-[#b8a898] mt-1">
                    {usd(expense.mtdActual)} of {usd(expense.monthly)} this month
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense budgets by category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cats.length === 0 && (
              <p className="text-sm text-[#b8a898]">No category budgets yet — add one below for more detail.</p>
            )}
            {cats.map((c) => {
              const line = overview?.budget.categories.find((x) => x.category.toLowerCase() === c.category.toLowerCase());
              const committed = line?.committed ?? 0;
              return (
              <div key={c.category} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#1a2b4a] dark:text-[#F8F5F0] truncate">{c.category}</span>
                    <span className="text-[#b8a898]">
                      {usd(c.mtdActual)} / {usd(c.monthly)} mo
                    </span>
                  </div>
                  <div className="mt-1">{bar(c.mtdActual, c.monthly)}</div>
                  {committed > 0 && (
                    <p className="text-[11px] mt-1" style={{ color: line && line.left < 0 ? "#b06a5a" : "#7b6b8d" }}>
                      {usd(committed)} still due from bills this month
                      {line ? ` · ${line.left >= 0 ? `${usd(line.left)} left` : `${usd(-line.left)} over`}` : ""}
                    </p>
                  )}
                </div>
                <button onClick={() => save("expense", c.category, 0)} className="text-[#b8a898] hover:text-red-500" title="Clear">
                  <X className="w-4 h-4" />
                </button>
              </div>
              );
            })}
            <div className="flex items-end gap-2 pt-2 border-t border-[#1a2b4a]/10">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Category</label>
                <CategoryInput value={newCat} onChange={setNewCat} type="expense" placeholder="e.g. Software" />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Monthly $</label>
                <MoneyInput value={newCatAmt} onChange={setNewCatAmt} aria-label="Monthly amount for the new category" />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={saving || !newCat.trim() || !newCatAmt}
                onClick={async () => {
                  await save("expense", newCat.trim(), Number(newCatAmt) || 0);
                  setNewCat("");
                  setNewCatAmt("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
