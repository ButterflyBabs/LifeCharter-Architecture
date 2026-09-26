"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, CheckCircle2, X } from "lucide-react";
import { resetSegmentOptions } from "@/components/segments/SegmentSelect";

// "Tie your existing activity to segments" — the client's own assistant proposes
// a segment for income, expenses, tasks, plan goals and sales activity that
// aren't tagged yet; the client reviews every suggestion and applies the ones
// they agree with. Nothing is changed until they confirm.

interface Counts { ledger: number; tasks: number; goals: number; sales: number; total: number }
interface SegOpt { id: number; name: string; business: string; description: string }
interface Proposal { ref: string; kind: "ledger" | "task" | "goal" | "sales"; label: string; detail: string; ids: string[]; segmentId: number | null; confidence: string; why: string }

const KIND_LABEL: Record<string, string> = { ledger: "Income & expenses", task: "Tasks", goal: "Plan goals", sales: "Sales activity" };

export function AutoTagPanel({ onApplied }: { onApplied: () => void }) {
  const [info, setInfo] = useState<{ segments: number; untagged: Counts | null } | null>(null);
  const [name, setName] = useState("Your assistant");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [needsKey, setNeedsKey] = useState(false);
  const [segs, setSegs] = useState<SegOpt[]>([]);
  const [rows, setRows] = useState<(Proposal & { on: boolean })[] | null>(null);
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  const refresh = () => fetch("/api/segments/auto-tag").then((r) => r.json()).then(setInfo).catch(() => undefined);
  useEffect(() => {
    refresh();
    fetch("/api/ai-settings").then((r) => r.json()).then((d) => d?.assistantName && setName(String(d.assistantName))).catch(() => undefined);
  }, []);

  const suggest = async () => {
    setBusy(true);
    setErr("");
    setDone(null);
    try {
      const res = await fetch("/api/segments/auto-tag", { method: "POST", headers: { "Content-Type": "application/json" } });
      const d = await res.json().catch(() => ({}));
      if (d.needsKey) setNeedsKey(true);
      else if (!res.ok) setErr(d.error || "Couldn't suggest tags.");
      else {
        if (d.assistant) setName(d.assistant);
        setSegs(d.segments ?? []);
        setRows((d.proposals as Proposal[]).map((p) => ({ ...p, on: p.segmentId !== null && p.confidence !== "low" })));
      }
    } catch {
      setErr("Couldn't reach your assistant just now.");
    }
    setBusy(false);
  };

  const chosen = useMemo(() => (rows ?? []).filter((r) => r.on && r.segmentId !== null), [rows]);
  const set = (ref: string, patch: Partial<Proposal & { on: boolean }>) => setRows((p) => (p ? p.map((r) => (r.ref === ref ? { ...r, ...patch } : r)) : p));

  const apply = async () => {
    setApplying(true);
    setErr("");
    const res = await fetch("/api/segments/auto-tag/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignments: chosen.map((r) => ({ kind: r.kind, ids: r.ids, segmentId: r.segmentId })) }),
    });
    const d = await res.json().catch(() => ({}));
    setApplying(false);
    if (!res.ok) return setErr(d.error || "Couldn't apply those.");
    setDone(d.applied ?? 0);
    setRows(null);
    resetSegmentOptions();
    refresh();
    onApplied();
  };

  if (!info || info.segments === 0) return null;
  const u = info.untagged;
  const anything = (u?.total ?? 0) > 0;
  if (!anything && done === null) return null;

  return (
    <section className="mb-6 rounded-2xl border border-[#2E7C83]/25 bg-[#F1F7F7] dark:bg-[#12303a] p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5E3B6C] to-[#2E7C83] flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></span>
          <div>
            <h2 className="font-semibold text-[#12303a] dark:text-[#F8F5F0]">Tie your existing activity to segments</h2>
            <p className="text-xs text-[#5a6472] dark:text-[#c3ccd8]">
              {anything
                ? `${u!.total} item${u!.total === 1 ? "" : "s"} aren't tied to a segment yet (${[u!.ledger && `${u!.ledger} income/expense`, u!.tasks && `${u!.tasks} task${u!.tasks === 1 ? "" : "s"}`, u!.goals && `${u!.goals} goal${u!.goals === 1 ? "" : "s"}`, u!.sales && `${u!.sales} sales`].filter(Boolean).join(", ")}). ${name} can suggest where each belongs — you review before anything changes.`
                : "Everything is tied to a segment."}
            </p>
          </div>
        </div>
        {anything && !rows && (
          <button onClick={suggest} disabled={busy || needsKey} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {busy ? "Reading…" : `Suggest tags with ${name}`}
          </button>
        )}
      </div>
      {needsKey && <p className="mt-3 text-sm text-[#8a6a15]">Connect your AI key to use your assistant here. <Link href="/settings?tab=ai" className="underline font-medium">Open AI settings</Link></p>}
      {err && <p className="mt-3 text-sm text-[#8a2f2f]">{err}</p>}
      {done !== null && <p className="mt-3 text-sm text-[#2c6b3f] inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Tagged {done} item{done === 1 ? "" : "s"}. Your segment scores now reflect them.</p>}

      {rows && (
        <div className="mt-4">
          {rows.length === 0 ? (
            <p className="text-sm text-[#5a6472]">Nothing to suggest right now.</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                  {name} matched {rows.filter((r) => r.segmentId !== null).length} of {rows.length}. Untick anything that&apos;s wrong or change its segment — the ones left blank stay untagged.
                </p>
                <button onClick={() => setRows(null)} aria-label="Close suggestions" className="text-[#7a8a99]"><X className="w-4 h-4" /></button>
              </div>
              <div className="max-h-[26rem] overflow-y-auto rounded-xl border border-[#2E7C83]/20 bg-white/70 dark:bg-[#0e1830]/40 divide-y divide-[#2E7C83]/10">
                {(["ledger", "task", "goal", "sales"] as const).map((k) => {
                  const part = rows.filter((r) => r.kind === k);
                  if (!part.length) return null;
                  return (
                    <div key={k}>
                      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#2E7C83] bg-[#2E7C83]/5">{KIND_LABEL[k]}</p>
                      {part.map((r) => (
                        <div key={r.ref} className="px-3 py-2 flex items-start gap-3 flex-wrap sm:flex-nowrap">
                          <input type="checkbox" aria-label={`Apply: ${r.label}`} checked={r.on && r.segmentId !== null} disabled={r.segmentId === null} onChange={(e) => set(r.ref, { on: e.target.checked })} className="mt-1" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0] break-words">{r.label}</p>
                            <p className="text-[11px] text-[#7a8a99] break-words">
                              {r.detail}{r.why ? ` · ${r.why}` : ""}{r.segmentId !== null ? ` · ${r.confidence} confidence` : ""}
                            </p>
                          </div>
                          <select
                            aria-label="Segment"
                            value={r.segmentId ?? ""}
                            onChange={(e) => { const v = e.target.value ? Number(e.target.value) : null; set(r.ref, { segmentId: v, on: v !== null }); }}
                            className="w-full sm:w-52 h-9 px-2 text-xs rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                          >
                            <option value="">Leave untagged</option>
                            {segs.map((s) => <option key={s.id} value={s.id}>{s.business ? `${s.business} · ` : ""}{s.name}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <button onClick={apply} disabled={applying || chosen.length === 0} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-[#1a2b4a] text-white hover:bg-[#1a2b4a]/90 disabled:opacity-60">
                  {applying && <Loader2 className="w-4 h-4 animate-spin" />} Apply {chosen.length} tag{chosen.length === 1 ? "" : "s"}
                </button>
                <span className="text-xs text-[#7a8a99]">Covers {chosen.reduce((n, r) => n + r.ids.length, 0)} records. Existing tags are never overwritten.</span>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
