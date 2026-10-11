"use client";

import { useEffect, useState } from "react";
import type { IbRequestRow } from "@/app/api/investor-access/requests/route";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

export default function Requests() {
  const [rows, setRows] = useState<IbRequestRow[] | null>(null);
  const [campaignOn, setCampaignOn] = useState(false);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState<{ email: string; text: string } | null>(null);

  const load = () =>
    fetch("/api/investor-access/requests", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d) => {
        setRows(d.rows);
        setCampaignOn(Boolean(d.campaignOn));
      })
      .catch(() => setRows([]));
  useEffect(() => {
    load();
  }, []);

  async function decide(row: IbRequestRow, action: "approve" | "deny" | "revoke", send = false) {
    setBusy(row.email + action + send);
    setNote(null);
    const r = await fetch("/api/investor-access/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: row.email, action, send }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) return setNote({ email: row.email, text: d.error || "It did not save." });
    if (action === "approve") {
      setNote({
        email: row.email,
        text: `Approved. ${row.name || row.email}'s personal access code is ${d.code}. ${d.emailed ? "It was emailed to them." : d.warning ? d.warning : "Give it to them yourself, or use Approve and email the code."}`,
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

      <div className="mt-5 rounded-xl border border-[#1a2b4a]/15 bg-white p-4 text-sm dark:bg-[#1a2b4a]/40">
        <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
          The approval email is a campaign:{" "}
          <a className="text-[#2E7C83] underline" href="/sequences-manager">Campaigns &amp; Broadcasts</a> &rsaquo; INVESTOR ACCESS - APPROVED
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${campaignOn ? "bg-[#2E7C83] text-white" : "bg-[#b8a898] text-[#1a2b4a]"}`}>{campaignOn ? "ON" : "OFF (draft)"}</span>
        </p>
        <p className="mt-1 text-[#5a6472] dark:text-[#b8c2cf]">
          Edit its wording there and turn it ON when it reads right. It includes the person&apos;s own access code and the link to the Investor Interest calendar (
          <a className="underline" href="https://lccommandsuite.com/book/investor-interest" target="_blank" rel="noopener noreferrer">lccommandsuite.com/book/investor-interest</a>
          ). Until it is ON, approving a request does not email the code. Tags: requests are tagged investor-interest; a booked call adds investor-interest-call-scheduled.
        </p>
      </div>
      {rows && rows.length > 0 && (
        <p className="mt-4 text-sm text-[#5a6472] dark:text-[#b8c2cf]">
          {rows.length} {rows.length === 1 ? "request" : "requests"} &middot; {rows.filter((r) => r.status === "pending").length} waiting &middot; {rows.filter((r) => r.status === "approved").length} approved &middot; {rows.filter((r) => r.callAt).length} {rows.filter((r) => r.callAt).length === 1 ? "call" : "calls"} booked
        </p>
      )}

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
              {r.investorType && <div><dt className="inline text-[#7a8a99]">Who they are: </dt><dd className="inline">{r.investorType}</dd></div>}
              {r.range && <div><dt className="inline text-[#7a8a99]">Range: </dt><dd className="inline">{r.range}</dd></div>}
              {r.timeline && <div><dt className="inline text-[#7a8a99]">Deciding: </dt><dd className="inline">{r.timeline}</dd></div>}
              {r.linkedin && <div className="sm:col-span-2"><dt className="inline text-[#7a8a99]">LinkedIn or website: </dt><dd className="inline break-all">{/^https?:\/\//i.test(r.linkedin) ? <a className="text-[#2E7C83] underline" href={r.linkedin} target="_blank" rel="noopener noreferrer">{r.linkedin}</a> : r.linkedin}</dd></div>}
              {r.referral && <div className="sm:col-span-2"><dt className="inline text-[#7a8a99]">How they heard: </dt><dd className="inline">{r.referral}</dd></div>}
              {r.emailedAt && <div><dt className="inline text-[#7a8a99]">Code emailed: </dt><dd className="inline">{when(r.emailedAt)}</dd></div>}
              {r.callAt && <div><dt className="inline text-[#7a8a99]">Call booked: </dt><dd className="inline">{when(r.callAt)}</dd></div>}
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
