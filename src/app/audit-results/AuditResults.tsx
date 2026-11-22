"use client";

import { useEffect, useMemo, useState } from "react";
import type { ResultKind, ResultRow } from "@/lib/auditResults";
import { KIND_LABEL } from "@/lib/auditResults";

const ink = "text-[#1a2b4a] dark:text-[#F8F5F0]";
const faint = "text-[#5b5f73] dark:text-[#b8c2cf]";
const box = "rounded-lg border border-[#1a2b4a]/25 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/40 dark:text-[#F8F5F0]";
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function AuditResults() {
  const [rows, setRows] = useState<ResultRow[] | null>(null);
  const [err, setErr] = useState("");
  const [kind, setKind] = useState<"all" | ResultKind>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/audit-results")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Couldn't load the results.");
        setRows(d.rows);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => (kind === "all" || r.kind === kind) && (!needle || [r.name, r.email, r.phone, r.business, r.headline].some((v) => v.toLowerCase().includes(needle))));
  }, [rows, kind, q]);
  const count = (k: ResultKind) => (rows ?? []).filter((r) => r.kind === k).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${ink}`}>Audit Results</h1>
          <p className={`mt-1 text-sm ${faint}`}>Everyone who has finished the Executive Business Assessment, the Mini Command Audit or the Business Health Check, newest first, with their contact details.</p>
        </div>
        <a href="/api/audit-results?format=csv" className="rounded-xl bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-[#F8F5F0] hover:bg-[#243a63] dark:bg-[#c9a227] dark:text-[#1a2b4a]">Download spreadsheet</a>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <select className={box} value={kind} onChange={(e) => setKind(e.target.value as "all" | ResultKind)} aria-label="Which audit">
          <option value="all">All three{rows ? ` (${rows.length})` : ""}</option>
          <option value="exec">{KIND_LABEL.exec}{rows ? ` (${count("exec")})` : ""}</option>
          <option value="health">{KIND_LABEL.health}{rows ? ` (${count("health")})` : ""}</option>
          <option value="mini">{KIND_LABEL.mini}{rows ? ` (${count("mini")})` : ""}</option>
        </select>
        <input className={`${box} w-full max-w-xs`} placeholder="Search name, email, phone, business" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      </div>

      {err && <p role="alert" className="mt-6 text-sm font-medium text-[#A4523C]">{err}</p>}
      {!rows && !err && <p className={`mt-6 ${faint}`}>Loading…</p>}
      {rows && shown.length === 0 && <p className={`mt-6 ${faint}`}>{rows.length === 0 ? "No one has finished an audit yet. They will appear here the moment they do." : "Nothing matches that search."}</p>}

      {shown.length > 0 && (
        <ul className="mt-5 space-y-3">
          {shown.map((r) => (
            <li key={r.id} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-4 dark:border-white/10 dark:bg-[#1a2b4a]/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`text-lg font-semibold ${ink}`}>{r.name}{r.business ? <span className={`font-normal ${faint}`}> · {r.business}</span> : null}</p>
                  <p className={`mt-0.5 text-sm ${ink}`}>
                    <a className="underline decoration-[#c9a227] underline-offset-2" href={`mailto:${r.email}`}>{r.email}</a>
                    {r.phone ? <> · <a className="underline decoration-[#c9a227] underline-offset-2" href={`tel:${r.phone}`}>{r.phone}</a></> : null}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-full bg-[#c9a227]/20 px-3 py-0.5 text-xs font-semibold text-[#6b5410] dark:text-[#e6cf7a]">{KIND_LABEL[r.kind]}</span>
                  <p className={`mt-1 text-xs ${faint}`}>{when(r.createdAt)}</p>
                </div>
              </div>
              <p className={`mt-3 font-medium ${ink}`}>{r.headline}</p>
              {r.lowest.length > 0 && <p className={`text-sm ${faint}`}>Lowest areas: {r.lowest.join(", ")}</p>}
              <p className={`mt-1 text-xs ${faint}`}>
                {r.source ? `Came from ${r.source}` : "No campaign tag"}
                {r.emailStatus ? ` · Scores email ${r.emailStatus}` : ""}
              </p>
              <button className={`mt-2 text-sm font-semibold underline decoration-[#c9a227] underline-offset-2 ${ink}`} aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>
                {open === r.id ? "Hide the full breakdown" : "See the full breakdown"}
              </button>
              {open === r.id && (
                <dl className="mt-3 grid gap-x-6 gap-y-1 border-t border-[#1a2b4a]/10 pt-3 text-sm sm:grid-cols-2 dark:border-white/10">
                  {r.details.map((d) => (
                    <div key={d.label} className="flex justify-between gap-3">
                      <dt className={faint}>{d.label}</dt>
                      <dd className={`text-right font-medium ${ink}`}>{d.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
