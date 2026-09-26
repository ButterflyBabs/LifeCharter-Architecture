"use client";

import { useEffect, useState } from "react";

// "Which business segment is this for?" — the link that lets a segment's score
// come from what's really happening in it. Shows nothing until the client has
// set up at least one segment.
export interface SegmentOption { id: number; name: string; business: string; label: string }

let cache: Promise<SegmentOption[]> | null = null;
const load = () => {
  if (!cache) cache = fetch("/api/segments/options").then((r) => r.json()).then((d) => (d.segments ?? []) as SegmentOption[]).catch(() => []);
  return cache;
};
// Call after adding/removing segments so pickers refetch.
export const resetSegmentOptions = () => { cache = null; };

export function SegmentSelect({ value, onChange, className, label = "Business segment (optional)", compact }: {
  value: number | string | null | undefined; onChange: (id: number | null) => void; className?: string; label?: string; compact?: boolean;
}) {
  const [opts, setOpts] = useState<SegmentOption[] | null>(null);
  useEffect(() => { load().then(setOpts); }, []);
  if (!opts || opts.length === 0) return null;
  const select = (
    <select
      aria-label={label}
      value={value ? String(value) : ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={className || "w-full h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}
    >
      <option value="">{compact ? "No segment" : "None"}</option>
      {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );
  if (compact) return select;
  return (
    <label className="block">
      <span className="block text-xs text-[#7a8a99] mb-1">{label}</span>
      {select}
    </label>
  );
}
