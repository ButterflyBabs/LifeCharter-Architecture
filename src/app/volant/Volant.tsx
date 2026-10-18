"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BellRing, CalendarPlus, Check, Copy, FileText, ListChecks, Lock, Pencil, Plus, Settings2, Trash2, Upload, X } from "lucide-react";
import Recordings from "./Recordings";
import ContactPicker, { personName, type PickedContact } from "@/app/contacts/ContactPicker";
import { localInputValue } from "@/components/reminders/useReminders";
import { reportToText, templateName, VOLANT_NAME, type ActionItem, type VolantReport, type VolantTemplate } from "@/lib/volant";

type Contact = { first_name: string | null; last_name: string | null; email: string } | null;
type Row = { id: string; template_key: string; title: string; session_date: string; contact_id: string | null; created_at: string; seq_contacts: Contact; items: number; approved: number };
type Full = Omit<Row, "items" | "approved"> & { report: VolantReport | null; transcript: string };
type Settings = { label: string; templateNames: Record<string, string> };

const field =
  "w-full rounded-lg border border-[#d9d2c0] dark:border-[#34405f] bg-white dark:bg-[#141b33] px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0] placeholder:text-[#8a8f9c] focus:outline-none focus:border-[#c9a227]";
const card = "rounded-2xl border border-[#e3dccd] dark:border-[#2b3b5c] bg-white dark:bg-[#16233b] p-4 sm:p-5";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#c9a227] px-3.5 py-1.5 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#c9a227]/15 disabled:opacity-50";
const btnGold = "inline-flex items-center gap-1.5 rounded-full bg-[#1a2b4a] dark:bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#F8F5F0] dark:text-[#14203a] hover:opacity-90 disabled:opacity-50";
const small = "inline-flex items-center gap-1 text-xs font-semibold text-[#2E7C83] hover:underline disabled:opacity-50";
const label = "block text-xs font-semibold uppercase tracking-wide text-[#7a8a99] mb-1";
const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Denver" });
const who = (c: Contact) => (c ? [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email : "");

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, d };
}

export default function Volant() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [templates, setTemplates] = useState<VolantTemplate[]>([]);
  const [settings, setSettings] = useState<Settings>({ label: VOLANT_NAME, templateNames: {} });
  const [view, setView] = useState<"new" | "report" | "names">("new");
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const d = await fetch("/api/volant", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (!d?.reports) {
      setError(d?.error || "Your reports could not be loaded. Reload the page.");
      setRows([]);
      return;
    }
    setRows(d.reports);
    setTemplates(d.templates ?? []);
    setSettings(d.settings ?? { label: VOLANT_NAME, templateNames: {} });
  }, []);
  useEffect(() => {
    void load();
    const r = new URLSearchParams(window.location.search).get("report");
    if (r) {
      setOpenId(r);
      setView("report");
    }
  }, [load]);

  const open = (id: string) => {
    setOpenId(id);
    setView("report");
    window.history.replaceState(null, "", `/volant?report=${id}`);
  };
  const tplName = (key: string) => {
    const t = templates.find((x) => x.key === key);
    return t ? templateName(t, settings.templateNames) : key;
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1a2b4a] to-[#c9a227]"><FileText className="h-6 w-6 text-white" /></div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{settings.label}</h1>
            <p className="text-[#7a8a99]">Turn any recording or transcript into a clear report. Upload the video, audio or transcript from Zoom, your phone or any recorder, pick a template, and send each action item to Tasks, a reminder or your calendar.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className={btnGold} onClick={() => { setView("new"); setOpenId(""); window.history.replaceState(null, "", "/volant"); }}><Plus className="h-4 w-4" />New report</button>
          <button className={btn} onClick={() => setView("names")}><Settings2 className="h-4 w-4" />Names</button>
        </div>
      </div>
      {error && <p className="mb-3 text-sm text-[#8a2f2f]" role="alert">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-2">
          <p className={label}>Your reports</p>
          {rows === null ? (
            <p className="text-sm text-[#7a8a99]">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-[#7a8a99]">No reports yet. Your first one will show here.</p>
          ) : (
            <ul className="space-y-1.5">
              {rows.map((r) => (
                <li key={r.id}>
                  <button onClick={() => open(r.id)} className={`w-full rounded-xl border p-3 text-left transition ${r.id === openId && view === "report" ? "border-[#c9a227] bg-[#c9a227]/10" : "border-[#1a2b4a]/10 hover:bg-[#1a2b4a]/5"}`}>
                    <span className="block truncate font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{r.title}</span>
                    <span className="block truncate text-xs text-[#7a8a99]">{fmtDate(r.session_date)} · {tplName(r.template_key)}{r.seq_contacts ? ` · ${who(r.seq_contacts)}` : ""}</span>
                    {r.items > 0 && <span className="mt-1 block text-xs text-[#2E7C83]">{r.approved} of {r.items} action items in Tasks</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="min-w-0">
          {view === "new" && <NewReport templates={templates} settings={settings} onMade={(id) => { void load(); open(id); }} />}
          {view === "report" && openId && <ReportView key={openId} id={openId} templates={templates} settings={settings} onChanged={load} onDeleted={() => { setOpenId(""); setView("new"); void load(); window.history.replaceState(null, "", "/volant"); }} />}
          {view === "names" && <Names templates={templates} settings={settings} onSaved={(s) => { setSettings(s); setView(openId ? "report" : "new"); }} />}
        </main>
      </div>
    </div>
  );
}

function NewReport({ templates, settings, onMade }: { templates: VolantTemplate[]; settings: Settings; onMade: (id: string) => void }) {
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today());
  const [contact, setContact] = useState<PickedContact | null>(null);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [consent, setConsent] = useState(false);
  const [recordingId, setRecordingId] = useState("");
  const [busy, setBusy] = useState<"" | "file" | "report">("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const t = templates.find((x) => x.key === key) ?? null;

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy("file");
    setMsg("");
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/volant/extract", { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (fileRef.current) fileRef.current.value = "";
    if (!r.ok) return setMsg(d.error || "That file could not be read.");
    setText(d.text || "");
    setFileName(d.name || file.name);
    setRecordingId("");
    if (d.cut) setMsg("That transcript is very long, so only the first part was kept.");
  }

  async function make() {
    setMsg("");
    if (!t) return setMsg("Pick a template first.");
    if (text.trim().length < 200) return setMsg("Paste or upload the transcript first (it looks too short to make a report).");
    if (!consent) return setMsg("Tick the box to confirm everyone agreed to be recorded.");
    setBusy("report");
    const { ok, d } = await post("/api/volant/report", { templateKey: t.key, transcript: text, title, date, contactId: contact?.id ?? "", recordingId, consent: true });
    setBusy("");
    if (!ok) return setMsg(d.error || "Couldn't write the report. Try again.");
    onMade(d.id);
  }

  return (
    <div className="space-y-4">
      <section className={card}>
        <p className={label}>1. Pick a template</p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((x) => (
            <button key={x.key} onClick={() => setKey(x.key)} className={`rounded-xl border p-3 text-left transition ${key === x.key ? "border-[#c9a227] bg-[#c9a227]/10" : "border-[#1a2b4a]/10 hover:bg-[#1a2b4a]/5"}`} aria-pressed={key === x.key}>
              <span className="block font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{templateName(x, settings.templateNames)}</span>
              <span className="block text-xs text-[#7a8a99]">{x.purpose}</span>
            </button>
          ))}
        </div>
        {t && (
          <div className="mt-3 rounded-xl bg-[#c9a227]/10 p-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
            <p className="font-semibold">Your report will have: {t.sections.map((s) => s.title).join(" · ")}</p>
            {t.rules && <p className="mt-1 text-xs text-[#5a6472] dark:text-[#b8c2cf]">Built-in rule: {t.rules}</p>}
          </div>
        )}
      </section>

      <section className={`${card} grid gap-3 md:grid-cols-2`}>
        <div className="md:col-span-2"><p className={label}>2. About the session</p></div>
        <div>
          <label className={label} htmlFor="v-title">Name (optional)</label>
          <input id="v-title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder={t ? `${templateName(t, settings.templateNames)}${contact ? ` with ${personName(contact)}` : ""}` : "e.g. Coaching session with Eloise"} />
        </div>
        <div>
          <label className={label} htmlFor="v-date">Date</label>
          <input id="v-date" type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <p className={label}>Who was it with? (optional: the report is saved on their contact record)</p>
          {contact ? (
            <div className="flex items-center gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              <span className="rounded-full bg-[#2E7C83]/10 px-3 py-1 font-medium">{personName(contact)}</span>
              <button className={small} onClick={() => setContact(null)}><X className="h-3 w-3" />Remove</button>
            </div>
          ) : (
            <ContactPicker onPick={setContact} placeholder="Search your contacts by name or email" />
          )}
        </div>
      </section>

      <section className={card}>
        <p className={label}>3. The recording or transcript</p>
        <label className="mb-3 flex items-start gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
          <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>Everyone in this conversation knew it was being recorded and agreed. (Some states require every person&apos;s consent.)</span>
        </label>
        <Recordings consent={consent} onUse={(t, recId, name) => { setText(t); setFileName(name); setRecordingId(recId); }} />
        <p className="mb-2 text-sm text-[#5a6472] dark:text-[#b8c2cf]">Already have a transcript? Upload the file (.txt, .docx, .pdf, .vtt, .srt or .md) from any app or device, or paste the text.</p>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button className={btn} disabled={busy !== ""} onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" />{busy === "file" ? "Reading the file…" : "Upload a file"}</button>
          <input ref={fileRef} type="file" accept=".txt,.md,.vtt,.srt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
          {fileName && <span className="text-xs text-[#7a8a99]">From {fileName}</span>}
        </div>
        <textarea className={`${field} min-h-[220px] font-mono text-xs`} value={text} onChange={(e) => { setText(e.target.value); setFileName(""); setRecordingId(""); }} placeholder="…or paste the transcript here" aria-label="Transcript" />
        <p className="mt-1 text-xs text-[#7a8a99]">{text.trim() ? `${text.trim().split(/\s+/).length.toLocaleString()} words` : ""}</p>
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-center gap-3">
          <button className={btnGold} disabled={busy !== ""} onClick={() => void make()}>{busy === "report" ? "Writing your report… (up to a minute)" : "Write my report"}</button>
          <span className="text-xs text-[#7a8a99]">Uses your own AI key. Nothing goes into Tasks until you approve each item.</span>
        </div>
        {msg && <p className="mt-2 text-sm text-[#8a2f2f]" role="alert">{msg}</p>}
      </section>
    </div>
  );
}

function ReportView({ id, templates, settings, onChanged, onDeleted }: { id: string; templates: VolantTemplate[]; settings: Settings; onChanged: () => void; onDeleted: () => void }) {
  const [r, setR] = useState<Full | null>(null);
  const [missing, setMissing] = useState(false);
  const [msg, setMsg] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/volant?id=${id}`, { cache: "no-store" })
      .then((x) => (x.ok ? x.json() : null))
      .then((d) => (d?.report ? setR(d.report) : setMissing(true)))
      .catch(() => setMissing(true));
  }, [id]);

  const t = useMemo(() => templates.find((x) => x.key === r?.template_key) ?? null, [templates, r?.template_key]);
  const actTitle = t?.sections.find((s) => s.kind === "actions")?.title ?? "Action items";

  if (missing) return <p className="text-sm text-[#7a8a99]">That report could not be found.</p>;
  if (!r) return <p className="text-sm text-[#7a8a99]">Loading…</p>;
  const report = r.report;

  async function rename() {
    const { ok, d } = await post("/api/volant", { action: "rename", id: r!.id, title: name });
    if (!ok) return setMsg(d.error || "Couldn't rename it.");
    setR({ ...r!, title: name.trim() });
    setRenaming(false);
    onChanged();
  }
  async function remove() {
    const { ok, d } = await post("/api/volant", { action: "delete", id: r!.id });
    if (!ok) return setMsg(d.error || "Couldn't delete it.");
    onDeleted();
  }
  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg(done);
    } catch {
      setMsg("Copying isn't allowed here. Select the text and copy it instead.");
    }
  }

  return (
    <div className="space-y-4">
      <section className={card}>
        {renaming ? (
          <div className="flex flex-wrap gap-2">
            <input className={`${field} max-w-xl`} value={name} onChange={(e) => setName(e.target.value)} maxLength={160} aria-label="Report name" />
            <button className={btnGold} onClick={() => void rename()}>Save</button>
            <button className={btn} onClick={() => setRenaming(false)}>Cancel</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{r.title}</h2>
            <button className={small} onClick={() => { setName(r.title); setRenaming(true); }}><Pencil className="h-3 w-3" />Rename</button>
          </div>
        )}
        <p className="mt-1 text-sm text-[#7a8a99]">
          {fmtDate(r.session_date)} · {t ? templateName(t, settings.templateNames) : r.template_key}
          {r.contact_id && r.seq_contacts ? <> · <Link className="text-[#2E7C83] hover:underline" href={`/contacts?contact=${r.contact_id}`}>{who(r.seq_contacts)}</Link></> : null}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {report && <button className={btn} onClick={() => void copy(reportToText(r.title, fmtDate(r.session_date), report, actTitle), "Report copied (private notes left out).")}><Copy className="h-4 w-4" />Copy report</button>}
          <button className={btn} onClick={() => setShowTranscript((v) => !v)}><FileText className="h-4 w-4" />{showTranscript ? "Hide transcript" : "Show transcript"}</button>
          {confirmDelete ? (
            <span className="inline-flex items-center gap-2 text-sm text-[#8a2f2f]">Delete this report and its transcript?
              <button className={btn} onClick={() => void remove()}>Yes, delete</button>
              <button className={btn} onClick={() => setConfirmDelete(false)}>Keep it</button>
            </span>
          ) : (
            <button className={btn} onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4" />Delete</button>
          )}
        </div>
        {report?.clipped && <p className="mt-2 text-xs text-[#7a8a99]">This transcript was very long, so the report was written from the first part (about 10,000 words).</p>}
        {msg && <p className="mt-2 text-sm text-[#1F5E63]" role="status">{msg}</p>}
      </section>

      {showTranscript && <section className={card}><pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-xs text-[#1a2b4a] dark:text-[#F8F5F0]">{r.transcript}</pre></section>}

      {!report ? (
        <p className="text-sm text-[#7a8a99]">This report is empty.</p>
      ) : (
        <>
          <section className={card}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{actTitle}</h3>
              <span className="text-xs text-[#7a8a99]">Send each one to Tasks, a reminder or your calendar. Nothing happens until you press a button.</span>
            </div>
            {report.action_items.length === 0 && <p className="text-sm text-[#7a8a99]">No action items came up in this conversation. Add your own below.</p>}
            <ul className="space-y-2">
              {report.action_items.map((it) => (
                <ItemRow key={it.id} it={it} reportId={r.id} reportTitle={r.title} onReport={(next) => { setR({ ...r, report: next }); onChanged(); }} setMsg={setMsg} />
              ))}
            </ul>
            <AddItem reportId={r.id} onReport={(next) => { setR({ ...r, report: next }); onChanged(); }} setMsg={setMsg} />
          </section>

          {report.sections.map((s) => (
            <section key={s.title} className={card}>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.title}</h3>
                {s.kind === "private" && <span className="inline-flex items-center gap-1 rounded-full bg-[#1a2b4a]/10 px-2.5 py-0.5 text-xs font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><Lock className="h-3 w-3" />Only you see this</span>}
                {s.kind === "draft" && s.content && <button className={small} onClick={() => void copy(s.content, "Draft copied. Edit it before you send it.")}><Copy className="h-3 w-3" />Copy draft</button>}
              </div>
              {s.kind === "draft" && <p className="mb-1 text-xs text-[#7a8a99]">A draft for you to edit and send yourself. It is never sent automatically.</p>}
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#1a2b4a] dark:text-[#e6e9ef]">{s.content || "Nothing on this came up."}</p>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

const pill = "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-50";
const whenAt = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
// A sensible starting time: the item's due date at 9 AM, or tomorrow at 9 AM.
const startFor = (due: string) => {
  const d = due ? new Date(`${due}T09:00:00`) : new Date(Date.now() + 86_400_000);
  if (!due) d.setHours(9, 0, 0, 0);
  return localInputValue(d);
};

// One action item: Edit / Remove until it has gone anywhere, then Add to Tasks, Set a reminder and Add to calendar,
// each on its own press and each shown as done once made. An item can be all three.
function ItemRow({ it, reportId, reportTitle, onReport, setMsg }: { it: ActionItem; reportId: string; reportTitle: string; onReport: (r: VolantReport) => void; setMsg: (m: string) => void }) {
  const [mode, setMode] = useState<"" | "edit" | "remind" | "event">("");
  const [edit, setEdit] = useState({ text: it.text, owner: it.owner, due: it.due });
  const [when, setWhen] = useState(startFor(it.due));
  const [minutes, setMinutes] = useState(30);
  const [busy, setBusy] = useState(false);
  const sent = Boolean(it.task_id || it.reminder || it.event);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    const { ok, d } = await post("/api/volant", { action, id: reportId, itemId: it.id, ...extra });
    if (!ok) {
      setMsg(d.error || "That didn't save.");
      return false;
    }
    if (d.report) onReport(d.report);
    return true;
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMsg("");
    await fn();
    setBusy(false);
  }
  const note = `From the LC Volant report "${reportTitle}".${it.owner ? ` Owner: ${it.owner}.` : ""}`;

  const remind = () => run(async () => {
    if (!when) return setMsg("Pick when to be reminded.");
    const at = new Date(when).toISOString();
    const r = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: it.text.slice(0, 200), notes: note, remindAt: at }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.reminder?.id) return setMsg(d.error || "Couldn't set the reminder.");
    if (await act("mark-item", { kind: "reminder", ref: d.reminder.id, at })) {
      setMode("");
      setMsg(`Reminder set for ${whenAt(at)}. It shows in Reminders, the bell and your email when it comes due.`);
    }
  });
  const addEvent = () => run(async () => {
    if (!when) return setMsg("Pick a date and time for the calendar.");
    const startISO = new Date(when).toISOString();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const r = await fetch("/api/calendar/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: it.text.slice(0, 200), startISO, durationMin: minutes, note, timeZone }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.eventId) {
      return setMsg(d.needsScope ? "Your Google calendar is connected read-only. Reconnect Google in Settings > Integrations to allow adding events, then try again." : d.error === "No calendar connected." ? "Connect your Google or Microsoft calendar in Settings > Integrations first." : d.error || "Couldn't add it to your calendar.");
    }
    if (await act("mark-item", { kind: "event", ref: d.eventId, at: startISO, provider: d.provider })) {
      setMode("");
      setMsg(`Added to your ${d.provider === "google" ? "Google" : "Microsoft"} calendar for ${whenAt(startISO)}.`);
    }
  });

  return (
    <li className={`rounded-xl border p-3 ${sent ? "border-[#2E7C83]/40 bg-[#2E7C83]/5" : "border-[#1a2b4a]/10"}`}>
      {mode === "edit" ? (
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_150px]">
          <input className={field} value={edit.text} onChange={(e) => setEdit({ ...edit, text: e.target.value })} maxLength={400} aria-label="Action item" />
          <input className={field} value={edit.owner} onChange={(e) => setEdit({ ...edit, owner: e.target.value })} maxLength={60} placeholder="Owner" aria-label="Owner" />
          <input className={field} type="date" value={edit.due} onChange={(e) => setEdit({ ...edit, due: e.target.value })} aria-label="Due date" />
          <div className="flex gap-2 sm:col-span-3">
            <button className={btnGold} disabled={busy} onClick={() => void run(async () => { if (await act("edit-item", { item: edit })) setMode(""); })}>Save</button>
            <button className={btn} onClick={() => setMode("")}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{it.text}</p>
              <p className="text-xs text-[#7a8a99]">{[it.owner && `Owner: ${it.owner}`, it.due && `Due ${fmtDate(it.due)}`, it.added && "Added by you"].filter(Boolean).join(" · ") || "No owner or date named"}</p>
            </div>
            {!sent && (
              <div className="flex flex-wrap items-center gap-3">
                <button className={small} disabled={busy} onClick={() => { setEdit({ text: it.text, owner: it.owner, due: it.due }); setMode("edit"); }}><Pencil className="h-3 w-3" />Edit</button>
                <button className={small} disabled={busy} onClick={() => void run(async () => { await act("remove-item"); })}><X className="h-3 w-3" />Remove</button>
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {it.task_id ? (
              <Link href="/tasks" className={`${pill} bg-[#2E7C83]/15 text-[#1F5E63] dark:text-[#9fd3d6]`}><Check className="h-3.5 w-3.5" />In Tasks</Link>
            ) : (
              <button className={`${pill} bg-[#2E7C83] text-white hover:opacity-90`} disabled={busy} onClick={() => void run(async () => { if (await act("approve-item")) setMsg("Added to Tasks."); })}><ListChecks className="h-3.5 w-3.5" />Add to Tasks</button>
            )}
            {it.reminder ? (
              <Link href="/reminders" className={`${pill} bg-[#2E7C83]/15 text-[#1F5E63] dark:text-[#9fd3d6]`}><Check className="h-3.5 w-3.5" />Reminder {whenAt(it.reminder.at)}</Link>
            ) : (
              <button className={`${pill} border border-[#2E7C83] text-[#1F5E63] hover:bg-[#2E7C83]/10 dark:text-[#9fd3d6]`} disabled={busy} onClick={() => { setWhen(startFor(it.due)); setMode(mode === "remind" ? "" : "remind"); }}><BellRing className="h-3.5 w-3.5" />Set a reminder</button>
            )}
            {it.event ? (
              <span className={`${pill} bg-[#2E7C83]/15 text-[#1F5E63] dark:text-[#9fd3d6]`}><Check className="h-3.5 w-3.5" />On your calendar {whenAt(it.event.at)}</span>
            ) : (
              <button className={`${pill} border border-[#2E7C83] text-[#1F5E63] hover:bg-[#2E7C83]/10 dark:text-[#9fd3d6]`} disabled={busy} onClick={() => { setWhen(startFor(it.due)); setMode(mode === "event" ? "" : "event"); }}><CalendarPlus className="h-3.5 w-3.5" />Add to calendar</button>
            )}
          </div>
          {(mode === "remind" || mode === "event") && (
            <div className="mt-2 flex flex-wrap items-end gap-2 rounded-lg bg-[#c9a227]/10 p-2">
              <label className="text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]">{mode === "remind" ? "Remind me" : "Starts"}
                <input type="datetime-local" className={`${field} mt-1`} value={when} onChange={(e) => setWhen(e.target.value)} />
              </label>
              {mode === "event" && (
                <label className="text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]">How long
                  <select className={`${field} mt-1`} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                    {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? "s" : ""}`}</option>)}
                  </select>
                </label>
              )}
              <button className={btnGold} disabled={busy} onClick={() => void (mode === "remind" ? remind() : addEvent())}>{busy ? "Saving…" : mode === "remind" ? "Set reminder" : "Add to calendar"}</button>
              <button className={btn} onClick={() => setMode("")}>Cancel</button>
            </div>
          )}
        </>
      )}
    </li>
  );
}

// Type in an action item the AI missed; it then gets the same Tasks, reminder and calendar buttons.
function AddItem({ reportId, onReport, setMsg }: { reportId: string; onReport: (r: VolantReport) => void; setMsg: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ text: "", owner: "", due: "" });
  const [busy, setBusy] = useState(false);
  async function add() {
    if (!v.text.trim()) return setMsg("Type the action item first.");
    setBusy(true);
    const { ok, d } = await post("/api/volant", { action: "add-item", id: reportId, item: v });
    setBusy(false);
    if (!ok) return setMsg(d.error || "Couldn't add that.");
    onReport(d.report);
    setV({ text: "", owner: "", due: "" });
    setOpen(false);
  }
  if (!open) return <button className={`${small} mt-3`} onClick={() => setOpen(true)}><Plus className="h-3 w-3" />Add an action item</button>;
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_150px]">
      <input className={field} value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} maxLength={400} placeholder="What needs doing" aria-label="New action item" />
      <input className={field} value={v.owner} onChange={(e) => setV({ ...v, owner: e.target.value })} maxLength={60} placeholder="Owner" aria-label="Owner" />
      <input className={field} type="date" value={v.due} onChange={(e) => setV({ ...v, due: e.target.value })} aria-label="Due date" />
      <div className="flex gap-2 sm:col-span-3">
        <button className={btnGold} disabled={busy} onClick={() => void add()}>Add</button>
        <button className={btn} onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

function Names({ templates, settings, onSaved }: { templates: VolantTemplate[]; settings: Settings; onSaved: (s: Settings) => void }) {
  const [lbl, setLbl] = useState(settings.label);
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(templates.map((t) => [t.key, templateName(t, settings.templateNames)])));
  const [msg, setMsg] = useState("");
  async function save() {
    const { ok, d } = await post("/api/volant", { action: "settings-save", label: lbl, templateNames: names });
    if (!ok) return setMsg(d.error || "Couldn't save your names.");
    onSaved(d.settings);
  }
  return (
    <section className={`${card} space-y-4`}>
      <div>
        <h2 className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Your names</h2>
        <p className="text-sm text-[#7a8a99]">Call this page and each template whatever fits your business. Leave a box as it is to keep the standard name.</p>
      </div>
      <div className="max-w-md">
        <label className={label} htmlFor="v-label">This page is called</label>
        <input id="v-label" className={field} value={lbl} onChange={(e) => setLbl(e.target.value)} maxLength={40} />
        <p className="mt-1 text-xs text-[#7a8a99]">Shown in your left menu and at the top of this page. Standard: {VOLANT_NAME}.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((t) => (
          <div key={t.key}>
            <label className={label} htmlFor={`v-n-${t.key}`}>{t.name}</label>
            <input id={`v-n-${t.key}`} className={field} value={names[t.key] ?? t.name} onChange={(e) => setNames({ ...names, [t.key]: e.target.value })} maxLength={80} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button className={btnGold} onClick={() => void save()}>Save names</button>
        <button className={btn} onClick={() => { setLbl(VOLANT_NAME); setNames(Object.fromEntries(templates.map((t) => [t.key, t.name]))); }}>Back to the standard names</button>
      </div>
      {msg && <p className="text-sm text-[#8a2f2f]" role="alert">{msg}</p>}
    </section>
  );
}
