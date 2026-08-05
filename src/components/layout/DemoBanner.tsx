"use client";

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";

// Shows a bold DEMO bar whenever Demo mode is on (lc_demo cookie), so sample
// data is never mistaken for real data. Reads the non-httpOnly cookie client-side.
export default function DemoBanner() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const has = document.cookie.split("; ").some((c) => c.trim() === "lc_demo=1");
    setOn(has);
  }, []);

  if (!on) return null;

  return (
    <div className="sticky top-0 z-[60] bg-[#c9a227] text-[#1a2b4a]">
      <div className="px-4 py-2 flex items-center justify-center gap-3 text-sm font-semibold">
        <Sparkles className="w-4 h-4" />
        <span>DEMO MODE — you&apos;re viewing sample data (Brand Alchemy Studio)</span>
        <a
          href="/demo/exit"
          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#1a2b4a] text-[#F8F5F0] hover:bg-[#1a2b4a]/90"
        >
          <X className="w-3 h-3" /> Exit demo
        </a>
      </div>
    </div>
  );
}
