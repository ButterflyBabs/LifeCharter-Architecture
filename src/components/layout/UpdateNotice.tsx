"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

// When the Suite is updated while a page is open, say so, with one button that loads the latest version. (Otherwise people
// keep seeing the old menu or page until they refresh by hand.)
export default function UpdateNotice() {
  const base = useRef<string | null>(null);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    let off = false;
    const check = async () => {
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as { v?: string };
        if (off || !d.v || d.v === "dev") return;
        if (base.current === null) base.current = d.v;
        else if (d.v !== base.current) setFresh(true);
      } catch {
        /* try again next time */
      }
    };
    void check();
    const timer = setInterval(check, 10 * 60_000);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    return () => {
      off = true;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (!fresh) return null;
  return (
    <div role="status" className="fixed bottom-4 left-1/2 z-[80] flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-xl bg-[#1a2b4a] px-4 py-3 text-sm text-[#F8F5F0] shadow-xl">
      <span>A newer version of the Suite is ready.</span>
      <button onClick={() => window.location.reload()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#c9a227] px-3 py-1.5 font-semibold text-[#1a2b4a] hover:bg-[#d8b33a]">
        <RefreshCw className="h-4 w-4" /> Refresh now
      </button>
      <button onClick={() => setFresh(false)} className="text-xs underline text-[#F8F5F0]/80" aria-label="Dismiss">Later</button>
    </div>
  );
}
