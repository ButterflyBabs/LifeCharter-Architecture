"use client";

import { useEffect, useState } from "react";
import { Compass } from "lucide-react";

// Executive Home card for a client who did The Command Shift and hasn't brought that work in yet.
// Disappears once imported (the answers then live on the Alignment Profile).
export function CommandShiftBanner() {
  const [available, setAvailable] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/command-shift", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAvailable(d && !d.imported ? d.available || 0 : 0))
      .catch(() => {});
  }, []);

  if (!available) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#c9a227]/40 bg-gradient-to-br from-[#c9a227]/10 to-transparent p-5 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1a2b4a]/10">
          <Compass className="h-6 w-6 text-[#1a2b4a] dark:text-[#e8e4f0]" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Bring in your Command Shift work</p>
          <p className="text-sm text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70">
            You wrote {available} key answers during the 21-Day Challenge: your mission line, True North, offer, brand voice and more. Bring them in so your assistant and your plans start from your own words.
          </p>
          {error && <p className="mt-1 text-sm text-[#B3392B]">{error}</p>}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            const res = await fetch("/api/command-shift", { method: "POST" });
            if (!res.ok) {
              const d = await res.json().catch(() => ({}));
              setError(d.error || "That didn't work. Please try again.");
              setBusy(false);
              return;
            }
            window.location.href = "/assessments/command-shift?imported=1";
          }}
          className="shrink-0 rounded-xl bg-[#1a2b4a] px-5 py-2.5 text-sm font-semibold text-[#F8F5F0] hover:bg-[#16223b] disabled:opacity-60"
        >
          {busy ? "Bringing it in…" : "Bring it in"}
        </button>
      </div>
    </div>
  );
}
