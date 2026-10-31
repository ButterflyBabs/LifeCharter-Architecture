"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import GuideSearch from "@/components/userGuide/GuideSearch";
import { askAssistant } from "@/lib/assistantPopout";
import type { GuideEntry } from "@/lib/userGuide/types";
import { guideCard } from "../guideStyles";

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`${guideCard} p-5`}>
      <h2 className="font-serif text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{title}</h2>
      <div className="mt-2 text-[#2E3A46] dark:text-[#d7dde5]">{children}</div>
    </section>
  );
}

export default function UserGuideEntry({ entry, related }: { entry: GuideEntry; related: { id: string; name: string }[] }) {
  // The assistant is closed during the assessment lock, to the Sales and consultant roles and to a restricted member.
  const [canAsk, setCanAsk] = useState(false);
  useEffect(() => {
    void fetch("/api/user-guide/opened", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: entry.id }) }).catch(() => {});
  }, [entry.id]);
  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCanAsk(Boolean(d) && !d.assessmentsLocked && !["sales", "consultant"].includes(d.teamRole) && !d.extras?.restrict))
      .catch(() => {});
  }, []);

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/user-guide" className="inline-flex items-center gap-1 text-sm font-medium text-[#0F5B63] dark:text-[#7fd0d6] hover:underline">
          <ArrowLeft aria-hidden className="h-4 w-4" /> User Guide
        </Link>
        <div className="w-full sm:w-80">
          <GuideSearch variant="header" />
        </div>
      </div>
      <h1 className="mt-4 font-serif text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] sm:text-4xl">{entry.name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-[#c9a227]/15 px-3 py-1 text-sm font-semibold text-[#7A5E1F] dark:text-[#e0c35a]">{entry.ai}</span>
        <Link href={entry.href} className="inline-flex items-center gap-1 rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3f66] dark:bg-[#c9a227] dark:text-[#1a2b4a]">
          Open {entry.name} <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
        <Part title="What it is"><p>{entry.what}</p></Part>
        <Part title="Where to find it"><p>{entry.where}</p></Part>
        <Part title="How AI is part of it">
          <p className="font-semibold">{entry.ai}</p>
          {entry.aiNote && <p className="mt-1">{entry.aiNote}</p>}
        </Part>
        <Part title="How it helps your business health"><p>{entry.health}</p></Part>
        <Part title="Using it day to day">
          <ol className="list-decimal space-y-1.5 pl-5">
            {entry.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </Part>
        {entry.sections?.map((s) => (
          <div key={s.id} id={s.id} className="scroll-mt-24">
            <Part title={s.title}><p>{s.body}</p></Part>
          </div>
        ))}
        {entry.tips.length > 0 && (
          <Part title="Tips">
            <ul className="list-disc space-y-1.5 pl-5">
              {entry.tips.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </Part>
        )}
        {entry.questions.length > 0 && (
          <Part title="Common questions">
            <dl className="space-y-3">
              {entry.questions.map((x) => (
                <div key={x.q}>
                  <dt className="font-semibold">{x.q}</dt>
                  <dd className="mt-0.5">{x.a}</dd>
                </div>
              ))}
            </dl>
          </Part>
        )}
        <Part title="Who sees it"><p>{entry.who}</p></Part>
        {related.length > 0 && (
          <Part title="Related">
            <ul className="flex flex-wrap gap-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link href={`/user-guide/${r.id}`} className="inline-block rounded-full border border-[#E6DDCB] dark:border-[#2F3B4A] px-3 py-1.5 text-sm hover:bg-[#c9a227]/10">{r.name}</Link>
                </li>
              ))}
            </ul>
          </Part>
        )}
      </div>

      {canAsk && (
        <button type="button" onClick={() => askAssistant(`I am reading the User Guide entry for ${entry.name}. What should I know about it for my business?`)} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#c9a227]/60 px-4 py-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#c9a227]/10">
          <Sparkles aria-hidden className="h-4 w-4 text-[#c9a227]" /> Ask my assistant
        </button>
      )}
    </div>
  );
}
