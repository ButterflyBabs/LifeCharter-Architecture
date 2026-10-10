"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchSegmentOptions, type SegmentOption } from "@/app/finance/segments";
import { CADENCE_LABEL } from "@/lib/finance/billDates";

const FREQS = ["weekly", "biweekly", "monthly", "quarterly", "semiannual", "annual"] as const;

const INCOME_CATS = ["Coaching", "Program", "Digital Product", "Speaking", "Affiliate Income", "Services"];
const EXPENSE_CATS = ["Software", "Contractors", "Advertising", "Education", "Office & Admin", "Travel", "Fees"];

const todayIn = () => {
  let tz = "";
  try {
    tz = localStorage.getItem("userTimezone") || "";
  } catch {
    /* browser zone */
  }
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz || undefined, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

// Add income or an expense without leaving the page you are on (used on Executive Home's Financial Pulse).
export default function AddMoneyEntryModal({ initialType, onClose, onSaved }: { initialType: "income" | "expense"; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<"income" | "expense">(initialType);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayIn());
  const [segmentId, setSegmentId] = useState("");
  const [vendor, setVendor] = useState("");
  const [paymentType, setPaymentType] = useState<"one_time" | "recurring">("one_time");
  const [frequency, setFrequency] = useState<(typeof FREQS)[number]>("monthly");
  const [renewal, setRenewal] = useState<"auto" | "manual">("auto");
  const [mine, setMine] = useState<{ income: string[]; expense: string[] }>({ income: [], expense: [] });
  const [segments, setSegments] = useState<SegmentOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchSegmentOptions().then(setSegments).catch(() => {});
    // The categories this account already uses, so the same one is always spelled the same way.
    fetch("/api/finance/categories")
      .then((r) => r.json())
      .then((d) => setMine({ income: Array.isArray(d.income) ? d.income : [], expense: Array.isArray(d.expense) ? d.expense : [] }))
      .catch(() => {});
  }, []);

  async function save() {
    const amt = Number(amount);
    if (!isFinite(amt) || amt <= 0) return setMsg("Enter an amount greater than zero.");
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/finance/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: amt,
          category: category.trim(),
          description: description.trim(),
          occurredOn: date || undefined,
          segmentId: segmentId || undefined,
          vendor: vendor.trim() || undefined,
          ...(type === "expense" ? { paymentType, ...(paymentType === "recurring" ? { frequency, renewal } : {}) } : {}),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return setMsg(d?.error || "Couldn't save that entry.");
      }
      onSaved();
      onClose();
    } catch {
      setMsg("Couldn't save that entry.");
    } finally {
      setSaving(false);
    }
  }

  const baseCats = type === "income" ? INCOME_CATS : EXPENSE_CATS;
  const cats = Array.from(new Set([...(type === "income" ? mine.income : mine.expense), ...baseCats]));
  const input = "w-full h-10 px-3 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white text-[#1a2b4a] outline-none focus:border-[#c9a227]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label="Add income or expense">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl text-indigo-900">Add to your Financial Pulse</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="mb-4 inline-flex rounded-lg border border-gray-200 p-0.5 text-sm" role="tablist" aria-label="Income or expense">
          {(["income", "expense"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={type === t} onClick={() => setType(t)} className={`rounded-md px-4 py-1.5 font-medium capitalize ${type === t ? (t === "income" ? "bg-[#2E7C83] text-white" : "bg-[#b06a5a] text-white") : "text-gray-500 hover:bg-gray-100"}`}>
              {t === "income" ? "Money in" : "Money out"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-gray-500">Amount
            <input type="number" min="0" step="0.01" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="0.00" className={`${input} mt-1`} />
          </label>
          <label className="block text-xs font-medium text-gray-500">Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} mt-1`} />
          </label>
          <label className="col-span-2 block text-xs font-medium text-gray-500">Category
            <input list="money-cats" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={type === "income" ? "e.g. Coaching" : "e.g. Software"} className={`${input} mt-1`} />
            <datalist id="money-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          <label className="col-span-2 block text-xs font-medium text-gray-500">Note (optional)
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this?" className={`${input} mt-1`} />
          </label>
          <label className="col-span-2 block text-xs font-medium text-gray-500">{type === "income" ? "From (client or source)" : "Paid to (vendor or person)"}
            <input value={vendor} onChange={(e) => setVendor(e.target.value)} maxLength={120} placeholder={type === "income" ? "e.g. Jane Smith, Stripe" : "e.g. Zoom, Canva"} className={`${input} mt-1`} />
          </label>
          {type === "expense" && (
            <>
              <label className="block text-xs font-medium text-gray-500">Type of payment
                <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as "one_time" | "recurring")} className={`${input} mt-1`}>
                  <option value="one_time">One-time</option>
                  <option value="recurring">Recurring</option>
                </select>
              </label>
              {paymentType === "recurring" ? (
                <label className="block text-xs font-medium text-gray-500">Renewal
                  <select value={renewal} onChange={(e) => setRenewal(e.target.value as "auto" | "manual")} className={`${input} mt-1`}>
                    <option value="auto">Auto-renews</option>
                    <option value="manual">I renew it manually</option>
                  </select>
                </label>
              ) : (
                <div />
              )}
              {paymentType === "recurring" && (
                <label className="col-span-2 block text-xs font-medium text-gray-500">How often
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value as (typeof FREQS)[number])} className={`${input} mt-1`}>
                    {FREQS.map((f) => <option key={f} value={f}>{CADENCE_LABEL[f]}</option>)}
                  </select>
                </label>
              )}
            </>
          )}
          {segments.length > 0 && (
            <label className="col-span-2 block text-xs font-medium text-gray-500">Business segment (optional)
              <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} className={`${input} mt-1`}>
                <option value="">— none —</option>
                {segments.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          )}
        </div>
        {msg && <p role="alert" className="mt-3 text-xs text-red-600">{msg}</p>}
        <div className="mt-5 flex items-center justify-between gap-3">
          <a href="/finance/pulse" className="text-xs text-[#2E7C83] hover:underline">Open the full Financial Pulse</a>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={save} disabled={saving} className="rounded-lg bg-[#1a2b4a] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
