"use client";

import { useEffect, useState } from "react";
import { Repeat } from "lucide-react";

interface SwitchInfo {
  canSwitch: boolean;
  active?: "own" | "team";
  team?: { label: string; role: string };
}

// Only shows for someone who owns their own account AND is a team member of another (Marcello).
// Everyone else gets nothing. Switching reloads into the other account.
export default function AccountSwitcher({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [info, setInfo] = useState<SwitchInfo | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/account/switch", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { canSwitch: false }))
      .then(setInfo)
      .catch(() => setInfo({ canSwitch: false }));
  }, []);

  if (!info?.canSwitch || !info.team) return null;

  const go = async (to: "own" | "team") => {
    if (busy || to === info.active) return;
    setBusy(true);
    try {
      const r = await fetch("/api/account/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      if (r.ok) {
        window.location.assign("/");
        return;
      }
    } catch {
      /* fall through */
    }
    setBusy(false);
  };

  const dark = tone === "dark";
  const wrap = dark ? "border-[#c9a227]/40 bg-[#1C2236] text-[#F3EEE4]" : "border-[#c9a227]/40 bg-white dark:bg-[#22223a] text-[#1a2b4a] dark:text-[#F8F5F0]";
  const on = "bg-[#c9a227] text-[#1a2b4a]";

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border p-0.5 text-xs font-semibold ${wrap}`} role="group" aria-label="Switch account">
      <Repeat className="w-3.5 h-3.5 ml-2 mr-1 text-[#c9a227]" aria-hidden />
      <button
        type="button"
        onClick={() => go("own")}
        disabled={busy}
        aria-pressed={info.active === "own"}
        className={`rounded-full px-3 py-1 ${info.active === "own" ? on : ""}`}
      >
        My account
      </button>
      <button
        type="button"
        onClick={() => go("team")}
        disabled={busy}
        aria-pressed={info.active === "team"}
        className={`rounded-full px-3 py-1 ${info.active === "team" ? on : ""}`}
        title={`${info.team.label} (${info.team.role})`}
      >
        {info.team.label} · {info.team.role}
      </button>
    </div>
  );
}
