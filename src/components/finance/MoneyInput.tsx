"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** "6959" -> "6,959", "6959.5" -> "6,959.5" (the raw value stays plain digits). */
function pretty(raw: string): string {
  if (!raw) return "";
  const [whole, frac] = raw.split(".");
  return `${group(whole || "0")}${frac !== undefined ? `.${frac}` : ""}`;
}

/**
 * A dollar amount box: a $ in front, thousands separators when you are not typing in it, and only
 * numbers accepted. The value it gives back is a plain number string ("6959" or "6959.50").
 */
export function MoneyInput(props: {
  value: string;
  onChange: (raw: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  disabled?: boolean;
}) {
  const { value, onChange, placeholder, className, disabled } = props;
  const [focused, setFocused] = useState(false);
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7b6b8d]" aria-hidden="true">
        $
      </span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        disabled={disabled}
        aria-label={props["aria-label"]}
        value={focused ? value : pretty(value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          // Keep digits and a single decimal point (cents), nothing else.
          const cleaned = e.target.value.replace(/[^0-9.]/g, "");
          const [whole, ...rest] = cleaned.split(".");
          const next = rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
          onChange(next);
        }}
        className="flex h-10 w-full rounded-lg border border-[#1a2b4a]/20 bg-white pl-7 pr-3 py-2 text-sm text-[#1a2b4a] placeholder:text-[#b8a898] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50 focus:border-[#c9a227] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]"
      />
    </div>
  );
}
