"use client";

import { useEffect, useState } from "react";
import type { IbRequestRow } from "@/app/api/investor-access/requests/route";

const DEFAULT_SUBJECT = "Your access to the LifeCharter investor documents";
const DEFAULT_BODY = `Dear [first name],

Thank you for your interest in LifeCharter Command Suite. I have reviewed your request and I am glad to share the investor documents with you.

You can open them here:
https://lccommandsuite.com/investor-brief

Sign in with this email address ([email]) and your personal access code:

[access code]

The page holds the investor brief, the investor summary, the product screens, the financial model outputs and the other supporting documents, which you can read online or download. If you have any questions, simply reply to this email.

Head up - Wings out,

AmiLynne "Babs" Carroll
Executive, Alignment Architect, and Chief Travel Partner
LifeCharter by AmiLynne Carroll`;

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

export default function Requests() {
  const [rows, setRows] = useState<IbRequestRow[] | null>(null);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState<{ email: string; text: string } | null>(null);

  const load = () =>
    fetch("/api/investor-access/requests", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d) => setRows(d.rows))
      .catch(() => setRows([]));
  useEffect(() => {
    load();
  }, []);

  async function decide(row: IbRequestRow, action: "approve" | "deny" | "revoke", send = false) {
    setBusy(row.email + action + send);
    setNote(null);
    const first = (row.name || "").trim().split(/\s+/)[0] || "there";
    const r = await fetch("/api/investor-access/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: row.email, action, send, subject, body: body.replace(/\[first name\]/gi, first) }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) return setNote({ email: row.email, text: d.error || "It did not save." });
    if (action === "approve") {
      setNote({
        email: row.email,
        text: `Approved. ${row.name || row.email}'s personal access code is ${d.code}. ${d.emailed ? "It was emailed to them." : send ? "The email did not send, so give them the code yourself." : "Give it to them yourself, or use Approve and email the code."}${d.warning ? " " + d.warning : ""}`,
      });
    }
    load();
  }

  const chip = (s: string) =>
    s === "approved" ? "bg-[#2E7C83] text-white" : s === "pending" ? "bg-[#c9a227] text-[#1a2b4a]" : "bg-[#b8a898] text-[#1a2b4a]";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Investor access requests</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#5a6472] dark:text-[#b8c2cf]">
        People ask for the investor documents on amilynnecarroll.com/investors. You review each one. Approving creates that person&apos;s own access code; they sign in with their email and that code. Only the investor page is protected.
      </p>

      <details className="mt-5 rounded-xl border border-[#1a2b4a]/15 bg-white p-4 dark:bg-[#1a2b4a]/40">
        <summary className="cursor-pointer text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">The email that goes with an approval (review and edit)</summary>
        <label className="mt-3 block text-xs font-semibold text-[#5a6472]">Subject</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-lg border border-[#1a2b4a]/20 px-3 py-2 text-sm text-[#1a2b4a]" />
        <label className="mt-3 block text-xs font-semibold text-[#5a6472]">Message (the access code is filled in for each person)</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} className="mt-1 w-full rounded-lg border border-[#1a2b4a]/20 px-3 py-2 font-serif text-sm text-[#1a2b4a]" />
        <p className="mt-2 text-xs text-[#7a8a99]">Nothing is emailed until you press Approve and email the code on a request.</p>
      </details>

      {rows === null && <p className="mt-6 text-sm text-[#7a8a99]">Loading…</p>}
      {rows && rows.length === 0 && <p className="mt-6 text-sm text-[#7a8a99]">No requests yet.</p>}

      <ul className="mt-6 space-y-4">
        {(rows ?? []).map((r) => (
          <li key={r.email} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 dark:bg-[#1a2b4a]/40">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{r.name}</p>
                <p className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">{r.company}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${chip(r.status)}`}>{r.status}</span>
            </div>
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div><dt className="inline text-[#7a8a99]">Email: </dt><dd className="inline">{r.email}</dd></div>
              <div><dt className="inline text-[#7a8a99]">Telephone: </dt><dd className="inline">{r.phone}</dd></div>
              <div><dt className="inline text-[#7a8a99]">Location: </dt><dd className="inline">{[r.city, r.state, r.zip].filter(Boolean).join(", ")}</dd></div>
              <div><dt className="inline text-[#7a8a99]">Requested: </dt><dd className="inline">{when(r.requestedAt)}</dd></div>
              {r.emailedAt && <div><dt className="inline text-[#7a8a99]">Code emailed: </dt><dd className="inline">{when(r.emailedAt)}</dd></div>}
              {r.lastLoginAt && <div><dt className="inline text-[#7a8a99]">Last opened: </dt><dd className="inline">{when(r.lastLoginAt)}</dd></div>}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {r.status !== "approved" && (
                <>
                  <button disabled={!!busy} onClick={() => decide(r, "approve", true)} className="rounded-full bg-[#0F1A38] px-4 py-2 text-sm font-semibold text-[#FAF8F3] disabled:opacity-50">
                    Approve and email the code
                  </button>
                  <button disabled={!!busy} onClick={() => decide(r, "approve", false)} className="rounded-full border border-[#0F1A38]/30 px-4 py-2 text-sm font-semibold text-[#0F1A38] disabled:opacity-50 dark:text-[#F8F5F0]">
                    Approve, no email
                  </button>
                  {r.status === "pending" && (
                    <button disabled={!!busy} onClick={() => decide(r, "deny")} className="rounded-full border border-[#A4523C]/50 px-4 py-2 text-sm font-semibold text-[#A4523C] disabled:opacity-50">
                      Decline
                    </button>
                  )}
                </>
              )}
              {r.status === "approved" && (
                <>
                  <button disabled={!!busy} onClick={() => decide(r, "approve", true)} className="rounded-full border border-[#0F1A38]/30 px-4 py-2 text-sm font-semibold text-[#0F1A38] disabled:opacity-50 dark:text-[#F8F5F0]">
                    New code and email it
                  </button>
                  <button disabled={!!busy} onClick={() => decide(r, "revoke")} className="rounded-full border border-[#A4523C]/50 px-4 py-2 text-sm font-semibold text-[#A4523C] disabled:opacity-50">
                    Remove access
                  </button>
                </>
              )}
            </div>
            {note?.email === r.email && <p className="mt-3 rounded-lg bg-[#2E7C83]/10 p-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{note.text}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
