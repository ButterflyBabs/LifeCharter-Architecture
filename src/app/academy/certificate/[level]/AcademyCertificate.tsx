"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AcademyCertificate({ level, track }: { level: string; track: string }) {
  const [cert, setCert] = useState<{ name: string; level: string; earned: string } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch(`/api/academy?certificate=${level}&track=${track}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setCert)
      .catch(() => setFailed(true));
  }, [level, track]);
  if (failed) return <p className="px-4 py-8 text-[#5a6472] dark:text-[#b8c2cf] sm:px-6">This certificate opens once every lesson and the exam in this level are passed. <Link href="/academy" className="underline">Back to the Academy</Link></p>;
  if (!cert) return <p className="px-4 py-8 text-[#5a6472] dark:text-[#b8c2cf] sm:px-6">Loading…</p>;
  const date = new Date(cert.earned).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-wrap gap-3 print:hidden">
        <button type="button" onClick={() => window.print()} className="rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#24395f]">Print or save as PDF</button>
        <Link href="/academy" className="rounded-lg border border-[#E6DDCB] dark:border-[#2F3B4A] px-4 py-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Back to the Academy</Link>
      </div>
      <article className="rounded-2xl border-4 border-[#c9a227] bg-[#fffdf8] p-8 text-center text-[#1a2b4a] shadow-[0_10px_28px_rgba(31,43,58,0.12)] sm:p-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a6210]">LCCS Academy</p>
        <h1 className="mt-4 font-serif text-4xl font-bold sm:text-5xl">Certificate of Completion</h1>
        <p className="mt-8 text-lg">This certifies that</p>
        <p className="mt-2 font-serif text-3xl font-bold sm:text-4xl">{cert.name}</p>
        <p className="mt-6 text-lg">has completed the {cert.level} level of the LifeCharter Command Suite training.</p>
        <p className="mt-8 font-semibold">{date}</p>
        <p className="mt-8 text-xs text-[#5a6472]">A record of training completed in the Command Suite. Not a license or professional credential.</p>
      </article>
    </div>
  );
}
