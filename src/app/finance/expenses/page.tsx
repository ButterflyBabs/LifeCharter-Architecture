"use client";


import UnassignedBanner from "@/components/finance/UnassignedBanner";import { anyProvincial } from "@/lib/salesTax";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, TrendingDown, Plus, X, Trash2, Camera, Receipt, FileText } from "lucide-react";
import Link from "next/link";
import { fetchSegmentOptions, type SegmentOption } from "../segments";
import { FinanceLedgerRead } from "@/components/planning/AssistantPanels";
import { CategoryInput, forgetCategories } from "@/components/finance/CategoryInput";
import { MoneyInput } from "@/components/finance/MoneyInput";
import { BillMatchPrompt, type BillMatch } from "@/components/finance/BillMatchPrompt";
import { FinanceRelated } from "@/components/finance/FinanceRelated";
import { useFinanceOverview } from "@/components/finance/useFinanceOverview";
import { CurrencySelect, OtherCurrencyNote } from "@/components/money/CurrencySelect";
import { useMoney, otherText, type OtherBlock } from "@/components/finance/money";
import { toCurrency, type Currency } from "@/lib/currency";
import { GstHstField, TaxNote, taxBody, showTaxFields, useSalesTax } from "@/components/finance/GstHst";
import { ExpenseDetails, recurringBadge, type Frequency, type PaymentType, type Renewal } from "@/components/finance/ExpenseDetails";

interface Entry {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  occurredOn: string;
  vendor?: string;
  paymentType?: string;
  frequency?: string | null;
  renewal?: string | null;
  hasReceipt?: boolean;
  currency?: string;
  taxAmount?: number;
  provTaxAmount?: number;
  taxProvince?: string | null;
}
interface CatBudget {
  category: string;
  monthly: number;
  mtdActual: number;
  ytdActual: number;
}

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
  const [other, setOther] = useState<OtherBlock>(null);
  const [loaded, setLoaded] = useState(false);
  // Totals and budgets are the home currency; each entry shows in its own.
  const { home, canChoose, money } = useMoney();
  const usd = (n: number, c: string = home) => money(n, c);
  const [currency, setCurrency] = useState<Currency | null>(null);

  const { overview, reload: reloadOverview } = useFinanceOverview();
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [vendor, setVendor] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("one_time");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [renewal, setRenewal] = useState<Renewal>("auto");
  const [segments, setSegments] = useState<SegmentOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [billMatch, setBillMatch] = useState<{ match: BillMatch; entryId: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  // GST/HST paid (only when the account is registered).
  const salesTax = useSalesTax();
  const [tax, setTax] = useState("");
  // QST / PST / RST (only when the account has a provincial registration).
  const [provTax, setProvTax] = useState("");
  // A receipt photo the assistant read (task 1150): its id rides along when the expense is saved.
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [readNote, setReadNote] = useState<string | null>(null);

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
      setOther(d.other ?? null);
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
          vendor: vendor.trim() || undefined,
          paymentType,
          frequency: paymentType === "recurring" ? frequency : undefined,
          renewal: paymentType === "recurring" ? renewal : undefined,
          receiptId: receiptId || undefined,
          currency: currency ?? home,
          ...taxBody(showTaxFields(salesTax), "expense", tax, "", anyProvincial(salesTax.provincial) ? provTax : undefined),
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
        setVendor("");
        setPaymentType("one_time");
        setReceiptId(null);
        setReadNote(null);
        setTax("");
        setProvTax("");
        setCurrency(null);
        forgetCategories();
        const saved = await res.json().catch(() => ({}));
        setBillMatch(saved?.billMatch && saved?.entry?.id ? { match: saved.billMatch, entryId: saved.entry.id } : null);
        await load();
        void reloadOverview();
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
      void reloadOverview();
    } catch {
      /* optimistic */
    }
  };

  const readReceipt = async (file: File | null | undefined) => {
    if (!file) return;
    setReading(true);
    setMsg(null);
    setReadNote(null);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/finance/receipts", { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    setReading(false);
    if (!r.ok) {
      setShowAdd(true);
      setMsg(d?.error || "Couldn't read that receipt.");
      return;
    }
    const x = d.read as { vendor: string; date: string; amount: number; tax?: number; provTax?: number; category: string; description: string; confident: boolean };
    setReceiptId(d.receiptId || null);
    // Registered for GST/HST: the tax on the receipt goes in its own box and the amount is the total before it.
    const readTax = salesTax.registered && x.tax && x.amount && x.tax > 0 && x.tax < x.amount ? x.tax : 0;
    // A Quebec QST registrant: the QST on the receipt goes in its own box too.
    const readProv = salesTax.provincial.QC?.registered && x.provTax && x.amount && x.provTax > 0 && x.provTax + readTax < x.amount ? x.provTax : 0;
    setAmount(x.amount ? String(Math.round((x.amount - readTax - readProv) * 100) / 100) : "");
    setTax(readTax ? String(readTax) : "");
    setProvTax(readProv ? String(readProv) : "");
    setVendor(x.vendor || "");
    setOccurredOn(x.date || "");
    setCategory(x.category || "");
    setDescription(x.description || "");
    setPaymentType("one_time");
    setShowAdd(true);
    setReadNote(x.confident ? "Read from your receipt. Check it, then press Add." : "Parts of the receipt were hard to read. Please check every field, then press Add.");
  };

  const overBudget = budget > 0 && mtd > budget;

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      <UnassignedBanner />
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
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex cursor-pointer items-center rounded-lg border border-[#1a2b4a]/20 px-4 py-2 text-sm font-medium text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:text-[#F8F5F0] ${reading ? "pointer-events-none opacity-60" : ""}`}>
            <Camera className="w-4 h-4 mr-1.5" />
            {reading ? "Reading your receipt…" : "Snap a receipt"}
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { void readReceipt(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          <Button onClick={() => { setShowAdd((v) => !v); if (showAdd) { setReceiptId(null); setReadNote(null); } }}>
            {showAdd ? <X className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
            {showAdd ? "Close" : "Add expense"}
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="mb-6 border-[#b06a5a]/30">
          <CardContent className="p-5">
            {readNote && (
              <p className="mb-3 flex items-center gap-2 rounded-lg bg-[#2E7C83]/10 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                <Receipt className="w-4 h-4 shrink-0 text-[#2E7C83]" />
                {readNote} The photo is kept with the expense.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Amount</label>
                <div className="flex gap-2">
                  <MoneyInput className="flex-1" value={amount} onChange={setAmount} placeholder="0.00" aria-label="Amount" currency={currency ?? home} home={home} />
                  {canChoose && <CurrencySelect value={currency ?? home} onChange={setCurrency} />}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#b8a898] mb-1">Category</label>
                <CategoryInput value={category} onChange={setCategory} type="expense" placeholder="e.g. Software, Ads" />
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
            {showTaxFields(salesTax) && <GstHstField type="expense" amount={amount} value={tax} onChange={setTax} provValue={provTax} onProvChange={setProvTax} homeProvince={salesTax.province} currency={currency ?? home} home={home} />}
            <ExpenseDetails
              vendor={vendor}
              setVendor={setVendor}
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              frequency={frequency}
              setFrequency={setFrequency}
              renewal={renewal}
              setRenewal={setRenewal}
            />
            {msg && <p className="text-xs text-red-600 mt-2">{msg}</p>}
          </CardContent>
        </Card>
      )}

      {billMatch && <BillMatchPrompt match={billMatch.match} entryId={billMatch.entryId} onClose={() => { setBillMatch(null); void reloadOverview(); }} />}
      <FinanceRelated variant="expenses" overview={overview} />

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
          <OtherCurrencyNote text={otherText(other, home, "mtd.expense")} />
        </div>
        <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
          <p className="text-sm text-[#7b6b8d]">Year to date</p>
          <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(ytd)}</p>
          <OtherCurrencyNote text={otherText(other, home, "ytd.expense")} />
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
                        {e.vendor ? `${e.vendor} · ` : ""}
                        {e.category || "Expense"}
                        {e.description ? ` — ${e.description}` : ""}
                      </p>
                      <p className="text-xs text-[#b8a898]">
                        {e.occurredOn}
                        {recurringBadge(e) ? ` · ${recurringBadge(e)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {e.hasReceipt && (
                        <a href={`/api/finance/receipts?entry=${e.id}`} target="_blank" rel="noreferrer" className="text-[#2E7C83] hover:text-[#1a2b4a]" title="Open the receipt">
                          <FileText className="w-4 h-4" />
                        </a>
                      )}
                      <span className="text-sm font-semibold text-[#b06a5a]">
                        −{usd(e.amount, toCurrency(e.currency, home))}
                        <TaxNote taxAmount={e.taxAmount} provTaxAmount={e.provTaxAmount} province={e.taxProvince} type={e.type === "income" ? "income" : "expense"} currency={toCurrency(e.currency, home)} home={home} />
                      </span>
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
      <div className="mt-6 print:hidden">
        <FinanceLedgerRead />
      </div>
    </div>
  );
}
