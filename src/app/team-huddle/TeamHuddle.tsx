"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, ListPlus, Loader2, Mail, Plus, Sparkles, Timer, Trash2, Upload } from "lucide-react";
import { HUDDLE_MAX_MINUTES, totalMinutes, type AgendaSection, type Huddle, type HuddleAction, type HuddleSummary } from "@/lib/teamHuddle";

interface Settings { title: string; max_minutes: number; weekday: number | null; start_time: string }
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Me { email: string; owner: boolean; canEdit: boolean; viewAs?: boolean }
interface Access { email: string; name: string | null; can_edit: boolean }
type Row = Huddle & { transcript_len?: number };

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const mmss = (s: number) => `${Math.floor(Math.abs(s) / 60)}:${String(Math.abs(s) % 60).padStart(2, "0")}`;

// A Zoom / Teams transcript file (.vtt or .srt) is mostly timestamps; keep the words and the speaker names.
function cleanTranscriptFile(name: string, text: string): string {
  if (!/\.(vtt|srt)$/i.test(name)) return text;
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim() && !/^WEBVTT/i.test(l) && !/^\d+$/.test(l.trim()) && !/-->/.test(l) && !/^NOTE\b/i.test(l))
    .join("\n");
}

const field =
  "w-full rounded-lg border border-[#d9d2c0] dark:border-[#34405f] bg-white dark:bg-[#141b33] px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0] placeholder:text-[#8a8f9c] focus:outline-none focus:border-[#c9a227] disabled:opacity-70 disabled:cursor-not-allowed";
const card = "rounded-2xl border border-[#e3dccd] dark:border-[#2b3b5c] bg-white dark:bg-[#16233b] p-4 sm:p-5";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#c9a227] px-3.5 py-1.5 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#c9a227]/15 disabled:opacity-50";
const btnGold = "inline-flex items-center gap-1.5 rounded-full bg-[#1a2b4a] dark:bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#F8F5F0] dark:text-[#14203a] hover:opacity-90 disabled:opacity-50";
const iconBtn = "rounded-full p-1.5 text-[#5d6b7a] hover:bg-[#c9a227]/15 hover:text-[#1a2b4a] dark:hover:text-[#F8F5F0] disabled:opacity-40";

export default function TeamHuddle({ bare = false }: { bare?: boolean }) {
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [access, setAccess] = useState<Access[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [cur, setCur] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareName, setShareName] = useState("");
  const [sentIds, setSentIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>({ title: "Weekly Team Huddle", max_minutes: HUDDLE_MAX_MINUTES, weekday: null, start_time: "08:00" });
  const [names, setNames] = useState<string[]>(["Everyone"]);
  const [showSettings, setShowSettings] = useState(false);
  const via = bare ? "share" : undefined;
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The run-it timer: total elapsed and the section we are on.
  const [run, setRun] = useState<{ startedAt: number; secIdx: number; secStartedAt: number } | null>(null);
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!run) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [run]);

  const canEdit = me?.canEdit === true;
  const owner = me?.owner === true;

  const loadList = useCallback(async (keep?: string | null) => {
    try {
      const r = await fetch(`/api/team-huddle${bare ? "?via=share" : ""}`, { cache: "no-store" });
      if (!r.ok) throw new Error(r.status === 404 ? "This page is shared by invitation. Ask the person who runs the account to add your email." : "Couldn't load the huddles.");
      const d = await r.json();
      setMe(d.me);
      setRows(d.huddles);
      setAccess(d.access ?? []);
      if (d.settings) setSettings(d.settings);
      if (Array.isArray(d.names)) setNames(d.names);
      const pick = keep ?? (d.huddles.find((h: Row) => h.status === "upcoming")?.id ?? d.huddles[0]?.id ?? null);
      setSelId(pick);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load.");
    }
  }, [bare]);
  useEffect(() => { void loadList(); }, [loadList]);

  // Load the chosen call in full (Babs also gets the transcript text).
  useEffect(() => {
    if (!selId) { setCur(null); return; }
    let live = true;
    (async () => {
      const r = await fetch(`/api/team-huddle?id=${selId}${bare ? "&via=share" : ""}`, { cache: "no-store" });
      if (!live || !r.ok) return;
      const d = await r.json();
      dirty.current = false;
      setCur(d.huddle);
      setRun(null);
    })();
    return () => { live = false; };
  }, [selId, bare]);

  // Autosave: any edit is saved about a second after the last keystroke.
  const save = useCallback(async (h: Row, withTranscript = false) => {
    setSaving("saving");
    const patch: Record<string, unknown> = {
      call_date: h.call_date, start_time: h.start_time, title: h.title, status: h.status,
      agenda: h.agenda, actions: h.actions, notes: h.notes, recording_url: h.recording_url,
    };
    if (withTranscript) patch.transcript = h.transcript;
    const r = await fetch("/api/team-huddle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", id: h.id, patch, via }) });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "Couldn't save. Your last change may not be kept.");
      setSaving("idle");
      return;
    }
    dirty.current = false;
    setSaving("saved");
    setRows((rs) => rs.map((x) => (x.id === h.id ? { ...x, call_date: h.call_date, title: h.title, status: h.status, start_time: h.start_time } : x)));
    setTimeout(() => setSaving((s) => (s === "saved" ? "idle" : s)), 1800);
  }, [via]);

  const edit = (fn: (h: Row) => Row, withTranscript = false) => {
    if (!cur || !canEdit) return;
    const next = fn(cur);
    setCur(next);
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(next, withTranscript), 900);
  };

  const total = useMemo(() => (cur ? totalMinutes(cur.agenda) : 0), [cur]);
  const limit = settings.max_minutes;
  const over = total > limit;

  async function post(body: Record<string, unknown>) {
    const r = await fetch("/api/team-huddle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, via }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Something went wrong.");
    return d;
  }

  async function newHuddle() {
    setBusy("new"); setNote(""); setError("");
    try {
      const d = await post({ action: "create" });
      setRows((rs) => [d.huddle, ...rs]);
      setSelId(d.huddle.id);
      setNote(d.carried ? `New huddle created. ${d.carried} open to-do${d.carried === 1 ? "" : "s"} carried over from the last call.` : "New huddle created from your agenda template.");
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't create."); }
    setBusy("");
  }

  async function removeHuddle() {
    if (!cur || !window.confirm("Delete this huddle, its to-dos and its transcript? This can't be undone.")) return;
    setBusy("del");
    try {
      await post({ action: "delete", id: cur.id });
      const rest = rows.filter((r) => r.id !== cur.id);
      setRows(rest);
      setSelId(rest[0]?.id ?? null);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't delete."); }
    setBusy("");
  }

  async function summarize() {
    if (!cur) return;
    setBusy("sum"); setNote(""); setError("");
    try {
      if (timer.current) clearTimeout(timer.current);
      await save(cur, true);
      const r = await fetch("/api/team-huddle/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cur.id, via }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't write the summary.");
      setCur({ ...cur, summary: d.summary as HuddleSummary, status: "done" });
      setNote(d.clipped ? "Summary written from the first part of a very long transcript." : "Summary written. Review it, then add the to-dos you want.");
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't summarize."); }
    setBusy("");
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    if (/\.(docx|pdf|doc)$/i.test(file.name)) { setError("Save the transcript as a .txt or .vtt file, or paste the text. Word and PDF files can't be read here."); return; }
    const text = cleanTranscriptFile(file.name, await file.text());
    edit((h) => ({ ...h, transcript: text.slice(0, 200000) }), true);
    setNote(`Loaded ${file.name}. Press "Create summary and to-dos" when you're ready.`);
  }

  async function share(action: "share-add" | "share-edit" | "share-remove", email: string, canEditFlag = false, name = "") {
    setBusy("share"); setError("");
    try {
      await post({ action, email, canEdit: canEditFlag, name });
      await loadList(selId);
      if (action === "share-add") { setShareEmail(""); setShareName(""); }
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't update sharing."); }
    setBusy("");
  }

  async function saveSettings(next: Settings) {
    setBusy("settings"); setError(""); setNote("");
    try {
      const d = await post({ action: "settings-save", ...next });
      setSettings(d.settings as Settings);
      setNote("Saved. New huddles will use these settings.");
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't save."); }
    setBusy("");
  }

  async function saveTemplate(reset: boolean) {
    if (!cur) return;
    setBusy("template"); setError(""); setNote("");
    try {
      if (timer.current) clearTimeout(timer.current);
      if (!reset) await save(cur);
      await post(reset ? { action: "template-reset" } : { action: "template-save", id: cur.id });
      setNote(reset ? "New huddles will start from the standard agenda again." : "Saved. Every new huddle will start from this agenda.");
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't save the template."); }
    setBusy("");
  }

  async function emailTest() {
    if (!cur) return;
    setBusy("test"); setNote(""); setError("");
    try {
      if (timer.current) clearTimeout(timer.current);
      await save(cur);
      await post({ action: "email", id: cur.id, test: true });
      setNote("Test sent to you. Only you received it; nothing has gone to your team.");
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't send the test."); }
    setBusy("");
  }

  async function emailAgenda() {
    if (!cur) return;
    if (!window.confirm(`Email this agenda to ${access.length} ${access.length === 1 ? "person" : "people"} you shared the page with?`)) return;
    setBusy("email"); setNote(""); setError("");
    try {
      if (timer.current) clearTimeout(timer.current);
      await save(cur);
      const d = await post({ action: "email", id: cur.id });
      setNote(`Agenda emailed to ${(d.sent as string[]).join(", ")}.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't send."); }
    setBusy("");
  }

  async function toTasks(a: HuddleAction) {
    if (!cur) return;
    setBusy(`task-${a.id}`); setError("");
    try {
      if (timer.current) clearTimeout(timer.current);
      await save(cur);
      await post({ action: "to-tasks", id: cur.id, actionIds: [a.id] });
      setSentIds((s) => [...s, a.id]);
      setNote("Added to LCCS Tasks.");
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't add the task."); }
    setBusy("");
  }

  // ── agenda helpers ───────────────────────────────────────────────
  const setSec = (i: number, fn: (s: AgendaSection) => AgendaSection) => edit((h) => ({ ...h, agenda: h.agenda.map((s, k) => (k === i ? fn(s) : s)) }));
  const moveSec = (i: number, d: -1 | 1) => edit((h) => {
    const a = [...h.agenda]; const j = i + d;
    if (j < 0 || j >= a.length) return h;
    [a[i], a[j]] = [a[j], a[i]];
    return { ...h, agenda: a };
  });
  const setAct = (id: string, fn: (a: HuddleAction) => HuddleAction) => edit((h) => ({ ...h, actions: h.actions.map((a) => (a.id === id ? fn(a) : a)) }));

  const timed = cur ? cur.agenda.filter((s) => s.minutes > 0) : [];
  const elapsed = run ? Math.floor((Date.now() - run.startedAt) / 1000) : 0;
  const secElapsed = run ? Math.floor((Date.now() - run.secStartedAt) / 1000) : 0;
  const runSec = run ? timed[Math.min(run.secIdx, timed.length - 1)] : null;
  const plannedBefore = run ? timed.slice(0, run.secIdx).reduce((n, s) => n + s.minutes, 0) : 0;

  if (error && !me) {
    return <div className={bare ? "min-h-screen bg-[#F8F5F0] dark:bg-[#0e1830] p-8" : "p-8"}><p className="rounded-xl border border-[#c9a227]/50 bg-[#c9a227]/10 p-4 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{error}</p></div>;
  }

  return (
    <div className={`${bare ? "min-h-screen bg-[#F8F5F0] dark:bg-[#0e1830]" : ""} px-4 sm:px-6 py-6`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#c9a227]">Your team</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1a2b4a] dark:text-[#F8F5F0]">Team Huddle</h1>
          <p className="mt-1 text-sm text-[#5d6b7a] dark:text-[#b8c2cf]">{limit} minutes, one agenda, every to-do owned. Head up. Wings out. 🦋</p>
        </div>
        {owner && <button className={btnGold} onClick={newHuddle} disabled={busy === "new"}>{busy === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} New huddle</button>}
      </div>
      {note && <p className="mt-3 rounded-lg bg-[#2c6b3f]/10 px-3 py-2 text-sm text-[#2c6b3f] dark:text-[#7cc596]">{note}</p>}
      {error && me && <p className="mt-3 rounded-lg bg-[#b3422f]/10 px-3 py-2 text-sm text-[#b3422f] dark:text-[#f09a86]">{error}</p>}

      {me?.viewAs && <p className="mt-3 rounded-lg bg-[#c9a227]/15 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">You are looking at this account's huddles as a viewer. Nothing can be changed from here.</p>}
      {owner && (
        <div className="mt-4">
          <button className={btn} onClick={() => setShowSettings((v) => !v)}>{showSettings ? "Hide settings" : "Customize for your team"}</button>
          {showSettings && (
            <div className={`${card} mt-3`}>
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="block text-xs font-semibold text-[#5d6b7a] dark:text-[#b8c2cf] sm:col-span-2">Name of your huddle
                  <input className={`${field} mt-1`} value={settings.title} onChange={(e) => setSettings({ ...settings, title: e.target.value })} />
                </label>
                <label className="block text-xs font-semibold text-[#5d6b7a] dark:text-[#b8c2cf]">Time limit (minutes)
                  <input type="number" min={5} max={120} className={`${field} mt-1`} value={settings.max_minutes} onChange={(e) => setSettings({ ...settings, max_minutes: Number(e.target.value) || 30 })} />
                </label>
                <label className="block text-xs font-semibold text-[#5d6b7a] dark:text-[#b8c2cf]">Usual start
                  <input type="time" className={`${field} mt-1`} value={settings.start_time} onChange={(e) => setSettings({ ...settings, start_time: e.target.value || "08:00" })} />
                </label>
                <label className="block text-xs font-semibold text-[#5d6b7a] dark:text-[#b8c2cf]">Usual day
                  <select className={`${field} mt-1`} value={settings.weekday ?? ""} onChange={(e) => setSettings({ ...settings, weekday: e.target.value === "" ? null : Number(e.target.value) })}>
                    <option value="">No usual day</option>
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button className={btnGold} disabled={busy === "settings"} onClick={() => void saveSettings(settings)}>Save settings</button>
                <button className={btn} disabled={!cur || busy === "template"} onClick={() => void saveTemplate(false)}>Use this agenda for every new huddle</button>
                <button className={btn} disabled={busy === "template"} onClick={() => void saveTemplate(true)}>Go back to the standard agenda</button>
              </div>
              <p className="mt-2 text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">Change the sections, minutes and prompts on any huddle below until the agenda fits how your team really meets, then press "Use this agenda for every new huddle". Open to-dos always carry over.</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* The calls */}
        <aside className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5d6b7a] dark:text-[#b8c2cf]">Calls</p>
          <ul className="space-y-2">
            {rows.length === 0 && <li className="text-sm text-[#5d6b7a] dark:text-[#b8c2cf]">{owner ? "No huddles yet. Press New huddle." : "No huddles have been shared with you yet."}</li>}
            {rows.map((r) => (
              <li key={r.id}>
                <button onClick={() => setSelId(r.id)} className={`w-full rounded-xl border px-3 py-2.5 text-left ${r.id === selId ? "border-[#c9a227] bg-[#c9a227]/10" : "border-[#e3dccd] dark:border-[#2b3b5c] bg-white dark:bg-[#16233b]"}`}>
                  <span className="block text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{fmtDate(r.call_date)}</span>
                  <span className="block truncate text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">{r.title}</span>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${r.status === "done" ? "bg-[#2c6b3f]/15 text-[#2c6b3f] dark:text-[#7cc596]" : "bg-[#c9a227]/20 text-[#7a5a12] dark:text-[#e0c35a]"}`}>{r.status === "done" ? "Done" : "Upcoming"}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* The call */}
        <section className="min-w-0 space-y-5">
          {!cur ? (
            <div className={card}><p className="text-sm text-[#5d6b7a] dark:text-[#b8c2cf]">Pick a call on the left{owner ? ", or press New huddle." : "."}</p></div>
          ) : (
            <>
              <div className={card}>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_7rem]">
                  <label className="block text-xs font-semibold text-[#5d6b7a] dark:text-[#b8c2cf]">Title
                    <input className={`${field} mt-1`} value={cur.title} disabled={!canEdit} onChange={(e) => edit((h) => ({ ...h, title: e.target.value }))} />
                  </label>
                  <label className="block text-xs font-semibold text-[#5d6b7a] dark:text-[#b8c2cf]">Date
                    <input type="date" className={`${field} mt-1`} value={cur.call_date} disabled={!canEdit} onChange={(e) => edit((h) => ({ ...h, call_date: e.target.value || h.call_date }))} />
                  </label>
                  <label className="block text-xs font-semibold text-[#5d6b7a] dark:text-[#b8c2cf]">Start (MT)
                    <input type="time" className={`${field} mt-1`} value={cur.start_time} disabled={!canEdit} onChange={(e) => edit((h) => ({ ...h, start_time: e.target.value || h.start_time }))} />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${over ? "bg-[#b3422f]/15 text-[#b3422f] dark:text-[#f09a86]" : "bg-[#2c6b3f]/15 text-[#2c6b3f] dark:text-[#7cc596]"}`}>
                    {total} / {limit} minutes
                  </span>
                  {over && <span className="text-sm text-[#b3422f] dark:text-[#f09a86]">Over your {limit}-minute limit. Trim a section or move a topic to the Parking lot.</span>}
                  <span className="ml-auto text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">
                    {saving === "saving" ? "Saving…" : saving === "saved" ? <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Saved</span> : canEdit ? "Changes save by themselves" : "View only"}
                  </span>
                  {canEdit && (
                    <button className={btn} onClick={() => edit((h) => ({ ...h, status: h.status === "done" ? "upcoming" : "done" }))}>
                      {cur.status === "done" ? "Reopen" : "Mark done"}
                    </button>
                  )}
                  {owner && <button className={btn} onClick={emailTest} disabled={busy === "test"}><Mail className="h-4 w-4" /> Send me a test</button>}
                  {owner && <button className={`${iconBtn} text-[#b3422f]`} onClick={removeHuddle} disabled={busy === "del"} aria-label="Delete this huddle"><Trash2 className="h-4 w-4" /></button>}
                </div>

                {/* Run it */}
                <div className="mt-4 rounded-xl bg-[#1a2b4a] px-4 py-3 text-[#F8F5F0]">
                  {!run ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <Timer className="h-5 w-5 text-[#c9a227]" />
                      <span className="text-sm">Run the huddle on the clock: it shows the section you are in and tells you when you are over.</span>
                      <button className="ml-auto rounded-full bg-[#c9a227] px-4 py-1.5 text-sm font-bold text-[#14203a]" onClick={() => setRun({ startedAt: Date.now(), secIdx: 0, secStartedAt: Date.now() })} disabled={timed.length === 0}>Start</button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <span className="text-2xl font-bold tabular-nums">{mmss(elapsed)}</span>
                      <span className="text-sm">of {total}:00 total</span>
                      <span className="text-sm font-semibold text-[#c9a227]">Now: {runSec?.title}</span>
                      <span className={`text-sm tabular-nums ${runSec && secElapsed > runSec.minutes * 60 ? "font-bold text-[#f09a86]" : ""}`}>
                        {mmss(secElapsed)} / {runSec?.minutes}:00{runSec && secElapsed > runSec.minutes * 60 ? ` (+${mmss(secElapsed - runSec.minutes * 60)} over)` : ""}
                      </span>
                      {elapsed > (plannedBefore + (runSec?.minutes ?? 0)) * 60 + 60 && <span className="text-xs text-[#f09a86]">Behind plan. Move something to the Parking lot.</span>}
                      <span className="ml-auto flex gap-2">
                        {run.secIdx < timed.length - 1 && <button className="rounded-full bg-[#c9a227] px-3.5 py-1.5 text-sm font-bold text-[#14203a]" onClick={() => setRun({ ...run, secIdx: run.secIdx + 1, secStartedAt: Date.now() })}>Next section</button>}
                        <button className="rounded-full border border-[#F8F5F0]/40 px-3.5 py-1.5 text-sm" onClick={() => setRun(null)}>Stop</button>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Agenda */}
              <div className="space-y-3">
                {cur.agenda.map((s, i) => {
                  const active = run && runSec?.id === s.id;
                  return (
                    <div key={s.id} className={`${card} ${active ? "ring-2 ring-[#c9a227]" : ""}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <input className={`${field} min-w-0 flex-1 font-semibold`} value={s.title} disabled={!canEdit} placeholder="Section title" onChange={(e) => setSec(i, (x) => ({ ...x, title: e.target.value }))} />
                        <label className="flex items-center gap-1.5 text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">
                          <input type="number" min={0} max={60} className={`${field} w-16 tabular-nums`} value={s.minutes} disabled={!canEdit} onChange={(e) => setSec(i, (x) => ({ ...x, minutes: Math.max(0, Math.min(60, Number(e.target.value) || 0)) }))} /> min
                        </label>
                        {canEdit && (
                          <span className="flex">
                            <button className={iconBtn} onClick={() => moveSec(i, -1)} disabled={i === 0} aria-label="Move up"><ChevronUp className="h-4 w-4" /></button>
                            <button className={iconBtn} onClick={() => moveSec(i, 1)} disabled={i === cur.agenda.length - 1} aria-label="Move down"><ChevronDown className="h-4 w-4" /></button>
                            <button className={`${iconBtn} text-[#b3422f]`} onClick={() => edit((h) => ({ ...h, agenda: h.agenda.filter((_, k) => k !== i) }))} aria-label="Remove section"><Trash2 className="h-4 w-4" /></button>
                          </span>
                        )}
                      </div>
                      <ul className="mt-3 space-y-2">
                        {s.items.map((it) => (
                          <li key={it.id} className="flex flex-wrap items-start gap-2">
                            <textarea rows={1} className={`${field} min-w-0 flex-1 resize-y`} value={it.text} disabled={!canEdit} placeholder="Agenda item" onChange={(e) => setSec(i, (x) => ({ ...x, items: x.items.map((y) => (y.id === it.id ? { ...y, text: e.target.value } : y)) }))} />
                            <input list="huddle-owners" className={`${field} w-28`} value={it.owner} disabled={!canEdit} placeholder="Owner" onChange={(e) => setSec(i, (x) => ({ ...x, items: x.items.map((y) => (y.id === it.id ? { ...y, owner: e.target.value } : y)) }))} />
                            {canEdit && <button className={`${iconBtn} text-[#b3422f]`} onClick={() => setSec(i, (x) => ({ ...x, items: x.items.filter((y) => y.id !== it.id) }))} aria-label="Remove item"><Trash2 className="h-4 w-4" /></button>}
                          </li>
                        ))}
                      </ul>
                      {canEdit && <button className={`${btn} mt-3`} onClick={() => setSec(i, (x) => ({ ...x, items: [...x.items, { id: uid(), text: "", owner: "" }] }))}><Plus className="h-3.5 w-3.5" /> Add item</button>}
                    </div>
                  );
                })}
                {canEdit && <button className={btn} onClick={() => edit((h) => ({ ...h, agenda: [...h.agenda, { id: uid(), title: "New section", minutes: 0, items: [] }] }))}><Plus className="h-4 w-4" /> Add a section</button>}
                <datalist id="huddle-owners">{names.map((o) => <option key={o} value={o} />)}</datalist>
              </div>

              {/* To-dos */}
              <div className={card}>
                <h2 className="font-serif text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">To-dos <span className="text-sm font-sans text-[#5d6b7a] dark:text-[#b8c2cf]">({cur.actions.filter((a) => !a.done && a.text.trim()).length} open)</span></h2>
                <p className="text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">One owner and a date for every item. Open to-dos carry over to the next huddle by themselves.</p>
                <ul className="mt-3 space-y-2">
                  {cur.actions.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-2">
                      <input type="checkbox" className="h-4 w-4 accent-[#2c6b3f]" checked={a.done} disabled={!canEdit} onChange={(e) => setAct(a.id, (x) => ({ ...x, done: e.target.checked }))} aria-label="Done" />
                      <input className={`${field} min-w-0 flex-1 ${a.done ? "line-through opacity-60" : ""}`} value={a.text} disabled={!canEdit} placeholder="What needs to happen" onChange={(e) => setAct(a.id, (x) => ({ ...x, text: e.target.value }))} />
                      <input list="huddle-owners" className={`${field} w-28`} value={a.owner} disabled={!canEdit} placeholder="Owner" onChange={(e) => setAct(a.id, (x) => ({ ...x, owner: e.target.value }))} />
                      <input type="date" className={`${field} w-40`} value={a.due} disabled={!canEdit} onChange={(e) => setAct(a.id, (x) => ({ ...x, due: e.target.value }))} />
                      {owner && (
                        <button className={`${iconBtn} text-xs font-semibold`} title="Add to LCCS Tasks" disabled={!a.text.trim() || sentIds.includes(a.id) || busy === `task-${a.id}`} onClick={() => toTasks(a)}>
                          {sentIds.includes(a.id) ? <Check className="h-4 w-4" /> : <ListPlus className="h-4 w-4" />}
                        </button>
                      )}
                      {canEdit && <button className={`${iconBtn} text-[#b3422f]`} onClick={() => edit((h) => ({ ...h, actions: h.actions.filter((x) => x.id !== a.id) }))} aria-label="Remove to-do"><Trash2 className="h-4 w-4" /></button>}
                    </li>
                  ))}
                </ul>
                {canEdit && <button className={`${btn} mt-3`} onClick={() => edit((h) => ({ ...h, actions: [...h.actions, { id: uid(), text: "", owner: "", due: "", done: false }] }))}><Plus className="h-3.5 w-3.5" /> Add a to-do</button>}
              </div>

              {/* Notes + recording */}
              <div className={card}>
                <h2 className="font-serif text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">Notes and recording</h2>
                <label className="mt-3 block text-xs font-semibold text-[#5d6b7a] dark:text-[#b8c2cf]">Notes from the call
                  <textarea rows={5} className={`${field} mt-1`} value={cur.notes} disabled={!canEdit} onChange={(e) => edit((h) => ({ ...h, notes: e.target.value }))} />
                </label>
                <label className="mt-3 block text-xs font-semibold text-[#5d6b7a] dark:text-[#b8c2cf]">Recording link (Zoom or Vimeo)
                  <input className={`${field} mt-1`} value={cur.recording_url} disabled={!canEdit} placeholder="https://…" onChange={(e) => edit((h) => ({ ...h, recording_url: e.target.value }))} />
                </label>
                {/^https?:\/\//.test(cur.recording_url) && <a className="mt-2 inline-block text-sm font-semibold text-[#2e7c83] underline" href={cur.recording_url} target="_blank" rel="noreferrer">Open the recording</a>}
              </div>

              {/* Transcript + summary (the person who runs the account) */}
              {owner && (
                <div className={card}>
                  <h2 className="font-serif text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">Transcript and summary</h2>
                  <p className="text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">Paste the transcript or upload the .txt or .vtt file from Zoom. The summary, wins, decisions and to-dos are written from what was said, and nothing goes anywhere until you press a button.</p>
                  <textarea rows={6} className={`${field} mt-3 font-mono text-xs`} value={cur.transcript} placeholder="Paste the transcript here…" onChange={(e) => edit((h) => ({ ...h, transcript: e.target.value }), true)} />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className={`${btn} cursor-pointer`}>
                      <Upload className="h-4 w-4" /> Upload a file
                      <input type="file" accept=".txt,.vtt,.srt,.md,text/plain" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
                    </label>
                    <button className={btnGold} onClick={summarize} disabled={busy === "sum" || cur.transcript.trim().length < 200}>
                      {busy === "sum" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Create summary and to-dos
                    </button>
                    <span className="text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">{cur.transcript.length.toLocaleString()} characters</span>
                  </div>

                  {cur.summary && (
                    <div className="mt-5 space-y-4 rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/[0.06] p-4">
                      <p className="text-sm leading-relaxed text-[#1a2b4a] dark:text-[#F8F5F0]">{cur.summary.summary}</p>
                      {([["Wins", cur.summary.wins], ["Decisions", cur.summary.decisions], ["Hot topics", cur.summary.hot_topics], ["Still open for next week", cur.summary.follow_ups]] as [string, string[]][]).map(([label, list]) =>
                        list.length ? (
                          <div key={label}>
                            <p className="text-xs font-bold uppercase tracking-wide text-[#7a5a12] dark:text-[#e0c35a]">{label}</p>
                            <ul className="mt-1 list-disc pl-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{list.map((x, k) => <li key={k}>{x}</li>)}</ul>
                          </div>
                        ) : null
                      )}
                      {cur.summary.action_items.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#7a5a12] dark:text-[#e0c35a]">To-dos found</p>
                          <ul className="mt-1 space-y-1 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                            {cur.summary.action_items.map((x, k) => <li key={k}>• {x.text}{x.owner ? ` [${x.owner}]` : ""}{x.due ? ` (due ${x.due})` : ""}</li>)}
                          </ul>
                          <button className={`${btn} mt-3`} onClick={() => {
                            const have = new Set(cur.actions.map((a) => a.text.trim().toLowerCase()));
                            const add = cur.summary!.action_items.filter((x) => !have.has(x.text.trim().toLowerCase())).map((x) => ({ id: uid(), text: x.text, owner: x.owner, due: x.due, done: false }));
                            edit((h) => ({ ...h, actions: [...h.actions, ...add] }));
                            setNote(add.length ? `${add.length} to-do${add.length === 1 ? "" : "s"} added above. Check the owners and dates.` : "Those to-dos are already on the list.");
                          }}><ListPlus className="h-4 w-4" /> Add these to the to-dos</button>
                        </div>
                      )}
                      <p className="text-[11px] text-[#5d6b7a] dark:text-[#b8c2cf]">Written by AI from the transcript on {new Date(cur.summary.made_at).toLocaleString("en-US", { timeZone: "America/Denver" })} MT. Read it before you share it.</p>
                    </div>
                  )}
                </div>
              )}
              {!owner && cur.summary && (
                <div className={card}>
                  <h2 className="font-serif text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">Summary</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#1a2b4a] dark:text-[#F8F5F0]">{cur.summary.summary}</p>
                </div>
              )}
            </>
          )}

          {/* Sharing (the person who runs the account) */}
          {owner && (
            <div className={card}>
              <h2 className="font-serif text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">Who can open this page</h2>
              <p className="text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">Give someone access by the email they sign in with. They open <span className="font-mono">/huddle</span> after signing in. Tick Can edit to let them change the agenda and to-dos; otherwise they can read it. People you have already invited to your team can open this page from their own menu.</p>
              <ul className="mt-3 divide-y divide-[#e3dccd] dark:divide-[#2b3b5c]">
                {access.length === 0 && <li className="py-2 text-sm text-[#5d6b7a] dark:text-[#b8c2cf]">Nobody yet.</li>}
                {access.map((p) => (
                  <li key={p.email} className="flex flex-wrap items-center gap-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                    <span className="min-w-0 flex-1 truncate">{p.name ? `${p.name} · ` : ""}{p.email}</span>
                    <label className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" className="h-4 w-4 accent-[#c9a227]" checked={p.can_edit} onChange={(e) => void share("share-edit", p.email, e.target.checked)} /> Can edit
                    </label>
                    <button className={`${iconBtn} text-[#b3422f]`} onClick={() => void share("share-remove", p.email)} aria-label={`Remove ${p.email}`}><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <input className={`${field} w-40`} placeholder="Name" value={shareName} onChange={(e) => setShareName(e.target.value)} />
                <input className={`${field} min-w-0 flex-1`} type="email" placeholder="name@email.com" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} />
                <button className={btnGold} disabled={busy === "share" || !shareEmail.includes("@")} onClick={() => void share("share-add", shareEmail, false, shareName)}>Add</button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button className={btn} onClick={emailTest} disabled={busy === "test" || !cur}>
                  {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send a test to myself
                </button>
                <button className={btn} onClick={emailAgenda} disabled={busy === "email" || !cur || access.length === 0}>
                  {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Email this agenda to everyone above
                </button>
                <span className="text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">The test goes only to you, marked TEST, so you can see exactly what your team will get. "Email this agenda" sends the same email to everyone above.</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
