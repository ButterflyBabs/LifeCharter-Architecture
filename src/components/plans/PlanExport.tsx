"use client";

import { useEffect, useState } from "react";
import { Check, CircleDot, Download, FileText, Loader2, Lock, Sparkles } from "lucide-react";

interface Progress {
  label: string;
  total: number;
  complete: number;
  ready: boolean;
  sections: { key: string; title: string; status: string; hasText: boolean }[];
}
interface Info {
  progress: Record<string, Progress>;
  business: string;
  preparedBy: string;
  unlocked: boolean;
}

type Version = "funding" | "partnership" | "general";
const VERSIONS: { id: Version; label: string; blurb: string }[] = [
  { id: "funding", label: "Funding request", blurb: "For grants, loans and investors. Cover letter states the ask." },
  { id: "partnership", label: "Partnership proposal", blurb: "For joint ventures, sponsors and collaborators." },
  { id: "general", label: "General copy", blurb: "No cover letter by default." },
];
const APPENDIX = [
  { id: "marketing", label: "Marketing Plan" },
  { id: "sales", label: "Sales Plan" },
  { id: "forecasting", label: "Forecast Plan" },
];

const FIELD = "w-full px-3 py-2 text-sm rounded-lg border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]";
const LABEL = "block text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-1";

// The printable business plan. Locked until EVERY Business Plan section is marked Complete.
export default function PlanExport({ planType, onOpenBuild }: { planType: "business" | "marketing"; onOpenBuild: () => void }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [version, setVersion] = useState<Version>("funding");
  const [business, setBusiness] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [recipient, setRecipient] = useState("");
  const [organization, setOrganization] = useState("");
  const [ask, setAsk] = useState("");
  const [letter, setLetter] = useState("");
  const [appendices, setAppendices] = useState<string[]>([]);
  const [finance, setFinance] = useState(true);
  const [busy, setBusy] = useState<"" | "letter" | "pdf" | "docx">("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/plans/export", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Info) => {
        if (d.progress) {
          setInfo(d);
          setBusiness(d.business || "");
          setPreparedBy(d.preparedBy || "");
          // Plans that are fully complete are included by default.
          setAppendices(APPENDIX.filter((a) => d.progress[a.id]?.ready).map((a) => a.id));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <p className="text-sm text-[#b8a898]">Checking your plan…</p>;
  if (!info) return <p className="text-sm text-[#b8a898]">Couldn&apos;t load this.</p>;

  const biz = info.progress[planType];
  const isBiz = planType === "business";
  if (!biz.ready) {
    return (
      <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#c9a227]/15 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#8a6a15]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Your printable {biz.label} unlocks when every section is complete</h2>
            <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf]">
              {biz.complete} of {biz.total} sections marked complete. Open a section on the Build tab and press <b>Mark section complete</b> when you are happy with it.
            </p>
          </div>
        </div>
        <ul className="space-y-1.5 mb-4">
          {biz.sections.map((s) => (
            <li key={s.key} className="flex items-center gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              {s.status === "done" && s.hasText ? <Check className="w-4 h-4 text-[#2c6b3f]" /> : <CircleDot className="w-4 h-4 text-[#b8a898]" />}
              <span className={s.status === "done" && s.hasText ? "" : "text-[#7a8a99]"}>{s.title}</span>
              {!s.hasText && <span className="text-[11px] text-[#8a6a15]">needs text</span>}
              {s.hasText && s.status !== "done" && <span className="text-[11px] text-[#7a8a99]">{s.status === "drafted" ? "drafted, not yet reviewed" : "edited, not yet marked complete"}</span>}
            </li>
          ))}
        </ul>
        <button onClick={onOpenBuild} className="text-sm font-medium px-4 py-2 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71]">
          Go to the Build tab
        </button>
      </div>
    );
  }

  const payload = () => ({ kind: planType, version, business, preparedBy, recipient, organization, ask, appendices, includeFinance: finance, letter: letter.trim() ? letter.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : null });

  async function writeLetter() {
    setBusy("letter");
    setErr("");
    setMsg("");
    try {
      const res = await fetch("/api/plans/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload(), action: "letter", letter: null }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Couldn't write the letter.");
      setLetter((d.paragraphs as string[]).join("\n\n"));
      setMsg(d.ai ? "Letter drafted from your plan. Read it and change anything you like." : "Letter started from a template (connect your AI key in Settings for a fuller draft). Edit it as you like.");
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy("");
  }

  async function download(format: "pdf" | "docx") {
    setBusy(format);
    setErr("");
    setMsg("");
    try {
      const res = await fetch("/api/plans/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload(), format }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't build the document.");
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") || "")?.[1] || `business-plan.${format}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setMsg(`Downloaded ${name}.`);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy("");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#2c6b3f]/25 bg-[#2c6b3f]/5 p-4 flex items-start gap-3">
        <Check className="w-5 h-5 text-[#2c6b3f] mt-0.5" />
        <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
          All {biz.total} {biz.label} sections are complete. Build a branded copy to share{isBiz ? " with a funder or partner" : " with a partner, agency or funder"}. It is made from what is in your plan right now.
        </p>
      </div>

      <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-5 space-y-4">
        <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">1. Who is it for?</h3>
        <div className="grid sm:grid-cols-3 gap-2">
          {VERSIONS.map((v) => (
            <button
              key={v.id}
              onClick={() => setVersion(v.id)}
              className={`text-left rounded-xl border px-3 py-2.5 ${version === v.id ? "border-[#2E7C83] bg-[#2E7C83]/8" : "border-[#1a2b4a]/12 hover:bg-[#1a2b4a]/4"}`}
            >
              <div className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{v.label}</div>
              <div className="text-[11px] text-[#7a8a99] dark:text-[#b8c2cf]">{v.blurb}</div>
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Business name on the cover</label>
            <input className={FIELD} value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Your business name" />
          </div>
          <div>
            <label className={LABEL}>Prepared by</label>
            <input className={FIELD} value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className={LABEL}>Recipient&apos;s name (optional)</label>
            <input className={FIELD} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Jane Smith" />
          </div>
          <div>
            <label className={LABEL}>Organization (optional)</label>
            <input className={FIELD} value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="e.g. Example Foundation" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-5 space-y-3">
        <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">2. Cover letter</h3>
        <div>
          <label className={LABEL}>{version === "funding" ? "What are you asking for?" : version === "partnership" ? "What are you proposing?" : "What is this plan for?"}</label>
          <input className={FIELD} value={ask} onChange={(e) => setAsk(e.target.value)} placeholder={version === "funding" ? "e.g. a $50,000 grant to build our client programs" : version === "partnership" ? "e.g. co-hosting a quarterly founder retreat" : "optional"} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={writeLetter} disabled={busy !== ""} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60">
            {busy === "letter" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {letter.trim() ? "Write it again" : "Write the cover letter"}
          </button>
          <span className="text-[11px] text-[#7a8a99] dark:text-[#b8c2cf]">{version === "general" ? "Leave blank for no cover letter." : "Leave blank and a simple letter is made for you."}</span>
        </div>
        <textarea className={`${FIELD} leading-relaxed`} rows={9} value={letter} onChange={(e) => setLetter(e.target.value)} placeholder="Your letter appears here so you can edit it. Separate paragraphs with a blank line. The greeting is the first paragraph; the sign-off is added for you." />
      </div>

      {isBiz && (
      <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-5 space-y-3">
        <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">3. What goes in</h3>
        <label className="flex items-start gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
          <input type="checkbox" checked={finance} onChange={(e) => setFinance(e.target.checked)} className="mt-1" />
          <span>
            Financial overview <span className="text-[#7a8a99]">(year-to-date income and expenses, your income goals, and the forecast scenarios, from your own numbers)</span>
          </span>
        </label>
        {APPENDIX.map((a) => {
          const p = info.progress[a.id];
          const ok = !!p?.ready;
          return (
            <label key={a.id} className={`flex items-start gap-2 text-sm ${ok ? "text-[#1a2b4a] dark:text-[#F8F5F0]" : "text-[#7a8a99]"}`}>
              <input
                type="checkbox"
                disabled={!ok}
                checked={appendices.includes(a.id)}
                onChange={(e) => setAppendices((cur) => (e.target.checked ? [...cur, a.id] : cur.filter((x) => x !== a.id)))}
                className="mt-1"
              />
              <span>
                Appendix: {a.label}{" "}
                {!ok && <span className="text-[11px]">({p ? `${p.complete} of ${p.total} sections complete` : "not started"}; mark every section complete to include it)</span>}
              </span>
            </label>
          );
        })}
      </div>
      )}

      {err && <p className="text-sm text-[#8a2f2f]">{err}</p>}
      {msg && <p className="text-sm text-[#2c6b3f]">{msg}</p>}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => download("pdf")} disabled={busy !== "" || !business.trim()} className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl bg-[#1a2b4a] text-white hover:opacity-90 disabled:opacity-60">
          {busy === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download PDF
        </button>
        <button onClick={() => download("docx")} disabled={busy !== "" || !business.trim()} className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl border border-[#1a2b4a]/25 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5 disabled:opacity-60">
          {busy === "docx" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Download Word (to edit)
        </button>
      </div>
    </div>
  );
}
