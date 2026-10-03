"use client";

import { useEffect, useState } from "react";
import { ReviewText } from "@/components/website/ReviewText";
import WebsiteQuestion from "@/components/website/WebsiteQuestion";

type Review = { website: string; status: "published" | "in_progress" | "needs_website" | "none"; content: string | null; publishedAt: string | null; due: string | null };

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "");

// The client's Website Alignment Review: included with Command Suite, written for them within
// 14 days of enrolling, and emailed to them when it's ready.
export default function WebsiteReviewPage() {
  const [r, setR] = useState<Review | null>(null);
  const load = () => fetch("/api/website-review").then((x) => x.json()).then(setR).catch(() => setR(null));
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Included with Command Suite · written by our team, delivered within 14 days</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Website Alignment Review</h1>
        <p className="mt-2 text-[15px] text-[#5b5f73] dark:text-[#b8a898]">
          Your website, read against the positioning, voice and offer you&rsquo;re building here, with the five changes that matter most.
        </p>
      </header>

      {!r ? (
        <p className="text-sm text-[#7b6b8d]">Loading…</p>
      ) : r.status === "published" && r.content ? (
        <article className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
          <p className="mb-4 text-xs text-[#7b6b8d]">{[r.website, r.publishedAt ? `Delivered ${fmt(r.publishedAt)}` : ""].filter(Boolean).join(" · ")}</p>
          <ReviewText text={r.content} />
          <p className="mt-6 border-t border-[#1a2b4a]/10 pt-4 text-sm text-[#5b5f73] dark:border-white/10 dark:text-[#b8a898]">
            Questions, or want to talk it through? Write to <a className="text-[#2E7C83] underline" href="mailto:support@lccommandsuite.com">support@lccommandsuite.com</a>.
          </p>
        </article>
      ) : r.status === "in_progress" ? (
        <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
          <p className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Your Review is being written</p>
          <p className="mt-1 text-[15px] text-[#5b5f73] dark:text-[#b8a898]">
            We&rsquo;re reviewing <strong>{r.website}</strong>.{r.due ? ` Expect it by ${fmt(r.due)}.` : ""} We&rsquo;ll email you the moment it&rsquo;s ready, and it will appear right here.
          </p>
          <div className="mt-5">
            <WebsiteQuestion onSaved={load} />
          </div>
        </div>
      ) : (
        <WebsiteQuestion onSaved={load} />
      )}
    </div>
  );
}
