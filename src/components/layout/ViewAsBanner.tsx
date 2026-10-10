"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

// Shows a bold bar whenever the Alignment Architect has a client's account open (View as client).
// Reads the display-only name cookie; the real gate is the signed lc_view_as cookie on the server.
export default function ViewAsBanner() {
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const read = () => {
      const hit = document.cookie.split("; ").find((c) => c.startsWith("lc_view_as_name="));
      if (!hit) return setName(null);
      try {
        setName(decodeURIComponent(hit.slice("lc_view_as_name=".length)) || "a client");
      } catch {
        setName("a client");
      }
    };
    read();
    window.addEventListener("focus", read);
    document.addEventListener("visibilitychange", read);
    const t = setInterval(read, 4000);
    return () => {
      window.removeEventListener("focus", read);
      document.removeEventListener("visibilitychange", read);
      clearInterval(t);
    };
  }, []);

  const exit = async () => {
    setBusy(true);
    try {
      await fetch("/api/admin/view-as", { method: "DELETE" });
    } catch {
      /* the cookie also expires by itself */
    }
    window.location.assign("/view-as");
  };

  if (!name) return null;

  return (
    <div className="sticky top-0 z-[60] bg-[#7a1f1f] text-white">
      <div className="px-4 py-2 flex items-center justify-center gap-3 text-sm font-semibold flex-wrap">
        <Eye className="w-4 h-4" />
        <span>VIEWING AS {name.toUpperCase()}: read-only, nothing you do here is saved or sent. This view is logged.</span>
        <button
          onClick={exit}
          disabled={busy}
          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-white text-[#7a1f1f] hover:bg-white/90"
        >
          {busy ? "Closing…" : "Exit and go back to my account"}
        </button>
      </div>
    </div>
  );
}
