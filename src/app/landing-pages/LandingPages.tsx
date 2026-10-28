"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { COLOR_PRESETS, PORTAL_FONTS } from "@/lib/portalLook";
import { rate, templateInfo, type Content, type Look, type Template } from "@/lib/landingPages";
import type { PublicPage } from "@/lib/landingServer";
import LandingView from "@/components/landing/LandingView";

// Clients & Sales › Landing Pages (task 1153).

type Stats = { views: number; conversions: number; views30: number; conversions30: number };
type Page = {
  id: string;
  template: Template;
  slug: string;
  name: string;
  status: "draft" | "published" | "archived";
  content: Content;
  look: Look;
  form_id: string | null;
  event_id: string | null;
  offer_id: string | null;
  calendar_id: string | null;
  button_url: string | null;
  pixel_id: string | null;
  image_path: string | null;
  updated_at: string;
  stats: Stats;
};
type Data = {
  templates: { key: Template; label: string; blurb: string; uses: string; conversion: string }[];
  brand: { name: string; logo: string | null };
  pages: Page[];
  forms: { id: string; name: string; active: boolean }[];
  events: { id: string; title: string; kind: string; status: string; starts_at: string | null }[];
  offers: { id: string; name: string; price: number | null; currency?: string; billing: string | null; link: string | null; status: string | null }[];
  calendars: { id: string; name: string; slug: string; active: boolean }[];
  testimonials: { name: string; quote: string }[];
  domain: string | null;
};

const SUITE = "https://lccommandsuite.com";
const input = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";
const btn = "rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50";
const primary = "rounded-md bg-[#2E7C83] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#256b71] disabled:opacity-50";

async function call(body: Record<string, unknown>) {
  const r = await fetch("/api/landing-pages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, d: await r.json().catch(() => ({})) };
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {help && <span className="mt-1 block text-xs text-muted-foreground">{help}</span>}
    </label>
  );
}

export default function LandingPages() {
  const [data, setData] = useState<Data | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async () => {
    const d = await fetch("/api/landing-pages", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (d?.pages) setData(d);
  }, []);
  useEffect(() => {
    load();
    const id = new URLSearchParams(window.location.search).get("page");
    if (id) setEditing(id);
  }, [load]);

  const urls = (slug: string) => ({ suite: `${SUITE}/go/${slug}`, own: data?.domain ? `https://${data.domain}/${slug}` : null });

  async function create(t: Template) {
    setBusy(true);
    const { ok, d } = await call({ action: "create", template: t, name: newName });
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: d.error || "Couldn't create the page." });
    setNewName("");
    await load();
    setEditing(d.id);
  }
  async function act(id: string, action: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    const { ok, d } = await call({ action, id });
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: d.error || "That didn't work." });
    if (action === "duplicate" && d.id) setEditing(d.id);
    if (action === "delete" && editing === id) setEditing(null);
    load();
  }
  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    setMsg({ ok: true, text: "Link copied." });
  };

  if (!data) return <div className="p-6 text-sm text-muted-foreground">Loading your landing pages…</div>;
  const page = editing ? data.pages.find((p) => p.id === editing) : null;
  if (page) return <Editor key={page.id} page={page} data={data} urls={urls(page.slug)} onBack={() => { setEditing(null); load(); }} onChanged={load} />;

  const list = data.pages.filter((p) => (showArchived ? p.status === "archived" : p.status !== "archived"));
  return (
    <div className="w-full space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Landing Pages</h1>
        <p className="text-sm text-muted-foreground">Simple, branded pages on your own forms, events, offers and booking pages. Your assistant can draft the words; you approve them.</p>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p>}

      <section className="rounded-2xl border border-border p-4">
        <p className="text-sm font-semibold">Make a new page</p>
        <input className={`${input} mt-2 max-w-md`} placeholder="Page name (for you), e.g. Free guide October" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.templates.map((t) => (
            <button key={t.key} disabled={busy} onClick={() => create(t.key)} className="rounded-xl border border-border p-4 text-left hover:border-[#2E7C83] hover:bg-muted disabled:opacity-50">
              <span className="block font-semibold">{t.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{t.blurb}</span>
              <span className="mt-2 block text-xs">Uses {t.uses}. Counts {t.conversion}.</span>
            </button>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{showArchived ? "Archived pages" : "Your pages"}</h2>
        <button className={btn} onClick={() => setShowArchived(!showArchived)}>{showArchived ? "Back to my pages" : "Archived"}</button>
      </div>
      {!list.length && <p className="text-sm text-muted-foreground">{showArchived ? "Nothing archived." : "No pages yet. Pick a template above to make your first one."}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((p) => {
          const u = urls(p.slug);
          const info = templateInfo(p.template);
          return (
            <div key={p.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{info.label}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === "published" ? "bg-emerald-100 text-emerald-800" : p.status === "archived" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-800"}`}>
                  {p.status === "published" ? "Live" : p.status === "archived" ? "Archived" : "Draft"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted p-2"><p className="text-lg font-semibold">{p.stats.views30}</p><p className="text-[11px] text-muted-foreground">visits (30 days)</p></div>
                <div className="rounded-lg bg-muted p-2"><p className="text-lg font-semibold">{p.stats.conversions30}</p><p className="text-[11px] text-muted-foreground">{info.conversion} (30 days)</p></div>
                <div className="rounded-lg bg-muted p-2"><p className="text-lg font-semibold">{rate(p.stats.views30, p.stats.conversions30)}%</p><p className="text-[11px] text-muted-foreground">rate</p></div>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">All time: {p.stats.views} visits, {p.stats.conversions} {info.conversion}, {rate(p.stats.views, p.stats.conversions)}%</p>
              {p.status === "published" && (
                <div className="mt-2 space-y-1 text-xs">
                  {[u.suite, u.own].filter(Boolean).map((x) => (
                    <div key={x} className="flex items-center gap-2">
                      <a href={x!} target="_blank" rel="noreferrer" className="truncate text-[#2E7C83] underline">{x}</a>
                      <button className="shrink-0 underline" onClick={() => copy(x!)}>Copy</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {p.status !== "archived" && <button className={primary} onClick={() => setEditing(p.id)}>Edit</button>}
                <a className={btn} href={`/go/${p.slug}?preview=1`} target="_blank" rel="noreferrer">Preview</a>
                {p.status === "draft" && <button className={btn} disabled={busy} onClick={() => act(p.id, "publish")}>Publish</button>}
                {p.status === "published" && <button className={btn} disabled={busy} onClick={() => act(p.id, "unpublish", "Take this page down? The link stops working until you publish again.")}>Unpublish</button>}
                <button className={btn} disabled={busy} onClick={() => act(p.id, "duplicate")}>Duplicate</button>
                {p.status !== "archived" && <button className={btn} disabled={busy} onClick={() => act(p.id, "archive", "Archive this page? It goes offline and moves to Archived.")}>Archive</button>}
                {p.status === "archived" && <button className={btn} disabled={busy} onClick={() => act(p.id, "restore")}>Restore as draft</button>}
                {p.status !== "published" && <button className={`${btn} text-red-700`} disabled={busy} onClick={() => act(p.id, "delete", "Delete this page and its numbers for good?")}>Delete</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const DRAFT_FIELDS: { key: keyof Content; label: string }[] = [
  { key: "eyebrow", label: "Small line above the headline" },
  { key: "headline", label: "Headline" },
  { key: "subheadline", label: "Under the headline" },
  { key: "body", label: "Main text" },
  { key: "bulletsTitle", label: "List title" },
  { key: "bullets", label: "List" },
  { key: "cta", label: "Button" },
  { key: "aboutTitle", label: "About title" },
  { key: "about", label: "About you" },
  { key: "faq", label: "Questions" },
  { key: "priceNote", label: "Price note" },
  { key: "guarantee", label: "Guarantee" },
  { key: "closing", label: "Closing line" },
  { key: "thankYou", label: "Thank-you message" },
];
const show = (v: unknown) => (Array.isArray(v) ? v.map((x) => (typeof x === "string" ? `• ${x}` : `${(x as { q: string }).q}\n${(x as { a: string }).a}`)).join("\n") : String(v ?? ""));

function Editor({ page, data, urls, onBack, onChanged }: { page: Page; data: Data; urls: { suite: string; own: string | null }; onBack: () => void; onChanged: () => void }) {
  const t = page.template;
  const info = templateInfo(t);
  const [name, setName] = useState(page.name);
  const [slug, setSlug] = useState(page.slug);
  const [c, setC] = useState<Content>(page.content);
  const [look, setLook] = useState<Look>(page.look);
  const [link, setLink] = useState({ formId: page.form_id || "", eventId: page.event_id || "", offerId: page.offer_id || "", calendarId: page.calendar_id || "", buttonUrl: page.button_url || "", pixelId: page.pixel_id || "" });
  const [status, setStatus] = useState(page.status);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [draft, setDraft] = useState<Content | null>(null);
  const [img, setImg] = useState(page.image_path ? `/api/lp/${page.id}/image?v=${Date.now()}` : null);

  const set = (patch: Partial<Content>) => {
    setC((x) => ({ ...x, ...patch }));
    setDirty(true);
  };
  const setL = (patch: Partial<typeof link>) => {
    setLink((x) => ({ ...x, ...patch }));
    setDirty(true);
  };

  async function save(): Promise<boolean> {
    setBusy("save");
    setMsg(null);
    const { ok, d } = await call({ action: "save", id: page.id, name, slug, content: c, look, ...link });
    setBusy("");
    if (!ok) {
      setMsg({ ok: false, text: d.error || "Couldn't save." });
      return false;
    }
    if (d.slug) setSlug(d.slug);
    setDirty(false);
    setMsg({ ok: true, text: "Saved." });
    onChanged();
    return true;
  }
  async function setLive(action: "publish" | "unpublish") {
    if (dirty && !(await save())) return;
    setBusy(action);
    const { ok, d } = await call({ action, id: page.id });
    setBusy("");
    if (!ok) return setMsg({ ok: false, text: d.error || "That didn't work." });
    setStatus(action === "publish" ? "published" : "draft");
    setMsg({ ok: true, text: action === "publish" ? "Your page is live." : "Your page is offline." });
    onChanged();
  }
  async function askDraft() {
    setBusy("draft");
    setMsg(null);
    const { ok, d } = await call({ action: "draft", id: page.id, notes, ...link });
    setBusy("");
    if (!ok) return setMsg({ ok: false, text: d.error || "The assistant couldn't write a draft." });
    setDraft(d.draft);
  }
  async function upload(file: File | null, remove = false) {
    const f = new FormData();
    f.set("id", page.id);
    if (remove) f.set("remove", "1");
    else if (file) f.set("file", file);
    else return;
    setBusy("image");
    const r = await fetch("/api/landing-pages/upload", { method: "POST", body: f });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) return setMsg({ ok: false, text: d.error || "The image didn't upload." });
    setImg(remove ? null : `/api/lp/${page.id}/image?v=${Date.now()}`);
  }

  // The live preview, built from what's on screen (Preview shows the exact page).
  const preview: PublicPage = useMemo(() => {
    const ev = data.events.find((e) => e.id === link.eventId);
    const of = data.offers.find((o) => o.id === link.offerId);
    const cal = data.calendars.find((x) => x.id === link.calendarId);
    const fm = data.forms.find((x) => x.id === link.formId);
    const buyUrl = t === "sales" ? link.buttonUrl || of?.link || null : null;
    const missing =
      t === "optin" && !fm ? "Choose one of your forms."
      : t === "webinar" && !ev ? "Choose one of your Events."
      : t === "sales" && !buyUrl ? "Choose an offer with a payment link, or paste a Buy link."
      : t === "booking" && !cal ? "Choose one of your booking pages."
      : null;
    return {
      id: page.id,
      template: t,
      slug,
      content: c,
      look,
      brand: data.brand,
      image: img,
      pixelId: null,
      form: fm ? { fields: [{ name: "first_name", label: "First name", required: true }, { name: "email", label: "Email", required: true, type: "email" }], submitLabel: null } : null,
      event: ev ? { kind: ev.kind, title: ev.title, host: data.brand.name, startsAt: ev.starts_at, durationMin: 60, timezone: "America/Denver", days: null, startsOn: null, open: true, note: null } : null,
      offer: of ? { name: of.name, price: of.price == null ? null : Number(of.price), currency: of.currency || "usd", billing: of.billing, paymentCount: null } : null,
      buyUrl,
      booking: cal ? { slug: cal.slug, name: cal.name, durationMin: 30, paid: false } : null,
      missing,
    };
  }, [c, look, link, data, img, page.id, slug, t]);

  const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button className="text-sm text-[#2E7C83] underline" onClick={() => (!dirty || window.confirm("Leave without saving your changes?")) && onBack()}>← All landing pages</button>
          <h1 className="mt-1 text-2xl font-semibold">{name || "Untitled page"}</h1>
          <p className="text-xs text-muted-foreground">{info.label} · {status === "published" ? "Live" : "Draft"}{dirty ? " · unsaved changes" : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={primary} disabled={!!busy} onClick={save}>{busy === "save" ? "Saving…" : "Save"}</button>
          <a className={btn} href={`/go/${slug}?preview=1`} target="_blank" rel="noreferrer">Preview</a>
          {status !== "published" ? (
            <button className={btn} disabled={!!busy} onClick={() => setLive("publish")}>Publish</button>
          ) : (
            <button className={btn} disabled={!!busy} onClick={() => setLive("unpublish")}>Unpublish</button>
          )}
        </div>
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p>}

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-border p-4">
            <p className="font-semibold">Basics</p>
            <Field label="Page name (only you see it)"><input className={input} value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} /></Field>
            <Field label="Web address" help={`${SUITE}/go/${slug}${data.domain ? ` and https://${data.domain}/${slug}` : ""}`}>
              <input className={input} value={slug} onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); setDirty(true); }} />
            </Field>
            {t === "optin" && (
              <Field label="Sign-up form" help="Sign-ups go through this form: its tags and campaign apply. Make or change forms in Contacts > Forms.">
                <select className={input} value={link.formId} onChange={(e) => setL({ formId: e.target.value })}>
                  <option value="">Choose a form</option>
                  {data.forms.map((f) => <option key={f.id} value={f.id}>{f.name}{f.active ? "" : " (turned off)"}</option>)}
                </select>
              </Field>
            )}
            {t === "webinar" && (
              <Field label="Event" help="People who save their seat are registered for this event and get its emails. Make events in Clients & Sales > Events.">
                <select className={input} value={link.eventId} onChange={(e) => setL({ eventId: e.target.value })}>
                  <option value="">Choose an event</option>
                  {data.events.map((e) => <option key={e.id} value={e.id}>{e.title}{e.status !== "published" ? " (not open for sign-ups yet)" : ""}</option>)}
                </select>
              </Field>
            )}
            {t === "sales" && (
              <>
                <Field label="Offer" help="The page shows the offer's name and price; Buy goes to the offer's payment link.">
                  <select className={input} value={link.offerId} onChange={(e) => setL({ offerId: e.target.value })}>
                    <option value="">Choose an offer</option>
                    {data.offers.map((o) => <option key={o.id} value={o.id}>{o.name}{o.link ? "" : " (no payment link yet)"}</option>)}
                  </select>
                </Field>
                <Field label="Buy link (optional)" help="Leave empty to use the offer's payment link. Paste another link to send buyers somewhere else."><input className={input} value={link.buttonUrl} placeholder="https://" onChange={(e) => setL({ buttonUrl: e.target.value })} /></Field>
              </>
            )}
            {t === "booking" && (
              <Field label="Booking page" help="Your open times show right on the page (paid booking pages show a button instead). Make booking pages in Calendars.">
                <select className={input} value={link.calendarId} onChange={(e) => setL({ calendarId: e.target.value })}>
                  <option value="">Choose a booking page</option>
                  {data.calendars.map((x) => <option key={x.id} value={x.id}>{x.name}{x.active ? "" : " (turned off)"}</option>)}
                </select>
              </Field>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-[#2E7C83]/40 bg-[#2E7C83]/5 p-4">
            <p className="font-semibold">Have my assistant draft the words</p>
            <p className="text-xs text-muted-foreground">Your assistant writes from your {info.uses} and anything you add here, using your own AI key. Nothing changes until you press Use on a part (then Save). It never makes up results or testimonials.</p>
            <textarea className={input} rows={3} placeholder="Optional: who it's for, what makes it different, the tone you want…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button className={primary} disabled={!!busy} onClick={askDraft}>{busy === "draft" ? "Writing… (about 30 seconds)" : "Draft the words"}</button>
            {draft && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">Draft ready</p>
                  <button className={primary} onClick={() => { set({ ...draft, testimonials: c.testimonials }); setDraft(null); setMsg({ ok: true, text: "Draft used. Press Save to keep it." }); }}>Use all</button>
                  <button className={btn} onClick={() => setDraft(null)}>Discard</button>
                </div>
                {DRAFT_FIELDS.filter((f) => show(draft[f.key]).trim() && show(draft[f.key]) !== show(c[f.key])).map((f) => (
                  <div key={f.key} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-muted-foreground">{f.label}</p>
                      <button className={btn} onClick={() => set({ [f.key]: draft[f.key] } as Partial<Content>)}>Use</button>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm">{show(draft[f.key])}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-border p-4">
            <p className="font-semibold">Words</p>
            <Field label="Small line above the headline (optional)"><input className={input} value={c.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
            <Field label="Headline"><input className={input} value={c.headline} onChange={(e) => set({ headline: e.target.value })} /></Field>
            <Field label="Under the headline"><textarea className={input} rows={2} value={c.subheadline} onChange={(e) => set({ subheadline: e.target.value })} /></Field>
            <Field label="Main text (optional)" help="Leave a blank line between paragraphs."><textarea className={input} rows={t === "sales" ? 8 : 4} value={c.body} onChange={(e) => set({ body: e.target.value })} /></Field>
            <Field label="List title"><input className={input} value={c.bulletsTitle} onChange={(e) => set({ bulletsTitle: e.target.value })} /></Field>
            <Field label="List (one per line)"><textarea className={input} rows={4} value={c.bullets.join("\n")} onChange={(e) => set({ bullets: lines(e.target.value) })} /></Field>
            <Field label="Button words"><input className={input} value={c.cta} onChange={(e) => set({ cta: e.target.value })} /></Field>
            {(t === "optin" || t === "webinar") && <Field label="Thank-you message" help={t === "optin" ? "Shown after they sign up (your form's own thank-you message is used if it has one)." : "Shown after they save their seat."}><input className={input} value={c.thankYou} onChange={(e) => set({ thankYou: e.target.value })} /></Field>}
            {t === "sales" && (
              <>
                <Field label="Price note (optional)" help="For example: Founding price until November 30."><input className={input} value={c.priceNote} onChange={(e) => set({ priceNote: e.target.value })} /></Field>
                <Field label="Guarantee (optional)"><textarea className={input} rows={2} value={c.guarantee} onChange={(e) => set({ guarantee: e.target.value })} /></Field>
              </>
            )}
            <Field label="About title"><input className={input} value={c.aboutTitle} onChange={(e) => set({ aboutTitle: e.target.value })} /></Field>
            <Field label="About you (optional)"><textarea className={input} rows={3} value={c.about} onChange={(e) => set({ about: e.target.value })} /></Field>
            <Field label="Closing line (optional)"><input className={input} value={c.closing} onChange={(e) => set({ closing: e.target.value })} /></Field>
          </section>

          <section className="space-y-3 rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Testimonials</p>
              <button className={btn} onClick={() => set({ testimonials: [...c.testimonials, { name: "", quote: "" }].slice(0, 6) })} disabled={c.testimonials.length >= 6}>Add one</button>
            </div>
            {data.testimonials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">From your Testimonials (shared with consent):</span>
                {data.testimonials.slice(0, 8).map((x, i) => (
                  <button key={i} className="rounded-full border border-border px-2.5 py-0.5 text-xs hover:bg-muted" disabled={c.testimonials.length >= 6 || c.testimonials.some((y) => y.quote === x.quote)} onClick={() => set({ testimonials: [...c.testimonials, x] })}>
                    + {x.name || "Client"}: {x.quote.slice(0, 40)}…
                  </button>
                ))}
              </div>
            )}
            {c.testimonials.map((x, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
                <input className={input} placeholder="First name" value={x.name} onChange={(e) => set({ testimonials: c.testimonials.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)) })} />
                <textarea className={input} rows={2} placeholder="What they said" value={x.quote} onChange={(e) => set({ testimonials: c.testimonials.map((y, j) => (j === i ? { ...y, quote: e.target.value } : y)) })} />
                <button className={btn} onClick={() => set({ testimonials: c.testimonials.filter((_, j) => j !== i) })}>Remove</button>
              </div>
            ))}
          </section>

          <section className="space-y-3 rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Questions (optional)</p>
              <button className={btn} onClick={() => set({ faq: [...c.faq, { q: "", a: "" }].slice(0, 10) })} disabled={c.faq.length >= 10}>Add a question</button>
            </div>
            {c.faq.map((x, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                <input className={input} placeholder="Question" value={x.q} onChange={(e) => set({ faq: c.faq.map((y, j) => (j === i ? { ...y, q: e.target.value } : y)) })} />
                <textarea className={input} rows={2} placeholder="Answer" value={x.a} onChange={(e) => set({ faq: c.faq.map((y, j) => (j === i ? { ...y, a: e.target.value } : y)) })} />
                <button className={btn} onClick={() => set({ faq: c.faq.filter((_, j) => j !== i) })}>Remove</button>
              </div>
            ))}
          </section>

          <section className="space-y-3 rounded-2xl border border-border p-4">
            <p className="font-semibold">Look</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((p) => (
                <button key={p.name} title={p.name} onClick={() => { setLook({ ...look, accent: p.accent, background: p.background }); setDirty(true); }} className={`h-8 w-8 rounded-full border-2 ${look.accent === p.accent ? "border-black" : "border-transparent"}`} style={{ background: p.accent }} />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Main color"><input type="color" className="h-9 w-full" value={look.accent} onChange={(e) => { setLook({ ...look, accent: e.target.value }); setDirty(true); }} /></Field>
              <Field label="Background"><input type="color" className="h-9 w-full" value={look.background} onChange={(e) => { setLook({ ...look, background: e.target.value }); setDirty(true); }} /></Field>
              <Field label="Font style">
                <select className={input} value={look.font} onChange={(e) => { setLook({ ...look, font: e.target.value as Look["font"] }); setDirty(true); }}>
                  {PORTAL_FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={look.showLogo} onChange={(e) => { setLook({ ...look, showLogo: e.target.checked }); setDirty(true); }} /> Show my business name and logo at the top</label>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">Main image</span>
              <label className={`${btn} cursor-pointer`}>
                {busy === "image" ? "Uploading…" : img ? "Replace" : "Add an image"}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => upload(e.target.files?.[0] ?? null)} />
              </label>
              {img && <button className={btn} onClick={() => upload(null, true)}>Remove</button>}
              <span className="text-xs text-muted-foreground">PNG, JPG, WebP or GIF, up to 5 MB.</span>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-border p-4">
            <p className="font-semibold">Ads tracking (optional)</p>
            <Field label="Your Meta pixel ID" help="Running Facebook or Instagram ads to this page? Paste your pixel ID from Meta Events Manager. The page then tells Meta about visits and each sign-up, registration, booking or Buy click. Visits and your rate are counted here either way.">
              <input className={input} inputMode="numeric" placeholder="e.g. 1234567890123456" value={link.pixelId} onChange={(e) => setL({ pixelId: e.target.value.replace(/[^0-9]/g, "") })} />
            </Field>
          </section>

          <div className="flex flex-wrap gap-2">
            <button className={primary} disabled={!!busy} onClick={save}>{busy === "save" ? "Saving…" : "Save"}</button>
            {status !== "published" && <button className={btn} disabled={!!busy} onClick={() => setLive("publish")}>Save and publish</button>}
          </div>
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live preview</p>
          <div className="max-h-[85vh] overflow-y-auto rounded-2xl border border-border shadow-sm">
            <LandingView page={preview} preview />
          </div>
        </div>
      </div>
    </div>
  );
}
