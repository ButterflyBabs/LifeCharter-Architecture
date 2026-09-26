"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle2, Circle, Clock, Plus, Trash2, Loader2, Sparkles, ChevronDown, ChevronUp, X } from "lucide-react";

// Operating Rhythm — the routines this business repeats to stay healthy: daily
// habits, a weekly review, a monthly check-in. They're the client's own recurring
// tasks, so each one shows up in Today's Schedule and the Daily Compass on the
// days it's due, and can be checked off. Nothing here is pre-filled for them.

type Cadence = "daily" | "weekly" | "monthly";
interface Item { id: string; title: string; cadence: Cadence; schedule: string; daysOfWeek: number[]; dayOfMonth: number | null; dueToday: boolean; doneToday: boolean }
interface Suggestion { title: string; cadence: Cadence; daysOfWeek: number[]; dayOfMonth: number | null; why: string; on?: boolean }

const COLORS: Record<Cadence, string> = { daily: "#4a9b9b", weekly: "#7b6b8d", monthly: "#c9a227" };
const LABELS: Record<Cadence, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const post = (url: string, body?: unknown) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

export function OperatingRhythm() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [help, setHelp] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", cadence: "daily" as Cadence, dow: 1, dom: 1 });
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("Your assistant");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const d = await (await fetch(`/api/recurring-tasks?tz=${encodeURIComponent(tz)}`, { cache: "no-store" })).json();
      setItems(d.tasks ?? []);
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => {
    load();
    fetch("/api/ai-settings").then((r) => r.json()).then((d) => d?.assistantName && setName(String(d.assistantName))).catch(() => undefined);
  }, [load]);

  const changed = () => { load(); window.dispatchEvent(new Event("tasks-changed")); };

  const toggle = async (it: Item) => {
    setItems((p) => (p ? p.map((x) => (x.id === it.id ? { ...x, doneToday: !it.doneToday } : x)) : p));
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await fetch(`/api/recurring-tasks/${it.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !it.doneToday, tz }) });
    window.dispatchEvent(new Event("tasks-changed"));
  };
  const remove = async (id: string) => {
    if (!window.confirm("Remove this routine?")) return;
    setItems((p) => (p ? p.filter((x) => x.id !== id) : p));
    await fetch(`/api/recurring-tasks/${id}`, { method: "DELETE" });
    changed();
  };
  const add = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    const res = await post("/api/recurring-tasks", { title: form.title, cadence: form.cadence, daysOfWeek: form.cadence === "weekly" ? [form.dow] : undefined, dayOfMonth: form.cadence === "monthly" ? form.dom : undefined });
    setBusy(false);
    if (res.ok) { setForm({ ...form, title: "" }); setAdding(false); changed(); }
  };

  const suggest = async () => {
    setSuggesting(true);
    setNote("");
    const res = await post("/api/operating-rhythm/suggest");
    const d = await res.json().catch(() => ({}));
    setSuggesting(false);
    if (d.needsKey) setNote("Connect your AI key in Settings to have your assistant suggest a rhythm.");
    else if (!res.ok) setNote(d.error || "Couldn't suggest a rhythm.");
    else {
      if (d.assistant) setName(d.assistant);
      setSuggestions((d.items as Suggestion[]).map((s) => ({ ...s, on: true })));
    }
  };
  const addSuggested = async () => {
    setBusy(true);
    for (const s of (suggestions ?? []).filter((x) => x.on)) {
      await post("/api/recurring-tasks", { title: s.title, cadence: s.cadence, daysOfWeek: s.cadence === "weekly" ? s.daysOfWeek : undefined, dayOfMonth: s.cadence === "monthly" ? s.dayOfMonth : undefined });
    }
    setBusy(false);
    setSuggestions(null);
    changed();
  };

  const total = items?.filter((i) => i.dueToday).length ?? 0;
  const done = items?.filter((i) => i.dueToday && i.doneToday).length ?? 0;

  return (
    <Card className="h-full border-[#c9a227]/30">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Operating Rhythm</CardTitle>
          <p className="text-xs text-[#7a8a99] mt-1 max-w-md">
            The routines that keep your business running — daily habits, a weekly review, a monthly check-in. Set them once; they appear in your schedule on the right days and you check them off.
          </p>
        </div>
        {items && items.length > 0 && <span className="text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0] whitespace-nowrap">{done} of {total} due today</span>}
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <button onClick={() => setHelp((h) => !h)} className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7C83] hover:underline mb-3">
          {help ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} What is an Operating Rhythm, and how do I use it?
        </button>
        {help && (
          <div className="mb-4 rounded-xl bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/5 p-4 text-sm text-[#3F4654] dark:text-[#e8e4f0] space-y-2">
            <p>Businesses drift when things only get done &ldquo;when there&apos;s time.&rdquo; An Operating Rhythm turns the recurring work that matters into a schedule, so it happens on purpose.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Daily</strong> — small habits: check messages and inbox, log your calls and income, choose tomorrow&apos;s top three.</li>
              <li><strong>Weekly</strong> — a review on a set day: your pipeline, your numbers, next week&apos;s content, what slipped.</li>
              <li><strong>Monthly</strong> — a check-in on a set date: reconcile your books, review your plan goals and your segments&apos; progress, plan the month ahead.</li>
            </ul>
            <p><strong>How to use it:</strong> add a few routines (or let {name} suggest ones for your business), then check each off on the days it&apos;s due. They also appear in <Link href="/daily-compass" className="underline">Today&apos;s Schedule and your Daily Compass</Link> and count toward your streak in the Weekly View. Start with three to five — a rhythm you keep beats a long list you don&apos;t.</p>
          </div>
        )}

        {failed ? (
          <p className="text-sm text-[#7a8a99]">Couldn&apos;t load your routines right now.</p>
        ) : items === null ? (
          <div className="flex items-center justify-center h-24"><Loader2 className="w-5 h-5 animate-spin text-[#4a9b9b]" /></div>
        ) : (
          <div className="space-y-4">
            {items.length === 0 && !suggestions && (
              <div className="rounded-xl border border-dashed border-[#1a2b4a]/20 p-4 text-center">
                <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">You haven&apos;t set up a rhythm yet.</p>
                <p className="text-xs text-[#7a8a99] mt-1">Add your own routines below, or let {name} suggest a starting rhythm for your business.</p>
              </div>
            )}
            {(["daily", "weekly", "monthly"] as Cadence[]).map((c) => {
              const list = items.filter((i) => i.cadence === c);
              if (!list.length) return null;
              return (
                <div key={c} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: COLORS[c] }} />
                    <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS[c] }}>{LABELS[c]}</h3>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {list.map((it) => (
                      <li key={it.id} className="group flex items-center gap-2 text-sm">
                        {it.dueToday ? (
                          <button onClick={() => toggle(it)} aria-label={it.doneToday ? `Mark ${it.title} not done` : `Mark ${it.title} done`} className="flex-shrink-0">
                            {it.doneToday ? <CheckCircle2 className="w-4 h-4 text-[#4a9b9b]" /> : <Circle className="w-4 h-4 text-[#b8a898]" />}
                          </button>
                        ) : (
                          <span className="w-4 h-4 flex-shrink-0" aria-hidden />
                        )}
                        <span className={`flex-1 min-w-0 ${it.doneToday ? "line-through text-[#b8a898]" : it.dueToday ? "text-[#1a2b4a] dark:text-[#F8F5F0]" : "text-[#7a8a99]"}`}>{it.title}</span>
                        <span className="text-[11px] text-[#7a8a99] whitespace-nowrap">{it.dueToday ? "due today" : it.schedule}</span>
                        <button onClick={() => remove(it.id)} aria-label={`Remove ${it.title}`} className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[#b06a5a]"><Trash2 className="w-3.5 h-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {suggestions && (
              <div className="rounded-xl border border-[#2E7C83]/25 bg-[#F1F7F7] dark:bg-[#12303a] p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[#12303a] dark:text-[#F8F5F0]">{name}&apos;s suggested rhythm — untick what you don&apos;t want</p>
                  <button onClick={() => setSuggestions(null)} aria-label="Close suggestions"><X className="w-4 h-4 text-[#7a8a99]" /></button>
                </div>
                <ul className="space-y-1.5">
                  {suggestions.map((s, n) => (
                    <li key={n} className="flex items-start gap-2 text-sm">
                      <input type="checkbox" className="mt-1" checked={!!s.on} onChange={(e) => setSuggestions((p) => (p ? p.map((x, i) => (i === n ? { ...x, on: e.target.checked } : x)) : p))} aria-label={s.title} />
                      <span className="flex-1 text-[#1a2b4a] dark:text-[#F8F5F0]">
                        <span className="font-medium">{s.title}</span>{" "}
                        <span className="text-xs text-[#7a8a99]">· {s.cadence === "weekly" ? `Weekly, ${DOW[s.daysOfWeek[0] ?? 1]}s` : s.cadence === "monthly" ? `Monthly on the ${s.dayOfMonth}${["th", "st", "nd", "rd"][((s.dayOfMonth ?? 1) % 10 > 3 || [11, 12, 13].includes(s.dayOfMonth ?? 1)) ? 0 : (s.dayOfMonth ?? 1) % 10]}` : "Every day"}{s.why ? ` · ${s.why}` : ""}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <button onClick={addSuggested} disabled={busy || !suggestions.some((s) => s.on)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-[#1a2b4a] text-white hover:bg-[#1a2b4a]/90 disabled:opacity-60">
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />} Add {suggestions.filter((s) => s.on).length} to my rhythm
                </button>
              </div>
            )}

            {adding ? (
              <div className="rounded-xl border border-[#1a2b4a]/12 p-3 space-y-2">
                <input aria-label="Routine" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="e.g. Review my pipeline" className="w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]" autoFocus />
                <div className="flex flex-wrap items-center gap-2">
                  <select aria-label="How often" value={form.cadence} onChange={(e) => setForm({ ...form, cadence: e.target.value as Cadence })} className="h-9 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]">
                    <option value="daily">Every day</option><option value="weekly">Every week</option><option value="monthly">Every month</option>
                  </select>
                  {form.cadence === "weekly" && (
                    <select aria-label="Day of the week" value={form.dow} onChange={(e) => setForm({ ...form, dow: Number(e.target.value) })} className="h-9 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]">
                      {DOW.map((d, i) => <option key={d} value={i}>{d}</option>)}
                    </select>
                  )}
                  {form.cadence === "monthly" && (
                    <select aria-label="Day of the month" value={form.dom} onChange={(e) => setForm({ ...form, dom: Number(e.target.value) })} className="h-9 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]">
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>the {d}{d % 10 === 1 && d !== 11 ? "st" : d % 10 === 2 && d !== 12 ? "nd" : d % 10 === 3 && d !== 13 ? "rd" : "th"}</option>)}
                    </select>
                  )}
                  <button onClick={add} disabled={busy || !form.title.trim()} className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60">{busy && <Loader2 className="w-4 h-4 animate-spin" />} Add</button>
                  <button onClick={() => setAdding(false)} className="text-sm text-[#7a8a99]">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"><Plus className="w-4 h-4" /> Add a routine</button>
                <button onClick={suggest} disabled={suggesting} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-[#2E7C83]/40 text-[#2E7C83] hover:bg-[#2E7C83]/10 disabled:opacity-60">
                  {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {suggesting ? "Thinking…" : `Suggest a rhythm with ${name}`}
                </button>
              </div>
            )}
            {note && <p className="text-xs text-[#8a6a15]">{note} <Link href="/settings?tab=ai" className="underline">AI settings</Link></p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
