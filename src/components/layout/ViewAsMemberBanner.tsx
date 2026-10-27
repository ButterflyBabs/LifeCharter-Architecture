"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

// A bold bar while the Alignment Architect has "View as team member" open: she sees the Suite exactly as that person
// does (their role and area limits), read-only. The real gate is the lc_view_member cookie on the server.
export default function ViewAsMemberBanner() {
  const [who, setWho] = useState<{ name: string; role: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setWho(d?.viewingMember ? { name: String(d.viewingMember.name || "a team member"), role: String(d.viewingMember.role || "") } : null))
      .catch(() => {});
  }, []);

  const exit = async () => {
    setBusy(true);
    try {
      await fetch("/api/admin/view-as-member", { method: "DELETE" });
    } catch {
      /* the cookie also expires by itself */
    }
    window.location.assign("/settings?tab=workspace");
  };

  if (!who) return null;
  return (
    <div className="sticky top-0 z-[60] bg-[#7a1f1f] text-white">
      <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-2 text-sm font-semibold">
        <Eye className="h-4 w-4" />
        <span>VIEWING AS {who.name.toUpperCase()}{who.role ? ` (${who.role.toUpperCase()})` : ""}: exactly what they can open, read-only. Nothing you do here is saved or sent.</span>
        <button onClick={exit} disabled={busy} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#7a1f1f] hover:bg-white/90">
          {busy ? "Closing…" : "Exit and go back to my account"}
        </button>
      </div>
    </div>
  );
}
