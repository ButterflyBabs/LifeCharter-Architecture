"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CADENCE_LABEL, occurrences, type Bill, type BillCadence } from "@/lib/finance/billDates";
import { CategoryInput } from "@/components/finance/CategoryInput";
import { MoneyInput } from "@/components/finance/MoneyInput";
import { FinanceRelated } from "@/components/finance/FinanceRelated";
import { useFinanceOverview } from "@/components/finance/useFinanceOverview";

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const pad = (n: number) => String(n).padStart(2, "0");
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const addDays = (isoDate: string, n: number) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  const t = new Date(y, m - 1, d + n);
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
};
const niceDate = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const EMPTY = { name: "", vendor: "", amount: "", nextDue: "", cadence: "monthly" as BillCadence, category: "", autopay: false, notes: "" };

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [monthIncome, setMonthIncome] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  });

  const { overview, reload: reloadOverview } = useFinanceOverview();
  const load = useCallback(async () => {
    const r = await fetch("/api/finance/bills", { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    setBills(Array.isArray(d.bills) ? d.bills : []);
    void reloadOverview();
  }, [reloadOverview]);
  useEffect(() => {
    void load();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch(`/api/finance/entries?tz=${encodeURIComponent(tz)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.mtd && setMonthIncome(Number(d.mtd.income) || 0))
      .catch(() => {});
  }, [load]);

  const today = todayIso();
  const list = useMemo(() => bills ?? [], [bills]);
  const overdue = list.filter((b) => b.nextDue < today);
  const sum = (from: string, to: string) => occurrences(list, from, to).reduce((s, o) => s + (o.bill.amount || 0), 0);
  const next7 = sum(today, addDays(today, 6));
  const next30 = sum(today, addDays(today, 29));
  const monthStart = `${cursor.y}-${pad(cursor.m)}-01`;
  const monthEnd = `${cursor.y}-${pad(cursor.m)}-${pad(new Date(cursor.y, cursor.m, 0).getDate())}`;
  const thisMonthKey = today.slice(0, 7);
  const leftThisMonth = sum(today, `${thisMonthKey}-${pad(new Date(Number(thisMonthKey.slice(0, 4)), Number(thisMonthKey.slice(5, 7)), 0).getDate())}`);
  const monthOcc = occurrences(list, monthStart, monthEnd);
  const upcoming = occurrences(list, today, addDays(today, 59));

  async function save() {
    if (!form.name.trim() || !form.nextDue) {
      setMsg("Give the bill a name and a due date.");
      return;
    }
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/finance/bills", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(editing ? { id: editing } : {}), ...form, amount: form.amount === "" ? null : Number(form.amount) }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(d.error || "Couldn't save that bill.");
    setForm(EMPTY);
    setEditing(null);
    void load();
  }

  async function pay(b: Bill) {
    setBusy(true);
    const res = await fetch("/api/finance/bills", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, action: "pay" }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(
      res.ok
        ? `${b.name} marked paid${d.recorded ? " and recorded as an expense" : ""}.${d.nextDue ? ` Next due ${niceDate(d.nextDue)}.` : ""}`
        : d.error || "Couldn't mark it paid."
    );
    void load();
  }

  async function remove(b: Bill) {
    if (!confirm(`Stop tracking ${b.name}? Payments already recorded stay in your ledger.`)) return;
    await fetch("/api/finance/bills", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id }) });
    void load();
  }

  async function addMany(items: Record<string, unknown>[], label: string) {
    if (!items.length) return setMsg(`Nothing to add from ${label}.`);
    setBusy(true);
    const res = await fetch("/api/finance/bills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bills: items }) });
    setBusy(false);
    setMsg(res.ok ? `Added ${items.length} from ${label}. Check the dates and amounts.` : "Couldn't add them just now.");
    void load();
  }

  // The four US estimated-tax dates still ahead in the next 12 months.
  function taxDates() {
    const y = Number(today.slice(0, 4));
    const dates = [`${y}-04-15`, `${y}-06-15`, `${y}-09-15`, `${y + 1}-01-15`, `${y + 1}-04-15`, `${y + 1}-06-15`, `${y + 1}-09-15`]
      .filter((d) => d >= today)
      .slice(0, 4);
    return dates.map((d) => ({ name: "Estimated tax payment", nextDue: d, cadence: "once", category: "Taxes" }));
  }

  async function fromTechStack() {
    const d = await fetch("/api/finance/techstack").then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const tools = (d?.tools ?? []) as { name: string; monthly: number }[];
    const have = new Set(list.map((b) => b.name.toLowerCase()));
    const first = `${today.slice(0, 7)}-01`;
    const nextFirst = addDays(first, 32).slice(0, 7) + "-01";
    void addMany(
      tools.filter((t) => !have.has(t.name.toLowerCase()) && t.monthly > 0).slice(0, 20).map((t) => ({ name: t.name, amount: t.monthly, nextDue: nextFirst, cadence: "monthly", category: "Software" })),
      "your Tech Stack"
    );
  }

  // Calendar grid for the month in view.
  const firstDow = new Date(cursor.y, cursor.m - 1, 1).getDay();
  const daysIn = new Date(cursor.y, cursor.m, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  const byDay = new Map<number, { bill: Bill; date: string }[]>();
  for (const o of monthOcc) {
    const d = Number(o.date.slice(8, 10));
    byDay.set(d, [...(byDay.get(d) ?? []), o]);
  }
  const monthName = new Date(cursor.y, cursor.m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const shift = (n: number) => setCursor((c) => {
    const t = c.m - 1 + n;
    return { y: c.y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 + 1 };
  });

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <Link href="/finance" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
        <ArrowLeft className="w-4 h-4" /> Finance Center
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b06a5a] to-[#c9a227] flex items-center justify-center">
          <CalendarDays className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Bills & Cash Calendar</h1>
          <p className="text-[#7a8a99]">What&apos;s due to go out, and when, so nothing sneaks up on you.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          ["Due in the next 7 days", usd(next7)],
          ["Due in the next 30 days", usd(next30)],
          ["Overdue", overdue.length ? `${overdue.length} bill${overdue.length === 1 ? "" : "s"}` : "None"],
          ["Cash check this month", monthIncome === null ? "—" : `${usd(monthIncome)} in · ${usd(leftThisMonth)} still due`],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-sm text-[#7a8a99] mb-1">{label}</p>
              <p className={`text-xl font-bold ${label === "Overdue" && overdue.length ? "text-[#b06a5a]" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <FinanceRelated variant="bills" overview={overview} />

      {msg && <p className="mb-4 rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{msg}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{monthName}</CardTitle>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></Button>
              <Button size="sm" variant="outline" onClick={() => shift(1)} aria-label="Next month"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-[#7a8a99] mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                const items = day ? byDay.get(day) ?? [] : [];
                const isToday = day && `${cursor.y}-${pad(cursor.m)}-${pad(day)}` === today;
                return (
                  <div key={i} className={`min-h-[72px] rounded-lg border p-1 text-left ${day ? "border-[#1a2b4a]/10" : "border-transparent"} ${isToday ? "bg-[#c9a227]/10 border-[#c9a227]/50" : ""}`}>
                    {day && <div className="text-[11px] text-[#7a8a99]">{day}</div>}
                    {items.slice(0, 3).map((o) => (
                      <div key={o.bill.id + o.date} title={`${o.bill.name}${o.bill.amount ? ` · ${usd(o.bill.amount)}` : ""}`} className="truncate rounded bg-[#b06a5a]/12 px-1 text-[10.5px] text-[#1a2b4a] dark:text-[#F8F5F0]">
                        {o.bill.name}
                      </div>
                    ))}
                    {items.length > 3 && <div className="text-[10px] text-[#7a8a99]">+{items.length - 3} more</div>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit bill" : "Add a bill"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Name (e.g. Rent, Zoom, Loan payment)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Paid to (vendor or person, optional)" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} maxLength={120} />
            <div className="grid grid-cols-2 gap-2">
              <MoneyInput placeholder="Amount" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} aria-label="Amount" />
              <Input type="date" value={form.nextDue} onChange={(e) => setForm({ ...form, nextDue: e.target.value })} aria-label="Next due date" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.cadence}
                onChange={(e) => setForm({ ...form, cadence: e.target.value as BillCadence })}
                className="h-10 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 text-sm"
                aria-label="How often"
              >
                {(Object.keys(CADENCE_LABEL) as BillCadence[]).map((c) => <option key={c} value={c}>{CADENCE_LABEL[c]}</option>)}
              </select>
              <CategoryInput placeholder="Category (optional)" value={form.category} onChange={(v) => setForm({ ...form, category: v })} type="expense" />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              <input type="checkbox" checked={form.autopay} onChange={(e) => setForm({ ...form, autopay: e.target.checked })} className="h-4 w-4" />
              Renews automatically (autopay). Leave unticked if you renew it by hand.
            </label>
            <div className="flex gap-2">
              <Button onClick={save} disabled={busy}><Plus className="w-4 h-4 mr-1" />{editing ? "Save changes" : "Add bill"}</Button>
              {editing && <Button variant="outline" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</Button>}
            </div>
            <div className="border-t border-[#1a2b4a]/10 pt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">Quick add</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => addMany(taxDates(), "the estimated-tax calendar")}>Quarterly estimated-tax dates</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={fromTechStack}>Subscriptions from my Tech Stack</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Coming up (next 60 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {bills === null ? (
            <p className="text-sm text-[#7a8a99]">Loading…</p>
          ) : !list.length ? (
            <p className="text-sm text-[#7a8a99]">No bills yet. Add your regular payments above (rent, software, loans, insurance) and they&apos;ll appear here and on the calendar.</p>
          ) : (
            <div className="divide-y divide-[#1a2b4a]/10">
              {[...overdue.map((b) => ({ bill: b, date: b.nextDue })), ...upcoming.filter((o) => o.date >= today)].map((o) => {
                const late = o.date < today;
                const isNext = o.date === o.bill.nextDue;
                return (
                  <div key={o.bill.id + o.date} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="w-28 shrink-0 text-sm">
                      <span className={late ? "font-semibold text-[#b06a5a]" : "text-[#7a8a99]"}>{late ? `Overdue · ${niceDate(o.date)}` : niceDate(o.date)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{o.bill.name}</p>
                      <p className="text-xs text-[#7a8a99]">
                        {CADENCE_LABEL[o.bill.cadence]}
                        {o.bill.vendor ? ` · ${o.bill.vendor}` : ""}
                        {o.bill.category ? ` · ${o.bill.category}` : ""}
                        {o.bill.cadence !== "once" ? (o.bill.autopay ? " · auto-renews" : " · renew manually") : ""}
                      </p>
                    </div>
                    <div className="w-24 text-right font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{o.bill.amount ? usd(o.bill.amount) : "—"}</div>
                    {isNext && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => pay(o.bill)}><Check className="w-3.5 h-3.5 mr-1" />Paid</Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(o.bill.id);
                            setForm({ name: o.bill.name, vendor: o.bill.vendor, amount: o.bill.amount === null ? "" : String(o.bill.amount), nextDue: o.bill.nextDue, cadence: o.bill.cadence, category: o.bill.category, autopay: o.bill.autopay, notes: o.bill.notes });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(o.bill)} aria-label={`Stop tracking ${o.bill.name}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
