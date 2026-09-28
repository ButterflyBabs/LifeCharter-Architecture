"use client";

import { useState } from "react";
import { FEATURES, PRESETS, type AccessLevel, type FeatureMap } from "@/lib/teamRoles";

// Choose what one team member can reach: their role's defaults, a preset, or
// feature by feature (No access / View / Edit). Billing, keys, connected
// accounts and other members' details stay closed whatever is chosen here.
export default function MemberAccess({
  access,
  busy,
  onSave,
}: {
  access: { preset: string | null; features: FeatureMap } | null;
  busy: boolean;
  onSave: (next: { preset: string; features: FeatureMap } | null) => void;
}) {
  const [preset, setPreset] = useState<string>(access?.preset ?? "role");
  const [features, setFeatures] = useState<FeatureMap>(access?.features ?? PRESETS[0].features);

  const choose = (key: string) => {
    setPreset(key);
    const p = PRESETS.find((x) => x.key === key);
    if (p) setFeatures(p.features);
  };
  const set = (k: keyof FeatureMap, l: AccessLevel) => {
    setFeatures({ ...features, [k]: l });
    setPreset("custom");
  };
  const blurb = PRESETS.find((p) => p.key === preset)?.blurb;

  return (
    <div className="mt-4 rounded-lg border border-[#1a2b4a]/10 bg-[#F8F5F0]/60 dark:bg-white/5 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">What they can reach</span>
        <select value={preset} onChange={(e) => choose(e.target.value)} className="text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 py-1.5">
          <option value="role">Everything their role allows</option>
          {PRESETS.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </div>
      {preset === "role" ? (
        <p className="text-xs text-[#7a8a99]">No feature limits: their role (Admin, Editor or Viewer) decides.</p>
      ) : (
        <>
          {blurb && <p className="text-xs text-[#7a8a99]">{blurb} Adjust any area below.</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <label key={f.key} className="flex items-center justify-between gap-2 rounded-md bg-white dark:bg-[#1a2b4a]/20 px-3 py-1.5 text-sm">
                <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{f.label}</span>
                <select value={features[f.key] ?? "none"} onChange={(e) => set(f.key, e.target.value as AccessLevel)} className="text-xs rounded border border-[#1a2b4a]/20 bg-transparent px-2 py-1">
                  <option value="none">No access</option>
                  <option value="view">View</option>
                  <option value="edit">Edit</option>
                </select>
              </label>
            ))}
          </div>
        </>
      )}
      <p className="text-xs text-[#7a8a99]">Team members never see billing, API keys, connected accounts or other members&rsquo; details.</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => onSave(preset === "role" ? null : { preset, features })}
        className="rounded-lg bg-[#2E7C83] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#256b71] disabled:opacity-60"
      >
        Save access
      </button>
    </div>
  );
}
