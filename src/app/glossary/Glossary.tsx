"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GLOSSARY, GLOSSARY_CATEGORIES } from "@/lib/glossary";

export default function Glossary() {
  const [q, setQ] = useState("");
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
  const groups = useMemo(
    () =>
      GLOSSARY_CATEGORIES.map((c) => ({
        category: c,
        terms: GLOSSARY.filter((g) => g.category === c && (!needle || `${g.term} ${g.short} ${g.long}`.toLowerCase().includes(needle))).sort((a, b) => a.term.localeCompare(b.term)),
      })).filter((g) => g.terms.length),
    [needle]
  );

  return (
    <div className="py-8 px-4 sm:px-6 max-w-[1100px] mx-auto">
      <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Glossary</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#5a6472] dark:text-[#b8c2cf]">
        The words we use in the Command Suite, and the business, sales and marketing terms behind it. Anywhere you see a word with a dotted underline, hover over it (or tap it) for a quick meaning.
      </p>
      <div className="relative mt-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#7a8a99]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the glossary" aria-label="Search the glossary" className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white py-2 pl-9 pr-3 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]" />
      </div>
      {!groups.length && <p className="mt-6 text-sm text-[#7a8a99]">Nothing matches that. Try another word.</p>}
      {groups.map((g) => (
        <section key={g.category} className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#2E7C83]">{g.category}</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {g.terms.map((t) => (
              <div key={t.id} id={t.id} className={`rounded-xl border bg-white p-4 dark:bg-[#1a2b4a]/30 ${hash === t.id ? "border-[#c9a227] shadow-md" : "border-[#1a2b4a]/10"}`}>
                <dt className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{t.term}</dt>
                <dd className="mt-1 text-sm font-medium text-[#1f6a70] dark:text-[#7fd0d6]">{t.short}</dd>
                <dd className="mt-1 text-sm leading-relaxed text-[#4a5568] dark:text-[#c9d1dc]">{t.long}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
