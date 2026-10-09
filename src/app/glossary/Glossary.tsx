"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { GLOSSARY, GLOSSARY_CATEGORIES, type GlossaryCategory } from "@/lib/glossary";

const BADGE: Record<GlossaryCategory, string> = {
  "Command Suite": "bg-[#2E7C83]/12 text-[#1f6a70] dark:text-[#7fd0d6]",
  Business: "bg-[#c9a227]/15 text-[#7a5a0e] dark:text-[#e0c35a]",
  Sales: "bg-[#7b6b8d]/15 text-[#5b4a70] dark:text-[#cdbfe0]",
  Marketing: "bg-[#c0632f]/12 text-[#9a4a1f] dark:text-[#f0b08a]",
};
const sortKey = (t: { term: string; sortAs?: string }) => (t.sortAs || t.term).toLowerCase().replace(/^the\s+/, "");

export default function Glossary() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<GlossaryCategory | "All">("All");
  const [hash, setHash] = useState("");
  useEffect(() => {
    const read = () => setHash(window.location.hash.replace("#", ""));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  useEffect(() => {
    if (hash) document.getElementById(hash)?.scrollIntoView({ block: "center" });
  }, [hash]);

  const needle = q.trim().toLowerCase();
  const letters = useMemo(() => {
    const list = GLOSSARY.filter((g) => (cat === "All" || g.category === cat) && (!needle || `${g.term} ${g.short} ${g.long}`.toLowerCase().includes(needle))).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    const map = new Map<string, typeof list>();
    for (const g of list) {
      const L = sortKey(g)[0]?.toUpperCase() || "#";
      map.set(L, [...(map.get(L) ?? []), g]);
    }
    return Array.from(map.entries());
  }, [needle, cat]);
  const present = new Set(letters.map(([l]) => l));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="py-8 px-4 sm:px-6 max-w-[1100px] mx-auto">
      <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Glossary</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#5a6472] dark:text-[#b8c2cf]">
        The words we use in the Command Suite, and the business, sales and marketing terms behind it, from A to Z. Anywhere you see a word with a dotted underline in the app, hover over it (or tap it) for a quick meaning.
      </p>
      <div className="relative mt-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#7a8a99]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the glossary" aria-label="Search the glossary" className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white py-2 pl-9 pr-3 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Show terms from">
        {(["All", ...GLOSSARY_CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`rounded-full border px-3 py-1 text-xs font-semibold ${cat === c ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/25 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
            {c === "All" ? "All terms" : c}
          </button>
        ))}
      </div>
      <nav aria-label="Jump to a letter" className="sticky top-0 z-10 -mx-1 mt-4 flex flex-wrap gap-1 bg-[#FBF8F1]/95 px-1 py-2 backdrop-blur dark:bg-[#0e1830]/95">
        {alphabet.map((L) => present.has(L) ? (
          <a key={L} href={`#letter-${L}`} className="rounded-md px-2 py-1 text-sm font-semibold text-[#1f6a70] hover:bg-[#2E7C83]/10 dark:text-[#7fd0d6]">{L}</a>
        ) : (
          <span key={L} className="rounded-md px-2 py-1 text-sm text-[#b8a898]">{L}</span>
        ))}
      </nav>
      {!letters.length && <p className="mt-6 text-sm text-[#7a8a99]">Nothing matches that. Try another word.</p>}
      {letters.map(([L, terms]) => (
        <section key={L} id={`letter-${L}`} className="mt-6 scroll-mt-16">
          <h2 className="border-b border-[#1a2b4a]/15 pb-1 font-serif text-2xl text-[#1a2b4a] dark:text-[#F8F5F0]">{L}</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {terms.map((t) => (
              <div key={t.id} id={t.id} className={`rounded-xl border bg-white p-4 dark:bg-[#1a2b4a]/30 ${hash === t.id ? "border-[#c9a227] shadow-md" : "border-[#1a2b4a]/10"}`}>
                <dt className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{t.term}</span>
                  <button onClick={() => setCat(t.category)} title={`Show only ${t.category} terms`} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE[t.category]}`}>{t.category}</button>
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#1f6a70] dark:text-[#7fd0d6]">{t.short}</dd>
                <dd className="mt-1 text-sm leading-relaxed text-[#4a5568] dark:text-[#c9d1dc]">{t.long}</dd>
                {t.seen && t.seen.length > 0 && (
                  <dd className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-[#7a8a99]">You will see it in:</span>
                    {t.seen.map((s) => (
                      <Link key={s.href + s.label} href={s.href} className="rounded-full border border-[#1a2b4a]/20 px-2.5 py-0.5 text-xs font-medium text-[#1a2b4a] hover:border-[#2E7C83] hover:text-[#1f6a70] dark:text-[#F8F5F0]">{s.label}</Link>
                    ))}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
