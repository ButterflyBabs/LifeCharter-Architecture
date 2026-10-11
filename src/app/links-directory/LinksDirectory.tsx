"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Search } from "lucide-react";

const APP = "https://lccommandsuite.com";
const SITE = "https://www.amilynnecarroll.com";

interface Row { name: string; url: string; note?: string; status?: string }
interface Offer { id: string; name: string; price: string | number | null; billing: string | null; status: string | null; link: string | null; format: string | null }
interface Form { id: string; key: string; name: string; active: boolean; tags: string[] | null; sequence_key: string | null; description: string | null }
interface Calendar { id: string; slug: string; name: string; active: boolean; duration_min: number | null; description: string | null }
interface Short { code: string; title: string | null; destination_url: string; active: boolean; click_count: number | null }

// Pages that are not stored as data: the landing sites, the website's offering pages and the always-public app pages.
const OFFERING_PAGES: Row[] = [
  { name: "LifeCharter Command Suite: choose a plan and check out", url: `${APP}/get-started`, note: "Starter, Growth, VIP" },
  { name: "MasterClass: landing page", url: "https://start.lccommandsuite.com/masterclass" },
  { name: "MasterClass: sign up (picks the next session)", url: `${APP}/masterclass-signup` },
  { name: "Executive Business Assessment (free)", url: "https://start.lccommandsuite.com/assessment" },
  { name: "Command Shift 21-Day Challenge: landing page", url: "https://shift.lccommandsuite.com/" },
  { name: "Command Shift 21-Day Challenge: the app", url: "https://challenge.lccommandsuite.com/" },
  { name: "Coaching Certification portal", url: `${APP}/certificationportal/` },
  { name: "The LifeCharter Collective (public page)", url: `${APP}/collective` },
  { name: "The LifeCharter Collective: sign in", url: `${APP}/community/sign-in` },
  { name: "LifeCharter Program (on the website)", url: `${SITE}/life-charter` },
  { name: "LifeCharter Program app", url: "https://lifecharter.life/app" },
  { name: "LifeCharter Incubator", url: `${SITE}/lifecharterincubator` },
  { name: "Life by Design Summit (April 15 to 17, 2027)", url: `${SITE}/life-by-design-summit`, note: "free; the registration form saves to Contacts" },
  { name: "Life by Design Summit: Integration Pass, early price (through April 14)", url: "https://buy.stripe.com/7sY5kEgAn8cHh0a02e4ow0e", note: "$197; not on the page or in emails until the Stripe logo is added" },
  { name: "Life by Design Summit: Integration Pass, live event price (from April 15)", url: "https://buy.stripe.com/fZu5kEck778DbFQ8yK4ow0f", note: "$297" },
  { name: "LifeCharter Circle: Early Adapter Special", url: "https://buy.stripe.com/28E7sM1Ft1Oj9xI8yK4ow0d", note: "$497; also listed under Offers" },
  { name: "LC Fledge (social posting): sign in", url: "https://fledge.lccommandsuite.com", note: "the app formerly called LC Beacon" },
  { name: "The Life Shift 21-Day Challenge (on the website)", url: `${SITE}/21-day-challenge` },
  { name: "SOUL Sessions", url: `${SITE}/soul-sessions` },
  { name: "Digital Planners", url: `${SITE}/planners` },
  { name: "Speaking", url: `${SITE}/speaking` },
  { name: "AmiLynne Speaks", url: `${SITE}/amilynne-speaks` },
  { name: "Conversations of Consequence", url: `${SITE}/conversations-of-consequence` },
  { name: "Eva Mae Foundation", url: "https://www.evamaefoundation.org" },
];

const OTHER_FORMS: Row[] = [
  { name: "Executive Consultation questionnaire (website build)", url: `${APP}/schedule/website` },
  { name: "MasterClass questionnaire", url: `${APP}/schedule/masterclass` },
  { name: "MasterClass registration", url: `${APP}/masterclass-signup` },
  { name: "Executive Business Assessment (landing site)", url: "https://start.lccommandsuite.com/assessment" },
  { name: "Command Shift Challenge registration (landing site)", url: "https://shift.lccommandsuite.com/" },
  { name: "Review collection", url: `${APP}/reviews/collect` },
  { name: "Sign in", url: `${APP}/login` },
  { name: "Forgot or set your password", url: `${APP}/forgot-password` },
  { name: "Contact (amilynnecarroll.com)", url: `${SITE}/contact-us` },
  { name: "Collective sign in", url: `${APP}/community/sign-in` },
];

const LEGAL: Row[] = [
  { name: "Privacy Policy", url: `${APP}/legal/privacy-policy` },
  { name: "Terms of Sale & Service Agreement", url: `${APP}/legal/terms-of-sale` },
  { name: "Year-1 Commitment Acknowledgment", url: `${APP}/legal/year-1-agreement` },
  { name: "Community Guidelines", url: `${APP}/legal/community-guidelines` },
  { name: "LC Fledge: Privacy Policy", url: "https://fledge.lccommandsuite.com/legal/privacy" },
  { name: "LC Fledge: Terms", url: "https://fledge.lccommandsuite.com/legal/terms" },
  { name: "LC Fledge: Data deletion", url: "https://fledge.lccommandsuite.com/legal/data-deletion" },
];

const money = (p: string | number | null, b: string | null) => {
  const n = Number(p);
  const amt = Number.isFinite(n) ? `$${n.toLocaleString(undefined, { minimumFractionDigits: n % 1 ? 2 : 0 })}` : "";
  const per = b === "monthly" ? "/month" : b === "payment_plan" ? " (payment plan)" : "";
  return amt ? amt + per : "";
};

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          },
          () => {}
        );
      }}
      className="inline-flex items-center gap-1 rounded-md border border-[#1a2b4a]/15 px-2 py-1 text-xs text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:text-[#F8F5F0]"
      aria-label={`Copy ${text}`}
    >
      {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function Section({ title, hint, rows, q }: { title: string; hint?: string; rows: Row[]; q: string }) {
  const shown = rows.filter((r) => !q || `${r.name} ${r.url} ${r.note ?? ""}`.toLowerCase().includes(q));
  if (!shown.length) return null;
  return (
    <section className="mt-8">
      <h2 className="font-serif text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
        {title} <span className="text-sm font-normal text-[#7a8a99]">({shown.length})</span>
      </h2>
      {hint && <p className="mt-1 text-sm text-[#7a8a99] dark:text-[#b8c2cf]">{hint}</p>}
      <ul className="mt-3 divide-y divide-[#1a2b4a]/10 overflow-hidden rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40">
        {shown.map((r, i) => (
          <li key={`${r.url}-${i}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <div className="min-w-0 flex-1 basis-64">
              <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                {r.name}
                {r.status && <span className="ml-2 rounded-full bg-[#1a2b4a]/10 px-2 py-0.5 text-[11px] font-normal">{r.status}</span>}
              </p>
              <p className="break-all text-xs text-[#2E7C83] dark:text-[#7fd0d6]">{r.url}</p>
              {r.note && <p className="text-xs text-[#7a8a99] dark:text-[#b8c2cf]">{r.note}</p>}
            </div>
            <div className="flex items-center gap-2">
              <CopyBtn text={r.url} />
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-[#1a2b4a]/15 px-2 py-1 text-xs text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:text-[#F8F5F0]">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Open
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function LinksDirectory() {
  const [data, setData] = useState<{ offers: Offer[]; forms: Form[]; calendars: Calendar[]; shortLinks: Short[] } | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/links-directory", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then(setData)
      .catch(() => setError("Couldn't load the list. Refresh to try again."));
  }, []);

  const ql = q.trim().toLowerCase();
  const offers: Row[] = useMemo(
    () =>
      (data?.offers ?? [])
        .filter((o) => (o.link || "").trim())
        .map((o) => ({ name: o.name, url: (o.link as string).trim(), note: [money(o.price, o.billing), o.format].filter(Boolean).join(" · "), status: o.status && o.status !== "active" ? o.status : undefined })),
    [data]
  );
  const offersWithoutLink = (data?.offers ?? []).filter((o) => !(o.link || "").trim());
  const forms: Row[] = useMemo(
    () => (data?.forms ?? []).map((f) => ({ name: f.name, url: `${APP}/f/${f.id}`, note: [f.tags?.length ? `tags: ${f.tags.join(", ")}` : "", f.sequence_key ? `starts: ${f.sequence_key}` : ""].filter(Boolean).join(" · "), status: f.active ? undefined : "off" })),
    [data]
  );
  const calendars: Row[] = useMemo(
    () => (data?.calendars ?? []).map((c) => ({ name: c.name, url: `${APP}/book/${c.slug}`, note: c.duration_min ? `${c.duration_min} minutes` : undefined, status: c.active ? undefined : "off" })),
    [data]
  );
  const shorts: Row[] = useMemo(
    () => (data?.shortLinks ?? []).map((s) => ({ name: s.title || s.code, url: `${APP}/l/${s.code}`, note: `goes to ${s.destination_url} · ${s.click_count ?? 0} clicks`, status: s.active ? undefined : "off" })),
    [data]
  );

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-serif text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Links &amp; Forms</h1>
      <p className="mt-1 max-w-3xl text-sm text-[#7a8a99] dark:text-[#b8c2cf]">
        Every address for every offering and every form, in one place. Offers, forms, booking pages and short links are read live from your account; the rest are the fixed pages. Copy a link or open it.
      </p>

      <label className="relative mt-5 block max-w-md">
        <span className="sr-only">Search links</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b8a898]" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a name or address"
          className="w-full rounded-full border border-[#1a2b4a]/15 bg-white py-2 pl-9 pr-3 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/40 dark:text-[#F8F5F0]"
        />
      </label>

      {error && <p className="mt-4 text-sm text-[#c0632f]">{error}</p>}
      {!data && !error && <p className="mt-6 text-sm text-[#7a8a99]">Loading…</p>}

      <Section title="Offering pages" hint="Where to send someone for each offering." rows={OFFERING_PAGES} q={ql} />
      {data && <Section title="Offers: checkout and sales links" hint="From Growth > Offers & Packages. These are the links people pay through." rows={offers} q={ql} />}
      {data && offersWithoutLink.length > 0 && !ql && (
        <p className="mt-3 text-sm text-[#7a8a99] dark:text-[#b8c2cf]">
          No link saved yet for: {offersWithoutLink.map((o) => o.name).join("; ")}.
        </p>
      )}
      {data && <Section title="Booking pages" rows={calendars} q={ql} />}
      {data && <Section title="Forms" hint="Every form stored in your CRM (Campaigns & Broadcasts > Forms)." rows={forms} q={ql} />}
      <Section title="Other forms and sign-ups" hint="Forms that live on their own pages." rows={OTHER_FORMS} q={ql} />
      {data && <Section title="Short links" rows={shorts} q={ql} />}
      <Section title="Legal pages" rows={LEGAL} q={ql} />
    </div>
  );
}
