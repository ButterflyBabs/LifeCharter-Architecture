"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { fmtDate, parseYmd, todayYmd, type AudienceSnapshot, type PlatformDef } from "@/lib/social/planner";
import type { SocialPlannerApi } from "./useSocialPlanner";
import { Spark, Tip, cx } from "./ui";

const nf = (n: number | null | undefined) =>
  n === null || n === undefined || Number.isNaN(n) ? "—" : Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 });

const val = (snap: AudienceSnapshot | undefined, pid: string, mid: string): number | null => {
  const v = snap?.values?.[pid]?.[mid];
  return v === undefined || v === null ? null : Number(v);
};

function rate(p: PlatformDef, snap: AudienceSnapshot | undefined) {
  if (!p.rate) return null;
  const a = val(snap, p.id, p.rate[0]);
  const b = val(snap, p.id, p.rate[1]);
  return a === null || !b ? null : (a / b) * 100;
}

function Delta({ now, then, pts }: { now: number | null; then: number | null; pts?: boolean }) {
  if (now === null || then === null) return <span className="text-[#94A3B8]">—</span>;
  const d = now - then;
  const cls = d > 0 ? "text-[#1f6b3a]" : d < 0 ? "text-[#9b2620]" : "text-[#64748B]";
  const sign = d > 0 ? "+" : "";
  return (
    <span className={`tabular-nums ${cls}`}>
      {sign}{nf(d)}{pts ? " pts" : then ? ` (${sign}${nf((d / then) * 100)}%)` : ""}
    </span>
  );
}

const daysSince = (date: string) => Math.round((parseYmd(todayYmd()).getTime() - parseYmd(date).getTime()) / 864e5);

export function AudienceView({ snapshots, platforms, api }: { snapshots: AudienceSnapshot[]; platforms: PlatformDef[]; api: SocialPlannerApi }) {
  const [form, setForm] = useState<{ date: string; asBase: boolean; existing: boolean } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const list = snapshots;
  const base = list.find((x) => x.baseline) || list[0];
  const last = list[list.length - 1];
  const prev = list.length > 1 ? list[list.length - 2] : undefined;

  const formEl = form && (
    <SnapshotForm
      date={form.date}
      asBase={form.asBase}
      existing={form.existing}
      source={list.find((x) => x.date === form.date) || last}
      platforms={platforms}
      firstEntry={!list.length}
      onCancel={() => setForm(null)}
      onSave={async (snap) => {
        await api.saveSnapshot(snap);
        setForm(null);
      }}
    />
  );

  if (!list.length) {
    return (
      <div className="space-y-4">
        <div>
          <p className={cx.eyebrow}>Audience growth</p>
          <h2 className={cx.h2}>Set your benchmark</h2>
        </div>
        <div className={`${cx.card} max-w-2xl space-y-3`}>
          <p className={cx.body}>
            Enter where each platform stands today: followers, connections, subscribers and recent engagement. Every number you log after this is measured against it, so you can see real growth instead of guessing.
          </p>
          <p className={cx.muted}>It takes about 10 minutes with each app&rsquo;s analytics open. Leave anything blank you can&rsquo;t find; you can add it later.</p>
          <button className={`${cx.btn} ${cx.primary}`} onClick={() => setForm({ date: todayYmd(), asBase: true, existing: false })}>
            Enter my benchmark numbers
          </button>
        </div>
        {formEl}
      </div>
    );
  }

  const since = daysSince(last.date);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={cx.eyebrow}>Audience growth</p>
          <h2 className={cx.h2}>Since {fmtDate(base.date, { month: "long", day: "numeric", year: "numeric" })}</h2>
          <p className={cx.muted}>
            Benchmark {fmtDate(base.date, { month: "short", day: "numeric" })} · last logged {since === 0 ? "today" : since === 1 ? "yesterday" : `${since} days ago`} · {list.length} {list.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <button className={`${cx.btn} ${cx.primary}`} onClick={() => setForm({ date: todayYmd(), asBase: false, existing: Boolean(list.find((x) => x.date === todayYmd())) })}>
          Log today&rsquo;s numbers
        </button>
      </div>
      {since >= 7 && <Tip>It&rsquo;s been {since} days since your last entry. Logging every Monday gives you a clean week-by-week growth line.</Tip>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {platforms.map((p) => {
          // Headline measure: the first one this account actually logs.
          const m = p.audience.find((x) => val(last, p.id, x.id) !== null) || p.audience[0];
          return (
            <div key={p.id} className={`${cx.card} !p-4`}>
              <p className="text-xs font-semibold" style={{ color: p.color }}>{p.name}</p>
              <p className="font-display text-3xl font-semibold tabular-nums text-[#0F1A38] dark:text-[#FAF8F3]">{nf(val(last, p.id, m.id))}</p>
              <p className={cx.muted}>
                {m.label} · <Delta now={val(last, p.id, m.id)} then={val(base, p.id, m.id)} /> since benchmark
              </p>
            </div>
          );
        })}
      </div>

      {platforms.map((p) => (
        <div key={p.id} className={cx.card}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-xl font-semibold text-[#0F1A38] dark:text-[#FAF8F3]">{p.name}</h3>
            <span className={cx.muted}>{p.audienceWhere}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="text-left text-xs text-[#64748B]">
                  <th className="py-2 font-medium">Measure</th>
                  <th className="py-2 text-right font-medium">Benchmark</th>
                  <th className="py-2 text-right font-medium">Latest</th>
                  <th className="py-2 text-right font-medium">Since benchmark</th>
                  <th className="py-2 text-right font-medium">Since last entry</th>
                  <th className="py-2 pl-4 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {p.audience.map((m) => {
                  const pts = m.id === "consumption";
                  const series = list.map((x) => val(x, p.id, m.id)).filter((v): v is number => v !== null);
                  return (
                    <tr key={m.id} className="border-t border-[#0F1A38]/5 dark:border-[#334060]">
                      <td className="py-2">{m.label}</td>
                      <td className="py-2 text-right tabular-nums">{nf(val(base, p.id, m.id))}</td>
                      <td className="py-2 text-right font-semibold tabular-nums">{nf(val(last, p.id, m.id))}</td>
                      <td className="py-2 text-right"><Delta now={val(last, p.id, m.id)} then={val(base, p.id, m.id)} pts={pts} /></td>
                      <td className="py-2 text-right">{prev ? <Delta now={val(last, p.id, m.id)} then={val(prev, p.id, m.id)} pts={pts} /> : <span className="text-[#94A3B8]">—</span>}</td>
                      <td className="py-2 pl-4">{series.length > 1 && <Spark values={series} target={series[0]} />}</td>
                    </tr>
                  );
                })}
                {p.rate && (
                  <tr className="border-t border-[#0F1A38]/5 dark:border-[#334060]">
                    <td className="py-2 font-semibold">{p.rateLabel || "Engagement rate"}</td>
                    <td className="py-2 text-right tabular-nums">{nf(rate(p, base))}%</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{nf(rate(p, last))}%</td>
                    <td className="py-2 text-right"><Delta now={rate(p, last)} then={rate(p, base)} pts /></td>
                    <td className="py-2 text-right">{prev ? <Delta now={rate(p, last)} then={rate(p, prev)} pts /> : <span className="text-[#94A3B8]">—</span>}</td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className={`${cx.card} space-y-2`}>
        <h3 className={cx.h3}>History</h3>
        {list.slice().reverse().map((x) => (
          <div key={x.date} className="flex flex-wrap items-center justify-between gap-2 border-t border-[#0F1A38]/5 py-2 first:border-t-0 dark:border-[#334060]">
            <span className="text-sm tabular-nums">{fmtDate(x.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
            <div className="flex items-center gap-2">
              {x === base ? (
                <span className="rounded-full bg-[#2E7C83]/12 px-2.5 py-1 text-[11px] font-semibold text-[#1f5f65]">Benchmark</span>
              ) : (
                <button className={`${cx.btn} ${cx.ghost} !py-1`} onClick={() => api.setBaseline(x.date)}>Make benchmark</button>
              )}
              <button className={`${cx.btn} ${cx.secondary} !py-1`} onClick={() => setForm({ date: x.date, asBase: x.baseline, existing: true })}>Edit</button>
              {confirm === x.date ? (
                <button className={`${cx.btn} ${cx.danger} !py-1`} onClick={() => { setConfirm(null); api.deleteSnapshot(x.date); }}>Delete?</button>
              ) : (
                <button className="rounded-lg p-1.5 hover:bg-[#0F1A38]/5" aria-label="Delete entry" onClick={() => setConfirm(x.date)}><X className="h-4 w-4 text-[#64748B]" /></button>
              )}
            </div>
          </div>
        ))}
      </div>
      {formEl}
    </div>
  );
}

function SnapshotForm({
  date, asBase, existing, source, platforms, firstEntry, onCancel, onSave,
}: {
  date: string;
  asBase: boolean;
  existing: boolean;
  source: AudienceSnapshot | undefined;
  platforms: PlatformDef[];
  firstEntry: boolean;
  onCancel: () => void;
  onSave: (s: AudienceSnapshot) => void;
}) {
  const [d, setD] = useState(date);
  const [baseline, setBaseline] = useState(asBase || firstEntry);
  const [values, setValues] = useState<Record<string, Record<string, string>>>(() => {
    const out: Record<string, Record<string, string>> = {};
    for (const p of platforms) for (const m of p.audience) {
      const v = val(source, p.id, m.id);
      (out[p.id] ||= {})[m.id] = v === null ? "" : String(v);
    }
    return out;
  });
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0F1A38]/40" onClick={onCancel}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Audience numbers"
        className="h-full w-full max-w-2xl space-y-4 overflow-y-auto bg-[#FAF8F3] p-6 shadow-2xl dark:bg-[#0E162A]"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          const out: AudienceSnapshot["values"] = {};
          for (const [pid, ms] of Object.entries(values)) for (const [mid, v] of Object.entries(ms)) if (v !== "") (out[pid] ||= {})[mid] = Number(v);
          onSave({ date: d, baseline, values: out });
        }}
      >
        <h2 className={cx.h2}>{asBase && !existing ? "Your benchmark numbers" : existing ? "Edit entry" : "Log today’s numbers"}</h2>
        <p className={cx.muted}>
          Copy each number from the platform&rsquo;s analytics. {source && !existing ? "Fields start with your last entry so you only change what moved." : "Leave blank anything you can’t find."}
        </p>
        <label className="block max-w-xs">
          <span className={cx.label}>Date</span>
          <input type="date" className={cx.input} value={d} readOnly={existing} required onChange={(e) => setD(e.target.value)} />
        </label>
        {platforms.map((p) => (
          <fieldset key={p.id} className="rounded-xl border border-[#0F1A38]/10 p-4 dark:border-[#334060]">
            <legend className="px-1 text-sm font-semibold" style={{ color: p.color }}>{p.name}</legend>
            <p className={`${cx.muted} mb-2`}>{p.audienceWhere}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {p.audience.map((m) => (
                <label key={m.id} className="block">
                  <span className={cx.label}>{m.label}</span>
                  <input
                    type="number" min={0} step="any" className={`${cx.input} tabular-nums`}
                    value={values[p.id]?.[m.id] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [p.id]: { ...(v[p.id] || {}), [m.id]: e.target.value } }))}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={baseline} onChange={(e) => setBaseline(e.target.checked)} /> Use this entry as my benchmark
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className={`${cx.btn} ${cx.ghost}`} onClick={onCancel}>Cancel</button>
          <button type="submit" className={`${cx.btn} ${cx.primary}`}>Save numbers</button>
        </div>
      </form>
    </div>
  );
}
