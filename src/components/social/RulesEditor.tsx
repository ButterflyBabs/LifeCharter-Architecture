"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import type { ContentRules } from "@/lib/social/planner";
import { cx } from "./ui";

// The account's voice and content rules. These are what the week writer
// (Phase 3) follows, so every client's posts sound like them.
export function RulesEditor({ rules, onSave, compact }: { rules: ContentRules; onSave: (r: ContentRules) => Promise<void> | void; compact?: boolean }) {
  const [r, setR] = useState(rules);
  const [saved, setSaved] = useState(false);
  useEffect(() => setR(rules), [rules]);
  const dirty = JSON.stringify(r) !== JSON.stringify(rules);

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({
          ...r,
          series: r.series.filter((s) => s.name.trim()),
          wordRules: r.wordRules.filter((w) => w.avoid.trim()),
          otherRules: r.otherRules.filter((x) => x.trim()),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
    >
      {!compact && (
        <div className="max-w-3xl">
          <p className={cx.eyebrow}>How your posts sound</p>
          <h2 className={cx.h2}>Voice &amp; rules</h2>
          <p className={cx.body}>Everything written for you follows these. Be as specific as you like.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className={cx.label}>Your voice</span>
          <textarea rows={4} className={cx.input} value={r.voice} onChange={(e) => setR({ ...r, voice: e.target.value })} placeholder="e.g. Warm, practical and direct. Short sentences. Never salesy." />
        </label>
        <label className="block">
          <span className={cx.label}>Sign-off on every post</span>
          <textarea rows={4} className={cx.input} value={r.signOff} onChange={(e) => setR({ ...r, signOff: e.target.value })} placeholder={"e.g. With you,\nSam"} />
        </label>
      </div>

      <label className="block max-w-md">
        <span className={cx.label}>Give-only posts for every invitation</span>
        <div className="flex items-center gap-2">
          <input type="number" min={1} max={20} className={`${cx.input} !w-24`} value={r.inviteRatio} onChange={(e) => setR({ ...r, inviteRatio: Number(e.target.value) || 4 })} />
          <span className={cx.muted}>to 1. About 4 to 1 keeps your feed generous.</span>
        </div>
      </label>

      <ListField
        label="Recurring series"
        hint="Regular features your audience can count on."
        items={r.series}
        blank={{ name: "", cadence: "" }}
        onChange={(series) => setR({ ...r, series })}
        render={(s, set) => (
          <>
            <input className={cx.input} value={s.name} placeholder="Series name" aria-label="Series name" onChange={(e) => set({ ...s, name: e.target.value })} />
            <input className={cx.input} value={s.cadence} placeholder="How often, e.g. every Friday" aria-label="How often" onChange={(e) => set({ ...s, cadence: e.target.value })} />
          </>
        )}
      />

      <ListField
        label="Words and phrases"
        hint="What to avoid, and what to say instead."
        items={r.wordRules}
        blank={{ avoid: "", instead: "" }}
        onChange={(wordRules) => setR({ ...r, wordRules })}
        render={(w, set) => (
          <>
            <input className={cx.input} value={w.avoid} placeholder="Never say…" aria-label="Avoid" onChange={(e) => set({ ...w, avoid: e.target.value })} />
            <input className={cx.input} value={w.instead} placeholder="Say instead…" aria-label="Instead" onChange={(e) => set({ ...w, instead: e.target.value })} />
          </>
        )}
      />

      <label className="block">
        <span className={cx.label}>Personal details</span>
        <textarea rows={2} className={cx.input} value={r.personalDetails} onChange={(e) => setR({ ...r, personalDetails: e.target.value })} />
      </label>

      <ListField
        label="Other rules"
        hint="Anything else, e.g. 'On LinkedIn, links go in the first comment.'"
        items={r.otherRules.map((text) => ({ text }))}
        blank={{ text: "" }}
        onChange={(list) => setR({ ...r, otherRules: list.map((x) => x.text) })}
        render={(x, set) => <input className={`${cx.input} sm:col-span-2`} value={x.text} aria-label="Rule" onChange={(e) => set({ text: e.target.value })} />}
      />

      <label className="block">
        <span className={cx.label}>Graphic style</span>
        <textarea rows={3} className={cx.input} value={r.graphicStyle} onChange={(e) => setR({ ...r, graphicStyle: e.target.value })} placeholder="Colors (hex), fonts, image sizes, and anything a designer should never change." />
      </label>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={!dirty} className={`${cx.btn} ${cx.primary}`}>Save voice &amp; rules</button>
        {saved && <span className={cx.muted}>Saved.</span>}
      </div>
    </form>
  );
}

function ListField<T>({
  label, hint, items, blank, onChange, render,
}: {
  label: string;
  hint: string;
  items: T[];
  blank: T;
  onChange: (items: T[]) => void;
  render: (item: T, set: (next: T) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <span className={cx.label}>{label}</span>
        <p className={cx.muted}>{hint}</p>
      </div>
      {items.map((it, i) => (
        <div key={i} className="grid items-center gap-2 sm:grid-cols-[1fr_1fr_auto]">
          {render(it, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}
          <button type="button" className="justify-self-start rounded-lg p-2 hover:bg-[#0F1A38]/5" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <X className="h-4 w-4 text-[#64748B]" />
          </button>
        </div>
      ))}
      <button type="button" className={`${cx.btn} ${cx.ghost}`} onClick={() => onChange([...items, structuredClone(blank)])}>
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
    </div>
  );
}
