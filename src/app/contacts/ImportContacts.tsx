"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, X, Download, ClipboardPaste, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IMPORT_LIMITS, TARGET_LABELS, buildRows, guessMapping, readTable, toCsv, type Table, type Target, type ImportRow } from "@/lib/contactImport";

// Contacts → Import contacts. The file is read and parsed right here in the
// browser; only the mapped rows go to /api/crm/contacts/import, in batches of 500.

type Step = "choose" | "map" | "importing" | "done";
interface Result {
  created: number;
  merged: number;
  unsubscribed: number;
  errors: { row: number; reason: string }[];
}

const TARGETS = Object.keys(TARGET_LABELS) as Target[];
const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 p-3 text-sm";
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const ACCEPT = ".csv,.tsv,.txt,.vcf,.vcard,text/csv,text/vcard,text/x-vcard,text/plain";

const HOW_TO: [string, string][] = [
  ["Gmail / Google Contacts", "contacts.google.com → Export → Google CSV."],
  ["Outlook", "People → Manage contacts → Export contacts → CSV."],
  ["iPhone / iCloud / Mac", "icloud.com/contacts → select all → Export vCard (Mac Contacts: File → Export → vCard)."],
  ["Your old CRM", "GoHighLevel, Mailchimp, Kajabi and most others: Contacts or Audience → Export → CSV."],
  ["Excel / Numbers / Google Sheets", "File → Save as or Download → CSV, or copy the cells and paste them below."],
];

async function readFileText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    // Older Outlook/Excel exports are often Windows-1252, not UTF-8.
    return new TextDecoder("windows-1252").decode(buf);
  }
}

function download(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExportContactsLink() {
  return (
    <a
      href="/api/crm/contacts/export"
      download
      className="inline-flex items-center justify-center rounded-full border-2 border-[#c9a227] px-4 py-1.5 text-sm font-medium text-[#1a2b4a] hover:bg-[#c9a227]/10 dark:text-[#F8F5F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227] focus-visible:ring-offset-2"
    >
      <Download className="w-4 h-4 mr-1" aria-hidden /> Export contacts
    </a>
  );
}

export default function ImportContacts({ onClose, onImported, onViewTag }: { onClose: () => void; onImported: () => void; onViewTag: (tag: string) => void }) {
  const [step, setStep] = useState<Step>("choose");
  const [table, setTable] = useState<Table | null>(null);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Target[]>([]);
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [tag, setTag] = useState(`imported-${today()}`);
  const [consent, setConsent] = useState(false);
  const [check, setCheck] = useState<{ existing: Set<string>; unsubscribed: Set<string> } | null>(null);
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<Result | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  function load(text: string, name: string) {
    setError("");
    const t = readTable(text);
    if (!t.rows.length) return setError("I couldn't find any contacts in that. Check it's a CSV or vCard export with at least one row.");
    if (t.rows.length > IMPORT_LIMITS.maxRows)
      return setError(`That has ${t.rows.length.toLocaleString()} rows; the limit is ${IMPORT_LIMITS.maxRows.toLocaleString()} per import. Split it into smaller files and import each one.`);
    setTable(t);
    setFileName(name);
    setMapping(guessMapping(t.headers, t.rows));
    setCheck(null);
    setConsent(false);
    setStep("map");
  }

  async function onFile(file: File | undefined | null) {
    if (!file) return;
    setError("");
    if (/\.(xlsx|xls|numbers|ods)$/i.test(file.name)) return setError("That's a spreadsheet file. Open it and save or download it as CSV, then drop the CSV here (or copy the cells and paste them).");
    if (!/\.(csv|tsv|txt|vcf|vcard)$/i.test(file.name)) return setError("Please choose a .csv or .vcf (vCard) file.");
    if (file.size > IMPORT_LIMITS.maxFileBytes) return setError("That file is over 5 MB. Split it into smaller files and import each one.");
    try {
      load(await readFileText(file), file.name);
    } catch {
      setError("I couldn't read that file. Try exporting it again as CSV.");
    }
  }

  const built = useMemo(() => (table ? buildRows(table, mapping) : { rows: [] as ImportRow[], skipped: [] }), [table, mapping]);
  const hasEmail = mapping.includes("email");
  const emailsKey = useMemo(() => built.rows.map((r) => r.email).join("\n"), [built.rows]);

  // Dry run: which of these are already in the account (nothing is saved).
  useEffect(() => {
    if (step !== "map" || !emailsKey) {
      setCheck(null);
      return;
    }
    let live = true;
    const t = setTimeout(async () => {
      setChecking(true);
      const r = await fetch("/api/crm/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "check", emails: emailsKey.split("\n") }),
      }).catch(() => null);
      const d = r ? await r.json().catch(() => ({})) : {};
      if (!live) return;
      setChecking(false);
      if (!r || !r.ok) {
        setCheck(null);
        if (r && (r.status === 401 || r.status === 403)) setError(d.error || "Your access doesn't include adding contacts.");
        return;
      }
      setCheck({ existing: new Set(d.existing ?? []), unsubscribed: new Set(d.unsubscribed ?? []) });
    }, 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [emailsKey, step]);

  const existingCount = check ? built.rows.filter((r) => check.existing.has(r.email)).length : 0;
  const cleanTag = tag.trim().toLowerCase().slice(0, IMPORT_LIMITS.tag);

  async function runImport() {
    if (!table || !consent || !built.rows.length) return;
    setError("");
    setStep("importing");
    const rows = built.rows;
    setProgress({ done: 0, total: rows.length });
    const total: Result = { created: 0, merged: 0, unsubscribed: 0, errors: [] };
    for (let i = 0; i < rows.length; i += IMPORT_LIMITS.batchSize) {
      const batch = rows.slice(i, i + IMPORT_LIMITS.batchSize);
      const r = await fetch("/api/crm/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "import", consent: true, file: fileName, tag: cleanTag, importKey: `${fileName}|${cleanTag}`, rows: batch }),
      }).catch(() => null);
      const d = r ? await r.json().catch(() => ({})) : {};
      if (r && r.ok) {
        total.created += d.created ?? 0;
        total.merged += d.merged ?? 0;
        total.unsubscribed += d.unsubscribed ?? 0;
        total.errors.push(...((d.errors as Result["errors"]) ?? []));
      } else if (r && r.status >= 400 && r.status < 500) {
        // Signed out, no access, or a bad request: stop rather than retrying every batch.
        const reason = d.error || "Not saved";
        for (const row of rows.slice(i)) total.errors.push({ row: row.row, reason });
        setProgress({ done: rows.length, total: rows.length });
        break;
      } else {
        for (const row of batch) total.errors.push({ row: row.row, reason: "Not saved (connection problem) — try importing the file again" });
      }
      setProgress({ done: Math.min(i + batch.length, rows.length), total: rows.length });
    }
    setResult(total);
    setStep("done");
    onImported();
  }

  function downloadSkipped() {
    if (!table) return;
    const byRow = new Map(table.rows.map((cells, i) => [table.rowNumbers[i], cells]));
    const list = [
      ...built.skipped.map((s) => ({ row: s.row, email: s.email, reason: s.reason, cells: s.cells })),
      ...(result?.errors ?? []).map((e) => ({ row: e.row, email: built.rows.find((r) => r.row === e.row)?.email ?? "", reason: e.reason, cells: byRow.get(e.row) ?? [] })),
    ].sort((a, b) => a.row - b.row);
    const label = table.kind === "vcard" ? "Card" : "Row";
    download(`skipped-${fileName.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_") || "contacts"}.csv`, toCsv([[label, "Email", "Reason", ...table.headers], ...list.map((s) => [s.row, s.email, s.reason, ...s.cells])]));
  }

  function reset() {
    setStep("choose");
    setTable(null);
    setFileName("");
    setMapping([]);
    setPaste("");
    setResult(null);
    setError("");
    setConsent(false);
  }

  const skippedTotal = built.skipped.length + (result?.errors.length ?? 0);

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] outline-none">
              {step === "choose" ? "Import contacts" : step === "map" ? "Match your columns" : step === "importing" ? "Importing…" : "Import finished"}
            </h2>
            {step === "map" && <p className="text-sm text-[#7a8a99]">{fileName}</p>}
          </div>
          <button onClick={onClose} aria-label="Close import" className="rounded-full p-1 text-[#7a8a99] hover:bg-[#1a2b4a]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div aria-live="polite" role="status">
          {error && (
            <p className="flex gap-2 rounded-lg bg-[#c9a227]/15 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#c9a227]" aria-hidden /> {error}
            </p>
          )}
        </div>

        {step === "choose" && (
          <>
            <p className="text-sm text-[#5a6472] dark:text-[#cfd6de]">Export your contacts from Gmail, Outlook, iPhone, or your old CRM as a CSV or vCard file, then drop it here.</p>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void onFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition focus-within:ring-2 focus-within:ring-[#c9a227] focus-within:ring-offset-2 ${
                dragging ? "border-[#c9a227] bg-[#c9a227]/10" : "border-[#1a2b4a]/25 bg-[#F8F5F0] dark:bg-[#1a2b4a]/20"
              }`}
            >
              <Upload className="w-7 h-7 text-[#c9a227]" aria-hidden />
              <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Drop a CSV or vCard file here, or choose a file</span>
              <span className="text-xs text-[#7a8a99]">.csv or .vcf · up to 5 MB and {IMPORT_LIMITS.maxRows.toLocaleString()} contacts</span>
              <input
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={(e) => {
                  void onFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <div>
              <Button variant="ghost" size="sm" onClick={() => setShowPaste((v) => !v)} aria-expanded={showPaste}>
                <ClipboardPaste className="w-4 h-4 mr-1" aria-hidden /> Paste from a spreadsheet instead
              </Button>
              {showPaste && (
                <div className="mt-2 space-y-2">
                  <label className="block text-sm text-[#5a6472]" htmlFor="import-paste">
                    Copy the cells (with the header row, if you have one) and paste them here.
                  </label>
                  <textarea id="import-paste" rows={6} value={paste} onChange={(e) => setPaste(e.target.value)} className={`${field} font-mono`} placeholder={"Email\tFirst name\tLast name\neloise@example.com\tEloise\tTest"} />
                  <Button size="sm" disabled={!paste.trim()} onClick={() => load(paste, "Pasted list")}>
                    Use pasted list
                  </Button>
                </div>
              )}
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">How to export from…</summary>
              <ul className="mt-2 space-y-1 text-[#5a6472] dark:text-[#cfd6de]">
                {HOW_TO.map(([k, v]) => (
                  <li key={k}>
                    <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{k}:</span> {v}
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}

        {step === "map" && table && (
          <>
            <p className="text-sm text-[#5a6472] dark:text-[#cfd6de]">I&apos;ve matched what I could. Change any column that&apos;s wrong; only the email is required.</p>
            <div className="overflow-x-auto rounded-xl border border-[#1a2b4a]/10">
              <table className="w-full text-sm">
                <thead className="bg-[#1a2b4a]/5 text-left">
                  <tr>
                    <th className="p-2">Column in your file</th>
                    <th className="p-2">Example</th>
                    <th className="p-2">Save as</th>
                  </tr>
                </thead>
                <tbody>
                  {table.headers.map((h, i) => {
                    const example = table.rows.slice(0, 20).map((r) => r[i]).find(Boolean) ?? "";
                    return (
                      <tr key={i} className="border-t border-[#1a2b4a]/10">
                        <td className="p-2 font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{h}</td>
                        <td className="p-2 text-[#7a8a99] max-w-[220px] truncate" title={example}>
                          {example || "—"}
                        </td>
                        <td className="p-2">
                          <select
                            aria-label={`Save “${h}” as`}
                            value={mapping[i]}
                            onChange={(e) => setMapping((m) => m.map((t, j) => (j === i ? (e.target.value as Target) : t)))}
                            className="h-9 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-2 text-sm"
                          >
                            {TARGETS.map((t) => (
                              <option key={t} value={t}>
                                {TARGET_LABELS[t]}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!hasEmail ? (
              <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Choose which column holds the email address to continue.</p>
            ) : (
              <>
                <div className="rounded-lg bg-[#1a2b4a]/5 px-4 py-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]" aria-live="polite">
                  {checking || !check ? (
                    <span>Checking against your contacts…</span>
                  ) : (
                    <span>
                      <strong>{(built.rows.length - existingCount).toLocaleString()}</strong> new · <strong>{existingCount.toLocaleString()}</strong> already in your contacts (will be merged) ·{" "}
                      <strong>{built.skipped.length.toLocaleString()}</strong> skipped (no or invalid email, or duplicates in the file)
                      {check.unsubscribed.size > 0 && ` · ${check.unsubscribed.size.toLocaleString()} unsubscribed and will stay unsubscribed`}
                    </span>
                  )}
                </div>

                {built.rows.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">Preview (first {Math.min(10, built.rows.length)} as they&apos;ll be saved)</p>
                    <div className="overflow-x-auto rounded-xl border border-[#1a2b4a]/10">
                      <table className="w-full text-xs">
                        <thead className="bg-[#1a2b4a]/5 text-left">
                          <tr>
                            {["Row", "Email", "First", "Last", "Phone", "Tags", "Company", "Notes", ""].map((h) => (
                              <th key={h} className="p-2 whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {built.rows.slice(0, 10).map((r) => (
                            <tr key={r.row} className="border-t border-[#1a2b4a]/10 align-top">
                              <td className="p-2 text-[#7a8a99]">{r.row}</td>
                              <td className="p-2">{r.email}</td>
                              <td className="p-2">{r.firstName}</td>
                              <td className="p-2">{r.lastName}</td>
                              <td className="p-2 whitespace-nowrap">{r.phone}</td>
                              <td className="p-2">{[cleanTag, ...(r.tags ?? [])].filter(Boolean).join(", ")}</td>
                              <td className="p-2">{r.company}</td>
                              <td className="p-2 max-w-[160px] truncate" title={r.notes}>
                                {r.notes}
                              </td>
                              <td className="p-2 whitespace-nowrap text-[#7a8a99]">{!check ? "" : check.unsubscribed.has(r.email) ? "Merge · stays unsubscribed" : check.existing.has(r.email) ? "Merge" : "New"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="import-tag" className="mb-1 block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                      Add a tag to everyone in this import
                    </label>
                    <Input id="import-tag" value={tag} maxLength={IMPORT_LIMITS.tag} onChange={(e) => setTag(e.target.value)} />
                    <p className="mt-1 text-xs text-[#7a8a99]">Leave it blank for no extra tag. Tags already on a contact are kept.</p>
                  </div>
                </div>

                <label className="flex items-start gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#1a2b4a]" />
                  <span>These people have agreed to hear from me (for example, they&apos;re clients, subscribers or inquiries).</span>
                </label>
                <p className="text-xs text-[#7a8a99]">Importing doesn&apos;t email anyone or start a sequence. Anyone who has unsubscribed stays unsubscribed.</p>
              </>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={runImport} disabled={!hasEmail || !consent || !built.rows.length || checking}>
                Import {built.rows.length.toLocaleString()} {built.rows.length === 1 ? "contact" : "contacts"}
              </Button>
              <Button variant="outline" onClick={reset}>
                Choose a different file
              </Button>
            </div>
          </>
        )}

        {step === "importing" && (
          <div className="space-y-2">
            <div
              role="progressbar"
              aria-label="Import progress"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.done}
              className="h-3 w-full overflow-hidden rounded-full bg-[#1a2b4a]/10"
            >
              <div className="h-full bg-[#c9a227] transition-all" style={{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%` }} />
            </div>
            <p className="text-sm text-[#5a6472]">
              {progress.done.toLocaleString()} of {progress.total.toLocaleString()} saved. Please keep this page open.
            </p>
          </div>
        )}

        {step === "done" && result && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-[#1a2b4a] dark:text-[#F8F5F0]">
              <CheckCircle2 className="w-5 h-5 text-[#2E7C83]" aria-hidden />
              <span>
                <strong>{result.created.toLocaleString()}</strong> added · <strong>{result.merged.toLocaleString()}</strong> merged into existing contacts · <strong>{skippedTotal.toLocaleString()}</strong> skipped
              </span>
            </p>
            {result.unsubscribed > 0 && <p className="text-sm text-[#5a6472]">{result.unsubscribed.toLocaleString()} of them had unsubscribed before and stay unsubscribed.</p>}
            <div className="flex flex-wrap gap-2">
              {cleanTag && (
                <Button onClick={() => onViewTag(cleanTag)}>
                  View contacts tagged “{cleanTag}”
                </Button>
              )}
              {skippedTotal > 0 && (
                <Button variant="outline" onClick={downloadSkipped}>
                  <Download className="w-4 h-4 mr-1" aria-hidden /> Download skipped rows (CSV)
                </Button>
              )}
              <Button variant="ghost" onClick={reset}>
                Import another file
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
