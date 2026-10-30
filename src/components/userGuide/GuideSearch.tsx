"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { GUIDE_ENTRIES } from "@/lib/userGuide/entries";
import { cleanGuideRecent, searchGuide, type GuideHit } from "@/lib/userGuide/search";

// Remembers a search on the person's own profile. Called when they pick a result, never on each keystroke.
export async function rememberGuideSearch(text: string) {
  const res = await fetch("/api/me/preferences", { cache: "no-store" }).catch(() => null);
  const prefs = res?.ok ? await res.json() : null;
  await fetch("/api/me/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guideRecent: cleanGuideRecent([text, ...(prefs?.guideRecent ?? [])]) }),
  }).catch(() => {});
}

export const guideHitHref = (hit: GuideHit) => `/user-guide/${hit.entry.id}${hit.section ? `#${hit.section.id}` : ""}`;

// The one search box: at the top of the User Guide and in the top bar.
export default function GuideSearch({ variant, initial = "" }: { variant: "page" | "header"; initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const hits = useMemo(() => searchGuide(q, GUIDE_ENTRIES), [q]);
  useEffect(() => setActive(-1), [q]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (hit: GuideHit) => {
    const text = q.trim();
    if (text) void rememberGuideSearch(text);
    setOpen(false);
    if (variant === "header") setQ("");
    router.push(guideHitHref(hit));
  };
  const showList = open && q.trim().length > 0;

  return (
    <div ref={boxRef} className="relative">
      <Search aria-hidden className={cn("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8a99]", variant === "page" ? "h-5 w-5" : "h-4 w-4")} />
      <input
        type="search"
        role="combobox"
        aria-label="Search the User Guide"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={q}
        placeholder={variant === "page" ? "Type what you want to do" : "Search LifeCharter..."}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (!hits.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => (a + 1) % hits.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a <= 0 ? hits.length - 1 : a - 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            go(hits[Math.max(active, 0)]);
          }
        }}
        className={cn(
          "w-full border text-[#1a2b4a] dark:text-[#F8F5F0] placeholder:text-[#7a8a99] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227]/60",
          variant === "page"
            ? "rounded-2xl border-[#E6DDCB] dark:border-[#2F3B4A] bg-card py-4 pl-11 pr-4 text-lg shadow-[0_10px_28px_rgba(31,43,58,0.12)]"
            : "rounded-full border-transparent bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10 py-2 pl-10 pr-4 text-sm"
        )}
      />
      <div id={listId} role="listbox" aria-label="Suggestions" hidden={!showList} className="absolute left-0 right-0 top-full z-50 mt-2 min-w-72 overflow-hidden rounded-xl border border-[#E6DDCB] dark:border-[#2F3B4A] bg-card shadow-[0_12px_32px_rgba(31,43,58,0.18)]">
        {hits.map((hit, i) => (
          <button
            key={guideHitHref(hit)}
            id={`${listId}-${i}`}
            type="button"
            role="option"
            aria-selected={active === i}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => go(hit)}
            className={cn("block w-full px-4 py-2.5 text-left hover:bg-[#c9a227]/10", active === i && "bg-[#c9a227]/15")}
          >
            <span className="block text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {hit.entry.name}
              {hit.section ? `: ${hit.section.title}` : ""}
            </span>
            <span className="block text-xs text-[#5a6472] dark:text-[#b8c2cf]">{hit.entry.where}</span>
          </button>
        ))}
        {showList && !hits.length && <p className="px-4 py-3 text-sm text-[#5a6472] dark:text-[#b8c2cf]">Nothing matches that yet. Try another word.</p>}
      </div>
    </div>
  );
}
