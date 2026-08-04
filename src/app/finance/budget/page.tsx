"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, PieChart, X } from "lucide-react";
import Link from "next/link";

interface Side {
  monthly: number;
  mtdActual: number;
  ytdActual: number;
  mtdBudget: number;
  ytdBudget: number;
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
  const [expense, setExpense] = useState<Side | null>(null);
  const [income, setIncome] = useState<Side | null>(null);
  const [cats, setCats] = useState<CatRow[]>([]);
  const [expInput, setExpInput] = useState("");
  const [incInput, setIncInput] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newCatAmt, setNewCatAmt] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/finance/entries?tz=${encodeURIComponent(tz())}`);
    const d = await res.json().catch(() => ({}));
    const b = d.budgetSummary;
    if (b) {
      setExpense(b.expense);
      setIncome(b.income);
      setCats(Array.isArray(b.byCategory) ? b.byCategory : []);
      setExpInput(b.expense?.monthly ? String(b.expense.monthly) : "");
      setIncInput(b.income?.monthly ? String(b.income.monthly) : "");
    }
  }, []);

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

      {/* Overall */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Overall monthly targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-[#b8a898] mb-1">Expense budget (monthly)</label>
              <div className="flex gap-2">
                <Input type="number" min="0" value={expInput} onChange={(e) => setExpInput(e.target.value)} placeholder="Overall cap" />
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
            <div>
              <label className="block text-xs font-medium text-[#b8a898] mb-1">Income target (monthly)</label>
              <div className="flex gap-2">
                <Input type="number" min="0" value={incInput} onChange={(e) => setIncInput(e.target.value)} placeholder="Revenue goal" />
                <Button variant="outline" size="sm" disabled={saving} onClick={() => save("income", "", Number(incInput) || 0)}>
                  Set
                </Button>
              </div>
              {income && income.monthly > 0 && (
                <div className="mt-2">
                  {bar(income.mtdActual, income.monthly)}
                  <p className="text-[11px] text-[#b8a898] mt-1">
                    {usd(income.mtdActual)} of {usd(income.monthly)} this month
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
            {cats.map((c) => (
              <div key={c.category} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#1a2b4a] dark:text-[#F8F5F0] truncate">{c.category}</span>
                    <span className="text-[#b8a898]">
                      {usd(c.mtdActual)} / {usd(c.monthly)} mo
                    </span>
                  </div>
                  <div className="mt-1">{bar(c.mtdActual, c.monthly)}</div>
                </div>
                <button onClick={() => save("expense", c.category, 0)} className="text-[#b8a898] hover:text-red-500" title="Clear">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex items-end gap-2 pt-2 border-t border-[#1a2b4a]/10">
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
