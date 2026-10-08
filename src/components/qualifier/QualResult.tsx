"use client";

import { useState } from "react";
import { PRIORITY_INFO, type Priority } from "@/lib/qualifier";

export type Qual = {
  id: string;
  icp_id: string | null;
  icp_name: string | null;
  kind: "profile" | "audience";
  audience_id: string | null;
  card_id: string | null;
  name: string;
  platform: string | null;
  profile_url: string | null;
  fit: string | null;
  level: string | null;
  priority: string | null;
  dm_angle: string | null;
  result: Record<string, unknown>;
  created_at: string;
};

const FIT_STYLE: Record<string, string> = { YES: "bg-[#2E7C83]/15 text-[#1F5E63] dark:text-[#8fd0d6]", BORDERLINE: "bg-[#c9a227]/20 text-[#6b5410] dark:text-[#e6d28a]", NO: "bg-[#C76F56]/15 text-[#A4523C]" };

export function PriorityBadge({ priority, small }: { priority: string | null | undefined; small?: boolean }) {
  const info = PRIORITY_INFO[(priority ?? "") as Priority];
  if (!info) return null;
  return <span className={`inline-block rounded-full font-bold tracking-wide ${small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"} ${info.badge}`}>{info.label} priority</span>;
}

const txt = (v: unknown) => (typeof v === "string" ? v.trim() : "");
function Row({ label, value }: { label: string; value: unknown }) {
  const t = txt(value);
  return t ? <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]"><span className="font-semibold text-[#5a6472] dark:text-[#b8c2cf]">{label}: </span>{t}</p> : null;
}
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:border-white/10 dark:bg-[#1a2b4a]/40">
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#7b6b8d]">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

// One full qualification, in the order you act on it: the verdict, the DM angle, then the evidence.
export default function QualResult({ q, compact, angleAction }: { q: Qual; compact?: boolean; angleAction?: React.ReactNode }) {
  const r = q.result ?? {};
  const content = (r.content ?? {}) as Record<string, unknown>;
  const offer = (r.offer ?? {}) as Record<string, unknown>;
  const fast = (r.fast ?? {}) as Record<string, unknown>;
  const evidence = Array.isArray(r.levelEvidence) ? (r.levelEvidence as unknown[]).map(txt).filter(Boolean) : [];
  const info = PRIORITY_INFO[(q.priority ?? "") as Priority];
  const [copied, setCopied] = useState(false);
  const [more, setMore] = useState(!compact);
  const angle = txt(q.dm_angle);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#1a2b4a]/10 bg-[#1a2b4a]/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={q.priority} />
          {q.fit && <span className={`rounded-full px-3 py-1 text-xs font-bold ${FIT_STYLE[q.fit] ?? ""}`}>Fit: {q.fit === "BORDERLINE" ? "Borderline" : q.fit === "YES" ? "Yes" : "No"}</span>}
          {q.level && <span className="rounded-full bg-[#7b6b8d]/15 px-3 py-1 text-xs font-semibold text-[#5b4d6b] dark:text-[#cbbfd8]">{q.level}</span>}
          {q.icp_name && <span className="text-xs text-[#7a8a99]">scored against {q.icp_name}</span>}
        </div>
        {txt(r.fitReason) && <p className="mt-2 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{txt(r.fitReason)}</p>}
        {info && <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]"><span className="font-semibold">What to do: </span>{info.todo}</p>}
        {txt(r.warmSignal) && !/^(none|no\b|n\/a|not )/i.test(txt(r.warmSignal)) && <p className="mt-1 text-sm text-[#1F5E63] dark:text-[#8fd0d6]"><span className="font-semibold">Warm signal: </span>{txt(r.warmSignal)}</p>}
      </div>

      {angle && angle.toLowerCase() !== "skip" && (
        <Block title="DM angle">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#1a2b4a] dark:text-[#F8F5F0]">{angle}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={async () => { try { await navigator.clipboard.writeText(angle); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* select it instead */ } }}
              className="rounded-full border border-[#2E7C83]/40 px-4 py-1.5 text-sm font-medium text-[#2E7C83] hover:bg-[#2E7C83]/5"
            >
              {copied ? "Copied" : "Copy DM"}
            </button>
            {angleAction}
            <span className="text-xs text-[#7a8a99]">{angle.length} characters</span>
          </div>
        </Block>
      )}

      {txt(r.gap) && <Block title="The gap"><p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{txt(r.gap)}</p></Block>}

      {compact && <button onClick={() => setMore(!more)} className="text-sm font-medium text-[#2E7C83] hover:underline">{more ? "Hide the full review" : "Show the full review"}</button>}
      {more && (
        <>
          {txt(r.observation) && <Block title="Observation"><p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{txt(r.observation)}</p></Block>}
          {evidence.length > 0 && (
            <Block title={`Level: ${q.level ?? ""}`}>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{evidence.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </Block>
          )}
          <div className="grid gap-3 lg:grid-cols-3">
            <Block title="Profile review">
              <Row label="Headline" value={r.headline} />
              <Row label="About" value={r.about} />
              <Row label="Location" value={r.location} />
              <Row label="Company" value={r.company} />
              <Row label="Audience" value={r.audience} />
              <Row label="Credentials" value={r.credentials} />
            </Block>
            <Block title="Content snapshot">
              <Row label="Posts about" value={content.topics} />
              <Row label="Frequency" value={content.frequency} />
              <Row label="Engagement" value={content.engagement} />
              <Row label="Post types" value={content.postTypes} />
            </Block>
            <Block title="Offer signal">
              <Row label="Offer visible" value={offer.visible} />
              <Row label="Details" value={offer.details} />
            </Block>
          </div>
          <Block title="Fast version">
            <Row label="Headline" value={fast.headline} />
            <Row label="Posts" value={fast.posts} />
            <Row label="Engagement" value={fast.engagement} />
            <Row label="Offer" value={fast.offer} />
            {txt(fast.bottomLine) && <p className="pt-1 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{txt(fast.bottomLine)}</p>}
          </Block>
        </>
      )}
    </div>
  );
}
