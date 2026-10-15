"use client";

import { useState } from "react";
import { Bell, CalendarCheck, CheckCircle2, Clock, ExternalLink, Loader2, Pencil, Sparkles } from "lucide-react";
import { askAssistant, openWorkWindow } from "@/lib/assistantPopout";

export type Who = "suite" | "assistant" | "you" | "both";
export interface ReportStep {
  text: string;
  who: Who;
  when?: string;
  status: "scheduled" | "needs_approval" | "waiting" | "ready" | "done";
  kind?: "approve" | "decide" | "do";
  waiting_on?: string;
  open?: string;
  links?: { label: string; href: string }[];
}

export const WHO: Record<Who, { label: string; cls: string }> = {
  suite: { label: "Suite", cls: "bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C]/40 dark:text-[#B5D4F4]" },
  assistant: { label: "Assistant", cls: "bg-[#FAEEDA] text-[#633806] dark:bg-[#633806]/40 dark:text-[#FAC775]" },
  you: { label: "You", cls: "bg-[#FCEBEB] text-[#791F1F] dark:bg-[#791F1F]/40 dark:text-[#F7C1C1]" },
  both: { label: "You + assistant", cls: "bg-[#EEEDFE] text-[#3C3489] dark:bg-[#3C3489]/40 dark:text-[#CECBF6]" },
};

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

/**
 * ONE next step on its own: its own Open button, its own Edit (says what to change in THIS item only, nothing else is
 * cancelled) and its own Approve / Mark done. Nothing here is shared with the other steps of the report.
 */
export default function ReportStepRow({ reportId, index, step, itemTitle, onStatus }: { reportId: string; index: number; step: ReportStep; itemTitle: string; onStatus: (index: number, next: Partial<ReportStep>) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [remind, setRemind] = useState(false);

  const done = step.status === "done";
  const kind = step.kind ?? "do";
  const asstCan = step.who === "assistant" || step.who === "both";
  const link = (step.links ?? []).find((l) => l.href.startsWith("/"))?.href ?? (step.open && step.open.startsWith("/") ? step.open : "");

  async function setStatus(status: "done" | "waiting") {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/assistant/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: reportId, step: index, status }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "That didn't save.");
      onStatus(index, d.step as Partial<ReportStep>);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <li className="px-3 py-3">
      <p className={done ? "break-words text-[#7a8a99] line-through" : "break-words font-medium"}>{step.text}</p>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5d6b7a] dark:text-[#b8c2cf]">
        <span className={`rounded-md px-2 py-0.5 font-medium ${WHO[step.who].cls}`}>{WHO[step.who].label}</span>
        {step.when && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {step.when}</span>}
        {step.status === "scheduled" && <span className="inline-flex items-center gap-1 text-[#2c6b3f]"><CalendarCheck className="h-3 w-3" /> Scheduled in the Suite</span>}
        {step.status === "needs_approval" && <span className="text-[#854F0B]">Needs your Approve (the card above)</span>}
        {step.status === "ready" && !done && <span className="text-[#0C447C] dark:text-[#B5D4F4]">{asstCan ? "Ready: your assistant can do this when you press the button" : "Waiting for you"}</span>}
        {done && <span className="text-[#2c6b3f]">{kind === "approve" ? "Approved by you" : "Done"}</span>}
      </p>
      {step.status === "waiting" && !done && (
        <p className="mt-1 text-xs text-[#1a2b4a] dark:text-[#F8F5F0]">
          <span className="font-semibold">Waiting for: </span>
          {step.waiting_on ? step.waiting_on : "what this is waiting on was not recorded. Ask your assistant and it will say exactly what is needed."}
        </p>
      )}

      {!done && step.status !== "scheduled" && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {link && (
            <a href={link} target="_blank" rel="noopener" onClick={(e) => { e.preventDefault(); openWorkWindow(link); }} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a2b4a] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 dark:bg-[#c9a227] dark:text-[#14203a]">
              <ExternalLink className="h-3.5 w-3.5" /> {kind === "approve" ? "Open and read (new window)" : "Open (new window)"}
            </a>
          )}
          {kind === "approve" && (
            <>
              <button onClick={() => { setEditing((v) => !v); setNote(""); }} disabled={busy} aria-expanded={editing} className="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a227] px-3 py-1.5 text-xs font-semibold hover:bg-[#c9a227]/10">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => setStatus("done")} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-[#2c6b3f]/50 px-3 py-1.5 text-xs font-semibold text-[#2c6b3f] hover:bg-[#2c6b3f]/10">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve this one
              </button>
            </>
          )}
          {kind !== "approve" && (
            <>
              {(asstCan || step.who === "you") && (
                <button
                  onClick={() => askAssistant(
                    asstCan
                      ? `Please do this next step now on "${itemTitle}": ${step.text}. Use your tools, prepare anything that needs my approval, and tell me exactly what you did and what you need from me.`
                      : `Help me do this next step on "${itemTitle}": ${step.text}. Tell me exactly what to do, and prepare whatever you can for my approval.`,
                    asstCan ? `Do this now: ${step.text}` : `Help me with: ${step.text}`
                  )}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a227] px-3 py-1.5 text-xs font-semibold hover:bg-[#c9a227]/10"
                >
                  <Sparkles className="h-3.5 w-3.5" /> {asstCan ? "Have my assistant do this now" : "Ask my assistant to help"}
                </button>
              )}
              <button onClick={() => setRemind((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#1a2b4a]/20 px-3 py-1.5 text-xs font-medium hover:bg-[#1a2b4a]/5 dark:border-white/20">
                <Bell className="h-3.5 w-3.5" /> Remind me
              </button>
              {step.who !== "suite" && (
                <button onClick={() => setStatus("done")} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-[#2c6b3f]/40 px-3 py-1.5 text-xs font-medium text-[#2c6b3f] hover:bg-[#2c6b3f]/10">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} {kind === "decide" ? "Mark decided" : "Mark done"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {!done && editing && kind === "approve" && (
        <div className="mt-2 rounded-lg border border-[#1a2b4a]/10 bg-white p-3 dark:bg-[#1a2b4a]/30">
          <label className="block text-xs font-medium" htmlFor={`edit-${reportId}-${index}`}>What should change in this one?</label>
          <textarea id={`edit-${reportId}-${index}`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Shorten question 2, make the subject warmer, change Thursday to Friday…" className="mt-1 w-full rounded-lg border border-[#1a2b4a]/15 bg-white px-3 py-2 text-xs dark:bg-[#1a2b4a]/30" />
          <div className="mt-2 flex items-center gap-2">
            <button
              disabled={!note.trim()}
              onClick={() => {
                setEditing(false);
                askAssistant(
                  `Please change ONE item only: ${step.text}. Where it is: ${link || "(see the checklist)"}. What to change: ${note.trim()}\n\nPrepare the change as a card for my approval using the right tool for this item (update_form for a form, the email series tool for an email draft). Do not change or approve anything else, and tell me exactly what the card will change.`,
                  `Change: ${step.text.replace(/^Read, edit and approve: /, "")} — ${note.trim()}`
                );
                setNote("");
              }}
              className="rounded-lg bg-[#1a2b4a] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-[#c9a227] dark:text-[#14203a]"
            >
              Send this change
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-[#7a8a99] hover:underline">Never mind</button>
            <span className="text-[11px] text-[#7a8a99]">Only this item changes. Everything else stays waiting.</span>
          </div>
        </div>
      )}

      {!done && remind && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-[#F8F5F0] p-2 text-xs dark:bg-[#1d2c4c]">
          <span className="text-[#5d6b7a] dark:text-[#b8c2cf]">Remind me:</span>
          {quickDays().map((q) => (
            <button
              key={q.date}
              onClick={() => {
                setRemind(false);
                askAssistant(
                  `Please prepare a reminder for me: "${step.text}" (from the report on "${itemTitle}"). Use the create_reminder tool with date ${q.date} and time 09:00 in my time zone, and put a short note saying which item it comes from.`,
                  `Remind me ${q.label.toLowerCase()}: ${step.text}`
                );
              }}
              className="rounded-md border border-[#c9a227] px-2.5 py-1 font-semibold hover:bg-[#c9a227]/10"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      {done && (
        <button onClick={() => setStatus("waiting")} disabled={busy} className="mt-1 text-[11px] text-[#7a8a99] hover:underline">Reopen this one</button>
      )}
      {err && <p className="mt-1 text-xs text-[#a3281f]">{err}</p>}
    </li>
  );
}
