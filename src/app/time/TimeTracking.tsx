"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Play, Plus, Square, Timer, Trash2 } from "lucide-react";
import ContactLookupInput, { lookupName, type LookupContact } from "@/components/crm/ContactLookupInput";
import { hm, minutesOf, totals, weekStart } from "@/lib/timeTracking";

type Entry = { id: string; person_email: string; contact_id: string | null; project_id: string | null; task_id: number | null; note: string | null; started_at: string; ended_at: string | null; billable: boolean; rate: number | null };
type Data = {
  me: string;
  entries: Entry[];
  running: Entry | null;
  settings: { weeklyCapacityHours: number; defaultRate: number | null; clientRates: Record<string, number> };
  contacts: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  tasks: { id: number; title: string; project_id: string | null }[];
};

const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-[0_8px_24px_rgba(26,43,74,0.08)] dark:border-white/10 dark:bg-[#1a2b4a]/40";
const label = "block text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898] mb-1";
const input = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/15 px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] hover:bg-[#1a2b4a]/5 disabled:opacity-50 dark:text-[#F8F5F0]";
const primary = "inline-flex items-center gap-1.5 rounded-full bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
const h2 = "mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]";
const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA");

type Links = { contact: LookupContact | null; contactText: string; projectId: string; taskId: string; note: string; billable: boolean };
const EMPTY: Links = { contact: null, contactText: "", projectId: "", taskId: "", note: "", billable: true };

function LinkFields({ v, set, d, idp }: { v: Links; set: (x: Links) => void; d: Data; idp: string }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div><label className={label} htmlFor={`${idp}-client`}>Client (optional)</label><ContactLookupInput id={`${idp}-client`} value={v.contactText} onChange={(t) => set({ ...v, contactText: t, contact: null })} onPick={(c) => set({ ...v, contact: c, contactText: lookupName(c) })} placeholder="Name or email" className={input} pickLabel="Choose" /></div>
      <div><label className={label} htmlFor={`${idp}-proj`}>Project (optional)</label><select id={`${idp}-proj`} className={input} value={v.projectId} onChange={(e) => set({ ...v, projectId: e.target.value })}><option value="">None</option>{d.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <div><label className={label} htmlFor={`${idp}-task`}>Task (optional)</label><select id={`${idp}-task`} className={input} value={v.taskId} onChange={(e) => set({ ...v, taskId: e.target.value })}><option value="">None</option>{d.tasks.filter((t) => !v.projectId || t.project_id === v.projectId).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
      <div><label className={label} htmlFor={`${idp}-note`}>What you worked on</label><input id={`${idp}-note`} className={input} value={v.note} onChange={(e) => set({ ...v, note: e.target.value })} placeholder="Strategy session prep" /></div>
      <label className="flex items-center gap-2 text-sm md:col-span-2 xl:col-span-4"><input type="checkbox" checked={v.billable} onChange={(e) => set({ ...v, billable: e.target.checked })} />Billable</label>
    </div>
  );
}

export default function TimeTracking() {
  const [week, setWeek] = useState(() => weekStart());
  const [d, setD] = useState<Data | null>(null);
  const [mineOnly, setMineOnly] = useState(true);
  const [start, setStart] = useState<Links>(EMPTY);
  const [manual, setManual] = useState<Links & { date: string; time: string; hours: string; minutes: string }>({ ...EMPTY, date: new Date().toLocaleDateString("en-CA"), time: "09:00", hours: "1", minutes: "0" });
  const [settings, setSettings] = useState<{ cap: string; rate: string } | null>(null);
  const [rateFor, setRateFor] = useState<{ c: LookupContact | null; text: string; rate: string }>({ c: null, text: "", rate: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    const to = new Date(week.getTime() + 7 * 86_400_000);
    const j = (await fetch(`/api/time?from=${week.toISOString()}&to=${to.toISOString()}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null)) as Data | null;
    if (j) {
      setD(j);
      setSettings((s) => s ?? { cap: String(j.settings.weeklyCapacityHours), rate: j.settings.defaultRate == null ? "" : String(j.settings.defaultRate) });
    }
  }, [week]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const act = async (body: Record<string, unknown>, ok?: string) => {
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/time", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setMsg(j.error || "That didn't work.");
      return false;
    }
    if (ok) setMsg(ok);
    await load();
    return true;
  };
  const linkBody = (v: Links) => ({ contactId: v.contact?.id ?? null, projectId: v.projectId || null, taskId: v.taskId ? Number(v.taskId) : null, note: v.note, billable: v.billable });

  const entries = useMemo(() => (d?.entries ?? []).filter((e) => !mineOnly || e.person_email === d?.me), [d, mineOnly]);
  const t = totals(entries);
  const capMin = (d?.settings.weeklyCapacityHours ?? 30) * 60;
  const name = (id: string | null, list: { id: string | number; name?: string; title?: string }[]) => (id == null ? null : list.find((x) => String(x.id) === String(id))?.name ?? list.find((x) => String(x.id) === String(id))?.title ?? null);
  const groups = useMemo(() => {
    const by = (key: (e: Entry) => string | null, label: (k: string) => string) => {
      const m = new Map<string, Entry[]>();
      for (const e of entries) {
        const k = key(e) ?? "";
        m.set(k, [...(m.get(k) ?? []), e]);
      }
      return Array.from(m.entries()).map(([k, es]) => ({ k, label: k ? label(k) : "Not linked", ...totals(es) })).sort((a, b) => b.min - a.min);
    };
    return {
      clients: by((e) => e.contact_id, (k) => d?.contacts.find((c) => c.id === k)?.name ?? "A client"),
      projects: by((e) => e.project_id, (k) => d?.projects.find((p) => p.id === k)?.name ?? "A project"),
    };
  }, [entries, d]);
  const days = useMemo(() => {
    const m = new Map<string, Entry[]>();
    for (const e of entries) m.set(dayKey(e.started_at), [...(m.get(dayKey(e.started_at)) ?? []), e]);
    return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  function exportCsv() {
    const rows = [["Date", "Person", "Client", "Project", "Task", "Note", "Minutes", "Hours", "Billable", "Rate", "Amount"]];
    for (const e of entries) {
      const m = minutesOf(e);
      rows.push([dayKey(e.started_at), e.person_email, name(e.contact_id, d!.contacts) ?? "", name(e.project_id, d!.projects) ?? "", (e.task_id && d!.tasks.find((x) => x.id === e.task_id)?.title) || "", e.note ?? "", String(m), (m / 60).toFixed(2), e.billable ? "yes" : "no", e.rate == null ? "" : String(e.rate), e.billable && e.rate ? ((m / 60) * e.rate).toFixed(2) : ""]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `time-${week.toLocaleDateString("en-CA")}.csv`;
    a.click();
  }

  const weekLabel = `${week.toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${new Date(week.getTime() + 6 * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  const run = d?.running;

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6">
      <header className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1a2b4a] to-[#2E7C83]"><Timer className="h-6 w-6 text-white" /></div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Daily Operations</p>
          <h1 className="text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Time</h1>
          <p className="mt-1 max-w-3xl text-[15px] text-[#5b5f73] dark:text-[#b8a898]">Track the hours you spend for each client, project and task, see how full your week is, and know what is billable.</p>
        </div>
      </header>
      {msg && <p className="rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm" role="status">{msg}</p>}

      <section className={card}>
        {run ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2E7C83]">Timer running</p>
              <p className="text-3xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(minutesOf(run))}</p>
              <p className="text-sm text-[#5b5f73] dark:text-[#b8a898]">{[name(run.contact_id, d!.contacts), name(run.project_id, d!.projects), run.note].filter(Boolean).join(" · ") || "Not linked"}{run.billable ? "" : " · not billable"}</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-[#8a2f2f] px-5 py-2.5 font-semibold text-white disabled:opacity-50" disabled={busy} onClick={() => void act({ action: "stop" }, "Timer stopped and saved.")}><Square className="h-4 w-4" />Stop</button>
          </div>
        ) : (
          <>
            <h2 className={h2}>Start a timer</h2>
            {d && <LinkFields v={start} set={setStart} d={d} idp="st" />}
            <button className={`${primary} mt-3`} disabled={busy || !d} onClick={async () => { if (await act({ action: "start", ...linkBody(start) }, "Timer started.")) setStart(EMPTY); }}><Play className="h-4 w-4" />Start</button>
          </>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className={btn} aria-label="Previous week" onClick={() => setWeek(new Date(week.getTime() - 7 * 86_400_000))}><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{weekLabel}</span>
          <button className={btn} aria-label="Next week" onClick={() => setWeek(new Date(week.getTime() + 7 * 86_400_000))}><ChevronRight className="h-4 w-4" /></button>
          <button className={btn} onClick={() => setWeek(weekStart())}>This week</button>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />Only my time</label>
          <button className={btn} disabled={!entries.length} onClick={exportCsv}><Download className="h-3.5 w-3.5" />Download CSV</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={card}>
          <p className={label}>This week</p>
          <p className="text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(t.min)}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1a2b4a]/10"><div className={`h-full rounded-full ${t.min > capMin ? "bg-[#b06a5a]" : "bg-[#2E7C83]"}`} style={{ width: `${Math.min(100, (t.min / Math.max(1, capMin)) * 100)}%` }} /></div>
          <p className="mt-1 text-xs text-[#7b6b8d]">{Math.round((t.min / Math.max(1, capMin)) * 100)}% of your {d?.settings.weeklyCapacityHours ?? 30}-hour week{t.min > capMin ? " · over capacity" : ""}</p>
        </div>
        <div className={card}><p className={label}>Billable</p><p className="text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{hm(t.billMin)}</p><p className="mt-1 text-xs text-[#7b6b8d]">{t.min ? Math.round((t.billMin / t.min) * 100) : 0}% of your time</p></div>
        <div className={card}><p className={label}>Billable value</p><p className="text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(t.amount)}</p><p className="mt-1 text-xs text-[#7b6b8d]">At the rates on each entry</p></div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {(["clients", "projects"] as const).map((k) => (
          <section key={k} className={card}>
            <h2 className={h2}>By {k === "clients" ? "client" : "project"}</h2>
            {!groups[k].length ? <p className="text-sm text-[#7b6b8d]">No time this week.</p> : (
              <ul className="space-y-2 text-sm">
                {groups[k].map((g) => (
                  <li key={g.k || "none"}>
                    <div className="flex items-baseline justify-between gap-2"><span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{g.label}</span><span className="tabular-nums text-[#5b5f73]">{hm(g.min)}{g.amount ? ` · ${usd(g.amount)}` : ""}</span></div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#1a2b4a]/10"><div className="h-full rounded-full bg-[#c9a227]" style={{ width: `${(g.min / Math.max(1, t.min)) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <section className={card}>
        <h2 className={h2}>Entries</h2>
        {!days.length && <p className="text-sm text-[#7b6b8d]">Nothing tracked this week yet.</p>}
        <div className="space-y-4">
          {days.map(([day, es]) => (
            <div key={day}>
              <p className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wide text-[#7b6b8d]"><span>{new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span><span className="tabular-nums">{hm(totals(es).min)}</span></p>
              <ul className="divide-y divide-[#1a2b4a]/10 text-sm">
                {es.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="min-w-0">
                      <span className="font-semibold tabular-nums">{e.ended_at ? hm(minutesOf(e)) : "running"}</span>
                      <span className="text-[#5b5f73] dark:text-[#b8a898]"> · {[name(e.contact_id, d!.contacts), name(e.project_id, d!.projects), e.note].filter(Boolean).join(" · ") || "Not linked"}</span>
                      <span className="text-xs text-[#7b6b8d]"> · {new Date(e.started_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}{e.person_email !== d!.me ? ` · ${e.person_email}` : ""}{e.billable ? (e.rate ? ` · ${usd(e.rate)}/h` : " · billable") : " · not billable"}</span>
                    </span>
                    {e.ended_at && (
                      <span className="flex items-center gap-1">
                        <label className="flex items-center gap-1 text-xs">Min<input aria-label="Minutes" inputMode="numeric" className="w-16 rounded border border-[#1a2b4a]/15 bg-transparent px-1.5 py-0.5 text-xs" defaultValue={minutesOf(e)} onBlur={(x) => { const m = Number(x.target.value); if (m > 0 && m !== minutesOf(e)) void act({ action: "update", id: e.id, minutes: m }); }} /></label>
                        <button className={btn} disabled={busy} onClick={() => void act({ action: "update", id: e.id, billable: !e.billable })}>{e.billable ? "Billable" : "Not billable"}</button>
                        <button className={btn} aria-label="Delete entry" disabled={busy} onClick={() => void act({ action: "delete", id: e.id })}><Trash2 className="h-3.5 w-3.5" /></button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>Add time by hand</h2>
        {d && <LinkFields v={manual} set={(x) => setManual({ ...manual, ...x })} d={d} idp="mn" />}
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <div><label className={label} htmlFor="mn-date">Date</label><input id="mn-date" type="date" className={input} value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} /></div>
          <div><label className={label} htmlFor="mn-time">Started at</label><input id="mn-time" type="time" className={input} value={manual.time} onChange={(e) => setManual({ ...manual, time: e.target.value })} /></div>
          <div><label className={label} htmlFor="mn-h">Hours</label><input id="mn-h" inputMode="numeric" className={input} value={manual.hours} onChange={(e) => setManual({ ...manual, hours: e.target.value })} /></div>
          <div><label className={label} htmlFor="mn-m">Minutes</label><input id="mn-m" inputMode="numeric" className={input} value={manual.minutes} onChange={(e) => setManual({ ...manual, minutes: e.target.value })} /></div>
        </div>
        <button className={`${primary} mt-3`} disabled={busy || !d} onClick={async () => { const minutes = (Number(manual.hours) || 0) * 60 + (Number(manual.minutes) || 0); if (await act({ action: "add", ...linkBody(manual), startedAt: new Date(`${manual.date}T${manual.time}`).toISOString(), minutes }, "Time added.")) setManual({ ...manual, ...EMPTY }); }}><Plus className="h-4 w-4" />Add time</button>
      </section>

      {settings && d && (
        <section className={card}>
          <h2 className={h2}>Capacity and rates</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div><label className={label} htmlFor="cap">Hours you want to work each week</label><input id="cap" inputMode="decimal" className={input} value={settings.cap} onChange={(e) => setSettings({ ...settings, cap: e.target.value })} /></div>
            <div><label className={label} htmlFor="rate">Default hourly rate ($, optional)</label><input id="rate" inputMode="decimal" className={input} value={settings.rate} onChange={(e) => setSettings({ ...settings, rate: e.target.value })} /></div>
          </div>
          <p className={`${label} mt-4`}>Rates for particular clients</p>
          <ul className="mb-2 space-y-1 text-sm">
            {Object.entries(d.settings.clientRates).map(([cid, r]) => (
              <li key={cid} className="flex items-center justify-between gap-2"><span>{d.contacts.find((c) => c.id === cid)?.name ?? "A client"} · {usd(r)}/h</span><button className={btn} onClick={() => { const next = { ...d.settings.clientRates }; delete next[cid]; void act({ action: "settings", weeklyCapacityHours: Number(settings.cap), defaultRate: settings.rate, clientRates: next }, "Rate removed."); }}>Remove</button></li>
            ))}
          </ul>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1"><label className={label} htmlFor="cr-client">Client</label><ContactLookupInput id="cr-client" value={rateFor.text} onChange={(x) => setRateFor({ ...rateFor, text: x, c: null })} onPick={(c) => setRateFor({ ...rateFor, c, text: lookupName(c) })} placeholder="Name or email" className={input} pickLabel="Choose" /></div>
            <div><label className={label} htmlFor="cr-rate">Rate ($/h)</label><input id="cr-rate" inputMode="decimal" className={input} value={rateFor.rate} onChange={(e) => setRateFor({ ...rateFor, rate: e.target.value })} /></div>
          </div>
          <button className={`${primary} mt-3`} disabled={busy} onClick={async () => { const next = { ...d.settings.clientRates, ...(rateFor.c && Number(rateFor.rate) >= 0 && rateFor.rate !== "" ? { [rateFor.c.id]: Number(rateFor.rate) } : {}) }; if (await act({ action: "settings", weeklyCapacityHours: Number(settings.cap), defaultRate: settings.rate, clientRates: next }, "Saved. New entries use these rates.")) setRateFor({ c: null, text: "", rate: "" }); }}>Save capacity and rates</button>
        </section>
      )}
    </div>
  );
}
