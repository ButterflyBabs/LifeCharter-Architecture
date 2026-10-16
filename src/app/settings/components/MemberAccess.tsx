"use client";

import { useEffect, useState } from "react";
import { FEATURES, PRESETS, type AccessExtras, type AccessLevel, type FeatureMap } from "@/lib/teamRoles";

// Choose what one team member can reach: their role's defaults, a preset, or
// feature by feature (No access / View / Edit). Billing, keys, connected
// accounts and other members' details stay closed whatever is chosen here.
export default function MemberAccess({
  access,
  busy,
  onSave,
  showHouse = false,
}: {
  access: { preset: string | null; features: FeatureMap; extras?: AccessExtras | null } | null;
  busy: boolean;
  onSave: (next: { preset: string; features: FeatureMap; extras: AccessExtras | null } | null) => void;
  // Babs's own account only: the Support Desk area (and the preset built around it).
  showHouse?: boolean;
}) {
  const [preset, setPreset] = useState<string>(access?.preset ?? "role");
  const [features, setFeatures] = useState<FeatureMap>(access?.features ?? PRESETS[0].features);

  const [extras, setExtras] = useState<AccessExtras>(access?.extras ?? {});
  const choose = (key: string) => {
    setPreset(key);
    const p = PRESETS.find((x) => x.key === key);
    if (p) {
      setFeatures(p.features);
      setExtras({ ...(p.extras ?? {}), ...(extras.pages ? { pages: extras.pages } : {}) });
    }
  };
  // My Pages, one at a time: give a person a single page without opening all of them.
  const [pages, setPages] = useState<{ slug: string; title: string }[]>([]);
  useEffect(() => {
    fetch("/api/custom-pages", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPages(Array.isArray(d?.pages) ? d.pages.filter((p: { nav_section?: string }) => p.nav_section !== "alignment_architect") : []))
      .catch(() => {});
  }, []);
  const setPage = (slug: string, l: AccessLevel) => {
    const next = { ...(extras.pages ?? {}) };
    if (l === "none") delete next[slug];
    else next[slug] = l;
    setExtras({ ...extras, pages: Object.keys(next).length ? next : undefined });
  };
  const toggle = (k: "restrict" | "ownOnly" | "noDelete" | "demo") => setExtras({ ...extras, [k]: !extras[k] });
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
          {PRESETS.filter((p) => showHouse || !p.houseOnly).map((p) => (
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
            {FEATURES.filter((f) => showHouse || !f.houseOnly).map((f) => (
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
      {preset !== "role" && pages.length > 0 && (
        <div className="space-y-1.5 rounded-md bg-white dark:bg-[#1a2b4a]/20 px-3 py-2">
          <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">My Pages, one at a time</p>
          <p className="text-xs text-[#7a8a99]">Choose just the pages they should open. These work even when &ldquo;My Pages (custom pages)&rdquo; above is off.</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {pages.map((p) => (
              <label key={p.slug} className="flex items-center justify-between gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                <span className="truncate">{p.title}</span>
                <select value={extras.pages?.[p.slug] ?? "none"} onChange={(e) => setPage(p.slug, e.target.value as AccessLevel)} className="text-xs rounded border border-[#1a2b4a]/20 bg-transparent px-2 py-1">
                  <option value="none">No access</option>
                  <option value="view">View</option>
                  <option value="edit">Edit</option>
                </select>
              </label>
            ))}
          </div>
        </div>
      )}
      {preset !== "role" && (
        <div className="space-y-1.5 rounded-md bg-white dark:bg-[#1a2b4a]/20 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
          <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={Boolean(extras.restrict)} onChange={() => toggle("restrict")} /><span>Show only the areas above (everything else, including Executive Home and the assistant, stays closed)</span></label>
          <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={Boolean(extras.ownOnly)} onChange={() => toggle("ownOnly")} /><span>Tasks and Reminders: only their own</span></label>
          <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={Boolean(extras.noDelete)} onChange={() => toggle("noDelete")} /><span>Cannot delete anything without your permission</span></label>
          {showHouse && <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={Boolean(extras.demo)} onChange={() => toggle("demo")} /><span>Can present the Demo Account (sample data, for live demos)</span></label>}
        </div>
      )}
      <p className="text-xs text-[#7a8a99]">Team members never see billing, API keys, connected accounts or other members&rsquo; details.</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => onSave(preset === "role" ? null : { preset, features, extras: Object.values(extras).some(Boolean) ? extras : null })}
        className="rounded-lg bg-[#2E7C83] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#256b71] disabled:opacity-60"
      >
        Save access
      </button>
    </div>
  );
}
