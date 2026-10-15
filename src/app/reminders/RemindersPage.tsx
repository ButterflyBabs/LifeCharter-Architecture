"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BellRing, Check, Pencil, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { askAssistant } from "@/lib/assistantPopout";
import AssistantReportCard from "@/components/assistant/AssistantReportCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isDue, whenWords, type Reminder } from "@/lib/reminders";
import { localInputValue, quickTimes, useReminders } from "@/components/reminders/useReminders";

const box = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";

export default function RemindersPage() {
  const params = useSearchParams();
  const { items, error, add, setDone, snooze, update, remove } = useReminders();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [when, setWhen] = useState(() => localInputValue(new Date(Date.now() + 24 * 3_600_000)));
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState("");
  const [edit, setEdit] = useState({ title: "", notes: "", when: "" });
  const [showDone, setShowDone] = useState(false);
  const [msg, setMsg] = useState("");
  // Which reminders have an assistant report (key -> when), and which report is open.
  const [reports, setReports] = useState<Record<string, string>>({});
  const [openReport, setOpenReport] = useState("");
  useEffect(() => {
    fetch("/api/assistant/reports?type=reminder", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.items && setReports(Object.fromEntries((d.items as { key: string; createdAt: string }[]).map((i) => [i.key, i.createdAt]))))
      .catch(() => {});
  }, [items?.length]);

  // Arriving from the card's "Pick a date and time" with the words already typed.
  useEffect(() => {
    const n = params.get("new");
    if (n) setTitle(n);
  }, [params]);

  const now = Date.now();
  const open = useMemo(() => (items ?? []).filter((r) => r.status === "open"), [items]);
  const due = open.filter((r) => isDue(r, now));
  const upcoming = open.filter((r) => !isDue(r, now));
  const done = (items ?? []).filter((r) => r.status === "done");

  async function create(iso: string) {
    if (!title.trim()) return setMsg("What should the reminder say?");
    setBusy(true);
    setMsg("");
    const ok = await add(title.trim(), iso, notes.trim() || undefined);
    setBusy(false);
    if (ok) {
      setTitle("");
      setNotes("");
      setMsg("Reminder saved. You will see it here, on Executive Home and Daily Compass, and in the bell, and it is emailed to you when it comes due.");
    }
  }

  function row(r: Reminder, tone: "due" | "soon" | "done") {
    const editing = editId === r.id;
    return (
      <li key={r.id} className={`rounded-xl border px-3 py-3 ${tone === "due" ? "border-[#A4523C]/30 bg-[#A4523C]/5" : "border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20"}`}>
        {editing ? (
          <div className="space-y-2">
            <Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} aria-label="Reminder" />
            <textarea rows={2} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} className={box} placeholder="Notes (optional)" />
            <input type="datetime-local" value={edit.when} onChange={(e) => setEdit({ ...edit, when: e.target.value })} className={box} aria-label="When" />
            <div className="flex gap-2">
              <Button size="sm" onClick={async () => { if (await update(r.id, { title: edit.title, notes: edit.notes, remindAt: edit.when ? new Date(edit.when).toISOString() : undefined })) setEditId(""); }}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditId("")}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            {tone === "done" ? (
              <button onClick={() => void setDone(r.id, false)} className="mt-0.5 text-[#2E7C83]" aria-label={`Reopen: ${r.title}`}><RotateCcw className="h-5 w-5" /></button>
            ) : (
              <button onClick={() => void setDone(r.id, true)} className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border ${tone === "due" ? "border-[#A4523C] text-[#A4523C] hover:bg-[#A4523C] hover:text-white" : "border-gray-300 text-transparent hover:border-[#2c6b3f] hover:text-[#2c6b3f]"}`} aria-label={`Mark done: ${r.title}`}><Check className="h-4 w-4" /></button>
            )}
            <div className="min-w-0 flex-1">
              <p className={`font-semibold ${tone === "done" ? "text-[#7a8a99] line-through" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>{r.title}</p>
              {(() => {
                // The assistant's report is kept on the note, but shown as its own card (below), not as a wall of text.
                const marker = "\n\n— Assistant report";
                const cut = r.notes ? r.notes.indexOf(marker) : -1;
                const body = r.notes ? (cut >= 0 ? r.notes.slice(0, cut) : r.notes) : "";
                return body ? <p className="mt-0.5 whitespace-pre-line text-sm text-[#5a6472] dark:text-[#b8c2cf]">{body}</p> : null;
              })()}
              {reports[r.id] && (
                <div className="mt-2">
                  <button
                    onClick={() => setOpenReport(openReport === r.id ? "" : r.id)}
                    aria-expanded={openReport === r.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a227] px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] hover:bg-[#c9a227]/10 dark:text-[#F8F5F0]"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> {openReport === r.id ? "Hide the assistant's report" : `See the assistant's report (${new Date(reports[r.id]).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })})`}
                  </button>
                  {openReport === r.id && <div className="mt-2"><AssistantReportCard type="reminder" itemKey={r.id} /></div>}
                </div>
              )}
              <p className={`mt-0.5 text-xs ${tone === "due" ? "font-semibold text-[#8a2f2f]" : "text-[#7a8a99]"}`}>
                {tone === "done" && r.done_at ? `Done ${new Date(r.done_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : whenWords(r.remind_at, now)}
              </p>
              {tone !== "done" && (
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs font-medium text-[#2E7C83]">
                  {tone === "due" && (
                    <>
                      <button className="hover:underline" onClick={() => void snooze(r.id, 60)}>Remind me in 1 hour</button>
                      <button className="hover:underline" onClick={() => void snooze(r.id, 60 * 24)}>Tomorrow</button>
                      <button className="hover:underline" onClick={() => void snooze(r.id, 60 * 24 * 7)}>Next week</button>
                    </>
                  )}
                  <button className="inline-flex items-center gap-1 hover:underline" onClick={() => askAssistant(`Work on this reminder and report back: "${r.title}". Read the whole reminder first, check what you can, prepare what you can, then give me the report.`, `Work on this reminder: ${r.title}`)}><Sparkles className="h-3 w-3" />Have my assistant work on this</button>
                  <button className="inline-flex items-center gap-1 hover:underline" onClick={() => { setEditId(r.id); setEdit({ title: r.title, notes: r.notes ?? "", when: localInputValue(new Date(r.remind_at)) }); }}><Pencil className="h-3 w-3" />Edit</button>
                </div>
              )}
            </div>
            <button onClick={() => { if (confirm(`Delete "${r.title}"?`)) void remove(r.id); }} className="text-[#b8a898] hover:text-[#A4523C]" aria-label={`Delete: ${r.title}`}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1c5a60] to-[#c9a227]"><BellRing className="h-6 w-6 text-white" /></div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Reminders</h1>
          <p className="text-[#7a8a99]">One-off things you must not forget: a free trial that renews, a deadline, a call to return. You are reminded here, on Executive Home and Daily Compass, in the bell, and by email.</p>
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-[#c9a227]/40 bg-white p-4 dark:bg-[#1a2b4a]/30">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#7a8a99]">New reminder</h2>
        <div className="space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="e.g. LinkedIn Premium free trial ends in 24 hours: renew or cancel before being charged" aria-label="What should the reminder say?" />
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={box} placeholder="Notes (optional): the account, the link, what to do" />
          <div>
            <p className="mb-1 text-xs font-medium text-[#5a6472]">Remind me</p>
            <div className="flex flex-wrap gap-2">
              {quickTimes().map((q) => (
                <Button key={q.label} size="sm" variant="outline" disabled={busy || !title.trim()} onClick={() => void create(q.iso)}>{q.label}</Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-medium text-[#5a6472]">Or pick a date and time
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={`${box} mt-1`} />
            </label>
            <Button disabled={busy || !title.trim() || !when} onClick={() => void create(new Date(when).toISOString())}>Save reminder</Button>
          </div>
          {(msg || error) && <p className={`text-sm ${error ? "text-[#8a2f2f]" : "text-[#1F5E63]"}`} role="status">{error || msg}</p>}
        </div>
      </section>

      {items === null ? (
        <p className="text-[#7a8a99]">Loading…</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#8a2f2f]">Due now ({due.length})</h2>
            {due.length === 0 ? <p className="text-sm text-[#7a8a99]">Nothing is due.</p> : <ul className="space-y-2">{due.map((r) => row(r, "due"))}</ul>}
          </section>
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#7a8a99]">Coming up ({upcoming.length})</h2>
            {upcoming.length === 0 ? <p className="text-sm text-[#7a8a99]">No upcoming reminders yet. Add one above.</p> : <ul className="space-y-2">{upcoming.map((r) => row(r, "soon"))}</ul>}
          </section>
          {done.length > 0 && (
            <section>
              <button className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#7a8a99] hover:underline" onClick={() => setShowDone((v) => !v)}>{showDone ? "Hide" : "Show"} done ({done.length})</button>
              {showDone && <ul className="space-y-2">{done.map((r) => row(r, "done"))}</ul>}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
