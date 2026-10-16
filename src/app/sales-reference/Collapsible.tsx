"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

// Reading help for the Sales Reference page: every section folds shut, and the whole page can be made larger or
// smaller. Both are remembered on this device.

const SIZE_KEY = "sales-ref:font-pct";
const MIN = 80;
const MAX = 170;
const STEP = 10;

export function applyFontSize(pct: number) {
  // Everything on this page is sized in rem, so scaling the page's root text size scales all of it together.
  document.documentElement.style.fontSize = `${pct}%`;
}

/** A section of the page with a header that folds it shut. The content stays mounted, so notes and forms keep what was typed. */
export function PageFold({ id, title, defaultOpen = true, children }: { id: string; title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`sales-ref:fold:${id}`);
      if (saved === "0") setOpen(false);
      if (saved === "1") setOpen(true);
    } catch {
      /* private mode */
    }
    const all = (e: Event) => setOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    window.addEventListener("sales-ref-fold-all", all);
    return () => window.removeEventListener("sales-ref-fold-all", all);
  }, [id]);
  const toggle = () => {
    setOpen((o) => {
      try {
        localStorage.setItem(`sales-ref:fold:${id}`, o ? "0" : "1");
      } catch {
        /* private mode */
      }
      return !o;
    });
  };
  return (
    <div className="mb-8">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#c9a227]/30 bg-[#1C2236] px-4 py-3 text-left hover:border-[#c9a227]/60"
      >
        <span className="text-base font-semibold text-[#F8F5F0]">{title}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-[#E3C27C] transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden="true" />
      </button>
      <div className={open ? "mt-4" : "hidden"}>{children}</div>
    </div>
  );
}

/** Font size and fold-all controls, pinned to the top of the page while reading. */
export function ReadingControls() {
  const [pct, setPct] = useState(100);
  useEffect(() => {
    let start = 100;
    try {
      const saved = Number(localStorage.getItem(SIZE_KEY));
      if (saved >= MIN && saved <= MAX) start = saved;
    } catch {
      /* private mode */
    }
    setPct(start);
    applyFontSize(start);
    return () => {
      document.documentElement.style.fontSize = ""; // leave the rest of the app at its own size
    };
  }, []);
  const set = (n: number) => {
    const v = Math.max(MIN, Math.min(MAX, n));
    setPct(v);
    applyFontSize(v);
    try {
      localStorage.setItem(SIZE_KEY, String(v));
    } catch {
      /* private mode */
    }
  };
  const foldAll = (open: boolean) => {
    window.dispatchEvent(new CustomEvent("sales-ref-fold-all", { detail: { open } }));
    document.querySelectorAll("[data-fold-head]").forEach((h) => {
      const card = h.parentElement;
      if (!card) return;
      if (open) card.removeAttribute("data-collapsed");
      else card.setAttribute("data-collapsed", "");
    });
  };
  const btn = "rounded-lg border border-[#F3EEE4]/25 bg-[#141826] px-3 py-1.5 text-sm font-semibold text-[#F3EEE4] hover:border-[#c9a227] disabled:opacity-40";
  return (
    <div className="sticky top-2 z-30 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c9a227]/40 bg-[#141826]/95 px-4 py-2.5 shadow-lg backdrop-blur" role="toolbar" aria-label="Reading controls">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#b8a898]">Text size</span>
        <button type="button" className={btn} onClick={() => set(pct - STEP)} disabled={pct <= MIN} aria-label="Make the text smaller">A−</button>
        <span className="w-12 text-center text-sm tabular-nums text-[#F3EEE4]">{pct}%</span>
        <button type="button" className={btn} onClick={() => set(pct + STEP)} disabled={pct >= MAX} aria-label="Make the text larger">A+</button>
        <button type="button" className="text-xs text-[#E3C27C] underline" onClick={() => set(100)}>Reset</button>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} onClick={() => foldAll(false)}>Collapse all</button>
        <button type="button" className={btn} onClick={() => foldAll(true)}>Expand all</button>
      </div>
    </div>
  );
}
