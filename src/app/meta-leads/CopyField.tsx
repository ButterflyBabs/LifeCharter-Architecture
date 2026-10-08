"use client";

import { useState } from "react";

export default function CopyField({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mt-2 flex gap-2">
      <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} aria-label="Lead address" className="min-w-0 flex-1 rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-xs text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]" />
      <button
        onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* select it instead */ } }}
        className="rounded-lg bg-[#1a2b4a] px-4 text-sm font-medium text-white"
      >
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
