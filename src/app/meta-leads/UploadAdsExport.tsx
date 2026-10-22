"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// The weekly step: export the Ads tab from Ads Manager and choose the file here. The Suite reads it, keeps it, and rebuilds the report.
export default function UploadAdsExport() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [needDates, setNeedDates] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  async function send(body: string, dates?: { start: string; end: string }) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/meta-ads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "upload", text: body, ...(dates ?? {}) }) });
      const j = (await res.json().catch(() => ({}))) as { error?: string; needDates?: boolean; ads?: number; periodStart?: string; periodEnd?: string };
      if (res.ok) {
        setNeedDates(false);
        setText(null);
        setMsg({ ok: true, text: `Added ${j.ads} ad${j.ads === 1 ? "" : "s"} for ${j.periodStart} to ${j.periodEnd}. Your report is updated.` });
        router.refresh();
      } else {
        setNeedDates(Boolean(j.needDates));
        setMsg({ ok: false, text: j.error ?? "That did not work." });
      }
    } catch {
      setMsg({ ok: false, text: "No connection. Try again." });
    }
    setBusy(false);
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    const buf = await f.arrayBuffer();
    const b = new Uint8Array(buf);
    const body = new TextDecoder(b[0] === 0xff && b[1] === 0xfe ? "utf-16le" : b[0] === 0xfe && b[1] === 0xff ? "utf-16be" : "utf-8").decode(buf);
    setText(body);
    await send(body);
  }

  return (
    <div className="mt-2 rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/40">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
        <li>Open <a className="underline" href="https://adsmanager.facebook.com/adsmanager/manage/ads" target="_blank" rel="noreferrer">Ads Manager</a> and click the <b>Ads</b> tab (not Campaigns).</li>
        <li>Set the date range at the top right to the week you want (for example <b>Last 7 days</b>).</li>
        <li>Next to <b>Columns</b> choose <b>Performance and clicks</b>.</li>
        <li>Click the download arrow, then <b>Export table data</b>, and choose <b>.csv</b>.</li>
        <li>Choose that file here.</li>
      </ol>
      <input type="file" accept=".csv,.tsv,.txt,text/csv" disabled={busy} onChange={(e) => void onFile(e.target.files?.[0])} className="mt-3 block text-sm" aria-label="Ads Manager export file" />
      {needDates && text && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs text-[#5a6472] dark:text-[#b8c2cf]">First day<input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 block rounded border border-[#1a2b4a]/20 bg-white px-2 py-1 text-sm text-[#1a2b4a]" /></label>
          <label className="text-xs text-[#5a6472] dark:text-[#b8c2cf]">Last day<input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 block rounded border border-[#1a2b4a]/20 bg-white px-2 py-1 text-sm text-[#1a2b4a]" /></label>
          <button disabled={busy || !start || !end} onClick={() => void send(text, { start, end })} className="rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Use these dates</button>
        </div>
      )}
      {busy && <p className="mt-2 text-sm text-[#7a8a99]">Reading your file…</p>}
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "font-medium text-[#1a2b4a] dark:text-[#F8F5F0]" : "text-[#A4523C]"}`}>{msg.text}</p>}
    </div>
  );
}
