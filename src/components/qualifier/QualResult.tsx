"use client";

import { useState } from "react";
import { PRIORITIES, PRIORITY_INFO, type Priority } from "@/lib/qualifier";

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
  email?: string | null;
  // Pipelines this person is already on (matched by profile link, email or exact name).
  on_boards?: { id: string; name: string }[];
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

type Call = (body: Record<string, unknown>) => Promise<{ qualification?: Qual; card?: unknown; error?: string } | null>;

// "Not right?": tell the scorer what the profile doesn't show (a referral, a stated need, more pages) and score again from
// the profile text already saved, or set the priority yourself. Your own call always stands: it costs no AI request.
export function QualAdjust({ q, call, onUpdated, startOpen }: { q: Qual; call: Call; onUpdated: (q: Qual, card?: unknown) => void; startOpen?: boolean }) {
  const [open, setOpen] = useState(!!startOpen);
  const [context, setContext] = useState(txt(q.result?.context));
  const [more, setMore] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const overridden = (q.result?.override ?? null) as { from?: string; to?: string } | null;
  async function run(label: string, body: Record<string, unknown>) {
    setBusy(label);
    setErr("");
    const d = await call(body);
    setBusy("");
    if (!d?.qualification) { setErr(d?.error || "Couldn't do that. Try again."); return; }
    if (body.action === "qualify") setMore("");
    onUpdated(d.qualification, d.card);
  }
  return (
    <section className="rounded-xl border border-dashed border-[#7b6b8d]/40 p-4">
      <button onClick={() => setOpen(!open)} className="text-sm font-semibold text-[#5b4d6b] hover:underline dark:text-[#cbbfd8]">
        {open ? "Hide" : "Not right? Add what you know, or set the priority yourself"}
      </button>
      {overridden?.to && <p className="mt-1 text-xs text-[#7a8a99]">You set this to {PRIORITY_INFO[overridden.to as Priority]?.label ?? overridden.to}{overridden.from ? ` (the score said ${PRIORITY_INFO[overridden.from as Priority]?.label ?? overridden.from})` : ""}.</p>}
      {open && (
        <div className="mt-3 space-y-3">
          <label className="block text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]">What do you know about them that isn&rsquo;t on the profile?
            <textarea rows={3} value={context} onChange={(e) => setContext(e.target.value)} className="mt-1 w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]" placeholder="e.g. A referral. Her company is about to ask for coaching proposals, so this is a coaching opportunity, not a keynote." />
          </label>
          <label className="block text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]">More of their profile (optional): another page, Experience, or more posts
            <textarea rows={3} value={more} onChange={(e) => setMore(e.target.value)} className="mt-1 w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]" placeholder="Paste it here. It is added to the profile already saved, so you don't paste that again." />
          </label>
          <button
            disabled={!!busy || (!context.trim() && !more.trim())}
            onClick={() => void run("score", { action: "qualify", qualId: q.id, icpId: q.icp_id, context, extraText: more })}
            className="rounded-full bg-[#2E7C83] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2E7C83]/90 disabled:opacity-50"
          >
            {busy === "score" ? "Scoring…" : "Score again with this"}
          </button>
          <div>
            <p className="mb-1.5 text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]">Or make the call yourself (no AI request)</p>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  disabled={!!busy}
                  aria-pressed={q.priority === p}
                  onClick={() => void run(p, { action: "override", qualId: q.id, priority: p, tz: Intl.DateTimeFormat().resolvedOptions().timeZone })}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium ${q.priority === p ? "border-[#2E7C83] bg-[#2E7C83]/10 text-[#1F5E63] dark:text-[#8fd0d6]" : "border-[#1a2b4a]/20 text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:text-[#F8F5F0]"}`}
                >
                  {busy === p ? "Saving…" : PRIORITY_INFO[p].label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-[#7a8a99]">Changing the priority doesn&rsquo;t write a new DM. If there is no DM angle yet, score again with what you know.</p>
          </div>
          {err && <p className="text-sm text-[#A4523C]">{err}</p>}
        </div>
      )}
    </section>
  );
}
