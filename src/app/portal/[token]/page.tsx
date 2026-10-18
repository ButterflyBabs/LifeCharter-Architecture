"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, CheckCircle2, Circle, FileText, Link2, Loader2, MessageCircle, Paperclip, Send, Target } from "lucide-react";
import { PORTAL_FONTS, onAccent, type SectionKey } from "@/lib/portalLook";
import ProgramCard, { type Program } from "./ProgramCard";

type Item = { id: string; title: string; body: string | null; url: string | null; fileName: string | null; hasFile: boolean; dueOn: string | null; status: string; doneAt: string | null; fromClient: boolean };
type View = {
  programs: Program[];
  brand: { name: string; logo: string | null };
  look: { accent: string; background: string; font: string; heading: string; banner: string | null; sections: { key: SectionKey; title: string; hidden: boolean }[] };
  client: { firstName: string | null };
  welcome: string | null;
  packages: { id: string; name: string; total: number; used: number; left: number; expiresOn: string | null; status: string }[];
  bookNow: { name: string; url: string }[];
  bookings: { id: string; name: string; start: string; end: string; meetingUrl: string | null }[];
  invoices: { id: string; description: string; amount: number; plan: string | null; dueDate: string | null; payUrl: string | null }[];
  recaps: { id: string; title: string; date: string; sections: { title: string; content: string }[]; commitments: { text: string; due: string | null }[] }[];
  homework: Item[];
  goals: Item[];
  resources: Item[];
  messages: { id: string; author: "owner" | "client"; body: string; created_at: string }[];
};

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d: string) => new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
const card = "rounded-2xl border border-[#E5DDCF] bg-white p-5";
const h2 = "mb-3 flex items-center gap-2 text-lg font-semibold text-[#1F2B3A] [font-family:var(--pf-heading)]";

// A client's private portal with the business they work with (task 1147). No account; the link is the key.
export default function PortalPage() {
  const { token } = useParams<{ token: string }>();
  const [v, setV] = useState<View | null>(null);
  const [bad, setBad] = useState(false);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/portal/${token}`, { cache: "no-store" });
    if (!r.ok) return setBad(true);
    setV(await r.json());
  }, [token]);
  useEffect(() => {
    void load();
  }, [load]);

  const post = async (body: Record<string, unknown>) => {
    setErr("");
    const r = await fetch(`/api/portal/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) setErr((await r.json().catch(() => ({}))).error || "That didn't save.");
    await load();
    return r.ok;
  };
  async function send() {
    if (!msg.trim()) return;
    setSending(true);
    if (await post({ action: "message", body: msg })) setMsg("");
    setSending(false);
  }
  async function upload(f: File | undefined) {
    if (!f) return;
    setSending(true);
    setErr("");
    const fd = new FormData();
    fd.append("file", f);
    const r = await fetch(`/api/portal/${token}/upload`, { method: "POST", body: fd });
    if (!r.ok) setErr((await r.json().catch(() => ({}))).error || "The file didn't upload.");
    if (fileRef.current) fileRef.current.value = "";
    setSending(false);
    await load();
  }

  if (bad)
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center text-[#1F2B3A]">
        <h1 className="mb-2 text-xl font-bold">This portal link isn&apos;t active</h1>
        <p className="text-[#56616E]">It may have been replaced with a new one. <a href="/portal" className="font-semibold text-[var(--pf-accent)] underline">Send me my current link</a>.</p>
      </main>
    );
  if (!v) return <main className="flex min-h-screen items-center justify-center text-[#56616E]"><Loader2 className="h-5 w-5 animate-spin" /></main>;

  const openHomework = v.homework.filter((h) => h.status !== "done");
  const doneHomework = v.homework.filter((h) => h.status === "done");
  const look = v.look;
  const title = (k: SectionKey) => look.sections.find((x) => x.key === k)?.title ?? k;
  const font = PORTAL_FONTS.find((f) => f.key === look.font) ?? PORTAL_FONTS[0];
  const ink = onAccent(look.accent);
  const blocks: Record<SectionKey, React.ReactNode> = {
    programs: v.programs.length ? (
          <section className={card}>
            <h2 className={h2}>{title("programs")}</h2>
            <div className="space-y-4">{v.programs.map((p) => <ProgramCard key={p.id} p={p} token={token} act={post} />)}</div>
          </section>
    ) : null,
    sessions: (
          <section className={card}>
            <h2 className={h2}><CalendarDays className="h-5 w-5 text-[var(--pf-accent)]" />{title("sessions")}</h2>
            {v.packages.filter((p) => p.status === "active").map((p) => (
              <div key={p.id} className="mb-4">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-[#56616E]">{p.left} of {p.total} left</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#E5DDCF]"><div className="h-full rounded-full bg-[var(--pf-accent)]" style={{ width: `${Math.min(100, (p.used / p.total) * 100)}%` }} /></div>
                {p.expiresOn && <p className="mt-1 text-xs text-[#56616E]">Use by {day(p.expiresOn)}</p>}
              </div>
            ))}
            {v.bookings.length ? (
              <ul className="space-y-2 text-sm">
                {v.bookings.map((b) => (
                  <li key={b.id} className="rounded-xl bg-[#FBF8F1] px-3 py-2">
                    <span className="font-semibold">{b.name}</span>
                    <span className="block text-[#56616E]">{when(b.start)}</span>
                    {b.meetingUrl && <a href={b.meetingUrl} className="text-xs font-semibold text-[var(--pf-accent)] underline">Join the meeting</a>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#56616E]">No upcoming sessions booked.</p>
            )}
            {v.bookNow.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {v.bookNow.map((c) => <a key={c.url} href={c.url} className="rounded-full bg-[var(--pf-accent)] px-4 py-2 text-sm font-semibold text-[var(--pf-on)] hover:opacity-90">Book {c.name}</a>)}
              </div>
            )}
          </section>
    ),
    homework: (
          <section className={card}>
            <h2 className={h2}><CheckCircle2 className="h-5 w-5 text-[var(--pf-accent)]" />{title("homework")}</h2>
            {!v.homework.length && <p className="text-sm text-[#56616E]">Nothing here yet.</p>}
            <ul className="space-y-2">
              {[...openHomework, ...doneHomework].map((h) => {
                const done = h.status === "done";
                return (
                  <li key={h.id} className="flex items-start gap-3">
                    <button type="button" onClick={() => void post({ action: "homework", id: h.id, done: !done })} aria-label={done ? `Mark "${h.title}" not done` : `Mark "${h.title}" done`} className="mt-0.5 text-[var(--pf-accent)]">
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </button>
                    <div className="min-w-0 text-sm">
                      <p className={done ? "text-[#56616E] line-through" : "font-semibold"}>{h.title}</p>
                      {h.body && <p className="whitespace-pre-wrap text-[#56616E]">{h.body}</p>}
                      {h.url && <a href={h.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[var(--pf-accent)] underline">Open the link</a>}
                      {h.dueOn && !done && <p className="text-xs text-[#56616E]">By {day(h.dueOn)}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
    ),
    pay: v.invoices.length > 0 ? (
            <section className={card}>
              <h2 className={h2}>{title("pay")}</h2>
              <ul className="space-y-2 text-sm">
                {v.invoices.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#FBF8F1] px-3 py-2">
                    <span><span className="font-semibold">{usd(i.amount)}</span> · {i.description}{i.plan ? ` · ${i.plan}` : i.dueDate ? ` · due ${day(i.dueDate)}` : ""}</span>
                    {i.payUrl && <a href={i.payUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[var(--pf-accent)] px-3 py-1 text-xs font-semibold text-[var(--pf-on)]">Pay securely</a>}
                  </li>
                ))}
              </ul>
            </section>
          
    ) : null,
    goals: v.goals.length > 0 ? (
            <section className={card}>
              <h2 className={h2}><Target className="h-5 w-5 text-[var(--pf-accent)]" />{title("goals")}</h2>
              <ul className="space-y-2 text-sm">
                {v.goals.map((g) => (
                  <li key={g.id}>
                    <p className="font-semibold">{g.title}{g.status === "achieved" ? " ✓" : ""}</p>
                    {g.body && <p className="whitespace-pre-wrap text-[#56616E]">{g.body}</p>}
                    {g.dueOn && g.status !== "achieved" && <p className="text-xs text-[#56616E]">By {day(g.dueOn)}</p>}
                  </li>
                ))}
              </ul>
            </section>
          
    ) : null,
    notes: v.recaps.length > 0 ? (
            <section className={card}>
              <h2 className={h2}><FileText className="h-5 w-5 text-[var(--pf-accent)]" />{title("notes")}</h2>
              <ul className="divide-y divide-[#E5DDCF]">
                {v.recaps.map((r) => (
                  <li key={r.id} className="py-2">
                    <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id} className="flex w-full items-baseline justify-between gap-2 text-left text-sm">
                      <span className="font-semibold">{r.title}</span>
                      <span className="text-[#56616E]">{day(r.date)}</span>
                    </button>
                    {open === r.id && (
                      <div className="mt-2 space-y-3 text-sm">
                        {r.sections.map((s) => (
                          <div key={s.title}><p className="font-semibold text-[var(--pf-accent)]">{s.title}</p><p className="whitespace-pre-wrap">{s.content}</p></div>
                        ))}
                        {r.commitments.length > 0 && (
                          <div><p className="font-semibold text-[var(--pf-accent)]">Commitments</p><ul className="list-disc pl-5">{r.commitments.map((c, i) => <li key={i}>{c.text}{c.due ? ` (by ${day(c.due)})` : ""}</li>)}</ul></div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          
    ) : null,
    files: (
          <section className={card}>
            <h2 className={h2}><Paperclip className="h-5 w-5 text-[var(--pf-accent)]" />{title("files")}</h2>
            {!v.resources.length && <p className="text-sm text-[#56616E]">Nothing shared yet.</p>}
            <ul className="space-y-2 text-sm">
              {v.resources.map((r) => (
                <li key={r.id} className="flex items-start gap-2">
                  {r.hasFile ? <Paperclip className="mt-0.5 h-4 w-4 text-[#56616E]" /> : <Link2 className="mt-0.5 h-4 w-4 text-[#56616E]" />}
                  <div className="min-w-0">
                    {r.hasFile ? <a href={`/api/portal/${token}/file?id=${r.id}`} className="font-semibold text-[var(--pf-accent)] underline">{r.title}</a> : r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold text-[var(--pf-accent)] underline">{r.title}</a> : <span className="font-semibold">{r.title}</span>}
                    {r.fromClient && <span className="ml-1 text-xs text-[#56616E]">(from you)</span>}
                    {r.body && <p className="whitespace-pre-wrap text-[#56616E]">{r.body}</p>}
                  </div>
                </li>
              ))}
            </ul>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--pf-accent)]">
              <input ref={fileRef} type="file" className="sr-only" onChange={(e) => void upload(e.target.files?.[0])} disabled={sending} />
              <Paperclip className="h-4 w-4" />Share a file with {v.brand.name}
            </label>
          </section>
    ),
    messages: (
          <section className={card}>
            <h2 className={h2}><MessageCircle className="h-5 w-5 text-[var(--pf-accent)]" />{title("messages")}</h2>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {!v.messages.length && <p className="text-sm text-[#56616E]">Send a note any time. It goes straight to {v.brand.name}.</p>}
              {v.messages.map((m) => (
                <div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.author === "client" ? "ml-auto bg-[var(--pf-accent)] text-[var(--pf-on)]" : "bg-[#F1ECE2]"}`}>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={`mt-0.5 text-[11px] ${m.author === "client" ? "opacity-80" : "text-[#56616E]"}`}>{new Date(m.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <label htmlFor="portal-msg" className="sr-only">Message</label>
              <textarea id="portal-msg" rows={2} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Write a message…" className="min-w-0 flex-1 rounded-xl border border-[#E5DDCF] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--pf-accent)]" />
              <button type="button" onClick={() => void send()} disabled={sending || !msg.trim()} aria-label="Send message" className="self-end rounded-full bg-[var(--pf-accent)] p-3 text-[var(--pf-on)] disabled:opacity-50"><Send className="h-4 w-4" /></button>
            </div>
          </section>
    ),
  };
  const shown = look.sections.filter((x) => !x.hidden && blocks[x.key]);

  return (
    <main
      className="min-h-screen text-[#1F2B3A] [font-family:var(--pf-body)]"
      style={{ background: look.background, ["--pf-accent" as string]: look.accent, ["--pf-on" as string]: ink, ["--pf-heading" as string]: font.heading, ["--pf-body" as string]: font.body } as React.CSSProperties}
    >
      <div className="h-1.5" style={{ background: look.accent }} />
      {look.banner && <div className="h-40 w-full bg-cover bg-center sm:h-56" style={{ backgroundImage: `url("${look.banner}")` }} />}
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-center gap-4">
          {v.brand.logo && <img src={v.brand.logo} alt="" className="h-14 w-14 rounded-full bg-white object-contain" />}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: look.accent }}>{v.brand.name}</p>
            <h1 className="text-3xl font-semibold [font-family:var(--pf-heading)]">{look.heading}</h1>
          </div>
        </header>
        {v.welcome && <p className="whitespace-pre-wrap rounded-2xl px-5 py-4 text-[15px]" style={{ background: `${look.accent}14` }}>{v.welcome}</p>}
        {err && <p className="text-sm text-[#8a2f2f]" role="alert">{err}</p>}

        <div className="grid gap-5 lg:grid-cols-2">
          {shown.map((x) => <div key={x.key} className={`min-w-0 [&>section]:h-full ${x.key === "programs" ? "lg:col-span-2" : ""}`}>{blocks[x.key]}</div>)}
        </div>
        <footer className="pt-4 text-center text-xs text-[#9aa3ad]">This page is private to you. Powered by LifeCharter Command Suite.</footer>
      </div>
    </main>
  );
}
