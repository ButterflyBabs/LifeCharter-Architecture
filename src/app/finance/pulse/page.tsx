"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  X,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface Entry {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  occurredOn: string;
  source: string;
}
interface Totals {
  income: number;
  expense: number;
  net: number;
}
interface MonthPoint {
  month: number;
  income: number;
  expense: number;
}
interface BudgetSide {
  monthly: number;
  mtdBudget: number;
  mtdActual: number;
  ytdBudget: number;
  ytdActual: number;
}
interface BudgetSummary {
  expense: BudgetSide;
  income: BudgetSide;
  byCategory: { category: string; monthly: number; mtdActual: number; ytdActual: number }[];
}
interface Health {
  score: number | null;
  profitSignal: number;
  budgetSignal: number | null;
  hasBudget: boolean;
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function tz(): string {
  if (typeof window === "undefined") return "UTC";
  return localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export default function FinancialPulsePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mtd, setMtd] = useState<Totals>({ income: 0, expense: 0, net: 0 });
  const [ytd, setYtd] = useState<Totals>({ income: 0, expense: 0, net: 0 });
  const [monthly, setMonthly] = useState<MonthPoint[]>([]);
  const [label, setLabel] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [expBudgetInput, setExpBudgetInput] = useState("");
  const [incTargetInput, setIncTargetInput] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newCatAmt, setNewCatAmt] = useState("");
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [showBudget, setShowBudget] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/finance/entries?tz=${encodeURIComponent(tz())}`);
      const d = await res.json().catch(() => ({}));
      setEntries(Array.isArray(d.entries) ? d.entries : []);
      if (d.mtd) setMtd(d.mtd);
      if (d.ytd) setYtd(d.ytd);
      if (Array.isArray(d.monthly)) setMonthly(d.monthly);
      if (d.year && d.month) setLabel(`${MONTHS[d.month - 1]} ${d.year}`);
      if (d.budgetSummary) {
        setBudgetSummary(d.budgetSummary);
        setExpBudgetInput(d.budgetSummary.expense.monthly ? String(d.budgetSummary.expense.monthly) : "");
        setIncTargetInput(d.budgetSummary.income.monthly ? String(d.budgetSummary.income.monthly) : "");
      }
      if (d.health) setHealth(d.health);
    } catch {
      /* ignore */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addEntry = async () => {
    const amt = Number(amount);
    if (!isFinite(amt) || amt <= 0) {
      setMsg("Enter an amount greater than zero.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/finance/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: amt,
          category: category.trim(),
          description: description.trim(),
          occurredOn: occurredOn || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(d?.error || "Couldn't save the entry.");
      } else {
        setAmount("");
        setCategory("");
        setDescription("");
        setOccurredOn("");
        await load();
      }
    } catch {
      setMsg("Couldn't save the entry.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await fetch(`/api/finance/entries/${id}`, { method: "DELETE" });
      load();
    } catch {
      /* optimistic */
    }
  };

  const saveBudget = async (bType: "income" | "expense", cat: string, amt: number) => {
    setBudgetSaving(true);
    try {
      await fetch("/api/finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: bType, category: cat, amount: amt }),
      });
      await load();
    } finally {
      setBudgetSaving(false);
    }
  };

  const maxBar = Math.max(1, ...monthly.map((m) => Math.max(m.income, m.expense)));

  const healthColor = (s: number | null) =>
    s == null ? "#8a7f74" : s >= 70 ? "#2c6b3f" : s >= 45 ? "#8a6a15" : "#b06a5a";

  const tile = (
    title: string,
    value: number,
    tone: "income" | "expense" | "net",
    icon: React.ReactNode,
    budget?: { target: number; isCap: boolean }
  ) => {
    const color =
      tone === "income" ? "#2E7C83" : tone === "expense" ? "#b06a5a" : value >= 0 ? "#2c6b3f" : "#b06a5a";
    const target = budget?.target ?? 0;
    const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
    // For an expense cap, over budget is bad (red). For an income target, at/over is good (green).
    const over = target > 0 && value > target;
    const barColor = budget?.isCap ? (over ? "#b06a5a" : "#2c6b3f") : "#2E7C83";
    return (
      <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
        <div className="flex items-center gap-2 text-[#7b6b8d] mb-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <p className="text-2xl font-bold" style={{ color }}>
          {tone === "net" && value >= 0 ? "+" : ""}
          {usd(value)}
        </p>
        {target > 0 && (
          <div className="mt-2">
            <div className="h-1.5 rounded-full bg-[#1a2b4a]/10 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
            </div>
            <p className="text-[11px] text-[#b8a898] mt-1">
              {budget?.isCap ? "of" : "toward"} {usd(target)} {budget?.isCap ? "budget" : "target"}
              {over && budget?.isCap ? ` · ${usd(value - target)} over` : ""}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-6 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/finance" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
          <ArrowLeft className="w-4 h-4" /> Finance
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2E7C83] to-[#c9a227] flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Financial Pulse</h1>
              <p className="text-[#b8a898]">{label ? `Live through ${label}` : "Your money at a glance"}</p>
            </div>
          </div>
          <Button onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? <X className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
            {showAdd ? "Close" : "Add entry"}
          </Button>
        </div>
      </div>

      {/* Add entry */}
      {showAdd && (
        <Card className="mb-6 border-[#c9a227]/30">
          <CardContent className="p-5">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setType("income")}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  type === "income"
                    ? "border-[#2E7C83] bg-[#2E7C83]/10 text-[#2E7C83]"
                    : "border-[#1a2b4a]/15 text-[#b8a898]"
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setType("expense")}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  type === "expense"
                    ? "border-[#b06a5a] bg-[#b06a5a]/10 text-[#b06a5a]"
                    : "border-[#1a2b4a]/15 text-[#b8a898]"
                }`}
              >
                Expense
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Amount</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Category</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Coaching, Software" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Date</label>
                <Input type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={addEntry} disabled={saving} className="w-full">
                  {saving ? "Saving…" : "Add"}
                </Button>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-[#b8a898] mb-1">Note (optional)</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this?" />
            </div>
            {msg && <p className="text-xs text-red-600 mt-2">{msg}</p>}
          </CardContent>
        </Card>
      )}

      {/* Health & budget */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center min-w-[110px]">
              <div className="text-4xl font-bold" style={{ color: healthColor(health?.score ?? null) }}>
                {health?.score ?? "—"}
              </div>
              <div className="text-xs text-[#b8a898]">Financial health</div>
            </div>
            <div className="flex-1 min-w-[280px] grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Monthly expense budget</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={expBudgetInput}
                    onChange={(e) => setExpBudgetInput(e.target.value)}
                    placeholder="Overall cap"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={budgetSaving}
                    onClick={() => saveBudget("expense", "", Number(expBudgetInput) || 0)}
                  >
                    Set
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Monthly income target</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={incTargetInput}
                    onChange={(e) => setIncTargetInput(e.target.value)}
                    placeholder="Revenue goal"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={budgetSaving}
                    onClick={() => saveBudget("income", "", Number(incTargetInput) || 0)}
                  >
                    Set
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowBudget((v) => !v)}
            className="mt-3 text-xs text-[#2E7C83] hover:underline"
          >
            {showBudget ? "Hide category budgets" : "Set budgets by category (optional detail)"}
          </button>

          {showBudget && (
            <div className="mt-3 pt-3 border-t border-[#1a2b4a]/10 space-y-2">
              {(budgetSummary?.byCategory ?? []).map((c) => {
                const over = c.mtdActual > c.monthly;
                const pct = c.monthly > 0 ? Math.min(100, Math.round((c.mtdActual / c.monthly) * 100)) : 0;
                return (
                  <div key={c.category} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#1a2b4a] dark:text-[#F8F5F0] truncate">{c.category}</span>
                        <span className="text-[#b8a898]">
                          {usd(c.mtdActual)} / {usd(c.monthly)} mo
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#1a2b4a]/10 overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: over ? "#b06a5a" : "#2c6b3f" }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => saveBudget("expense", c.category, 0)}
                      className="text-[#b8a898] hover:text-red-500"
                      title="Clear budget"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              <div className="flex items-end gap-2 pt-1">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#b8a898] mb-1">Category</label>
                  <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="e.g. Software" />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-[#b8a898] mb-1">Monthly $</label>
                  <Input type="number" min="0" value={newCatAmt} onChange={(e) => setNewCatAmt(e.target.value)} />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={budgetSaving || !newCat.trim() || !newCatAmt}
                  onClick={async () => {
                    await saveBudget("expense", newCat.trim(), Number(newCatAmt) || 0);
                    setNewCat("");
                    setNewCatAmt("");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-[#b8a898] mt-3">
            Health blends profitability with how spending tracks to budget. Set one overall budget for the
            simple view, or add categories for detail — as much or as little as you like.
          </p>
        </CardContent>
      </Card>

      {/* This month */}
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7b6b8d] mb-3">
        This month{label ? ` · ${label}` : ""}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {tile("Income (MTD)", mtd.income, "income", <TrendingUp className="w-4 h-4" />, {
          target: budgetSummary?.income.mtdBudget ?? 0,
          isCap: false,
        })}
        {tile("Expenses (MTD)", mtd.expense, "expense", <TrendingDown className="w-4 h-4" />, {
          target: budgetSummary?.expense.mtdBudget ?? 0,
          isCap: true,
        })}
        {tile("Net (MTD)", mtd.net, "net", <Wallet className="w-4 h-4" />)}
      </div>

      {/* Year to date */}
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7b6b8d] mb-3">Year to date</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {tile("Income (YTD)", ytd.income, "income", <TrendingUp className="w-4 h-4" />, {
          target: budgetSummary?.income.ytdBudget ?? 0,
          isCap: false,
        })}
        {tile("Expenses (YTD)", ytd.expense, "expense", <TrendingDown className="w-4 h-4" />, {
          target: budgetSummary?.expense.ytdBudget ?? 0,
          isCap: true,
        })}
        {tile("Net (YTD)", ytd.net, "net", <Wallet className="w-4 h-4" />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This year, by month</CardTitle>
          </CardHeader>
          <CardContent>
            {ytd.income === 0 && ytd.expense === 0 ? (
              <p className="text-sm text-[#b8a898]">No entries yet this year — add one to see the trend.</p>
            ) : (
              <div className="space-y-2">
                {monthly.map((m) => (
                  <div key={m.month} className="flex items-center gap-2">
                    <span className="text-xs text-[#b8a898] w-8">{MONTHS[m.month - 1]}</span>
                    <div className="flex-1 space-y-1">
                      <div className="h-2.5 rounded-full bg-[#2E7C83]" style={{ width: `${(m.income / maxBar) * 100}%` }} />
                      <div className="h-2.5 rounded-full bg-[#b06a5a]" style={{ width: `${(m.expense / maxBar) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-4 pt-2 text-xs text-[#b8a898]">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-2 rounded-full bg-[#2E7C83] inline-block" /> Income
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-2 rounded-full bg-[#b06a5a] inline-block" /> Expense
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent entries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent entries</CardTitle>
          </CardHeader>
          <CardContent>
            {!loaded ? (
              <p className="text-sm text-[#b8a898]">Loading…</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-[#b8a898]">No entries yet. Add your first income or expense above.</p>
            ) : (
              <div className="divide-y divide-[#1a2b4a]/8 max-h-[360px] overflow-y-auto">
                {entries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0] truncate">
                        {e.category || (e.type === "income" ? "Income" : "Expense")}
                        {e.description ? ` — ${e.description}` : ""}
                      </p>
                      <p className="text-xs text-[#b8a898]">{e.occurredOn}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: e.type === "income" ? "#2E7C83" : "#b06a5a" }}
                      >
                        {e.type === "income" ? "+" : "−"}
                        {usd(e.amount)}
                      </span>
                      <button
                        onClick={() => remove(e.id)}
                        className="text-[#b8a898] hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
