"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, TrendingUp, Plus, X, Trash2 } from "lucide-react";
import Link from "next/link";

interface Entry {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  occurredOn: string;
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const tz = () =>
  (typeof window !== "undefined" &&
    (localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone)) ||
  "UTC";

export default function IncomePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mtd, setMtd] = useState(0);
  const [ytd, setYtd] = useState(0);
  const [target, setTarget] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/finance/entries?tz=${encodeURIComponent(tz())}`);
      const d = await res.json().catch(() => ({}));
      const all: Entry[] = Array.isArray(d.entries) ? d.entries : [];
      setEntries(all.filter((e) => e.type === "income"));
      setMtd(d.mtd?.income ?? 0);
      setYtd(d.ytd?.income ?? 0);
      setTarget(d.budgetSummary?.income?.mtdBudget ?? 0);
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
          type: "income",
          amount: amt,
          category: category.trim(),
          description: description.trim(),
          occurredOn: occurredOn || undefined,
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

  const byCat = Object.entries(
    entries.reduce<Record<string, number>>((m, e) => {
      const c = e.category || "Uncategorized";
      m[c] = (m[c] || 0) + e.amount;
      return m;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      <Link href="/finance/pulse" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
        <ArrowLeft className="w-4 h-4" /> Financial Pulse
      </Link>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#2E7C83]/15 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-[#2E7C83]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Income</h1>
            <p className="text-[#b8a898]">Money coming in — tracked to the ledger</p>
          </div>
        </div>
        <Button onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? <X className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
          {showAdd ? "Close" : "Add income"}
        </Button>
      </div>

      {showAdd && (
        <Card className="mb-6 border-[#2E7C83]/30">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Amount</label>
                <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Source / category</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Coaching, Course" />
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
            <div className="mt-3">
              <label className="block text-xs font-medium text-[#b8a898] mb-1">Note (optional)</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this?" />
            </div>
            {msg && <p className="text-xs text-red-600 mt-2">{msg}</p>}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
          <p className="text-sm text-[#7b6b8d]">This month</p>
          <p className="text-2xl font-bold text-[#2E7C83]">{usd(mtd)}</p>
          {target > 0 && <p className="text-[11px] text-[#b8a898] mt-1">toward {usd(target)} target</p>}
        </div>
        <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
          <p className="text-sm text-[#7b6b8d]">Year to date</p>
          <p className="text-2xl font-bold text-[#2E7C83]">{usd(ytd)}</p>
        </div>
        <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
          <p className="text-sm text-[#7b6b8d]">Entries (this year)</p>
          <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{entries.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By source (this year)</CardTitle>
          </CardHeader>
          <CardContent>
            {byCat.length === 0 ? (
              <p className="text-sm text-[#b8a898]">No income recorded yet.</p>
            ) : (
              <div className="space-y-1.5">
                {byCat.map(([c, amt]) => (
                  <div key={c} className="flex items-center justify-between text-sm">
                    <span className="text-[#3F4654] dark:text-[#e8e4f0]">{c}</span>
                    <span className="tabular-nums text-[#2E7C83] font-medium">{usd(amt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent income</CardTitle>
          </CardHeader>
          <CardContent>
            {!loaded ? (
              <p className="text-sm text-[#b8a898]">Loading…</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-[#b8a898]">No income yet — add your first above.</p>
            ) : (
              <div className="divide-y divide-[#1a2b4a]/8 max-h-[360px] overflow-y-auto">
                {entries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0] truncate">
                        {e.category || "Income"}
                        {e.description ? ` — ${e.description}` : ""}
                      </p>
                      <p className="text-xs text-[#b8a898]">{e.occurredOn}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-[#2E7C83]">+{usd(e.amount)}</span>
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
