"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Circle, ListPlus } from "lucide-react";

interface Item { title: string; done: boolean; mine: boolean }
interface Ev { id: string; kind: "masterclass" | "incubator"; title: string; date: string; status: "scheduled" | "active" | "done"; total: number; done: number; items: Item[] }

const TABS = [
  { id: "incubator" as const, label: "LifeCharter", hint: "The LifeCharter Incubator sessions." },
  { id: "masterclass" as const, label: "LifeCharter Command Suite", hint: "The Command Suite MasterClass sessions." },
];
const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const STATUS = {
  active: { label: "In your task list now", tone: "bg-[#2c6b3f]/15 text-[#1f4d2d] dark:text-[#8fd6a5]" },
  scheduled: { label: "Waiting its turn", tone: "bg-[#c9a227]/20 text-[#7a5a12] dark:text-[#e8c766]" },
  done: { label: "Held", tone: "bg-[#1a2b4a]/10 text-[#1a2b4a] dark:text-[#F8F5F0]" },
} as const;

export default function SessionChecklists() {
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [tab, setTab] = useState<"incubator" | "masterclass">("masterclass");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    fetch("/api/session-checklists", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d) => {
        const evs = (d.events ?? []) as Ev[];
        setEvents(evs);
        setOpen((o) => {
          if (Object.keys(o).length) return o;
          const first: Record<string, boolean> = {};
          for (const k of ["incubator", "masterclass"]) {
            const act = evs.find((e) => e.kind === k && e.status === "active") ?? evs.find((e) => e.kind === k && e.status === "scheduled");
            if (act) first[act.id] = true;
          }
          return first;
        });
      })
      .catch(() => setMsg("Couldn't load the sessions. Refresh to try again."));
  }, []);
  useEffect(load, [load]);

  const shown = useMemo(() => (events ?? []).filter((e) => e.kind === tab), [events, tab]);

  async function activate(id: string) {
    setBusy(id);
    setMsg("");
    try {
      const r = await fetch("/api/session-checklists/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: id }) });
      const d = await r.json().catch(() => ({}));
      setMsg(r.ok ? `Added ${d.added ?? 0} tasks to your task list.` : d.error || "Couldn't add it.");
      load();
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-serif text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Session Checklists</h1>
      <p className="mt-1 max-w-3xl text-sm text-[#7a8a99] dark:text-[#b8c2cf]">
        The whole picture for every session. The session coming up is in your task list; the later ones wait here and are added the morning after the one before it is held. Tick things off on the Tasks page and they show here.
      </p>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Sessions">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${tab === t.id ? "bg-[#1a2b4a] text-white dark:bg-[#c9a227] dark:text-[#1a2b4a]" : "border border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-[#7a8a99] dark:text-[#b8c2cf]">{TABS.find((t) => t.id === tab)?.hint}</p>
      {msg && <p className="mt-3 text-sm text-[#2E7C83]" role="status">{msg}</p>}
      {!events && !msg && <p className="mt-6 text-sm text-[#7a8a99]">Loading…</p>}
      {events && shown.length === 0 && <p className="mt-6 text-sm text-[#7a8a99]">No sessions here yet.</p>}

      <div className="mt-4 space-y-3">
        {shown.map((e) => {
          const pct = e.total ? Math.round((e.done / e.total) * 100) : 0;
          const s = STATUS[e.status];
          return (
            <section key={e.id} className="overflow-hidden rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40">
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [e.id]: !o[e.id] }))} aria-expanded={!!open[e.id]} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left">
                <span className="min-w-0 flex-1 basis-56">
                  <span className="block font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{e.title}</span>
                  <span className="block text-xs text-[#7a8a99] dark:text-[#b8c2cf]">{fmt(e.date)}</span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.tone}`}>{s.label}</span>
                <span className="text-xs tabular-nums text-[#7a8a99] dark:text-[#b8c2cf]">
                  {e.done} of {e.total} done{e.total ? ` · ${pct}%` : ""}
                </span>
                <ChevronDown className={`h-4 w-4 text-[#7a8a99] transition-transform ${open[e.id] ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {open[e.id] && (
                <div className="border-t border-[#1a2b4a]/10 px-4 py-3">
                  {e.status === "scheduled" && (
                    <button
                      type="button"
                      onClick={() => activate(e.id)}
                      disabled={busy === e.id}
                      className="mb-3 inline-flex items-center gap-2 rounded-lg bg-[#1a2b4a] px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-[#c9a227] dark:text-[#1a2b4a]"
                    >
                      <ListPlus className="h-4 w-4" aria-hidden /> {busy === e.id ? "Adding…" : "Add to my task list now"}
                    </button>
                  )}
                  {e.items.length === 0 ? (
                    <p className="text-sm text-[#7a8a99]">No steps.</p>
                  ) : (
                    <ol className="space-y-1.5">
                      {e.items.map((i, n) => (
                        <li key={n} className="flex items-start gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                          {i.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2c6b3f] dark:text-[#8fd6a5]" aria-hidden /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#b8a898]" aria-hidden />}
                          <span className={i.done ? "text-[#7a8a99] line-through" : ""}>{i.title}</span>
                          {i.mine && <span className="ml-auto shrink-0 rounded-full bg-[#2E7C83]/15 px-2 py-0.5 text-[11px] text-[#1f5a60] dark:text-[#7fd0d6]">Claude</span>}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
