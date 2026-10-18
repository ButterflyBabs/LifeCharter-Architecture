"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Circle, Loader2, Lock } from "lucide-react";

type Day = { day: number; open: boolean; title: string; body: string | null; videoUrl: string | null; url: string | null; action: string | null; done: boolean };
type Data = { brand: { name: string; logo: string | null }; event: { title: string; subtitle: string | null; host: string; accent: string | null; days: number; start: string | null }; firstName: string | null; today: number; days: Day[] };

// A person's private challenge page (task 1149): each day opens on its date; tick it off when done.
export default function ChallengePage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const [d, setD] = useState<Data | null>(null);
  const [bad, setBad] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const load = useCallback(async () => {
    const r = await fetch(`/api/e/${slug}/c/${token}`, { cache: "no-store" });
    if (!r.ok) return setBad(true);
    const j = (await r.json()) as Data;
    setD(j);
    setOpen((o) => o ?? (j.today >= 1 ? Math.min(j.today, j.event.days) : null));
  }, [slug, token]);
  useEffect(() => {
    void load();
  }, [load]);
  async function tick(day: number, done: boolean) {
    await fetch(`/api/e/${slug}/c/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ day, done }) });
    await load();
  }
  if (bad) return <main className="mx-auto max-w-xl px-4 py-16 text-center text-[#1F2B3A]"><h1 className="mb-2 text-xl font-bold">This link isn&apos;t active</h1><p className="text-[#56616E]">Please use the link in your challenge emails.</p></main>;
  if (!d) return <main className="flex min-h-screen items-center justify-center text-[#56616E]"><Loader2 className="h-5 w-5 animate-spin" /></main>;
  const accent = d.event.accent && /^#[0-9a-fA-F]{6}$/.test(d.event.accent) ? d.event.accent : "#2E7C83";
  const doneCount = d.days.filter((x) => x.done).length;
  return (
    <main className="min-h-screen bg-[#FBF8F1] text-[#1F2B3A]">
      <div className="h-1.5" style={{ background: accent }} />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>{d.event.host}</p>
          <h1 className="text-3xl font-semibold" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>{d.event.title}</h1>
          <p className="mt-1 text-sm text-[#56616E]">{d.firstName ? `${d.firstName}, ` : ""}{d.today < 1 ? `your challenge starts ${d.event.start ? new Date(`${d.event.start}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "soon"}.` : `${doneCount} of ${d.event.days} days done.`}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5DDCF]"><div className="h-full rounded-full" style={{ width: `${(doneCount / Math.max(1, d.event.days)) * 100}%`, background: accent }} /></div>
        </header>
        <ul className="space-y-2">
          {d.days.map((x) => (
            <li key={x.day} className="rounded-2xl border border-[#E5DDCF] bg-white">
              {x.open ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button type="button" onClick={() => void tick(x.day, !x.done)} aria-label={x.done ? `Mark day ${x.day} not done` : `Mark day ${x.day} done`} style={{ color: accent }}>{x.done ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}</button>
                    <button type="button" onClick={() => setOpen(open === x.day ? null : x.day)} aria-expanded={open === x.day} className="flex-1 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>Day {x.day}</span>
                      <span className={`block font-semibold ${x.done ? "text-[#56616E] line-through" : ""}`}>{x.title}</span>
                    </button>
                  </div>
                  {open === x.day && (
                    <div className="space-y-3 border-t border-[#E5DDCF] px-4 py-3 text-[15px]">
                      {x.body && <p className="whitespace-pre-wrap leading-relaxed">{x.body}</p>}
                      {x.action && <p className="rounded-xl bg-[#FBF8F1] px-3 py-2"><strong>Today&apos;s step:</strong> {x.action}</p>}
                      <div className="flex flex-wrap gap-3 text-sm font-semibold">
                        {x.videoUrl && <a href={x.videoUrl} target="_blank" rel="noreferrer" className="underline" style={{ color: accent }}>Watch today&apos;s video</a>}
                        {x.url && <a href={x.url} target="_blank" rel="noreferrer" className="underline" style={{ color: accent }}>Open the link</a>}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="flex items-center gap-3 px-4 py-3 text-[#56616E]"><Lock className="h-5 w-5 shrink-0" /><span><span className="text-xs font-semibold uppercase tracking-wide">Day {x.day}</span><span className="block">Opens {d.event.start ? new Date(Date.parse(`${d.event.start}T12:00:00`) + (x.day - 1) * 86_400_000).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "soon"}</span></span></p>
              )}
            </li>
          ))}
        </ul>
        <p className="pt-4 text-center text-xs text-[#9aa3ad]">This page is private to you. Powered by LifeCharter Command Suite.</p>
      </div>
    </main>
  );
}
