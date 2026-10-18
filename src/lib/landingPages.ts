import { COLOR_PRESETS, PORTAL_FONTS, type FontKey } from "@/lib/portalLook";

// Simple landing pages (task 1153). Four templates built on what the account already has: an opt-in page on one of
// its Suite forms, a webinar/event page on one of its Events, a sales page on one of its offers (Buy = the offer's
// payment link), and a book-a-call page on one of its booking pages. Published at lccommandsuite.com/go/<slug> and on
// the account's own short-link domain (<their domain>/<slug>). Pure, so the editor and the public page share it.

export type Template = "optin" | "webinar" | "sales" | "booking";
export const TEMPLATES: { key: Template; label: string; blurb: string; uses: string; conversion: string }[] = [
  { key: "optin", label: "Opt-in (freebie)", blurb: "Give something away and grow your list. Sign-ups land in Contacts with your form's tags and campaign.", uses: "one of your forms", conversion: "sign-ups" },
  { key: "webinar", label: "Webinar or event", blurb: "Fill a live event or challenge. People save their seat right on the page and get your event emails.", uses: "one of your Events", conversion: "registrations" },
  { key: "sales", label: "Sales page", blurb: "Tell the story, show the results and send buyers to your payment link.", uses: "one of your offers", conversion: "Buy clicks" },
  { key: "booking", label: "Book a call", blurb: "A short pitch with your booking calendar right on the page.", uses: "one of your booking pages", conversion: "bookings" },
];
export const templateInfo = (t: string) => TEMPLATES.find((x) => x.key === t) ?? TEMPLATES[0];

export interface Testimonial { name: string; quote: string }
export interface Faq { q: string; a: string }
export interface Content {
  eyebrow: string;
  headline: string;
  subheadline: string;
  body: string;
  bulletsTitle: string;
  bullets: string[];
  cta: string;
  aboutTitle: string;
  about: string;
  testimonials: Testimonial[];
  faq: Faq[];
  priceNote: string;
  guarantee: string;
  closing: string;
  thankYou: string;
}

export interface Look { accent: string; background: string; font: FontKey; showLogo: boolean }
export const DEFAULT_LOOK: Look = { accent: COLOR_PRESETS[0].accent, background: COLOR_PRESETS[0].background, font: "classic", showLogo: true };

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Starting words for each template: real sample copy the owner replaces (or the assistant drafts). */
export function starterContent(t: Template): Content {
  const base: Content = {
    eyebrow: "",
    headline: "",
    subheadline: "",
    body: "",
    bulletsTitle: "",
    bullets: [],
    cta: "",
    aboutTitle: "About me",
    about: "",
    testimonials: [],
    faq: [],
    priceNote: "",
    guarantee: "",
    closing: "",
    thankYou: "",
  };
  if (t === "optin")
    return { ...base, eyebrow: "Free guide", headline: "The one-page plan that gets your week back", subheadline: "A short, practical guide you can use today.", bulletsTitle: "Inside you'll find", bullets: ["The three questions to ask before you say yes", "A simple weekly rhythm that fits real life", "What to stop doing first"], cta: "Send me the guide", thankYou: "Thank you! Check your email in the next few minutes." };
  if (t === "webinar")
    return { ...base, eyebrow: "Free live training", headline: "How to grow without burning out", subheadline: "Join me live. Bring your questions.", bulletsTitle: "You'll learn", bullets: ["The one shift that frees up hours each week", "How to choose your next best move", "A plan you can start the same day"], cta: "Save my seat", thankYou: "You're in! Check your email for the details and the add-to-calendar link." };
  if (t === "sales")
    return { ...base, eyebrow: "", headline: "From scattered to steady in 90 days", subheadline: "A guided program for founders who are ready for a business that fits their life.", body: "You started your business for freedom. Somewhere along the way it started running you.\n\nThis program walks you through a clear plan, step by step, with support at every turn.", bulletsTitle: "What you get", bullets: ["Weekly coaching sessions", "Your own written plan", "Templates and tools you keep"], cta: "Join now", priceNote: "", guarantee: "", closing: "Ready when you are." };
  return { ...base, eyebrow: "Free call", headline: "Let's talk about your next step", subheadline: "A relaxed conversation about where you are and where you want to be.", bulletsTitle: "On our call we'll", bullets: ["Get clear on what you want", "Spot what's in the way", "Map your best next step"], cta: "Pick a time" };
}

/** A safe, complete content object from whatever was saved or sent. */
export function cleanContent(raw: unknown, t: Template): Content {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const list = (v: unknown, n: number, each: number) => (Array.isArray(v) ? v.map((x) => str(x, each)).filter(Boolean).slice(0, n) : []);
  const pairs = <T,>(v: unknown, n: number, f: (o: Record<string, unknown>) => T | null) => (Array.isArray(v) ? (v as Record<string, unknown>[]).map((o) => (o && typeof o === "object" ? f(o) : null)).filter((x): x is T => Boolean(x)).slice(0, n) : []);
  const start = starterContent(t);
  const has = (k: string) => Object.prototype.hasOwnProperty.call(r, k);
  return {
    eyebrow: has("eyebrow") ? str(r.eyebrow, 60) : start.eyebrow,
    headline: str(r.headline, 160) || start.headline,
    subheadline: has("subheadline") ? str(r.subheadline, 300) : start.subheadline,
    body: has("body") ? str(r.body, 6000) : start.body,
    bulletsTitle: has("bulletsTitle") ? str(r.bulletsTitle, 80) : start.bulletsTitle,
    bullets: has("bullets") ? list(r.bullets, 12, 200) : start.bullets,
    cta: str(r.cta, 40) || start.cta || "Continue",
    aboutTitle: has("aboutTitle") ? str(r.aboutTitle, 80) : start.aboutTitle,
    about: has("about") ? str(r.about, 2000) : start.about,
    testimonials: pairs(r.testimonials, 6, (o) => (str(o.quote, 600) ? { name: str(o.name, 60), quote: str(o.quote, 600) } : null)),
    faq: pairs(r.faq, 10, (o) => (str(o.q, 200) && str(o.a, 1000) ? { q: str(o.q, 200), a: str(o.a, 1000) } : null)),
    priceNote: str(r.priceNote, 200),
    guarantee: str(r.guarantee, 400),
    closing: str(r.closing, 400),
    thankYou: has("thankYou") ? str(r.thankYou, 400) : start.thankYou,
  };
}

export function cleanPageLook(raw: unknown): Look {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    accent: HEX.test(str(r.accent, 7)) ? str(r.accent, 7) : DEFAULT_LOOK.accent,
    background: HEX.test(str(r.background, 7)) ? str(r.background, 7) : DEFAULT_LOOK.background,
    font: PORTAL_FONTS.some((f) => f.key === r.font) ? (r.font as FontKey) : DEFAULT_LOOK.font,
    showLogo: typeof r.showLogo === "boolean" ? r.showLogo : true,
  };
}

const RESERVED = new Set(["api", "go", "l", "e", "f", "p", "book", "portal", "login", "admin", "settings", "new", "preview", "yr", "www"]);
/** A web address word: lowercase letters, numbers and dashes, 3 to 60 long. */
export function slugify(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}
export const validSlug = (s: string) => /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/.test(s) && !RESERVED.has(s);

/** A Meta pixel ID is 10 to 20 digits. */
export const cleanPixel = (v: unknown) => {
  const s = str(v, 30).replace(/\s/g, "");
  return /^\d{10,20}$/.test(s) ? s : null;
};

/** Visits, conversions and the rate (one decimal). */
export function rate(views: number, conversions: number): number {
  return views > 0 ? Math.round((conversions / views) * 1000) / 10 : 0;
}

/** Turn a pasted link into a safe https:// link (or null). */
export function cleanUrl(v: unknown): string | null {
  const s = str(v, 500);
  if (!s) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}
