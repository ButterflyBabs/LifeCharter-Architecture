"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { PLATFORMS, STARTER_GOALS, platformDef, type GoalMetric, type Goals, type MetricKind } from "@/lib/social/planner";
import { PlatformChip, cx } from "./ui";

const KIND_LABEL: Record<MetricKind, string> = {
  plan: "Counted from your content plan",
  manual: "Entered from your analytics",
  habit: "Daily habit (days per week)",
  percent: "Percentage (averaged)",
};

const newId = (label: string, taken: string[]) => {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "goal";
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
};

// Weekly targets per platform, plus which platforms the account plans for.
// Edits save on their own shortly after typing stops.
export function GoalsEditor({
  goals, platforms, onSave,
}: {
  goals: Goals;
  platforms: string[];
  onSave: (patch: { goals?: Goals; platforms?: string[] }) => void;
}) {
  const [draft, setDraft] = useState<Goals>(goals);
  const [confirm, setConfirm] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setDraft(goals), [goals]);

  const change = (next: Goals) => {
    setDraft(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSave({ goals: next }), 700);
  };
  const edit = (pid: string, mid: string, patch: Partial<GoalMetric>) =>
    change({ ...draft, [pid]: (draft[pid] || []).map((m) => (m.id === mid ? { ...m, ...patch } : m)) });

  const shown = Array.from(new Set([...platforms, ...Object.keys(draft)]));
  const addable = PLATFORMS.filter((p) => !shown.includes(p.id));

  return (
    <div className="space-y-5">
      <div className="max-w-3xl">
        <p className={cx.eyebrow}>Weekly targets</p>
        <h2 className={cx.h2}>Goals</h2>
        <p className={cx.body}>
          Each target is per week. Today, the Week scorecard and the Month review all read from here. Goals counted from your content plan use the post formats you tick.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {shown.map((pid) => {
          const p = platformDef(pid);
          const list = draft[pid] || [];
          return (
            <div key={pid} className={cx.card}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-xl font-semibold text-[#0F1A38] dark:text-[#FAF8F3]">{p.name}</h3>
                <AddGoal
                  onAdd={(kind) => {
                    const label = kind === "habit" ? "New daily habit" : kind === "plan" ? "New posts" : "New goal";
                    const m: GoalMetric = { id: newId(label, list.map((x) => x.id)), label, kind, target: kind === "habit" ? 5 : kind === "percent" ? 50 : 1 };
                    if (kind === "plan") m.formats = [];
                    if (kind === "habit") m.days = "weekdays";
                    change({ ...draft, [pid]: [...list, m] });
                  }}
                />
              </div>
              <div className="space-y-3">
                {list.length === 0 && <p className={cx.muted}>No goals yet for {p.name}.</p>}
                {list.map((m) => (
                  <div key={m.id} className="rounded-xl border border-[#0F1A38]/10 dark:border-[#334060] p-3">
                    <div className="flex items-center gap-2">
                      <input className={cx.input} value={m.label} aria-label="Goal name" onChange={(e) => edit(pid, m.id, { label: e.target.value })} />
                      <input
                        type="number" min={0} className={`${cx.input} !w-24 tabular-nums`} value={m.target} aria-label="Weekly target"
                        onChange={(e) => edit(pid, m.id, { target: Number(e.target.value) || 0 })}
                      />
                      {confirm === `${pid}.${m.id}` ? (
                        <button className={`${cx.btn} ${cx.danger} shrink-0`} onClick={() => { setConfirm(null); change({ ...draft, [pid]: list.filter((x) => x.id !== m.id) }); }}>
                          Remove?
                        </button>
                      ) : (
                        <button className="shrink-0 rounded-lg p-2 hover:bg-[#0F1A38]/5" aria-label={`Remove ${m.label}`} onClick={() => setConfirm(`${pid}.${m.id}`)}>
                          <X className="h-4 w-4 text-[#64748B]" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#475569] dark:text-[#CBD5E1]">
                      <span className="font-medium">{KIND_LABEL[m.kind]}</span>
                      {m.kind === "plan" && (
                        <>
                          {p.formats.map((f) => (
                            <label key={f} className="inline-flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={(m.formats || []).includes(f)}
                                onChange={(e) => edit(pid, m.id, { formats: e.target.checked ? [...(m.formats || []), f] : (m.formats || []).filter((x) => x !== f) })}
                              />
                              {f}
                            </label>
                          ))}
                          {!(m.formats || []).length && <span className="italic">(none ticked = every format counts)</span>}
                        </>
                      )}
                      {m.kind === "habit" && (
                        <label className="inline-flex items-center gap-1">
                          <input type="checkbox" checked={m.days === "weekdays"} onChange={(e) => edit(pid, m.id, { days: e.target.checked ? "weekdays" : "all" })} />
                          Weekdays only
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {confirm === `platform.${pid}` ? (
                <div className="mt-3 flex gap-2">
                  <button
                    className={`${cx.btn} ${cx.danger}`}
                    onClick={() => {
                      setConfirm(null);
                      const next = { ...draft };
                      delete next[pid];
                      setDraft(next);
                      onSave({ goals: next, platforms: platforms.filter((x) => x !== pid) });
                    }}
                  >
                    Stop planning for {p.name}
                  </button>
                  <button className={`${cx.btn} ${cx.ghost}`} onClick={() => setConfirm(null)}>Keep it</button>
                </div>
              ) : (
                <button className="mt-3 text-xs text-[#64748B] underline" onClick={() => setConfirm(`platform.${pid}`)}>Remove {p.name} from my plan</button>
              )}
            </div>
          );
        })}
      </div>

      {addable.length > 0 && (
        <div className={`${cx.card} space-y-2`}>
          <p className={cx.h3}>Add a platform</p>
          <div className="flex flex-wrap gap-2">
            {addable.map((p) => (
              <button
                key={p.id}
                className={`${cx.btn} ${cx.secondary}`}
                onClick={() => {
                  const next = { ...draft, [p.id]: structuredClone(STARTER_GOALS[p.id] || []) };
                  setDraft(next);
                  onSave({ goals: next, platforms: [...platforms, p.id] });
                }}
              >
                <PlatformChip id={p.id} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddGoal({ onAdd }: { onAdd: (kind: MetricKind) => void }) {
  const [kind, setKind] = useState<MetricKind>("manual");
  return (
    <div className="flex items-center gap-2">
      <select className={`${cx.input} !w-auto !py-1.5 text-xs`} value={kind} aria-label="Kind of goal to add" onChange={(e) => setKind(e.target.value as MetricKind)}>
        <option value="manual">Number from analytics</option>
        <option value="plan">Counted from plan</option>
        <option value="habit">Daily habit</option>
        <option value="percent">Percentage</option>
      </select>
      <button className={`${cx.btn} ${cx.secondary}`} onClick={() => onAdd(kind)}>Add goal</button>
    </div>
  );
}
