"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GuideSearch, { guideHitHref, rememberGuideSearch } from "@/components/userGuide/GuideSearch";
import { searchGuide } from "@/lib/userGuide/search";
import { GUIDE_AREAS, type GuideEntry } from "@/lib/userGuide/types";
import { guideCard } from "./guideStyles";

type EntryCardData = Pick<GuideEntry, "id" | "name" | "where" | "area" | "starter">;

function EntryCard({ entry }: { entry: EntryCardData }) {
  return (
    <Link href={`/user-guide/${entry.id}`} className={`${guideCard} block p-4 transition-shadow hover:shadow-[0_14px_34px_rgba(31,43,58,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c9a227]`}>
      <span className="block font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{entry.name}</span>
      <span className="mt-1 block text-sm text-[#5a6472] dark:text-[#b8c2cf]">{entry.where}</span>
    </Link>
  );
}

export default function UserGuideHome({ entries }: { entries: EntryCardData[] }) {
  const router = useRouter();
  const [recent, setRecent] = useState<string[]>([]);
  const [area, setArea] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/me/preferences", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRecent(Array.isArray(d?.guideRecent) ? d.guideRecent : []))
      .catch(() => {});
  }, []);

  const rerun = async (text: string) => {
    const { GUIDE_ENTRIES } = await import("@/lib/userGuide/entries");
    const hit = searchGuide(text, GUIDE_ENTRIES)[0];
    if (!hit) return;
    void rememberGuideSearch(text);
    router.push(guideHitHref(hit));
  };
  const starters = entries.filter((e) => e.starter);
  const areas = GUIDE_AREAS.filter((a) => entries.some((e) => e.area === a));
  const heading = "text-sm font-semibold uppercase tracking-[0.12em] text-[#5a6472] dark:text-[#b8c2cf]";

  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="font-serif text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] sm:text-4xl">What are you looking to do today?</h1>
      <p className="mt-2 text-[#5a6472] dark:text-[#b8c2cf]">Search for it in your own words, or browse by the left menu.</p>
      <div className="mt-5 max-w-3xl">
        <GuideSearch variant="page" />
      </div>

      {recent.length > 0 && (
        <section className="mt-8" aria-labelledby="guide-recent">
          <h2 id="guide-recent" className={heading}>Recently searched</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {recent.map((text) => (
              <button key={text} type="button" onClick={() => void rerun(text)} className="rounded-full border border-[#E6DDCB] dark:border-[#2F3B4A] bg-card px-3 py-1.5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#c9a227]/10">
                {text}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8" aria-labelledby="guide-start">
        <h2 id="guide-start" className={heading}>Good places to start</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {starters.map((e) => <EntryCard key={e.id} entry={e} />)}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="guide-browse">
        <h2 id="guide-browse" className={heading}>Browse by menu area</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {areas.map((a) => (
            <button key={a} type="button" aria-pressed={area === a} onClick={() => setArea(area === a ? null : a)} className={`rounded-full border px-3 py-1.5 text-sm ${area === a ? "border-[#c9a227] bg-[#c9a227]/15 text-[#1a2b4a] dark:text-[#F8F5F0]" : "border-[#E6DDCB] dark:border-[#2F3B4A] bg-card text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#c9a227]/10"}`}>
              {a}
            </button>
          ))}
        </div>
        {area && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {entries.filter((e) => e.area === area).map((e) => <EntryCard key={e.id} entry={e} />)}
          </div>
        )}
      </section>
    </div>
  );
}
