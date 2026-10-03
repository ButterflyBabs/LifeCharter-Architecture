"use client";

import { Fragment, useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Clock, MinusCircle, Pencil } from "lucide-react";

type Cell = { state: "sent" | "due" | "skipped" | "waiting" | "missed"; at?: string; note?: string };
interface Data {
  enabled: boolean;
  emails: { key: string; day: number; subject: string; sent: number; rule: string }[];
  clients: { id: string; name: string; email: string; joined: string; day: number; setup: { ai: boolean; assessments: boolean; tools: boolean; website: boolean } | null; cells: Record<string, Cell> }[];
  recent: { userId: string; key: string; at: string; name: string | null; email: string | null }[];
}

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
interface EmailCopy { key: string; day: number; subject: string; preview: string; body: string; edited: boolean; original: { subject: string; preview: string; body: string } }
const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/30 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/20 px-3.5 py-1.5 text-xs font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5 disabled:opacity-50";
const btnPrimary = "inline-flex items-center gap-1.5 rounded-full bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-[#F8F5F0] hover:opacity-90 disabled:opacity-50";
const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40 p-5";

function CellView({ c }: { c: Cell }) {
  if (c.state === "sent") return <span className="inline-flex items-center gap-1 text-[#2c6b3f]"><CheckCircle2 className="h-3.5 w-3.5" /> {c.at ? day(c.at) : "Sent"}</span>;
  if (c.state === "due") return <span title={c.note} className="inline-flex items-center gap-1 font-semibold text-[#2E7C83]"><Clock className="h-3.5 w-3.5" /> Due</span>;
  if (c.state === "skipped") return <span title={c.note} className="inline-flex items-center gap-1 text-[#6b5410]"><MinusCircle className="h-3.5 w-3.5" /> Skipped</span>;
  if (c.state === "missed") return <span title={c.note} className="inline-flex items-center gap-1 text-[#b3422f]"><CircleAlert className="h-3.5 w-3.5" /> Missed</span>;
  return <span className="text-[#7a8a99]" title={c.note}>{c.note || "Waiting"}</span>;
}

// Monitoring for the new-client welcome series: is it on, what has gone out, what is waiting,
// and what was skipped (and why). Read-only. Babs's account only.
export default function WelcomeSeriesTab() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [copy, setCopy] = useState<EmailCopy[]>([]);
  const [openKey, setOpenKey] = useState("");
  const [draft, setDraft] = useState({ subject: "", preview: "", body: "" });
  const [html, setHtml] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");

  const loadCopy = () =>
    fetch("/api/crm/welcome-series/emails", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setCopy(j.emails ?? []))
      .catch(() => undefined);
  useEffect(() => {
    void loadCopy();
  }, []);

  const edit = (key: string) => {
    if (openKey === key) return setOpenKey("");
    const c = copy.find((x) => x.key === key);
    if (!c) return;
    setOpenKey(key);
    setDraft({ subject: c.subject, preview: c.preview, body: c.body });
    setHtml("");
    setNote("");
  };
  const call = async (method: string, body: Record<string, unknown>, url = "/api/crm/welcome-series/emails") => {
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: method === "DELETE" ? undefined : JSON.stringify(body) });
    return { ok: r.ok, j: await r.json().catch(() => ({})) };
  };
  const save = async () => {
    setBusy("save");
    const { ok, j } = await call("PUT", { key: openKey, ...draft });
    setBusy("");
    setNote(ok ? "Saved. It goes out this way from now on. Emails already sent are not changed." : j.error || "Couldn't save.");
    if (ok) await loadCopy();
  };
  const reset = async () => {
    setBusy("reset");
    await fetch(`/api/crm/welcome-series/emails?key=${openKey}`, { method: "DELETE" });
    setBusy("");
    await loadCopy();
    const c = (await fetch("/api/crm/welcome-series/emails", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ emails: [] }))).emails.find((x: EmailCopy) => x.key === openKey);
    if (c) setDraft({ subject: c.subject, preview: c.preview, body: c.body });
    setNote("Back to the original copy.");
  };
  const render = async (action: "preview" | "test") => {
    setBusy(action);
    const { ok, j } = await call("POST", { key: openKey, action, ...draft });
    setBusy("");
    if (action === "preview") {
      if (ok) setHtml(j.html);
      else setNote(j.error || "Couldn't show the preview.");
    } else setNote(ok ? `Test sent to ${j.to}.` : j.error || "The test didn't send.");
  };

  useEffect(() => {
    fetch("/api/crm/welcome-series", { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "Couldn't load the welcome series.");
        setD(j as Data);
      })
      .catch((e) => setErr((e as Error).message));
  }, []);

  if (err) return <p className="rounded-xl bg-[#b06a5a]/10 p-4 text-sm text-[#8a2f2f]">{err}</p>;
  if (!d) return <p className="text-sm text-[#7a8a99]">Loading…</p>;

  return (
    <div className="space-y-5">
      <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <p className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">LCCS New Client Welcome</p>
          <p className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">Six emails to every new Command Suite client: the day they join, then Day 1, 3, 5, 10 and 14. It goes out from the 9 am Mountain run each morning, and no email ever goes out twice.</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${d.enabled ? "bg-[#2c6b3f]/15 text-[#2c6b3f]" : "bg-[#c9a227]/20 text-[#6b5410]"}`}>{d.enabled ? "Sending is on" : "Sending is off"}</span>
      </div>
      {!d.enabled && <p className="rounded-xl bg-[#c9a227]/15 px-4 py-3 text-sm text-[#6b5410]">Nothing is being sent yet. The series stays off until you approve the copy and it is switched on, so the &ldquo;Due&rdquo; marks below are what would go out.</p>}

      <div className={card}>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#7a8a99]">The emails</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-[#7a8a99]"><th className="py-2 pr-3 font-medium">When</th><th className="py-2 pr-3 font-medium">Subject</th><th className="py-2 pr-3 font-medium">Rule</th><th className="py-2 pr-3 text-right font-medium">Sent</th><th className="py-2"></th></tr></thead>
            <tbody>
              {d.emails.map((e) => {
                const c = copy.find((x) => x.key === e.key);
                return (
                  <Fragment key={e.key}>
                    <tr className="border-t border-[#1a2b4a]/10 align-top">
                      <td className="py-2 pr-3 whitespace-nowrap font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{e.day === 0 ? "Day of joining" : `Day ${e.day}`}</td>
                      <td className="py-2 pr-3">{c?.subject || e.subject}{c?.edited && <span className="ml-2 rounded-full bg-[#c9a227]/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#6b5410]">Edited</span>}</td>
                      <td className="py-2 pr-3 text-[#5a6472] dark:text-[#b8c2cf]">{e.rule}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{e.sent}</td>
                      <td className="py-2 text-right"><button className={btn} onClick={() => edit(e.key)}><Pencil className="h-3 w-3" /> {openKey === e.key ? "Close" : "View or edit"}</button></td>
                    </tr>
                    {openKey === e.key && (
                      <tr className="border-t border-[#1a2b4a]/10">
                        <td colSpan={5} className="pb-4 pt-3">
                          <div className="space-y-3 rounded-xl bg-[#1a2b4a]/[0.03] p-4">
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#7a8a99]" htmlFor="wl-subject">Subject</label>
                              <input id="wl-subject" className={field} value={draft.subject} onChange={(ev) => setDraft({ ...draft, subject: ev.target.value })} maxLength={200} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#7a8a99]" htmlFor="wl-preview">Preview line (the grey text beside the subject in an inbox)</label>
                              <input id="wl-preview" className={field} value={draft.preview} onChange={(ev) => setDraft({ ...draft, preview: ev.target.value })} maxLength={300} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#7a8a99]" htmlFor="wl-body">The email</label>
                              <textarea id="wl-body" className={`${field} font-mono`} rows={16} value={draft.body} onChange={(ev) => setDraft({ ...draft, body: ev.target.value })} />
                              <p className="mt-1 text-xs text-[#7a8a99]">Leave a blank line between paragraphs. Start a line with &ldquo;- &rdquo; for a bullet, or &ldquo;1. &rdquo; for a numbered step. <b>{"{{GREETING}}"}</b> becomes &ldquo;Hi Name,&rdquo;{e.key === "welcome" ? <>, <b>{"{{INCLUDED}}"}</b> becomes the list of what their plan includes</> : null}{e.key === "day10" || e.key === "day14" ? <>, <b>{"{{REVIEW_DUE}}"}</b> becomes their Website Review date</> : null}. Your sign-off is added for you. Which day it goes out is fixed.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button className={btnPrimary} onClick={save} disabled={busy !== ""}>{busy === "save" ? "Saving…" : "Save changes"}</button>
                              <button className={btn} onClick={() => render("preview")} disabled={busy !== ""}>{busy === "preview" ? "Loading…" : "Preview"}</button>
                              <button className={btn} onClick={() => render("test")} disabled={busy !== ""}>{busy === "test" ? "Sending…" : "Send me a test"}</button>
                              {c?.edited && <button className={btn} onClick={reset} disabled={busy !== ""}>Back to original</button>}
                            </div>
                            {note && <p className="text-sm text-[#1F5E63]" role="status">{note}</p>}
                            {html && <iframe title="Email preview" sandbox="" srcDoc={html} className="h-[560px] w-full rounded-xl border border-[#1a2b4a]/15 bg-white" />}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={card}>
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-[#7a8a99]">Clients who joined in the last 30 days</p>
        <p className="mb-3 text-xs text-[#7a8a99]">Skipped means they had already done what the email asks for, so the nudge was not sent. Hover a mark for the reason.</p>
        {d.clients.length === 0 ? (
          <p className="text-sm text-[#7a8a99]">No new clients in the last 30 days.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#7a8a99]">
                  <th className="py-2 pr-3 font-medium">Client</th><th className="py-2 pr-3 font-medium">Joined</th><th className="py-2 pr-3 font-medium">Setup</th>
                  {d.emails.map((e) => <th key={e.key} className="py-2 pr-3 font-medium whitespace-nowrap">{e.day === 0 ? "Welcome" : `Day ${e.day}`}</th>)}
                </tr>
              </thead>
              <tbody>
                {d.clients.map((c) => (
                  <tr key={c.id} className="border-t border-[#1a2b4a]/10 align-top">
                    <td className="py-2 pr-3"><span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{c.name}</span><br /><span className="text-xs text-[#7a8a99]">{c.email}</span></td>
                    <td className="py-2 pr-3 whitespace-nowrap">{day(c.joined)}<br /><span className="text-xs text-[#7a8a99]">day {c.day}</span></td>
                    <td className="py-2 pr-3 text-xs">
                      {c.setup ? (
                        <>
                          <span className={c.setup.ai ? "text-[#2c6b3f]" : "text-[#7a8a99]"}>AI {c.setup.ai ? "✓" : "–"}</span>{" "}
                          <span className={c.setup.assessments ? "text-[#2c6b3f]" : "text-[#7a8a99]"}>Assessments {c.setup.assessments ? "✓" : "–"}</span>{" "}
                          <span className={c.setup.tools ? "text-[#2c6b3f]" : "text-[#7a8a99]"}>Tool {c.setup.tools ? "✓" : "–"}</span>{" "}
                          <span className={c.setup.website ? "text-[#2c6b3f]" : "text-[#7a8a99]"}>Website {c.setup.website ? "✓" : "–"}</span>
                        </>
                      ) : "n/a"}
                    </td>
                    {d.emails.map((e) => <td key={e.key} className="py-2 pr-3 whitespace-nowrap"><CellView c={c.cells[e.key]} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={card}>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#7a8a99]">Latest sends</p>
        {d.recent.length === 0 ? (
          <p className="text-sm text-[#7a8a99]">Nothing has been sent yet.</p>
        ) : (
          <ul className="divide-y divide-[#1a2b4a]/10 text-sm">
            {d.recent.map((r, i) => (
              <li key={`${r.userId}-${r.key}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <span><b className="text-[#1a2b4a] dark:text-[#F8F5F0]">{r.name || r.email || "A client"}</b> got <i>{d.emails.find((e) => e.key === r.key)?.subject || r.key}</i></span>
                <span className="text-xs text-[#7a8a99]">{when(r.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
