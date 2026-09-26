"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import type { PlanQuestion } from "@/lib/plans/blueprints";
import { cx } from "./ui";

export interface PlanSection {
  key: string;
  title: string;
  questions: PlanQuestion[];
  answers: Record<string, string>;
}

// The account's Marketing Plan sections (Build tab), loaded once per page.
let cache: Promise<PlanSection[]> | null = null;
export function loadMarketingSections(fresh = false): Promise<PlanSection[]> {
  if (!cache || fresh) {
    cache = fetch("/api/plans/sections?type=marketing")
      .then((r) => (r.ok ? r.json() : { sections: [] }))
      .then((d) => (Array.isArray(d.sections) ? (d.sections as PlanSection[]) : []))
      .catch(() => []);
  }
  return cache;
}

// Read-only view of some of a Marketing Plan section's answers, so the Social
// Planner shows the strategy instead of asking for it again. Editing happens
// in the Marketing Plan's Build tab.
export function PlanSectionSummary({
  sectionKey, questionIds, heading, emptyText, children,
}: {
  sectionKey: string;
  questionIds: string[];
  heading: string;
  emptyText: string;
  children?: ReactNode; // extra content under the answers
}) {
  const [section, setSection] = useState<PlanSection | null | undefined>(undefined);

  useEffect(() => {
    loadMarketingSections().then((all) => setSection(all.find((s) => s.key === sectionKey) || null));
  }, [sectionKey]);

  const answered = (section?.questions || []).filter((q) => questionIds.includes(q.id) && (section?.answers[q.id] || "").trim());
  const href = `/marketing-plan?section=${sectionKey}`;

  return (
    <section className="rounded-2xl border border-[#D4AF63]/40 bg-[#FAF8F3] p-4 dark:border-[#334060] dark:bg-[#1E2A48]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={cx.eyebrow}>From your Marketing Plan</p>
          <h3 className={cx.h3}>{heading}</h3>
        </div>
        <Link href={href} className={`${cx.btn} ${cx.secondary}`}>
          <Pencil className="h-3.5 w-3.5" /> Edit in Marketing Plan
        </Link>
      </div>
      {section === undefined ? (
        <p className={cx.muted}>Loading…</p>
      ) : answered.length === 0 ? (
        <p className={cx.body}>
          {emptyText}{" "}
          <Link href={href} className="underline">
            Answer it in your Marketing Plan
          </Link>
          .
        </p>
      ) : (
        <dl className="space-y-2">
          {answered.map((q) => (
            <div key={q.id}>
              <dt className={cx.muted}>{q.question}</dt>
              <dd className="whitespace-pre-wrap text-sm text-[#0F1A38] dark:text-[#FAF8F3]">{section!.answers[q.id]}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </section>
  );
}
