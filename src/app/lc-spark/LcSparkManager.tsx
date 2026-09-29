"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Copy, Check, Plus, Trash2, AtSign, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Site { origin: string; label: string; enabled: boolean; bookingSlug?: string | null; brandColor?: string | null; knowledgeNote?: string | null }
interface Settings {
  enabled: boolean; public_key: string | null; assistant_name: string | null; greeting: string | null; knowledge: string | null; instructions: string | null; sites: Site[];
  ig_enabled: boolean; ig_user_id: string | null; ig_username: string | null; ig_token_expires_at: string | null; ig_connected: boolean;
  price_per_conversation_cents: number | null; monthly_conversation_cap: number | null;
}
interface Conv { id: string; channel: "web" | "instagram"; site_origin: string | null; contact_id: string | null; visitor_name: string | null; visitor_email: string | null; started_at: string; last_message_at: string; message_count: number; booked: boolean; billable: boolean; summary: string | null }
interface Stat { conversations: number; billable: number; messages: number; emails: number; booked: number }
interface Data {
  settings: Settings; igConfigured: boolean; calendars: { slug: string; name: string }[]; conversations: Conv[];
  usage: { thisMonth: Stat; lastMonth: Stat; days: { day: string; conversations: number; messages: number; emails: number; booked: number }[] };
}
type Act = (b: Record<string, unknown>) => Promise<boolean>;

const TABS = [
  ["conversations", "Conversations"],
  ["settings", "Settings"],
  ["websites", "Websites"],
  ["instagram", "Instagram"],
  ["usage", "Usage & billing"],
] as const;
type Tab = (typeof TABS)[number][0];

const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 p-2.5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";
const sel = "h-10 w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-2 text-sm";
const label = "block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-1";
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const host = (o: string | null) => (o || "").replace(/^https?:\/\//, "").replace(/^www\./, "");

export default function LcSparkManager() {
  const [d, setD] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>("conversations");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const x = await fetch("/api/spark", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (x?.settings) setD(x);
    else setMsg(x?.error || "Couldn't load LC Spark.");
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("tab");
    if (t && TABS.some(([k]) => k === t)) setTab(t as Tab);
    const ig = p.get("ig");
    if (ig) {
      setMsg(
        ({
          connected: "Instagram connected. LC Spark will answer new DMs while it's switched on.",
          "connected-no-webhook": "Instagram connected, but DM notifications couldn't be switched on. Try connecting again.",
          "not-set-up": "Instagram isn't set up yet (the Meta app keys aren't added).",
          expired: "That connect link expired. Please try again.",
          denied: "Please sign in as the account owner and try again.",
          canceled: "Instagram connect was canceled.",
          failed: "Instagram didn't connect. Please try again.",
        } as Record<string, string>)[ig] || ""
      );
      window.history.replaceState(null, "", "/lc-spark" + (t ? `?tab=${t}` : ""));
    }
    void load();
  }, [load]);

  const act: Act = useCallback(
    async (body) => {
      const r = await fetch("/api/spark", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const x = await r.json().catch(() => ({}));
      setMsg(r.ok ? x.message || "Saved." : x.error || "Something went wrong.");
      if (r.ok) await load();
      return r.ok;
    },
    [load]
  );

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a227] to-[#1a2b4a] flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-white" aria-hidden />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">LC Spark</h1>
          <p className="text-[#7a8a99]">Your AI assistant for leads: answers questions in your voice on your websites and Instagram, captures name + email into Contacts, and offers your booking link.</p>
        </div>
      </div>
      {d && (
        <p className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${d.settings.enabled ? "bg-[#2E7C83]/10 text-[#1F5E63]" : "bg-[#c9a227]/15 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
          <span className={`h-2 w-2 rounded-full ${d.settings.enabled ? "bg-[#2E7C83]" : "bg-[#c9a227]"}`} aria-hidden />
          {d.settings.enabled ? "LC Spark is on" : "LC Spark is off — switch it on in Settings"}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mb-5" role="tablist">
        {TABS.map(([k, name]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === k ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
            {name}
          </button>
        ))}
      </div>
      {msg && (
        <button onClick={() => setMsg("")} className="mb-4 block w-full text-left rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm" aria-live="polite">
          {msg}
        </button>
      )}
      {!d ? (
        <p className="text-sm text-[#7a8a99]">Loading…</p>
      ) : tab === "conversations" ? (
        <Conversations d={d} />
      ) : tab === "settings" ? (
        <SettingsTab key={d.settings.public_key ?? "s"} s={d.settings} act={act} />
      ) : tab === "websites" ? (
        <Websites d={d} act={act} />
      ) : tab === "instagram" ? (
        <InstagramTab d={d} act={act} />
      ) : (
        <Usage d={d} act={act} />
      )}
    </div>
  );
}

// ── Conversations ────────────────────────────────────────────────────────────
function Conversations({ d }: { d: Data }) {
  const [open, setOpen] = useState<string | null>(null);
  const [t, setT] = useState<{ role: string; content: string; created_at: string }[] | null>(null);
  const show = async (id: string) => {
    if (open === id) return setOpen(null);
    setOpen(id);
    setT(null);
    const x = await fetch(`/api/spark?conversation=${id}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    setT(x?.messages ?? []);
  };
  const name = d.settings.assistant_name || "LC Spark";
  if (!d.conversations.length) return <p className="text-sm text-[#7a8a99]">No conversations yet. Once LC Spark is on and added to a website (or Instagram is connected), every chat shows up here.</p>;
  return (
    <div className="space-y-2">
      {d.conversations.map((c) => (
        <div key={c.id} className="rounded-xl border border-[#1a2b4a]/10 text-sm">
          <button onClick={() => show(c.id)} aria-expanded={open === c.id} className="w-full text-left p-4 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                {c.visitor_name || c.visitor_email || "Visitor"}
                {c.visitor_name && c.visitor_email ? <span className="font-normal text-[#5a6472]"> · {c.visitor_email}</span> : null}
              </p>
              <p className="text-[#5a6472] truncate">{c.summary || "—"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-[#1a2b4a]/5 px-2.5 py-0.5">{c.channel === "instagram" ? "Instagram" : host(c.site_origin) || "Website"}</span>
              <span className="text-[#7a8a99]">{c.message_count} msgs</span>
              {c.booked && <span className="rounded-full bg-[#2E7C83]/10 px-2.5 py-0.5 text-[#1F5E63]">Booked</span>}
              <span className="text-[#7a8a99]">{when(c.started_at)}</span>
            </div>
          </button>
          {open === c.id && (
            <div className="border-t border-[#1a2b4a]/10 p-4 bg-[#F8F5F0] dark:bg-[#1a2b4a]/20 rounded-b-xl space-y-2">
              {c.contact_id && (
                <a href="/contacts" className="inline-flex items-center gap-1 text-[#2E7C83] underline text-xs">
                  Open in Contacts <ExternalLink className="w-3 h-3" aria-hidden />
                </a>
              )}
              {!t ? (
                <p className="text-[#7a8a99]">Loading…</p>
              ) : (
                t.map((m, i) => (
                  <p key={i} className={m.role === "visitor" ? "" : "pl-4 border-l-2 border-[#c9a227]"}>
                    <strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">{m.role === "visitor" ? c.visitor_name || "Visitor" : name}:</strong>{" "}
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  </p>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────
const KNOWLEDGE_PLACEHOLDER = `Everything LC Spark may say about your business. It will ONLY state facts written here.

WHO I HELP: e.g. women founders ready to...

OFFERS (name · who it's for · price · link):
- Next Chapter Call · free 30-min call to see if we're a fit · free · book with the booking link
- ...

FAQs:
- How long is the program? ...
- Do you offer payment plans? ...

LINKS: website, free resources, podcast...

DON'T SAY: e.g. don't promise results, don't discuss refunds (hand to the team).`;

function SettingsTab({ s, act }: { s: Settings; act: Act }) {
  const [f, setF] = useState({ enabled: s.enabled, assistant_name: s.assistant_name || "LC Spark", greeting: s.greeting || "", instructions: s.instructions || "", knowledge: s.knowledge || "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  return (
    <form
      className="space-y-5 max-w-3xl"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await act({ action: "save-settings", ...f });
        setBusy(false);
      }}
    >
      <label className="flex items-center gap-3 rounded-xl border border-[#c9a227]/40 p-4">
        <input type="checkbox" className="h-5 w-5 accent-[#1a2b4a]" checked={f.enabled} onChange={(e) => set("enabled", e.target.checked)} />
        <span>
          <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">LC Spark is {f.enabled ? "on" : "off"}</span>
          <span className="block text-sm text-[#7a8a99]">When off, the chat bubble disappears from your websites and Instagram DMs aren&rsquo;t answered.</span>
        </span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="sp-name">Assistant name</label>
          <Input id="sp-name" value={f.assistant_name} maxLength={60} onChange={(e) => set("assistant_name", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="sp-greet">Greeting (first message on your site)</label>
          <Input id="sp-greet" value={f.greeting} maxLength={500} placeholder="Hi! I'm here to help — what brings you here today?" onChange={(e) => set("greeting", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="sp-voice">Your voice (how it should sound)</label>
        <textarea id="sp-voice" className={field} rows={5} maxLength={3000} value={f.instructions} onChange={(e) => set("instructions", e.target.value)} placeholder="e.g. Warm, direct and encouraging. Short sentences. Speak like a trusted guide, never salesy. Use “you” a lot. Sign-off phrases I love: ..." />
      </div>
      <div>
        <label className={label} htmlFor="sp-know">Knowledge (the only facts it may state)</label>
        <textarea id="sp-know" className={`${field} font-mono`} rows={18} maxLength={12000} value={f.knowledge} onChange={(e) => set("knowledge", e.target.value)} placeholder={KNOWLEDGE_PLACEHOLDER} />
        <p className="mt-1 text-xs text-[#7a8a99]">{f.knowledge.length.toLocaleString()} / 12,000 characters. Anything not written here, it won&rsquo;t claim — it offers to have the team follow up instead.</p>
      </div>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button>
    </form>
  );
}

// ── Websites ────────────────────────────────────────────────────────────────
function Websites({ d, act }: { d: Data; act: Act }) {
  const [sites, setSites] = useState<Site[]>(d.settings.sites);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const snippet = `<script src="https://lccommandsuite.com/spark.js" data-key="${d.settings.public_key ?? ""}" defer></script>`;
  const upd = (i: number, p: Partial<Site>) => setSites((x) => x.map((s, j) => (j === i ? { ...s, ...p } : s)));
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#c9a227]/40 p-4">
        <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Embed code</p>
        <p className="text-sm text-[#7a8a99] mb-2">Paste this just before &lt;/body&gt; on every site listed below. The bubble only appears on sites listed here and switched on.</p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 break-all rounded-lg bg-[#1a2b4a]/5 p-2.5 text-xs">{snippet}</code>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(snippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* clipboard blocked */
              }
            }}
          >
            {copied ? <Check className="w-4 h-4 mr-1" aria-hidden /> : <Copy className="w-4 h-4 mr-1" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {sites.map((s, i) => (
        <div key={i} className="rounded-xl border border-[#1a2b4a]/10 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={label} htmlFor={`o${i}`}>Website address</label>
              <Input id={`o${i}`} value={s.origin} placeholder="amilynnecarroll.com" onChange={(e) => upd(i, { origin: e.target.value })} />
            </div>
            <div>
              <label className={label} htmlFor={`l${i}`}>Label</label>
              <Input id={`l${i}`} value={s.label} onChange={(e) => upd(i, { label: e.target.value })} />
            </div>
            <div>
              <label className={label} htmlFor={`b${i}`}>Booking calendar</label>
              <select id={`b${i}`} className={sel} value={s.bookingSlug || ""} onChange={(e) => upd(i, { bookingSlug: e.target.value || null })}>
                <option value="">No booking link</option>
                {d.calendars.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
                {s.bookingSlug && !d.calendars.some((c) => c.slug === s.bookingSlug) && <option value={s.bookingSlug}>{s.bookingSlug} (inactive)</option>}
              </select>
            </div>
          </div>
          <div>
            <label className={label} htmlFor={`k${i}`}>Note for this site (optional)</label>
            <textarea id={`k${i}`} className={field} rows={2} maxLength={2000} value={s.knowledgeNote || ""} placeholder="e.g. Visitors here are usually established business owners; lead with the Executive Consultation." onChange={(e) => upd(i, { knowledgeNote: e.target.value })} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-[#1a2b4a]" checked={s.enabled} onChange={(e) => upd(i, { enabled: e.target.checked })} /> Show the chat on this site
            </label>
            <label className="flex items-center gap-2">
              Bubble color
              <input type="color" aria-label="Bubble color" value={s.brandColor || "#0f1a38"} onChange={(e) => upd(i, { brandColor: e.target.value })} className="h-8 w-10 rounded border border-[#1a2b4a]/20" />
              {s.brandColor && <button type="button" className="text-xs underline text-[#7a8a99]" onClick={() => upd(i, { brandColor: null })}>Use default</button>}
            </label>
            <button type="button" onClick={() => setSites((x) => x.filter((_, j) => j !== i))} className="ml-auto inline-flex items-center gap-1 text-[#9b2c2c]">
              <Trash2 className="w-4 h-4" aria-hidden /> Remove
            </button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setSites((x) => [...x, { origin: "", label: "", enabled: true, bookingSlug: null }])}>
          <Plus className="w-4 h-4 mr-1" aria-hidden /> Add website
        </Button>
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await act({ action: "save-sites", sites });
            setBusy(false);
          }}
        >
          {busy ? "Saving…" : "Save websites"}
        </Button>
      </div>
    </div>
  );
}

// ── Instagram ───────────────────────────────────────────────────────────────
function InstagramTab({ d, act }: { d: Data; act: Act }) {
  const s = d.settings;
  if (!d.igConfigured) {
    return (
      <div className="rounded-xl border border-[#c9a227]/40 p-4 text-sm max-w-2xl">
        <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Instagram isn&rsquo;t set up yet</p>
        <p className="text-[#7a8a99] mt-1">The Suite&rsquo;s Meta app keys (SPARK_IG_APP_ID, SPARK_IG_APP_SECRET, SPARK_IG_VERIFY_TOKEN) need to be added before you can connect an Instagram professional account.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4 max-w-2xl text-sm">
      {s.ig_connected ? (
        <div className="rounded-xl border border-[#1a2b4a]/10 p-4 space-y-3">
          <p className="flex items-center gap-2 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
            <AtSign className="w-5 h-5" aria-hidden /> Connected as @{s.ig_username || s.ig_user_id}
          </p>
          {s.ig_token_expires_at && <p className="text-[#7a8a99]">Access renews automatically (current access good until {new Date(s.ig_token_expires_at).toLocaleDateString()}).</p>}
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-[#1a2b4a]" checked={s.ig_enabled} onChange={(e) => act({ action: "ig-toggle", enabled: e.target.checked })} /> Answer Instagram DMs with LC Spark
          </label>
          {!s.enabled && <p className="text-[#9b6b00]">LC Spark is off in Settings, so DMs won&rsquo;t be answered until it&rsquo;s on.</p>}
          <div className="flex gap-2">
            <a href="/api/spark/instagram/connect" className="inline-flex items-center rounded-full border-2 border-[#c9a227] px-4 py-1.5 text-[#1a2b4a] dark:text-[#F8F5F0]">Reconnect</a>
            <Button variant="ghost" size="sm" onClick={() => { if (confirm("Disconnect Instagram? LC Spark will stop answering DMs.")) void act({ action: "ig-disconnect" }); }}>Disconnect</Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1a2b4a]/10 p-4 space-y-3">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0]">Connect an Instagram professional (Business or Creator) account so LC Spark can answer DMs in your voice. Instagram doesn&rsquo;t share email addresses, so LC Spark asks for one when it helps.</p>
          <a href="/api/spark/instagram/connect" className="inline-flex items-center gap-2 rounded-full bg-[#1a2b4a] px-5 py-2.5 text-[#F8F5F0]">
            <AtSign className="w-4 h-4" aria-hidden /> Connect Instagram
          </a>
        </div>
      )}
    </div>
  );
}

// ── Usage & billing ─────────────────────────────────────────────────────────
function Usage({ d, act }: { d: Data; act: Act }) {
  const s = d.settings;
  const [price, setPrice] = useState(s.price_per_conversation_cents == null ? "" : (s.price_per_conversation_cents / 100).toFixed(2));
  const [cap, setCap] = useState(s.monthly_conversation_cap == null ? "" : String(s.monthly_conversation_cap));
  const cards = (t: string, x: Stat) => (
    <div className="rounded-xl border border-[#1a2b4a]/10 p-4">
      <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">{t}</p>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        {([["Billable conversations", x.billable], ["Messages", x.messages], ["Emails captured", x.emails], ["Booked", x.booked]] as const).map(([k, v]) => (
          <div key={k}>
            <dt className="text-[#7a8a99] text-xs">{k}</dt>
            <dd className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{v.toLocaleString()}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
  return (
    <div className="space-y-5 text-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        {cards("This month", d.usage.thisMonth)}
        {cards("Last month", d.usage.lastMonth)}
      </div>
      <div className="rounded-xl border border-[#c9a227]/40 p-4 space-y-3 max-w-2xl">
        <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Billing</p>
        <p className="text-[#7a8a99]">A conversation counts once a visitor sends their first message. Billing applies to client accounts; your own account isn&rsquo;t charged. Charging through Stripe comes later — for now usage is metered.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="sp-price">Price per conversation ($)</label>
            <Input id="sp-price" inputMode="decimal" value={price} placeholder="e.g. 0.50" onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="sp-cap">Monthly conversation cap</label>
            <Input id="sp-cap" inputMode="numeric" value={cap} placeholder="No cap" onChange={(e) => setCap(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-[#7a8a99]">After the cap, new visitors get a polite &ldquo;leave your email&rdquo; reply and no AI is used.</p>
        <Button
          onClick={() => {
            const p = price.trim() === "" ? null : Math.round(parseFloat(price) * 100);
            const c = cap.trim() === "" ? null : Number(cap);
            if ((p !== null && !Number.isFinite(p)) || (c !== null && !Number.isInteger(c))) return void act({ action: "save-billing", price_per_conversation_cents: "x" });
            void act({ action: "save-billing", price_per_conversation_cents: p, monthly_conversation_cap: c });
          }}
        >
          Save billing
        </Button>
        {s.price_per_conversation_cents != null && (
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0]">This month so far: {d.usage.thisMonth.billable} × ${(s.price_per_conversation_cents / 100).toFixed(2)} = <strong>${((d.usage.thisMonth.billable * s.price_per_conversation_cents) / 100).toFixed(2)}</strong></p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full max-w-2xl text-left">
          <caption className="text-left font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">This month by day</caption>
          <thead className="text-xs text-[#7a8a99]">
            <tr><th className="py-1 pr-4">Day</th><th className="py-1 pr-4">Conversations</th><th className="py-1 pr-4">Messages</th><th className="py-1 pr-4">Emails</th><th className="py-1">Booked</th></tr>
          </thead>
          <tbody>
            {d.usage.days.length ? (
              d.usage.days.map((r) => (
                <tr key={r.day} className="border-t border-[#1a2b4a]/10">
                  <td className="py-1.5 pr-4">{new Date(r.day + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td className="py-1.5 pr-4">{r.conversations}</td>
                  <td className="py-1.5 pr-4">{r.messages}</td>
                  <td className="py-1.5 pr-4">{r.emails}</td>
                  <td className="py-1.5">{r.booked}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="py-2 text-[#7a8a99]">No conversations yet this month.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
