"use client";

import { useEffect, useRef, useState } from "react";
import { PORTAL_FONTS, onAccent } from "@/lib/portalLook";
import type { PublicPage } from "@/lib/landingServer";

// One landing page (task 1153), shared by the public page (/go/<slug> and the owner's own domain) and the editor's
// preview. In preview nothing is counted, no pixel fires and the action buttons don't submit.

const SUITE = "https://lccommandsuite.com";
type Fbq = ((...a: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };

function visitorId(): string {
  try {
    let v = localStorage.getItem("lccs_v");
    if (!v) {
      v = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem("lccs_v", v);
    }
    return v;
  } catch {
    return "";
  }
}

function loadPixel(id: string) {
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (w.fbq) return;
  const n = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else (n.queue as unknown[]).push(args);
  } as Fbq;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  w.fbq = n;
  w._fbq = n;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  n("init", id);
  n("track", "PageView");
}
const track = (event: string) => {
  const f = (window as unknown as { fbq?: Fbq }).fbq;
  if (f) f("track", event);
};

const when = (iso: string, tz?: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz, timeZoneName: "short" });
const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export default function LandingView({ page, preview = false }: { page: PublicPage; preview?: boolean }) {
  const c = page.content;
  const look = page.look;
  const font = PORTAL_FONTS.find((f) => f.key === look.font) ?? PORTAL_FONTS[0];
  const ink = onAccent(look.accent);
  const [v, setV] = useState("");
  const [tz, setTz] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ text: string; link?: string | null } | null>(null);
  const [err, setErr] = useState("");
  const act = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || undefined);
    if (preview) return;
    const id = visitorId();
    setV(id);
    fetch(`/api/lp/${page.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "view", v: id }) }).catch(() => null);
    if (page.pixelId) loadPixel(page.pixelId);
    const onMsg = (e: MessageEvent) => {
      if (e.origin === SUITE && (e.data as { type?: string })?.type === "lccs-booked") track("Schedule");
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [page.id, page.pixelId, preview]);

  const post = async (body: Record<string, unknown>) => {
    const r = await fetch(`/api/lp/${page.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, v, _page: window.location.href, _ref: new URLSearchParams(window.location.search).get("ref") || undefined }) });
    return { ok: r.ok, d: await r.json().catch(() => ({})) };
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (preview) return setErr("This is a preview. Publish the page to take sign-ups.");
    setSending(true);
    setErr("");
    const fields = Object.fromEntries(new FormData(e.currentTarget).entries());
    const { ok, d } =
      page.template === "webinar"
        ? await post({ action: "register", ...fields, timezone: tz })
        : await post({ action: "submit", ...fields, _tz: tz });
    setSending(false);
    if (!ok) return setErr(d.error || "Something went wrong. Please try again.");
    track(page.template === "webinar" ? "CompleteRegistration" : "Lead");
    setDone({ text: (page.template === "optin" ? d.message : "") || c.thankYou || "Thank you!", link: d.challenge });
  }

  function buy(e: React.MouseEvent<HTMLAnchorElement>) {
    if (preview) {
      e.preventDefault();
      return setErr("This is a preview. Publish the page to send buyers to your payment link.");
    }
    track("InitiateCheckout");
    const body = JSON.stringify({ action: "click", v });
    try {
      navigator.sendBeacon(`/api/lp/${page.id}`, new Blob([body], { type: "application/json" }));
    } catch {
      fetch(`/api/lp/${page.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => null);
    }
  }

  const button = "inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold shadow-sm transition hover:opacity-90 disabled:opacity-60";
  const box = "mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] text-[#1F2B3A] outline-none focus:ring-2";
  const scrollToAct = () => act.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const paragraphs = (t: string) => t.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);

  // The part that does the page's job.
  const action = (() => {
    if (done)
      return (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-xl font-semibold" style={{ fontFamily: font.heading }}>{done.text}</p>
          {done.link && <a href={done.link} className={`${button} mt-4`} style={{ background: look.accent, color: ink }}>Open my challenge page</a>}
        </div>
      );
    if (page.template === "optin" || page.template === "webinar") {
      if (page.template === "webinar" && page.event && !page.event.open) return <p className="rounded-2xl bg-white p-6 text-center shadow-sm">{page.event.note}</p>;
      const fields =
        page.template === "optin"
          ? page.form?.fields ?? []
          : [
              { name: "firstName", label: "First name", required: true, type: "text" },
              { name: "email", label: "Email", required: true, type: "email" },
            ];
      if (!fields.length) return <p className="rounded-2xl bg-white p-6 text-center text-sm opacity-70 shadow-sm">{preview ? page.missing : "Sign-ups open soon."}</p>;
      return (
        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          {fields.map((f) => (
            <label key={f.name} className="block text-sm font-medium text-[#1F2B3A]">
              {f.label}
              {f.required && <span style={{ color: look.accent }}> *</span>}
              {f.type === "textarea" ? (
                <textarea name={f.name} required={f.required} rows={4} className={box} />
              ) : "options" in f && f.options?.length ? (
                <select name={f.name} required={f.required} defaultValue="" className={box}>
                  <option value="" disabled>Choose one</option>
                  {f.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input name={f.name} type={f.type || "text"} required={f.required} autoComplete={f.name === "email" ? "email" : f.name === "firstName" || f.name === "first_name" ? "given-name" : undefined} className={box} />
              )}
            </label>
          ))}
          <input name="_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          {err && <p className="text-sm text-[#8a2f2f]" role="alert">{err}</p>}
          <button disabled={sending} className={`${button} w-full`} style={{ background: look.accent, color: ink }}>{sending ? "Sending…" : c.cta}</button>
        </form>
      );
    }
    if (page.template === "sales") {
      return (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8">
          {page.offer && <p className="text-lg font-semibold" style={{ fontFamily: font.heading }}>{page.offer.name}</p>}
          {page.offer?.price != null && page.offer.price > 0 && (
            <p className="mt-1 text-3xl font-semibold">
              {page.offer.paymentCount && page.offer.paymentCount > 1 ? `${page.offer.paymentCount} payments of ${usd(page.offer.price / page.offer.paymentCount)}` : usd(page.offer.price)}
              {page.offer.billing === "monthly" && <span className="text-base font-normal opacity-70"> / month</span>}
            </p>
          )}
          {c.priceNote && <p className="mt-1 text-sm opacity-75">{c.priceNote}</p>}
          {page.buyUrl ? (
            <a href={page.buyUrl} onClick={buy} className={`${button} mt-5`} style={{ background: look.accent, color: ink }}>{c.cta}</a>
          ) : (
            <p className="mt-4 text-sm opacity-70">{preview ? page.missing : "Enrollment opens soon."}</p>
          )}
          {c.guarantee && <p className="mx-auto mt-4 max-w-md text-sm opacity-80">{c.guarantee}</p>}
          {err && <p className="mt-3 text-sm text-[#8a2f2f]">{err}</p>}
        </div>
      );
    }
    // Book a call
    if (!page.booking) return <p className="rounded-2xl bg-white p-6 text-center text-sm opacity-70 shadow-sm">{preview ? page.missing : "Booking opens soon."}</p>;
    const href = `${SUITE}/book/${page.booking.slug}?lp=${page.id}${v ? `&v=${v}` : ""}`;
    if (page.booking.paid || preview)
      return (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="opacity-80">{page.booking.name} · {page.booking.durationMin} minutes</p>
          <a href={preview ? "#" : href} onClick={(e) => preview && (e.preventDefault(), setErr("This is a preview. Publish the page to take bookings."))} className={`${button} mt-4`} style={{ background: look.accent, color: ink }}>{c.cta}</a>
          {preview && !page.booking.paid && <p className="mt-3 text-xs opacity-60">On the published page your open times show right here.</p>}
          {err && <p className="mt-3 text-sm text-[#8a2f2f]">{err}</p>}
        </div>
      );
    return <iframe title={page.booking.name} src={href} className="h-[1100px] w-full rounded-2xl border-0 bg-white shadow-sm" />;
  })();

  return (
    <main className="min-h-screen [color-scheme:light]" style={{ background: look.background, color: "#1F2B3A", fontFamily: font.body }}>
      <div className="h-1.5" style={{ background: look.accent }} />
      <div className="mx-auto max-w-3xl px-5 pb-16 pt-8 sm:px-8">
        {look.showLogo && (
          <div className="mb-8 flex items-center gap-3">
            {page.brand.logo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={page.brand.logo} alt="" className="h-11 w-11 rounded-full bg-white object-contain" />}
            <p className="text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: look.accent }}>{page.brand.name}</p>
          </div>
        )}

        <header className="text-center">
          {c.eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: look.accent }}>{c.eyebrow}</p>}
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl" style={{ fontFamily: font.heading }}>{c.headline}</h1>
          {c.subheadline && <p className="mx-auto mt-4 max-w-2xl text-lg opacity-80">{c.subheadline}</p>}
          {page.template === "webinar" && page.event && (
            <p className="mt-4 text-base font-semibold">
              {page.event.kind === "live" && page.event.startsAt
                ? `${when(page.event.startsAt, tz)} · ${page.event.durationMin} minutes`
                : `${page.event.days ?? ""}-day challenge${page.event.startsOn ? `, starts ${new Date(`${page.event.startsOn}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" })}` : ", starts the day after you join"}`}
              {page.event.host && <span className="font-normal opacity-75"> · with {page.event.host}</span>}
            </p>
          )}
          {page.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={page.image} alt="" className="mx-auto mt-8 max-h-[420px] w-full rounded-2xl object-cover" />}
          {page.template !== "booking" && !done && (
            <button type="button" onClick={scrollToAct} className={`${button} mt-8`} style={{ background: look.accent, color: ink }}>{c.cta}</button>
          )}
        </header>

        {c.body && <div className="mx-auto mt-12 max-w-2xl space-y-4 text-[17px] leading-relaxed">{paragraphs(c.body).map((x, i) => <p key={i} className="whitespace-pre-line">{x}</p>)}</div>}

        {c.bullets.length > 0 && (
          <section className="mx-auto mt-12 max-w-2xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            {c.bulletsTitle && <h2 className="text-2xl font-semibold" style={{ fontFamily: font.heading }}>{c.bulletsTitle}</h2>}
            <ul className="mt-4 space-y-3">
              {c.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-[16px]">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: look.accent }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div ref={act} className="mx-auto mt-12 max-w-2xl scroll-mt-6">{action}</div>

        {c.testimonials.length > 0 && (
          <section className="mt-14">
            <div className="grid gap-4 sm:grid-cols-2">
              {c.testimonials.map((t, i) => (
                <blockquote key={i} className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="text-[16px] leading-relaxed">“{t.quote}”</p>
                  {t.name && <footer className="mt-3 text-sm font-semibold" style={{ color: look.accent }}>{t.name}</footer>}
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {c.about && (
          <section className="mx-auto mt-14 max-w-2xl">
            {c.aboutTitle && <h2 className="text-2xl font-semibold" style={{ fontFamily: font.heading }}>{c.aboutTitle}</h2>}
            <div className="mt-3 space-y-3 text-[16px] leading-relaxed opacity-90">{paragraphs(c.about).map((x, i) => <p key={i}>{x}</p>)}</div>
          </section>
        )}

        {c.faq.length > 0 && (
          <section className="mx-auto mt-14 max-w-2xl">
            <h2 className="text-2xl font-semibold" style={{ fontFamily: font.heading }}>Questions</h2>
            <div className="mt-4 space-y-2">
              {c.faq.map((f, i) => (
                <details key={i} className="rounded-xl bg-white p-4 shadow-sm">
                  <summary className="cursor-pointer font-semibold">{f.q}</summary>
                  <p className="mt-2 whitespace-pre-line opacity-85">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {(c.closing || (page.template !== "booking" && !done && (c.testimonials.length || c.faq.length || c.about))) && (
          <section className="mt-14 text-center">
            {c.closing && <p className="text-xl font-semibold" style={{ fontFamily: font.heading }}>{c.closing}</p>}
            {page.template !== "booking" && !done && <button type="button" onClick={scrollToAct} className={`${button} mt-5`} style={{ background: look.accent, color: ink }}>{c.cta}</button>}
          </section>
        )}

        <footer className="pt-14 text-center text-xs opacity-50">Powered by LifeCharter Command Suite</footer>
      </div>
    </main>
  );
}
