"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ChevronRight, ListChecks } from "lucide-react";
import { GUIDE_PAGES, type GuideAnswers, type GuidePage } from "@/lib/marketing/guideQuestions";

type Progress = Partial<Record<GuidePage, number>>;

// Marketing Plan → links to the five guided questionnaires, with how far the
// client has got in each.
export function GuidedQuestionsCard() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    fetch("/api/marketing-plan/answers")
      .then((r) => (r.ok ? r.json() : { pages: {} }))
      .then((d: { pages?: Record<string, { answers: GuideAnswers }> }) => {
        const out: Progress = {};
        for (const [page, def] of Object.entries(GUIDE_PAGES) as [GuidePage, (typeof GUIDE_PAGES)[GuidePage]][]) {
          const a = d.pages?.[page]?.answers || {};
          out[page] = def.questions.filter((q) => a[q.id] !== undefined).length;
        }
        setProgress(out);
      })
      .catch(() => setProgress({}));
  }, []);

  const pages = Object.entries(GUIDE_PAGES) as [GuidePage, (typeof GUIDE_PAGES)[GuidePage]][];
  const done = progress ? pages.filter(([p, def]) => progress[p] === def.questions.length).length : 0;

  return (
    <section className="mb-6 rounded-2xl border border-[#0F1A38]/10 bg-white dark:bg-[#1E2A48] dark:border-[#334060] p-4 font-ui">
      <div className="mb-3 flex items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F1A38]">
          <ListChecks className="h-5 w-5 text-[#D4AF63]" />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-xl font-semibold text-[#0F1A38] dark:text-[#FAF8F3]">Guided questions</h2>
          <p className="text-sm text-[#334155] dark:text-[#CBD5E1]">
            Answer these once and your marketing tools work from your own words.
          </p>
        </div>
        {progress && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8C6D24] dark:text-[#D4AF63] tabular-nums">
            {done} of {pages.length} done
          </span>
        )}
      </div>
      <ul className="divide-y divide-[#0F1A38]/5 dark:divide-[#334060]">
        {pages.map(([page, def]) => {
          const answered = progress?.[page] ?? 0;
          const total = def.questions.length;
          const complete = answered === total;
          return (
            <li key={page}>
              <Link
                href={`/marketing-plan/${page}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-[#D4AF63]/10"
              >
                {complete ? (
                  <CheckCircle className="h-5 w-5 shrink-0 text-[#2E7C83]" aria-label="Done" />
                ) : (
                  <span className="h-5 w-5 shrink-0 rounded-full border-2 border-[#0F1A38]/20 dark:border-[#94A3B8]/40" aria-hidden="true" />
                )}
                <span className="flex-1 text-sm font-medium text-[#0F1A38] dark:text-[#FAF8F3]">{def.title}</span>
                <span className="text-xs tabular-nums text-[#64748B] dark:text-[#94A3B8]">
                  {!progress ? "" : complete ? "Done" : answered ? `${answered} of ${total} answered` : `${total} questions`}
                </span>
                <ChevronRight className="h-4 w-4 text-[#94A3B8]" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
