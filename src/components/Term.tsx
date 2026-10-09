"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { glossaryById, glossarySplit } from "@/lib/glossary";

// A word from the Command Suite glossary: dotted underline, and a one-line definition when you hover, focus or tap it.
export function Term({ id, children }: { id: string; children?: React.ReactNode }) {
  const g = glossaryById.get(id);
  const [open, setOpen] = useState(false);
  const tip = useId();
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: Event) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
  if (!g) return <>{children}</>;
  return (
    <span ref={box} className="relative inline" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span
        role="button"
        tabIndex={0}
        aria-describedby={open ? tip : undefined}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); } }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="cursor-help underline decoration-dotted decoration-[#c9a227] underline-offset-4"
      >
        {children ?? g.term}
      </span>
      {open && (
        <span id={tip} role="tooltip" className="absolute left-0 top-full z-50 mt-1 block w-64 max-w-[80vw] rounded-lg bg-[#1a2b4a] px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-[#F8F5F0] shadow-lg">
          <strong className="block text-[#e0c35a]">{g.term}</strong>
          {g.short}
          <Link href={`/glossary#${g.id}`} className="mt-1 block text-[#8fd3d8] underline">See it in the Glossary</Link>
        </span>
      )}
    </span>
  );
}

// A sentence with its glossary words marked up (the first time each one appears).
export function GlossaryText({ text, only }: { text: string; only?: string[] }) {
  return (
    <>
      {glossarySplit(text, only).map((p, i) => (p.term ? <Term key={i} id={p.term.id}>{p.text}</Term> : <span key={i}>{p.text}</span>))}
    </>
  );
}
