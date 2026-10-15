"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CalendarCheck, CheckCircle2, Clock, ExternalLink, Loader2, Pencil, Sparkles, X } from "lucide-react";
import { announceDecision, askAssistant } from "@/lib/assistantPopout";
import type { ActionCardData } from "./ActionCards";

type Who = "suite" | "assistant" | "you" | "both";
interface Step { text: string; who: Who; when: string; status: "scheduled" | "needs_approval" | "waiting" | "ready" | "done"; waiting_on?: string; open?: string }
interface Report {
  id: string;
  title: string;
  createdAt: string;
  summary: string;
  done: string[];
  found: { label: string; value: string }[];
  next_steps: Step[];
}

const WHO: Record<Who, { label: string; cls: string }> = {
  suite: { label: "Suite", cls: "bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C]/40 dark:text-[#B5D4F4]" },
  assistant: { label: "Assistant", cls: "bg-[#FAEEDA] text-[#633806] dark:bg-[#633806]/40 dark:text-[#FAC775]" },
  you: { label: "You", cls: "bg-[#FCEBEB] text-[#791F1F] dark:bg-[#791F1F]/40 dark:text-[#F7C1C1]" },
  both: { label: "You + assistant", cls: "bg-[#EEEDFE] text-[#3C3489] dark:bg-[#3C3489]/40 dark:text-[#CECBF6]" },
};

const PAGE_LABEL: Record<string, string> = {
  "/sequences-manager": "Campaigns & Broadcasts",
  "/contacts": "Contacts",
  "/dm-pipeline": "Outreach Pipelines",
  "/tasks": "Tasks",
  "/reminders": "Reminders",
  "/projects": "Projects",
  "/calendars": "Calendars",
  "/finance": "Finance",
  "/links-directory": "Links & Forms",
  "/daily-compass/calendar": "Content Calendar",
};

// Quick reminder times for a step, in the client's own zone (the assistant prepares the card for Approve).
function quickDays() {
  const at = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-CA");
  };
  return [
    { label: "Tomorrow, 9:00 AM", date: at(1) },
    { label: "In 2 days, 9:00 AM", date: at(2) },
    { label: "Next week, 9:00 AM", date: at(7) },
  ];
}

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * The assistant's latest report on one task or reminder, laid out to be read at a glance: what was done, the key
 * numbers, what was prepared (each with Approve / Edit / Cancel while it waits) and every next step with WHO does it.
 */
export default function AssistantReportCard({ type, itemKey }: { type: "task" | "reminder"; itemKey: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [actions, setActions] = useState<ActionCardData[]>([]);
  const [history, setHistory] = useState<{ id: string; createdAt: string; summary: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [remindFor, setRemindFor] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/assistant/reports?type=${type}&key=${encodeURIComponent(itemKey)}`, { cache: "no-store" });
      const d = r.ok ? await r.json() : null;
      setReport(d?.report ?? null);
      setActions(d?.actions ?? []);
      setHistory(d?.history ?? []);
    } catch {
      /* the card just stays empty */
    }
    setLoading(false);
  }, [type, itemKey]);
  useEffect(() => { void load(); }, [load]);

  async function decide(id: string, decision: "approve" | "cancel") {
    setBusy(id);
    setErr("");
    try {
      const res = await fetch("/api/assistant/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, decision }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "That didn't work.");
      setActions((cur) => cur.map((c) => (c.id === id ? (d.card as ActionCardData) : c)));
      announceDecision({ origin: "report-card", card: d.card });
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(null);
  }

  // Edit: cancel the prepared one, then ask the assistant to prepare a corrected one (same wording as in the chat).
  async function sendChanges(c: ActionCardData) {
    if (!note.trim()) return;
    setBusy(c.id);
    setErr("");
    try {
      const res = await fetch("/api/assistant/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, decision: "cancel" }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "That didn't work.");
      setActions((cur) => cur.filter((x) => x.id !== c.id));
      const instruction = note.trim();
      setEditing(null);
      setNote("");
      askAssistant(
        `Please change what you prepared for me: "${c.title}". What to change: ${instruction}\n\nThe details you had prepared (JSON, for your reference): ${JSON.stringify(c.args ?? {}).slice(0, 8000)}\n\nThat earlier preview has been cancelled and nothing was created, so do not look for it or update anything in my account. Call the ${c.tool} tool again now with the full corrected details to prepare a NEW preview for my approval.`,
        `Change "${c.title}": ${instruction}`
      );
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(null);
  }

  async function stepStatus(i: number, status: "done" | "waiting") {
    if (!report) return;
    setBusy(`step-${i}`);
    setErr("");
    try {
      const res = await fetch("/api/assistant/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: report.id, step: i, status }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "That didn't save.");
      setReport({ ...report, next_steps: report.next_steps.map((x, k) => (k === i ? { ...x, ...(d.step as Step) } : x)) });
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(null);
  }

  if (loading) return <p className="text-xs text-[#7a8a99]">Loading the report…</p>;
  if (!report) return <p className="text-xs text-[#7a8a99]">No assistant report on this yet. Press Have my assistant work on this.</p>;

  const waiting = actions.filter((a) => a.status === "proposed");

  return (
    <div className="rounded-xl border border-[#e3dccd] bg-white p-4 text-sm text-[#1a2b4a] dark:border-[#2b3b5c] dark:bg-[#16233b] dark:text-[#F8F5F0]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">Assistant report · {when(report.createdAt)}</p>
          {report.summary && <p className="mt-1 max-w-3xl text-base leading-snug">{report.summary}</p>}
        </div>
        <span className="rounded-md bg-[#EAF3DE] px-2.5 py-1 text-xs text-[#27500A] dark:bg-[#27500A]/40 dark:text-[#C0DD97]">Saved on this {type}</span>
      </div>

      {report.found.length > 0 && (
        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
          {report.found.map((f, i) => (
            <div key={i} className="rounded-lg bg-[#F8F5F0] p-3 dark:bg-[#1d2c4c]">
              <p className="text-[11px] text-[#5d6b7a] dark:text-[#b8c2cf]">{f.label}</p>
              <p className="text-lg font-semibold leading-tight">{f.value}</p>
            </div>
          ))}
        </div>
      )}

      {report.done.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5d6b7a] dark:text-[#b8c2cf]">Done</p>
          <ul className="mt-1 space-y-1">
            {report.done.map((d, i) => (
              <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#2c6b3f]" /><span>{d}</span></li>
            ))}
          </ul>
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5d6b7a] dark:text-[#b8c2cf]">Prepared by your assistant{waiting.length ? ` · ${waiting.length} waiting for you` : ""}</p>
          <div className="mt-1 space-y-2">
            {actions.map((c) => (
              <div key={c.id} className={`rounded-lg border p-3 ${c.status === "proposed" ? "border-[#c9a227]/50 bg-[#FBF7EC] dark:bg-[#2a2415]" : "border-[#e3dccd] dark:border-[#2b3b5c]"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 flex-1 font-medium">{c.title}</span>
                  {c.status === "executed" && <span className="inline-flex items-center gap-1 text-xs text-[#2c6b3f]"><CalendarCheck className="h-3.5 w-3.5" /> Added{c.summary ? `: ${c.summary}` : ""}</span>}
                  {c.status === "cancelled" && <span className="inline-flex items-center gap-1 text-xs text-[#7a8a99]"><X className="h-3.5 w-3.5" /> Cancelled</span>}
                  {c.status === "failed" && <span className="text-xs text-[#a3281f]">Didn&apos;t work{c.error ? `: ${c.error}` : ""}</span>}
                  {c.status === "undone" && <span className="text-xs text-[#7a8a99]">Undone</span>}
                </div>
                {c.lines.length > 0 && c.status === "proposed" && (
                  <ul className="mt-1 list-disc pl-5 text-xs text-[#5a6472] dark:text-[#b8c2cf]">{c.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
                )}
                {c.status === "proposed" && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button onClick={() => decide(c.id, "approve")} disabled={busy === c.id} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a2b4a] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60 dark:bg-[#c9a227] dark:text-[#14203a]">
                      {busy === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve
                    </button>
                    <button onClick={() => { setEditing(editing === c.id ? null : c.id); setNote(""); }} disabled={busy === c.id} aria-expanded={editing === c.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a227] px-4 py-2 text-xs font-semibold hover:bg-[#c9a227]/10">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => decide(c.id, "cancel")} disabled={busy === c.id} className="rounded-lg border border-[#1a2b4a]/20 px-4 py-2 text-xs font-medium hover:bg-[#1a2b4a]/5 dark:border-white/20">Cancel</button>
                    <span className="text-[11px] text-[#7a8a99]">Nothing changes until you approve.</span>
                  </div>
                )}
                {c.status === "proposed" && editing === c.id && (
                  <div className="mt-2 rounded-lg border border-[#1a2b4a]/10 bg-white p-3 dark:bg-[#1a2b4a]/30">
                    <label className="block text-xs font-medium" htmlFor={`rc-${c.id}`}>What should change?</label>
                    <textarea id={`rc-${c.id}`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Make it Thursday at 9, rename it, add a note…" className="mt-1 w-full rounded-lg border border-[#1a2b4a]/15 bg-white px-3 py-2 text-xs dark:bg-[#1a2b4a]/30" />
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => sendChanges(c)} disabled={busy === c.id || !note.trim()} className="rounded-lg bg-[#1a2b4a] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-[#c9a227] dark:text-[#14203a]">Send changes</button>
                      <button onClick={() => setEditing(null)} className="text-xs text-[#7a8a99] hover:underline">Never mind</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {report.next_steps.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5d6b7a] dark:text-[#b8c2cf]">Next steps</p>
          <ul className="mt-1 divide-y divide-[#e3dccd] rounded-lg border border-[#e3dccd] dark:divide-[#2b3b5c] dark:border-[#2b3b5c]">
            {report.next_steps.map((st, i) => {
              const done = st.status === "done";
              const mineToDo = st.who === "you" || st.who === "both";
              const asstCan = st.who === "assistant" || st.who === "both";
              return (
                <li key={i} className="px-3 py-3">
                  <p className={done ? "text-[#7a8a99] line-through" : "font-medium"}>{st.text}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">
                    <span className={`rounded-md px-2 py-0.5 font-medium ${WHO[st.who].cls}`}>{WHO[st.who].label}</span>
                    {st.when && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {st.when}</span>}
                    {st.status === "scheduled" && <span className="inline-flex items-center gap-1 text-[#2c6b3f]"><CalendarCheck className="h-3 w-3" /> Scheduled in the Suite</span>}
                    {st.status === "needs_approval" && <span className="text-[#854F0B]">Needs your Approve (the card above)</span>}
                    {st.status === "ready" && <span className="text-[#0C447C] dark:text-[#B5D4F4]">Ready: your assistant can do this when you press the button</span>}
                    {done && <span className="text-[#2c6b3f]">Done</span>}
                  </p>
                  {st.status === "waiting" && (
                    <p className="mt-1 text-xs text-[#1a2b4a] dark:text-[#F8F5F0]">
                      <span className="font-semibold">Waiting for: </span>
                      {st.waiting_on ? st.waiting_on : "what this is waiting on was not recorded. Ask your assistant and it will say exactly what is needed."}
                    </p>
                  )}
                  {!done && st.status !== "scheduled" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {st.open && st.open.startsWith("/") && (
                        <a href={st.open} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a2b4a] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 dark:bg-[#c9a227] dark:text-[#14203a]">
                          <ExternalLink className="h-3.5 w-3.5" /> Open {PAGE_LABEL[st.open.split("?")[0]] ?? "it"}
                        </a>
                      )}
                      {(asstCan || mineToDo) && (
                        <button
                          onClick={() => askAssistant(
                            asstCan
                              ? `Please do this next step now on "${report.title}": ${st.text}. Use your tools, prepare anything that needs my approval, and tell me exactly what you did and what you need from me.`
                              : `Help me do this next step on "${report.title}": ${st.text}. Tell me exactly what to do, and prepare whatever you can for my approval.`,
                            asstCan ? `Do this now: ${st.text}` : `Help me with: ${st.text}`
                          )}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a227] px-3 py-1.5 text-xs font-semibold hover:bg-[#c9a227]/10"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> {asstCan ? "Have my assistant do this now" : "Ask my assistant to help"}
                        </button>
                      )}
                      <button onClick={() => setRemindFor(remindFor === i ? null : i)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#1a2b4a]/20 px-3 py-1.5 text-xs font-medium hover:bg-[#1a2b4a]/5 dark:border-white/20">
                        <Bell className="h-3.5 w-3.5" /> Remind me
                      </button>
                      {st.who !== "suite" && (
                        <button onClick={() => stepStatus(i, "done")} disabled={busy === `step-${i}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#2c6b3f]/40 px-3 py-1.5 text-xs font-medium text-[#2c6b3f] hover:bg-[#2c6b3f]/10">
                          {busy === `step-${i}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Mark done
                        </button>
                      )}
                    </div>
                  )}
                  {!done && remindFor === i && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-[#F8F5F0] p-2 text-xs dark:bg-[#1d2c4c]">
                      <span className="text-[#5d6b7a] dark:text-[#b8c2cf]">Remind me:</span>
                      {quickDays().map((q) => (
                        <button
                          key={q.date}
                          onClick={() => {
                            setRemindFor(null);
                            askAssistant(
                              `Please prepare a reminder for me: "${st.text}" (from the report on "${report.title}"). Use the create_reminder tool with date ${q.date} and time 09:00 in my time zone, and put a short note saying which item it comes from.`,
                              `Remind me ${q.label.toLowerCase()}: ${st.text}`
                            );
                          }}
                          className="rounded-md border border-[#c9a227] px-2.5 py-1 font-semibold hover:bg-[#c9a227]/10"
                        >
                          {q.label}
                        </button>
                      ))}
                      <span className="text-[#7a8a99]">or tell the assistant a different time after pressing one.</span>
                    </div>
                  )}
                  {done && (
                    <button onClick={() => stepStatus(i, "waiting")} disabled={busy === `step-${i}`} className="mt-1 text-[11px] text-[#7a8a99] hover:underline">Reopen this step</button>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] text-[#7a8a99]">Suite = runs by itself · Assistant = it does it when you press the button, or waits for your Approve · You = only you can do it.</p>
        </div>
      )}

      {err && <p className="mt-3 text-xs text-[#a3281f]">{err}</p>}
      {history.length > 0 && (
        <details className="mt-3 text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">
          <summary className="cursor-pointer">Earlier reports ({history.length})</summary>
          <ul className="mt-1 space-y-1">{history.map((h) => <li key={h.id}>{when(h.createdAt)}: {h.summary}</li>)}</ul>
        </details>
      )}
    </div>
  );
}
