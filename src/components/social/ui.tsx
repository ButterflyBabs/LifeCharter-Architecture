"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { platformDef, STATUSES, type PostStatus } from "@/lib/social/planner";

// Command Suite brand board (2026-09): indigo #0F1A38, gold #D4AF63, ivory
// #FAF8F3; Cormorant Garamond display, Montserrat UI. Small gold text uses a
// deeper gold on light surfaces so it stays readable.
export const cx = {
  page: "py-8 px-4 max-w-6xl mx-auto font-ui",
  card: "rounded-2xl border border-[#0F1A38]/10 bg-white dark:bg-[#1E2A48] dark:border-[#334060] p-5",
  eyebrow: "font-ui text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8C6D24] dark:text-[#D4AF63]",
  h1: "font-display text-4xl font-semibold text-[#0F1A38] dark:text-[#FAF8F3] leading-tight",
  h2: "font-display text-2xl font-semibold text-[#0F1A38] dark:text-[#FAF8F3]",
  h3: "font-ui text-sm font-semibold text-[#0F1A38] dark:text-[#FAF8F3]",
  body: "text-sm text-[#334155] dark:text-[#CBD5E1]",
  muted: "text-xs text-[#64748B] dark:text-[#94A3B8]",
  btn: "inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 font-ui text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors disabled:opacity-50",
  primary: "bg-[#D4AF63] text-[#0F1A38] hover:bg-[#c9a24f]",
  secondary: "border border-[#D4AF63] text-[#0F1A38] dark:text-[#FAF8F3] hover:bg-[#D4AF63]/10",
  ghost: "text-[#0F1A38] dark:text-[#FAF8F3] hover:bg-[#0F1A38]/5 dark:hover:bg-white/5",
  danger: "border border-[#D83A34]/40 text-[#B3261E] hover:bg-[#D83A34]/5",
  input:
    "w-full rounded-lg border border-[#0F1A38]/15 dark:border-[#334060] bg-white dark:bg-[#0E162A] px-3 py-2 text-sm text-[#0F1A38] dark:text-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#D4AF63]/60",
  label: "block font-ui text-xs font-medium text-[#475569] dark:text-[#CBD5E1] mb-1",
};

export function PlatformChip({ id, className = "" }: { id: string; className?: string }) {
  const p = platformDef(id);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
      style={{ color: p.color, backgroundColor: `${p.color}1a` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
      {p.short}
    </span>
  );
}

export const STATUS_META: Record<PostStatus, { label: string; color: string; bg: string }> = {
  idea: { label: "Idea", color: "#5E3B6C", bg: "#efe8f3" },
  draft: { label: "Draft", color: "#5a5148", bg: "#eee9e2" },
  scheduled: { label: "Scheduled", color: "#1c5a60", bg: "#d3ebee" },
  posted: { label: "Posted", color: "#2c6b3f", bg: "#d8efdd" },
};

export function StatusBadge({ status }: { status: PostStatus }) {
  const m = STATUS_META[status];
  return (
    <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: m.color, backgroundColor: m.bg }}>
      {m.label}
    </span>
  );
}

export function StatusSelect({ value, onChange, disabled }: { value: PostStatus; onChange: (s: PostStatus) => void; disabled?: boolean }) {
  return (
    <select
      aria-label="Status"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as PostStatus)}
      className="rounded-lg border border-[#0F1A38]/15 dark:border-[#334060] bg-white dark:bg-[#0E162A] px-2 py-1 text-xs text-[#0F1A38] dark:text-[#FAF8F3]"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_META[s].label}
        </option>
      ))}
    </select>
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API refused (older browser, embedded frame): fall back to a
    // hidden textarea + execCommand.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({ text, label = "Copy", variant = "secondary", className = "" }: { text: string; label?: string; variant?: "primary" | "secondary" | "ghost"; className?: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  return (
    <button
      type="button"
      disabled={!text}
      onClick={async () => {
        setState((await copyText(text)) ? "done" : "failed");
        setTimeout(() => setState("idle"), 1800);
      }}
      className={`${cx.btn} ${cx[variant]} ${className}`}
    >
      {state === "done" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {state === "done" ? "Copied" : state === "failed" ? "Couldn\u2019t copy" : label}
    </button>
  );
}

export function Bar({ ratio }: { ratio: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0F1A38]/8 dark:bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? "#2E7C83" : "#D4AF63" }} />
    </div>
  );
}

export function ScorePill({ pct, children }: { pct: number; children: ReactNode }) {
  const tone = pct >= 100 ? "bg-[#2E7C83]/12 text-[#1f5f65]" : pct >= 60 ? "bg-[#C9A227]/15 text-[#7a5f10]" : "bg-[#D83A34]/10 text-[#9b2620]";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums ${tone}`}>{children}</span>;
}

export function Ring({ pct }: { pct: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, pct));
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <circle cx="24" cy="24" r={r} fill="none" strokeWidth="5" className="stroke-[#0F1A38]/10 dark:stroke-white/10" />
      <circle
        cx="24" cy="24" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
        stroke={v >= 100 ? "#2E7C83" : "#D4AF63"}
        strokeDasharray={`${(v / 100) * c} ${c}`} transform="rotate(-90 24 24)"
      />
      <text x="24" y="28" textAnchor="middle" className="fill-[#0F1A38] dark:fill-[#FAF8F3]" style={{ font: "600 11px var(--font-montserrat), sans-serif" }}>
        {v}%
      </text>
    </svg>
  );
}

export function Spark({ values, target }: { values: number[]; target: number }) {
  const W = 120;
  const H = 30;
  const max = Math.max(target, ...values, 1);
  const x = (i: number) => (values.length === 1 ? W / 2 : 4 + (i * (W - 8)) / (values.length - 1));
  const y = (v: number) => H - 3 - (v / max) * (H - 6);
  const last = values.length - 1;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <line x1="0" x2={W} y1={y(target)} y2={y(target)} strokeDasharray="3 3" className="stroke-[#0F1A38]/20 dark:stroke-white/20" />
      <polyline points={values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")} fill="none" stroke="#D4AF63" strokeWidth="2" strokeLinejoin="round" />
      {last >= 0 && <circle cx={x(last)} cy={y(values[last])} r="3" fill="#D4AF63" />}
    </svg>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-[#0F1A38]/10 dark:border-[#334060] mb-6">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`whitespace-nowrap px-3.5 py-2.5 font-ui text-[12px] font-semibold uppercase tracking-[0.06em] border-b-2 -mb-px ${
            value === t.id
              ? "border-[#D4AF63] text-[#0F1A38] dark:text-[#FAF8F3]"
              : "border-transparent text-[#64748B] hover:text-[#0F1A38] dark:hover:text-[#FAF8F3]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Tip({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D4AF63]/40 bg-[#D4AF63]/10 px-4 py-3 text-sm text-[#5b4716] dark:text-[#E9D7A9]">
      <span>{children}</span>
      {action}
    </div>
  );
}
