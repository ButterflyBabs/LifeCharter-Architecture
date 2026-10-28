"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Check, Clock, CreditCard, Globe, MapPin, Phone, User, Video } from "lucide-react";
import SlotPicker from "@/components/booking/SlotPicker";
import { formatMoney, type Currency } from "@/lib/currency";
import { OUTSIDE_LABEL, PROVINCES, isTaxPlace, taxCents, taxFor, type TaxPlace } from "@/lib/salesTax";

// Public booking page: lccommandsuite.com/book/<slug>. ?name=&email= prefill. A month calendar, then the times for the
// chosen day, then a short form. The house account's pages wear one of its brands (Command Suite, LifeCharter or
// AmiLynne); every client account's page stays neutral.
interface Q {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
}
interface Meta {
  name: string;
  description: string | null;
  duration: number;
  location: string;
  requirePhone?: boolean;
  questions: Q[];
  hostName: string | null;
  brand?: string;
  payment?: { amount: number; kind: "full" | "deposit"; currency?: Currency; tax?: boolean } | null;
  homeCurrency?: Currency;
  sms?: { consent: string } | null;
}

interface Theme {
  bar: string;
  accent: string;
  accentInk: string;
  tint: string;
  dot: string;
  line: string;
  ink: string;
  logo: string | null;
  powered: string | null;
}
// Colors from the Sept 2026 brand boards (brand/README.md).
const THEMES: Record<string, Theme> = {
  command_suite: { bar: "#D4AF63", accent: "#0F1A38", accentInk: "#FFFFFF", tint: "#E8E0D4", dot: "#D4AF63", line: "#E8E0D4", ink: "#0F1A38", logo: "/brand/command-suite-logo.png", powered: "LifeCharter Command Suite" },
  lifecharter: { bar: "#D4AF63", accent: "#0F5B63", accentInk: "#FFFFFF", tint: "#DDE9E7", dot: "#C76F56", line: "#EADFCF", ink: "#2E3A3F", logo: "/brand/lifecharter-logo.png", powered: "LifeCharter" },
  amilynne: { bar: "#D4AF63", accent: "#0F1A38", accentInk: "#FFFFFF", tint: "#E8E0D4", dot: "#D4AF63", line: "#E8E0D4", ink: "#0F1A38", logo: "/brand/amilynne-logo.png", powered: null },
  neutral: { bar: "#2E7C83", accent: "#2E7C83", accentInk: "#FFFFFF", tint: "#E6F1F1", dot: "#C76F56", line: "#EADFCF", ink: "#1F2B3A", logo: null, powered: null },
};
const serif = "'EB Garamond', Georgia, 'Times New Roman', serif";

/** The price in the calendar's own currency ("$150" in the account's home currency, "CA$150" / "US$150" otherwise). */
const money = (m: Meta) => formatMoney(m.payment?.amount ?? 0, m.payment?.currency ?? "usd", { home: m.homeCurrency ?? "usd" });
/** Any amount in the calendar's currency, with cents (the tax line and the total with tax). */
const moneyOf = (m: Meta, n: number) => formatMoney(n, m.payment?.currency ?? "usd", { home: m.homeCurrency ?? "usd", cents: true });

const inputCls = "mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-[15px] outline-none focus:ring-2";

export default function BookPage({ params }: { params: { slug: string } }) {
  const [tz, setTz] = useState("America/Denver");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [pick, setPick] = useState("");
  const [prefill, setPrefill] = useState({ name: "", email: "" });
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ start: string; manage: string } | null>(null);
  const [more, setMore] = useState(false);
  const [unpaid, setUnpaid] = useState(false);
  // GST/HST: where the booker is (asked only when the account charges it on a paid calendar).
  const [place, setPlace] = useState<TaxPlace | "">("");
  useEffect(() => setUnpaid(new URLSearchParams(window.location.search).get("unpaid") === "1"), []);
  // Shown inside a landing page (task 1153): tell the page how tall to make its frame.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get("lp") || window.parent === window) return;
    const send = () => window.parent.postMessage({ type: "lccs-height", h: document.documentElement.scrollHeight }, "*");
    const ro = new ResizeObserver(send);
    ro.observe(document.body);
    send();
    return () => ro.disconnect();
  }, []);
  const [now, setNow] = useState(() => new Date());
  // Hold the page invisible only until the calendar says which brand it wears (never longer than a moment).
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver");
    const q = new URLSearchParams(window.location.search);
    let saved: { name?: string; email?: string } = {};
    try { saved = JSON.parse(sessionStorage.getItem("bk_prefill") || "{}"); } catch {}
    setPrefill({ name: q.get("name") || saved.name || "", email: q.get("email") || saved.email || "" });
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const th = THEMES[meta?.brand ?? "neutral"] ?? THEMES.neutral;
  const zones = useMemo(() => {
    try {
      const all = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
      return all.includes(tz) ? all : [tz, ...all];
    } catch {
      return [tz];
    }
  }, [tz]);

  const dateLine = (s: string) => new Date(s).toLocaleDateString("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeLine = (s: string) => {
    const f = (d: Date) => d.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" });
    const a = new Date(s);
    return `${f(a)} – ${f(new Date(a.getTime() + (meta?.duration ?? 30) * 60_000))}`;
  };
  const where = meta?.location === "zoom" ? "Zoom (the link comes in your confirmation)" : meta?.location === "phone" ? "Phone call" : null;
  const LocIcon = meta?.location === "phone" ? Phone : Video;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setErr("");
    const f = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const answers = Object.fromEntries((meta?.questions ?? []).map((q) => [q.name, f[`q_${q.name}`] || ""]));
    const r = await fetch(`/api/book/${params.slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: pick, name: f.name, email: f.email, phone: f.phone, smsOk: f.sms_ok === "on", timezone: tz, answers, taxPlace: meta?.payment?.tax ? place || undefined : undefined, _hp: f._hp, _ref: new URLSearchParams(window.location.search).get("ref") || undefined }),
    });
    const d = await r.json().catch(() => ({}));
    setSending(false);
    if (r.ok && d.pay) {
      window.location.href = d.pay; // pay on the owner's own Stripe; the booking is confirmed when Stripe says it's paid
      return;
    }
    if (r.ok) {
      setDone({ start: pick, manage: d.manage });
      // Booked from a landing page (task 1153): count it there, and tell the page (for the owner's Meta pixel).
      const q = new URLSearchParams(window.location.search);
      const lp = q.get("lp");
      if (lp && /^[0-9a-f-]{36}$/i.test(lp)) {
        fetch(`/api/lp/${lp}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "booked", v: q.get("v") || undefined }) }).catch(() => null);
        try {
          window.parent?.postMessage({ type: "lccs-booked" }, "*");
        } catch {}
      }
    } else {
      setErr(d.error || "Something went wrong. Please try again.");
      if (r.status === 409) setPick("");
    }
  }

  const desc = meta?.description ?? "";
  const longDesc = desc.length > 260 || desc.split("\n").length > 4;
  const vars = {
    "--bk-accent": th.accent,
    "--bk-accent-ink": th.accentInk,
    "--bk-tint": th.tint,
    "--bk-dot": th.dot,
    "--bk-line": th.line,
    color: th.ink,
  } as React.CSSProperties;

  const Pill = ({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold" style={{ borderColor: th.line }}>
      <Icon className="h-4 w-4 opacity-70" /> {children}
    </span>
  );

  const Header = ({ compact }: { compact?: boolean }) => (
    <div className="text-center">
      {th.logo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={th.logo} alt="" className={`mx-auto w-auto ${compact ? "h-14" : "h-24 sm:h-28"}`} />}
      <h1 className={`mt-4 font-bold ${compact ? "text-3xl" : "text-4xl sm:text-5xl"}`} style={{ fontFamily: serif }}>{meta?.name || " "}</h1>
    </div>
  );

  return (
    <main className={`min-h-screen bg-white transition-opacity [color-scheme:light] ${meta || waited ? "opacity-100" : "opacity-0"}`} style={vars}>
      <div className="border-b py-2.5 text-center text-xs opacity-80" style={{ borderColor: th.line }} hidden={!th.powered}>
        Powered by {th.powered}
      </div>
      <div className="h-1.5" style={{ background: th.bar }} />

      <div className="mx-auto max-w-4xl px-5 pb-16 pt-10 sm:px-8">
        {done ? (
          <>
            <Header />
            <div className="mx-auto mt-10 max-w-xl rounded-2xl border p-6 sm:p-8" style={{ borderColor: th.line }}>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: th.tint, color: th.accent }}><Check className="h-5 w-5" /></span>
                <h2 className="text-2xl font-semibold" style={{ fontFamily: serif }}>You&rsquo;re booked</h2>
              </div>
              <p className="text-[15px] opacity-70">{dateLine(done.start)}</p>
              <p className="text-xl font-semibold">{timeLine(done.start)}</p>
              <p className="mt-1 flex items-center gap-2 text-sm opacity-70"><Globe className="h-4 w-4" /> {tz.replace(/_/g, " ")}</p>
              <div className="mt-4 space-y-2 border-t pt-4 text-[15px]" style={{ borderColor: th.line }}>
                <p className="flex items-center gap-3 font-semibold"><Clock className="h-4 w-4 opacity-70" /> {meta?.duration} minutes</p>
                {meta?.hostName && <p className="flex items-center gap-3"><User className="h-4 w-4 opacity-70" /> {meta.hostName}</p>}
                {where && <p className="flex items-center gap-3"><LocIcon className="h-4 w-4 opacity-70" /> {where}</p>}
              </div>
              <p className="mt-5 flex items-start gap-2 text-sm opacity-80"><CalendarCheck className="mt-0.5 h-4 w-4 shrink-0" /> A confirmation email and a calendar invitation are on their way.</p>
              <a href={done.manage} className="mt-4 inline-block text-sm font-semibold underline" style={{ color: th.accent }}>Reschedule or cancel</a>
            </div>
          </>
        ) : !pick ? (
          <>
            <Header />
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {meta && <Pill icon={Clock}>{meta.duration} minutes</Pill>}
              {meta?.hostName && <Pill icon={User}>{meta.hostName}</Pill>}
              {meta && where && <Pill icon={LocIcon}>{meta.location === "zoom" ? "Zoom" : "Phone"}</Pill>}
              {meta?.payment && <Pill icon={CreditCard}>{money(meta)}{meta.payment.kind === "deposit" ? " deposit" : ""}{meta.payment.tax ? " + GST/HST" : ""}</Pill>}
            </div>
            {unpaid && <p className="mx-auto mt-4 max-w-xl text-center text-sm text-[#8a2f2f]">Your payment wasn&apos;t finished, so that time wasn&apos;t booked. Please choose a time again.</p>}
            {desc && (
              <div className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed opacity-90">
                <p className={`whitespace-pre-line ${!more && longDesc ? "line-clamp-5" : ""}`}>{desc}</p>
                {longDesc && (
                  <button type="button" onClick={() => setMore((v) => !v)} className="mt-1 block w-full text-right text-sm font-semibold opacity-80 hover:opacity-100">
                    {more ? "see less" : "…see more"}
                  </button>
                )}
              </div>
            )}
            {err && <p className="mt-4 text-center text-sm text-[#8a2f2f]">{err}</p>}
            <div className="mt-8">
              <SlotPicker slug={params.slug} tz={tz} onPick={setPick} onMeta={(m) => setMeta(m as unknown as Meta)} />
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 border-t pt-5 text-sm" style={{ borderColor: th.line }}>
              <Globe className="h-4 w-4 opacity-70" />
              <label className="flex items-center gap-2">
                <span className="opacity-70">Time zone</span>
                <select value={tz} onChange={(e) => setTz(e.target.value)} className="max-w-[16rem] rounded-lg border bg-white px-2 py-1.5 font-semibold" style={{ borderColor: th.line }}>
                  {zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
                </select>
              </label>
              <span className="opacity-60">{now.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" })}</span>
            </div>
          </>
        ) : (
          <>
            <Header compact />
            <form onSubmit={submit} className="mx-auto mt-8 max-w-xl space-y-4">
              <div className="rounded-2xl border p-5" style={{ borderColor: th.line }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm opacity-70">{dateLine(pick)}</p>
                    <p className="text-lg font-semibold">{timeLine(pick)}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-sm opacity-70"><Globe className="h-4 w-4" /> {tz.replace(/_/g, " ")}</p>
                  </div>
                  <button type="button" onClick={() => setPick("")} className="text-sm font-semibold underline" style={{ color: th.accent }}>Change</button>
                </div>
                <div className="mt-3 space-y-1.5 border-t pt-3 text-sm" style={{ borderColor: th.line }}>
                  <p className="flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 opacity-70" /> {meta?.duration} minutes</p>
                  {meta?.hostName && <p className="flex items-center gap-2"><User className="h-4 w-4 opacity-70" /> {meta.hostName}</p>}
                  {where && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 opacity-70" /> {where}</p>}
                </div>
              </div>
              <label className="block text-sm font-semibold">Name *<input name="name" required defaultValue={prefill.name} autoComplete="name" className={inputCls} style={{ borderColor: th.line }} /></label>
              <label className="block text-sm font-semibold">Email *<input name="email" type="email" required defaultValue={prefill.email} autoComplete="email" className={inputCls} style={{ borderColor: th.line }} /></label>
              <label className="block text-sm font-semibold">Phone{meta?.location === "phone" || meta?.requirePhone ? " *" : ""}<input name="phone" type="tel" required={meta?.location === "phone" || Boolean(meta?.requirePhone)} autoComplete="tel" className={inputCls} style={{ borderColor: th.line }} /></label>
              {meta?.sms && (
                <label className="flex items-start gap-2.5 text-sm">
                  <input type="checkbox" name="sms_ok" className="mt-1 h-4 w-4 shrink-0" style={{ accentColor: th.accent }} />
                  <span className="opacity-80">{meta.sms.consent} <a href="/legal/text-messaging-terms" target="_blank" rel="noopener noreferrer" className="underline">Text Messaging Terms</a>.</span>
                </label>
              )}
              {(meta?.questions ?? []).map((q) => (
                <label key={q.name} className="block text-sm font-semibold">
                  {q.label}
                  {q.required ? " *" : ""}
                  {q.type === "textarea" ? (
                    <textarea name={`q_${q.name}`} required={q.required} rows={3} className={inputCls} style={{ borderColor: th.line }} />
                  ) : q.options?.length ? (
                    <select name={`q_${q.name}`} required={q.required} defaultValue="" className={inputCls} style={{ borderColor: th.line }}>
                      <option value="" disabled>Choose one</option>
                      {q.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input name={`q_${q.name}`} required={q.required} className={inputCls} style={{ borderColor: th.line }} />
                  )}
                </label>
              ))}
              <input name="_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              {err && <p className="text-sm text-[#8a2f2f]">{err}</p>}
              {meta?.payment?.tax && (() => {
                const t = isTaxPlace(place) ? taxFor(place) : null;
                const base = Math.round((meta.payment?.amount ?? 0) * 100);
                const tc = t ? taxCents(base, t.rate) : 0;
                return (
                  <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: th.line }}>
                    <label className="block font-semibold">
                      Where are you? *
                      <select value={place} required onChange={(e) => setPlace(e.target.value as TaxPlace | "")} className={inputCls} style={{ borderColor: th.line }}>
                        <option value="" disabled>Choose your province or territory</option>
                        {PROVINCES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                        <option value="OUTSIDE">{OUTSIDE_LABEL}</option>
                      </select>
                    </label>
                    <div className="mt-3 space-y-1">
                      <p className="flex justify-between"><span>{meta.payment?.kind === "deposit" ? "Deposit" : "Price"}</span><span>{moneyOf(meta, base / 100)}</span></p>
                      <p className="flex justify-between opacity-80"><span>{t ? (t.rate > 0 ? `${t.kind} ${t.rate}%` : "No GST/HST (outside Canada)") : "GST/HST"}</span><span>{t ? moneyOf(meta, tc / 100) : "Choose where you are"}</span></p>
                      {t && <p className="flex justify-between border-t pt-1 font-semibold" style={{ borderColor: th.line }}><span>Total</span><span>{moneyOf(meta, (base + tc) / 100)}</span></p>}
                    </div>
                  </div>
                );
              })()}
              {meta?.payment && <p className="text-center text-xs opacity-70">Your time is held for 30 minutes while you pay securely with Stripe.</p>}
              <button disabled={sending} className="w-full rounded-full px-6 py-3.5 text-base font-semibold disabled:opacity-60" style={{ background: th.accent, color: th.accentInk }}>
                {sending
                  ? "Booking…"
                  : meta?.payment
                    ? meta.payment.tax && isTaxPlace(place)
                      ? `Continue to pay ${moneyOf(meta, (Math.round(meta.payment.amount * 100) + taxCents(Math.round(meta.payment.amount * 100), taxFor(place).rate)) / 100)}${meta.payment.kind === "deposit" ? " deposit" : ""}`
                      : `Continue to pay ${money(meta)}${meta.payment.kind === "deposit" ? " deposit" : ""}${meta.payment.tax ? " + tax" : ""}`
                    : "Confirm booking"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
