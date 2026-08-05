"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Upload, Sparkles, CheckCircle, Trash2 } from "lucide-react";
import Link from "next/link";

interface Txn {
  include: boolean;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
}

export default function FinanceImportPage() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const [txns, setTxns] = useState<Txn[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(file);
  };

  const parse = async () => {
    if (!text.trim()) {
      setMsg({ ok: false, text: "Paste some text or upload a CSV first." });
      return;
    }
    setParsing(true);
    setMsg(null);
    setNeedsKey(false);
    try {
      const res = await fetch("/api/finance/import/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.needsKey) {
        setNeedsKey(true);
      } else if (!res.ok) {
        setMsg({ ok: false, text: d?.error || "Couldn't parse that." });
      } else {
        const list: Txn[] = (d.transactions || []).map((t: Omit<Txn, "include">) => ({ ...t, include: true }));
        setTxns(list);
        if (list.length === 0) setMsg({ ok: false, text: "No transactions found in that text." });
      }
    } catch {
      setMsg({ ok: false, text: "Couldn't parse that." });
    } finally {
      setParsing(false);
    }
  };

  const update = (i: number, patch: Partial<Txn>) =>
    setTxns((prev) => (prev ? prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) : prev));

  const selectedCount = txns?.filter((t) => t.include).length ?? 0;

  const commit = async () => {
    if (!txns) return;
    const entries = txns
      .filter((t) => t.include)
      .map((t) => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        occurredOn: t.date,
      }));
    if (entries.length === 0) {
      setMsg({ ok: false, text: "Select at least one transaction." });
      return;
    }
    setImporting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/finance/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: d?.error || "Couldn't import." });
      } else {
        setMsg({ ok: true, text: `Imported ${d.imported} transaction(s) into your ledger.` });
        setTxns(null);
        setText("");
        setFileName("");
      }
    } catch {
      setMsg({ ok: false, text: "Couldn't import." });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      <Link href="/finance/pulse" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
        <ArrowLeft className="w-4 h-4" /> Financial Pulse
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-full bg-[#c9a227]/15 flex items-center justify-center">
          <Upload className="w-6 h-6 text-[#c9a227]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Import transactions</h1>
          <p className="text-[#b8a898]">Upload a CSV statement or paste text — AI extracts the transactions.</p>
        </div>
      </div>

      {msg && (
        <div
          className={`mb-5 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            msg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"
          }`}
        >
          {msg.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : null}
          <span>{msg.text}</span>
        </div>
      )}

      {!txns && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" onChange={onFile} className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1.5" /> Upload CSV / text
              </Button>
              {fileName && <span className="text-xs text-[#b8a898]">{fileName}</span>}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="…or paste statement rows / CSV / invoice text here"
              className="w-full p-3 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] font-mono"
            />
            {needsKey ? (
              <div className="mt-3 text-sm">
                <p className="text-[#3F4654] mb-2">Parsing uses your AI assistant — add your OpenAI key to enable it.</p>
                <Link href="/settings?tab=ai">
                  <Button variant="outline" size="sm">Set up your AI assistant</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-3">
                <Button onClick={parse} disabled={parsing}>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  {parsing ? "Reading…" : "Parse with AI"}
                </Button>
              </div>
            )}
            <p className="text-xs text-[#b8a898] mt-3">
              CSV bank/card exports work best. PDF statements: for now, copy the text out and paste it here — direct
              PDF upload is coming next.
            </p>
          </CardContent>
        </Card>
      )}

      {txns && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">
                Review {txns.length} transaction(s) — {selectedCount} selected
              </p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setTxns(null)}>
                  Start over
                </Button>
                <Button onClick={commit} disabled={importing || selectedCount === 0}>
                  {importing ? "Importing…" : `Import ${selectedCount}`}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#b8a898] border-b border-[#1a2b4a]/10">
                    <th className="py-2 pr-2"></th>
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Description</th>
                    <th className="py-2 pr-2">Category</th>
                    <th className="py-2 pr-2">Type</th>
                    <th className="py-2 pr-2 text-right">Amount</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t, i) => (
                    <tr key={i} className={`border-b border-[#1a2b4a]/6 ${t.include ? "" : "opacity-40"}`}>
                      <td className="py-1.5 pr-2">
                        <input
                          type="checkbox"
                          checked={t.include}
                          onChange={(e) => update(i, { include: e.target.checked })}
                          className="w-4 h-4 rounded border-[#1a2b4a]/30 text-[#c9a227]"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="date"
                          value={t.date}
                          onChange={(e) => update(i, { date: e.target.value })}
                          className="text-xs p-1 rounded border border-[#1a2b4a]/15 bg-transparent"
                        />
                      </td>
                      <td className="py-1.5 pr-2 min-w-[140px]">
                        <input
                          value={t.description}
                          onChange={(e) => update(i, { description: e.target.value })}
                          className="w-full text-xs p-1 rounded border border-[#1a2b4a]/15 bg-transparent"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          value={t.category}
                          onChange={(e) => update(i, { category: e.target.value })}
                          className="w-full text-xs p-1 rounded border border-[#1a2b4a]/15 bg-transparent min-w-[90px]"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <select
                          value={t.type}
                          onChange={(e) => update(i, { type: e.target.value as "income" | "expense" })}
                          className="text-xs p-1 rounded border border-[#1a2b4a]/15 bg-transparent"
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                      </td>
                      <td className="py-1.5 pr-2 text-right">
                        <input
                          type="number"
                          value={t.amount}
                          onChange={(e) => update(i, { amount: Number(e.target.value) })}
                          className="w-24 text-xs p-1 rounded border border-[#1a2b4a]/15 bg-transparent text-right"
                        />
                      </td>
                      <td className="py-1.5">
                        <button
                          onClick={() => setTxns((prev) => (prev ? prev.filter((_, idx) => idx !== i) : prev))}
                          className="text-[#b8a898] hover:text-red-500"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#b8a898] mt-3">
              Check the AI&apos;s work — adjust type, category, dates, or amounts before importing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
