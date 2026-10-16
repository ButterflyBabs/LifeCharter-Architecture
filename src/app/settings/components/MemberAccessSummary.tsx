"use client";

import { FEATURES, type AccessExtras, type FeatureMap } from "@/lib/teamRoles";

// A plain list of everything one team member can reach, shown under their name: each area with Edit or View,
// the custom pages given one at a time, the limits that apply, and (so removing is easy) what is not included.
const chip = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";

export default function MemberAccessSummary({
  role,
  roleText,
  access,
  pageTitles,
  showHouse,
}: {
  role: string;
  roleText: string;
  access: { preset: string | null; features: FeatureMap; extras?: AccessExtras | null } | null;
  pageTitles: Record<string, string>;
  showHouse: boolean;
}) {
  // No feature limits: the role decides.
  if (!access) {
    return (
      <div className="mt-3 rounded-lg bg-[#F8F5F0]/70 dark:bg-white/5 px-3 py-2 text-xs text-[#5c5348] dark:text-[#b8c2cf]">
        <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Access: </span>
        everything their role allows ({roleText}).
      </div>
    );
  }
  const list = FEATURES.filter((f) => showHouse || !f.houseOnly);
  const edit = list.filter((f) => access.features[f.key] === "edit");
  const view = list.filter((f) => access.features[f.key] === "view");
  const none = list.filter((f) => (access.features[f.key] ?? "none") === "none");
  const ex = access.extras ?? null;
  const pages = Object.entries(ex?.pages ?? {});
  const limits = [
    ex?.restrict && "Sees only the areas listed",
    ex?.ownOnly && "Own tasks and reminders only",
    ex?.noDelete && "Cannot delete without your permission",
    role === "viewer" && "View-only role: cannot change anything",
  ].filter(Boolean) as string[];

  return (
    <div className="mt-3 space-y-2 rounded-lg bg-[#F8F5F0]/70 dark:bg-white/5 px-3 py-3 text-xs">
      <Row label="Can edit" empty="Nothing">
        {edit.map((f) => (
          <span key={f.key} className={`${chip} bg-[#c9a227]/20 text-[#7a5f0a] dark:text-[#e8cf7a]`}>{f.label}</span>
        ))}
      </Row>
      {view.length > 0 && (
        <Row label="Can view" empty="">
          {view.map((f) => (
            <span key={f.key} className={`${chip} bg-[#1a2b4a]/10 text-[#1a2b4a] dark:text-[#F8F5F0]`}>{f.label}</span>
          ))}
        </Row>
      )}
      {pages.length > 0 && (
        <Row label="My Pages" empty="">
          {pages.map(([slug, l]) => (
            <span key={slug} className={`${chip} bg-[#2E7C83]/15 text-[#1f5a60] dark:text-[#8fd0d6]`}>
              {pageTitles[slug] ?? slug} · {l === "edit" ? "edit" : "view"}
            </span>
          ))}
        </Row>
      )}
      {limits.length > 0 && (
        <Row label="Limits" empty="">
          {limits.map((l) => (
            <span key={l} className={`${chip} bg-[#2E7C83]/15 text-[#1f5a60] dark:text-[#8fd0d6]`}>{l}</span>
          ))}
        </Row>
      )}
      {none.length > 0 && (
        <p className="text-[#7a8a99]">
          <span className="font-semibold">Not included: </span>
          {none.map((f) => f.label.replace(/ \(.*\)$/, "")).join(", ")}
        </p>
      )}
    </div>
  );
}

function Row({ label, empty, children }: { label: string; empty: string; children: React.ReactNode }) {
  const has = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-16 shrink-0 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{label}</span>
      {has ? children : <span className="text-[#7a8a99]">{empty}</span>}
    </div>
  );
}
