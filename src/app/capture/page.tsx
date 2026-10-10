"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ListPlus, Smartphone, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/finance/MoneyInput";
import { CategoryInput, forgetCategories } from "@/components/finance/CategoryInput";
import { ExpenseDetails, IncomeFrom, type Frequency, type PaymentType, type Renewal } from "@/components/finance/ExpenseDetails";
import { fetchSegmentOptions, type SegmentOption } from "@/app/finance/segments";
import { BillMatchPrompt, type BillMatch } from "@/components/finance/BillMatchPrompt";

// Quick capture: a phone-friendly page for the two things owners jot down on
// the move, a task or money in/out. Also a home-screen shortcut in the Suite app.
// Money in/out asks for everything the Finance pages do (date, category, who, one-time or
// recurring, how often, renewal, business segment) so an entry never has to be reopened later.
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const selectCls = "w-full h-12 px-3 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]";

export default function CapturePage() {
  const [mode, setMode] = useState<"task" | "money">("task");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [occurredOn, setOccurredOn] = useState(today());
  const [vendor, setVendor] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("one_time");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [renewal, setRenewal] = useState<Renewal>("auto");
  const [segmentId, setSegmentId] = useState("");
  const [segments, setSegments] = useState<SegmentOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [billMatch, setBillMatch] = useState<{ match: BillMatch; entryId: string } | null>(null);
  const [done, setDone] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchSegmentOptions().then(setSegments).catch(() => {});
  }, []);

  async function save() {
    setBusy(true);
    setErr("");
    setDone("");
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res =
      mode === "task"
        ? await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: title.trim(), status: due ? "backlog" : "today", ...(due ? { dueDay: due, tz } : {}) }),
          })
        : await fetch("/api/finance/entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: kind,
              amount: Number(amount),
              description: desc.trim(),
              category: category.trim(),
              occurredOn: occurredOn || today(),
              vendor: vendor.trim() || undefined,
              segmentId: segmentId || undefined,
              ...(kind === "expense" ? { paymentType, ...(paymentType === "recurring" ? { frequency, renewal } : {}) } : {}),
            }),
          });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(d.error || "Couldn't save that. Try again.");
    setBillMatch(mode === "money" && d?.billMatch && d?.entry?.id ? { match: d.billMatch, entryId: d.entry.id } : null);
    setDone(mode === "task" ? `Added "${title.trim()}" to your tasks.` : `Recorded ${kind === "income" ? "income" : "an expense"} of $${Number(amount).toLocaleString("en-US")}.`);
    setTitle("");
    setDue("");
    setAmount("");
    setDesc("");
    setCategory("");
    setVendor("");
    setSegmentId("");
    setPaymentType("one_time");
    setOccurredOn(today());
    forgetCategories();
  }

  const canSave = mode === "task" ? title.trim().length > 0 : Number(amount) > 0;

  return (
    <div className="py-6 px-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">Quick capture</h1>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button onClick={() => setMode("task")} className={`flex items-center justify-center gap-2 rounded-xl border py-3 font-semibold ${mode === "task" ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
          <ListPlus className="w-5 h-5" /> Task
        </button>
        <button onClick={() => setMode("money")} className={`flex items-center justify-center gap-2 rounded-xl border py-3 font-semibold ${mode === "money" ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
          <Wallet className="w-5 h-5" /> Money
        </button>
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          {mode === "task" ? (
            <>
              <Input autoFocus placeholder="What needs doing?" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 text-base" />
              <label className="block text-sm text-[#7a8a99]">
                Due (optional)
                <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mt-1 h-12" />
              </label>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(["expense", "income"] as const).map((k) => (
                  <button key={k} onClick={() => setKind(k)} className={`rounded-lg border py-2 text-sm font-semibold ${kind === k ? (k === "income" ? "border-[#2c6b3f] bg-[#2c6b3f]/10 text-[#2c6b3f]" : "border-[#b06a5a] bg-[#b06a5a]/10 text-[#b06a5a]") : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                    {k === "income" ? "Money in" : "Money out"}
                  </button>
                ))}
              </div>
              <MoneyInput placeholder="Amount" value={amount} onChange={setAmount} className="[&_input]:h-12 [&_input]:text-base" aria-label="Amount" />
              <label className="block text-sm text-[#7a8a99]">
                Date
                <Input type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} className="mt-1 h-12" />
              </label>
              <CategoryInput value={category} onChange={setCategory} type={kind} placeholder="Category (e.g. Software, Coaching)" />
              <Input placeholder="Note: what was this for? (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} className="h-12" />
              {kind === "income" ? <IncomeFrom value={vendor} onChange={setVendor} /> : (
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
              )}
              {segments.length > 0 && (
                <label className="block text-sm text-[#7a8a99]">
                  Business segment (optional)
                  <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} className={`${selectCls} mt-1`}>
                    <option value="">— none —</option>
                    {segments.map((sg) => (
                      <option key={sg.id} value={sg.id}>{sg.label}</option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
          <Button onClick={save} disabled={busy || !canSave} className="w-full h-12 text-base">{busy ? "Saving…" : "Save"}</Button>
          {done && <p className="flex items-center gap-2 text-sm text-[#2c6b3f]"><CheckCircle2 className="w-4 h-4" />{done}</p>}
          {billMatch && <BillMatchPrompt match={billMatch.match} entryId={billMatch.entryId} onClose={() => setBillMatch(null)} />}
          {err && <p className="text-sm text-[#8a2f2f]">{err}</p>}
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-sm"><Link href={mode === "task" ? "/tasks" : "/finance/pulse"} className="text-[#2E7C83] hover:underline">{mode === "task" ? "Open my tasks" : "Open my Cash Flow"}</Link></p>
      <Card className="mt-6">
        <CardContent className="p-4 text-sm text-[#1a2b4a] dark:text-[#F8F5F0] space-y-2">
          <p className="flex items-center gap-2 font-semibold"><Smartphone className="w-4 h-4" /> Put the Command Suite on your phone</p>
          <p><strong>iPhone (Safari):</strong> tap Share, then &ldquo;Add to Home Screen&rdquo;.</p>
          <p><strong>Android (Chrome):</strong> tap the ⋮ menu, then &ldquo;Install app&rdquo;.</p>
          <p className="text-[#7a8a99]">Press and hold the app icon for shortcuts to Quick capture, Daily Compass and your tasks.</p>
        </CardContent>
      </Card>
    </div>
  );
}
