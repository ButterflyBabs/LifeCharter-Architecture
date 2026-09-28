"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Check, Building2 } from "lucide-react";

type Biz = { id: number; name: string; color: string | null };

// Header business switcher (Babs, 2026-09-28). With two or more businesses, choosing one filters
// Executive Home, Daily Compass, tasks, Financial Pulse, Sales Activities, Pipeline and Offers to
// that business. With one business or none, it's a plain label with the account name.
export function BusinessSwitcher({ workspace }: { workspace: string }) {
  const [list, setList] = useState<Biz[] | null>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/business-scope", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setList(d?.businesses ?? []);
        setCurrent(d?.current ?? null);
      })
      .catch(() => setList([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  async function choose(id: number | null) {
    setBusy(true);
    await fetch("/api/business-scope", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: id }) }).catch(() => {});
    window.location.reload();
  }

  if (list === null) return null;

  if (list.length <= 1) {
    if (!workspace && !list.length) return null;
    return (
      <Link href="/settings?tab=workspace" className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:text-[#F8F5F0]" title="Workspace settings">
        <Building2 className="w-4 h-4 text-[#b8a898]" />
        {list[0]?.name || workspace}
      </Link>
    );
  }

  const chosen = list.find((b) => b.id === current) ?? null;
  return (
    <div ref={ref} className="relative hidden md:flex items-center gap-2">
      <span className="text-xs text-[#b8a898] uppercase tracking-wider">Business</span>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${chosen ? "bg-[#c9a227]/15 hover:bg-[#c9a227]/25" : "bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10 hover:bg-[#1a2b4a]/10 dark:hover:bg-[#e8e4f0]/20"}`}
      >
        {chosen && <span className="h-2.5 w-2.5 rounded-full" style={{ background: chosen.color || "#c9a227" }} />}
        <span className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{busy ? "Switching…" : chosen ? chosen.name : "All businesses"}</span>
        <ChevronDown className="w-4 h-4 text-[#b8a898]" />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[#1a2b4a]/10 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#1a2b4a]">
          <button role="menuitemradio" aria-checked={!chosen} onClick={() => choose(null)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:text-[#F8F5F0]">
            All businesses {!chosen && <Check className="w-4 h-4 text-[#2E7C83]" />}
          </button>
          {list.map((b) => (
            <button key={b.id} role="menuitemradio" aria-checked={current === b.id} onClick={() => choose(b.id)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:text-[#F8F5F0]">
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color || "#c9a227" }} />{b.name}</span>
              {current === b.id && <Check className="w-4 h-4 text-[#2E7C83]" />}
            </button>
          ))}
          <p className="border-t border-[#1a2b4a]/10 px-3 pt-2 pb-1 text-[11px] leading-snug text-[#7b6b8d] dark:border-white/10">
            Filters Home, Daily Compass, tasks, finances, Sales Activities, Pipeline and Offers. New items go to the chosen business.
          </p>
          <Link href="/segments" onClick={() => setOpen(false)} className="block px-3 py-2 text-xs font-medium text-[#2E7C83] hover:underline">Manage businesses</Link>
        </div>
      )}
    </div>
  );
}
