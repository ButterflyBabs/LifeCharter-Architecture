"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Sparkles, Download, FileText } from "lucide-react";

const TYPES = [
  { id: "grant", label: "Grant application" },
  { id: "investor", label: "Investor / funding request" },
  { id: "partnership", label: "Partnership proposal" },
  { id: "loan", label: "Business loan narrative" },
  { id: "sponsorship", label: "Sponsorship proposal" },
];

interface Stored {
  id: string;
  proposal_type: string;
  target: string;
  title: string;
  created_at: string;
}

export default function ProposalModal({ onClose }: { onClose: () => void }) {
  const [proposalType, setProposalType] = useState("grant");
  const [target, setTarget] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ id: string | null; title: string; content: string } | null>(null);
  const [history, setHistory] = useState<Stored[]>([]);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/plans/proposal");
    const d = await res.json().catch(() => ({}));
    if (Array.isArray(d.proposals)) setHistory(d.proposals);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const generate = async () => {
    setBusy(true);
    setErr("");
    setNeedsKey(false);
    setResult(null);
    try {
      const res = await fetch("/api/plans/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalType, target, notes }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.needsKey) setNeedsKey(true);
      else if (d.content) {
        setResult({ id: d.id, title: d.title, content: d.content });
        loadHistory();
      } else setErr(d.error || "Couldn't generate the proposal.");
    } catch {
      setErr("Couldn't reach the AI.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white dark:bg-[#111d33] rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2b4a]/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2E7C83]" />
            <h2 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Create a Proposal</h2>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X className="w-5 h-5 text-[#b8a898]" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf]">
            Assembled from everything in your plans and your numbers. Pick a type, add a target if you have one, and
            generate — then edit and send.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-[#7a8a99] mb-1">Type</label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
              >
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#7a8a99] mb-1">Target funder / recipient (optional)</label>
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. Amber Grant for Women"
                className="w-full h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
              />
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Anything specific to emphasize (optional)"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
          />
          {needsKey && <p className="text-xs text-[#8a6a15]">Connect your AI key in settings to generate proposals.</p>}
          {err && <p className="text-xs text-[#8a2f2f]">{err}</p>}
          <button
            onClick={generate}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {busy ? "Drafting your proposal…" : "Generate proposal"}
          </button>

          {result && (
            <div className="rounded-xl border border-[#2E7C83]/40 bg-[#F1F7F7] dark:bg-[#12303a] p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-semibold text-[#12303a] dark:text-[#F8F5F0]">{result.title}</h3>
                {result.id && (
                  <a
                    href={`/api/plans/proposal?id=${result.id}&download=1`}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71]"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .md
                  </a>
                )}
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm text-[#3a3630] dark:text-[#d8d2c8] max-h-72 overflow-y-auto leading-relaxed">
                {result.content}
              </pre>
            </div>
          )}

          {history.length > 0 && (
            <div className="pt-3 border-t border-[#1a2b4a]/10">
              <p className="text-xs font-semibold text-[#7a8a99] mb-2">Recent proposals</p>
              <div className="space-y-1.5">
                {history.map((h) => (
                  <a
                    key={h.id}
                    href={`/api/plans/proposal?id=${h.id}&download=1`}
                    className="flex items-center gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0] hover:text-[#2E7C83]"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#b8a898]" />
                    <span className="truncate">{h.title || h.proposal_type}</span>
                    <span className="ml-auto text-xs text-[#b8a898]">{new Date(h.created_at).toISOString().slice(0, 10)}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
