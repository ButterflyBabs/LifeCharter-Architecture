"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, TrendingDown, Plus, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { fetchSegmentOptions, type SegmentOption } from "../segments";

interface Entry {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  occurredOn: string;
}
interface CatBudget {
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

export default function ExpensesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mtd, setMtd] = useState(0);
  const [ytd, setYtd] = useState(0);
  const [budget, setBudget] = useState(0);
  const [catBudgets, setCatBudgets] = useState<CatBudget[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [segments, setSegments] = useState<SegmentOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSegmentOptions().then(setSegments).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/finance/entries?tz=${encodeURIComponent(tz())}`);
      const d = await res.json().catch(() => ({}));
      const all: Entry[] = Array.isArray(d.entries) ? d.entries : [];
      setEntries(all.filter((e) => e.type === "expense"));
      setMtd(d.mtd?.expense ?? 0);
      setYtd(d.ytd?.expense ?? 0);
      setBudget(d.budgetSummary?.expense?.mtdBudget ?? 0);
      setCatBudgets(Array.isArray(d.budgetSummary?.byCategory) ? d.budgetSummary.byCategory : []);
    } catch {
      /* ignore */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
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
          type: "expense",
          amount: amt,
          category: category.trim(),
          description: description.trim(),
          occurredOn: occurredOn || undefined,
          segmentId: segmentId || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(d?.error || "Couldn't save.");
      } else {
        setAmount("");
        setCategory("");
        setDescription("");
        setOccurredOn("");
        setSegmentId("");
        await load();
      }
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

  const overBudget = budget > 0 && mtd > budget;

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      <Link href="/finance/pulse" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
        <ArrowLeft className="w-4 h-4" /> Financial Pulse
      </Link>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#b06a5a]/15 flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-[#b06a5a]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Expenses</h1>
            <p className="text-[#b8a898]">Money going out — tracked to the ledger</p>
          </div>
        </div>
        <Button onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? <X className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
          {showAdd ? "Close" : "Add expense"}
        </Button>
      </div>

      {showAdd && (
        <Card className="mb-6 border-[#b06a5a]/30">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Amount</label>
                <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Category</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Software, Ads" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Date</label>
                <Input type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={add} disabled={saving} className="w-full">
                  {saving ? "Saving…" : "Add"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Note (optional)</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this?" />
              </div>
              {segments.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[#b8a898] mb-1">Business segment (optional)</label>
                  <select
                    value={segmentId}
                    onChange={(e) => setSegmentId(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  >
                    <option value="">— none —</option>
                    {segments.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {msg && <p className="text-xs text-red-600 mt-2">{msg}</p>}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
          <p className="text-sm text-[#7b6b8d]">This month</p>
          <p className="text-2xl font-bold" style={{ color: overBudget ? "#b06a5a" : "#1a2b4a" }}>
            {usd(mtd)}
          </p>
          {budget > 0 && (
            <p className="text-[11px] text-[#b8a898] mt-1">
              of {usd(budget)} budget{overBudget ? ` · ${usd(mtd - budget)} over` : ""}
            </p>
          )}
        </div>
        <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
          <p className="text-sm text-[#7b6b8d]">Year to date</p>
          <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(ytd)}</p>
        </div>
        <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
          <p className="text-sm text-[#7b6b8d]">Entries (this year)</p>
          <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{entries.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By category vs budget (this month)</CardTitle>
          </CardHeader>
          <CardContent>
            {catBudgets.length === 0 ? (
              <p className="text-sm text-[#b8a898]">
                No category budgets set. Add them on the Financial Pulse to track spend by category.
              </p>
            ) : (
              <div className="space-y-2.5">
                {catBudgets.map((c) => {
                  const over = c.mtdActual > c.monthly;
                  const pct = c.monthly > 0 ? Math.min(100, Math.round((c.mtdActual / c.monthly) * 100)) : 0;
                  return (
                    <div key={c.category}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#3F4654] dark:text-[#e8e4f0]">{c.category}</span>
                        <span className="text-[#b8a898] tabular-nums">
                          {usd(c.mtdActual)} / {usd(c.monthly)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#1a2b4a]/10 overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: over ? "#b06a5a" : "#2c6b3f" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {!loaded ? (
              <p className="text-sm text-[#b8a898]">Loading…</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-[#b8a898]">No expenses yet — add your first above.</p>
            ) : (
              <div className="divide-y divide-[#1a2b4a]/8 max-h-[360px] overflow-y-auto">
                {entries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0] truncate">
                        {e.category || "Expense"}
                        {e.description ? ` — ${e.description}` : ""}
                      </p>
                      <p className="text-xs text-[#b8a898]">{e.occurredOn}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-[#b06a5a]">−{usd(e.amount)}</span>
                      <button onClick={() => remove(e.id)} className="text-[#b8a898] hover:text-red-500" title="Delete">
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
