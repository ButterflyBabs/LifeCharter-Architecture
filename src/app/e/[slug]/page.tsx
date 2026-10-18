"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, Clock, Loader2, Sparkles } from "lucide-react";

type Data = {
  brand: { name: string; logo: string | null };
  event: { kind: "live" | "challenge"; title: string; subtitle: string | null; description: string | null; host: string; accent: string | null; startsAt: string | null; durationMin: number; timezone: string; days: number | null; startsOn: string | null; status: string; full: boolean; past: boolean };
};

const onAccent = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.62 ? "#1F2B3A" : "#FFFFFF";
};

// A public event sign-up page (task 1149), in the account's own name and accent color.
export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const [d, setD] = useState<Data | null>(null);
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ challenge: string | null } | null>(null);
  const [tz, setTz] = useState("America/Denver");
  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver");
    fetch(`/api/e/${slug}`, { cache: "no-store" })
      .then(async (r) => (r.ok ? setD(await r.json()) : setBad(true)))
      .catch(() => setBad(true));
  }, [slug]);

  async function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setBusy(true);
    setErr("");
    const f = Object.fromEntries(new FormData(ev.currentTarget).entries()) as Record<string, string>;
    const r = await fetch(`/api/e/${slug}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, timezone: tz }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "That didn't work. Please try again.");
    setDone({ challenge: j.challenge ?? null });
  }

  if (bad) return <main className="mx-auto max-w-xl px-4 py-16 text-center text-[#1F2B3A]"><h1 className="mb-2 text-xl font-bold">This event isn&apos;t available</h1><p className="text-[#56616E]">Please check the link you were given.</p></main>;
  if (!d) return <main className="flex min-h-screen items-center justify-center text-[#56616E]"><Loader2 className="h-5 w-5 animate-spin" /></main>;
  const e = d.event;
  const accent = e.accent && /^#[0-9a-fA-F]{6}$/.test(e.accent) ? e.accent : "#2E7C83";
  const ink = onAccent(accent);
  const when = e.startsAt ? new Date(e.startsAt).toLocaleString("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }) : null;
  const closed = e.status !== "published" || e.full || e.past;

  return (
    <main className="min-h-screen bg-[#FBF8F1] text-[#1F2B3A]">
      <div className="h-1.5" style={{ background: accent }} />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0">
          <div className="flex items-center gap-3">
            {d.brand.logo && <img src={d.brand.logo} alt="" className="h-10 w-10 rounded-full bg-white object-contain" />}
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>{e.host}</p>
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-tight" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>{e.title}</h1>
          {e.subtitle && <p className="mt-2 text-lg text-[#3d4652]">{e.subtitle}</p>}
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {e.kind === "live" && when && <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm"><CalendarDays className="h-4 w-4" style={{ color: accent }} />{when}</span>}
            {e.kind === "live" && <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm"><Clock className="h-4 w-4" style={{ color: accent }} />{e.durationMin} minutes · online</span>}
            {e.kind === "challenge" && <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm"><Sparkles className="h-4 w-4" style={{ color: accent }} />{e.days}-day challenge{e.startsOn ? ` · starts ${new Date(`${e.startsOn}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })}` : " · starts the day after you join"}</span>}
          </div>
          {e.description && <div className="mt-6 whitespace-pre-wrap text-[16px] leading-relaxed text-[#2E3A46]">{e.description}</div>}
        </section>
        <aside className="h-fit rounded-2xl border border-[#E5DDCF] bg-white p-6 shadow-sm">
          {done ? (
            <div role="status">
              <h2 className="text-xl font-semibold">You&apos;re in!</h2>
              <p className="mt-2 text-sm text-[#56616E]">{e.kind === "live" ? "Your confirmation is on its way by email, with the join link and a way to add it to your calendar." : "Your welcome email is on its way. Day 1 comes by email, and every day also opens on your challenge page."}</p>
              {done.challenge && <a href={done.challenge} className="mt-4 inline-block rounded-full px-5 py-2.5 text-sm font-semibold" style={{ background: accent, color: ink }}>Open my challenge page</a>}
            </div>
          ) : closed ? (
            <div><h2 className="text-xl font-semibold">{e.past ? "This event has happened" : e.full ? "This event is full" : "Registration is closed"}</h2><p className="mt-2 text-sm text-[#56616E]">Thank you for your interest.</p></div>
          ) : (
            <form onSubmit={(ev) => void submit(ev)} className="space-y-3">
              <h2 className="text-xl font-semibold">{e.kind === "live" ? "Save your seat" : "Join the challenge"}</h2>
              <label className="block text-sm font-semibold">First name<input name="firstName" required autoComplete="given-name" className="mt-1 w-full rounded-xl border border-[#E5DDCF] px-3 py-2.5 outline-none focus:ring-2" /></label>
              <label className="block text-sm font-semibold">Last name<input name="lastName" autoComplete="family-name" className="mt-1 w-full rounded-xl border border-[#E5DDCF] px-3 py-2.5 outline-none focus:ring-2" /></label>
              <label className="block text-sm font-semibold">Email<input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-xl border border-[#E5DDCF] px-3 py-2.5 outline-none focus:ring-2" /></label>
              <input name="_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              {err && <p className="text-sm text-[#8a2f2f]" role="alert">{err}</p>}
              <button disabled={busy} className="w-full rounded-full px-5 py-3 font-semibold disabled:opacity-60" style={{ background: accent, color: ink }}>{busy ? "Saving…" : e.kind === "live" ? "Register free" : "Join free"}</button>
              <p className="text-center text-xs text-[#9aa3ad]">We&apos;ll email you about this {e.kind === "live" ? "event" : "challenge"}. Unsubscribe any time.</p>
            </form>
          )}
        </aside>
      </div>
      <p className="pb-8 text-center text-xs text-[#9aa3ad]">Powered by LifeCharter Command Suite</p>
    </main>
  );
}
