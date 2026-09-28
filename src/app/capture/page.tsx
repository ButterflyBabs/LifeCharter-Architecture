"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ListPlus, Smartphone, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Quick capture: a phone-friendly page for the two things owners jot down on
// the move, a task or money in/out. Also a home-screen shortcut in the Suite app.
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function CapturePage() {
  const [mode, setMode] = useState<"task" | "money">("task");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [err, setErr] = useState("");

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
            body: JSON.stringify({ type: kind, amount: Number(amount), description: desc.trim(), category: category.trim(), occurredOn: today() }),
          });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(d.error || "Couldn't save that. Try again.");
    setDone(mode === "task" ? `Added "${title.trim()}" to your tasks.` : `Recorded ${kind === "income" ? "income" : "an expense"} of $${Number(amount).toLocaleString("en-US")}.`);
    setTitle("");
    setDue("");
    setAmount("");
    setDesc("");
    setCategory("");
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
              <Input autoFocus type="number" inputMode="decimal" min="0" step="0.01" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 text-base" />
              <Input placeholder="What for?" value={desc} onChange={(e) => setDesc(e.target.value)} className="h-12" />
              <Input placeholder="Category (optional)" value={category} onChange={(e) => setCategory(e.target.value)} className="h-12" />
            </>
          )}
          <Button onClick={save} disabled={busy || !canSave} className="w-full h-12 text-base">{busy ? "Saving…" : "Save"}</Button>
          {done && <p className="flex items-center gap-2 text-sm text-[#2c6b3f]"><CheckCircle2 className="w-4 h-4" />{done}</p>}
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
