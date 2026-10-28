"use client";

import { CURRENCIES, type Currency } from "@/lib/currency";

/** A small USD / CAD picker for an offer, bill, invoice or entry. */
export function CurrencySelect({ value, onChange, className, ...rest }: { value: Currency; onChange: (c: Currency) => void; className?: string; "aria-label"?: string; disabled?: boolean }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value === "cad" ? "cad" : "usd")}
      aria-label={rest["aria-label"] ?? "Currency"}
      disabled={rest.disabled}
      className={className ?? "h-10 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]"}
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {c.toUpperCase()}
        </option>
      ))}
    </select>
  );
}

/** "Also: CA$300" under a total, when the other currency has money. Renders nothing otherwise. */
export function OtherCurrencyNote({ text, className }: { text: string | null | undefined; className?: string }) {
  if (!text) return null;
  return <p className={className ?? "text-xs text-[#1a2b4a]/60 dark:text-[#F8F5F0]/60 mt-1"}>Kept separate: {text}</p>;
}
