"use client";

import { useState } from "react";

// Reads the file downloaded from Meta's Leads Center (CSV or tab-separated, UTF-8 or UTF-16) and sends each row to the same
// address the automatic link uses, so every lead is registered on Zoom, saved as a contact and given a card in Registered.
function parse(text: string): Record<string, string>[] {
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const delim = first.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

export default function UploadLeads({ address }: { address: string }) {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    setLog([]);
    const buf = await f.arrayBuffer();
    const b = new Uint8Array(buf);
    const text = new TextDecoder(b[0] === 0xff && b[1] === 0xfe ? "utf-16le" : b[0] === 0xfe && b[1] === 0xff ? "utf-16be" : "utf-8").decode(buf).replace(/^﻿/, "");
    const leads = parse(text).filter((r) => /@/.test(r.email || r.email_address || ""));
    if (!leads.length) { setLog(["I couldn't find any rows with an email address in that file."]); setBusy(false); return; }
    let ok = 0;
    const bad: string[] = [];
    for (const r of leads) {
      const body = { ...r, email: r.email || r.email_address, full_name: r.full_name || [r.first_name, r.last_name].filter(Boolean).join(" ") };
      try {
        const res = await fetch(address, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) ok++;
        else bad.push(`${body.email}: ${((await res.json().catch(() => ({}))) as { error?: string }).error ?? res.status}`);
      } catch {
        bad.push(`${body.email}: no connection`);
      }
    }
    setLog([`${ok} of ${leads.length} leads registered.`, ...bad]);
    setBusy(false);
  }

  return (
    <div className="mt-2 rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/40">
      <p className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">
        In the Leads Center in Meta, download your leads, then choose the file here. Each person is registered on the MasterClass Zoom meeting and gets a card in Registered. Someone already registered is simply kept as they are.
      </p>
      <input type="file" accept=".csv,.tsv,.txt,text/csv" disabled={busy} onChange={(e) => void onFile(e.target.files?.[0])} className="mt-3 block text-sm" aria-label="Leads file" />
      {busy && <p className="mt-2 text-sm text-[#7a8a99]">Registering…</p>}
      {log.map((l, i) => <p key={i} className={`mt-1 text-sm ${i === 0 ? "font-medium text-[#1a2b4a] dark:text-[#F8F5F0]" : "text-[#A4523C]"}`}>{l}</p>)}
    </div>
  );
}
