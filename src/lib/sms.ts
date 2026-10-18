// Text messages (task 1151), the pure parts: phone numbers, message length, opt-out words, reminder wording and quiet
// hours. Each account texts from its own verified toll-free number in the Suite's Twilio account; Babs absorbs the
// cost, so each account has a monthly cap by plan (plans.capabilities.sms_texts): Starter 500, Growth 1,000, VIP 2,500.

export const SMS_CAP_BY_TIER: Record<string, number> = { starter: 500, growth: 1000, vip: 2500 };
export const SMS_DEFAULT_CAP = 500; // no active plan found: the Starter amount

/** A US or Canadian number in +1XXXXXXXXXX form, or null. Toll-free texting reaches US and Canada only. */
export function toE164(raw: string | null | undefined): string | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  const digits = s.replace(/\D/g, "");
  let n = digits;
  if (n.length === 11 && n.startsWith("1")) n = n.slice(1);
  if (n.length !== 10) return null;
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(n)) return null; // NANP: area code and exchange never start with 0 or 1
  return `+1${n}`;
}

/** How a number reads: (303) 555-0123. */
export function prettyPhone(e164: string | null | undefined): string {
  const m = String(e164 || "").match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : String(e164 || "");
}

const GSM = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXT = "^{}\\[~]|€";
/** How many billed parts a text is (160 plain characters each, or 70 with emoji and special characters). */
export function segmentsOf(body: string): number {
  let gsm = true;
  let len = 0;
  for (const ch of body) {
    if (GSM.includes(ch)) len += 1;
    else if (GSM_EXT.includes(ch)) len += 2;
    else {
      gsm = false;
      break;
    }
  }
  if (gsm) return len <= 160 ? 1 : Math.ceil(len / 153);
  const units = Array.from(body).reduce((n, ch) => n + (ch.codePointAt(0)! > 0xffff ? 2 : 1), 0);
  return units <= 70 ? 1 : Math.ceil(units / 67);
}

const STOP = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "OPTOUT", "OPT-OUT", "REVOKE", "STOP ALL"]);
const START = new Set(["START", "UNSTOP", "YES", "OPTIN", "OPT-IN"]);
/** What a reply means: an opt-out, an opt-back-in, a request for help, or an ordinary message. */
export function keywordOf(body: string): "stop" | "start" | "help" | null {
  const w = body.trim().toUpperCase().replace(/[.!]+$/, "");
  if (STOP.has(w)) return "stop";
  if (START.has(w)) return "start";
  if (w === "HELP" || w === "INFO") return "help";
  return null;
}

export const DEFAULT_24H = "{business}: reminder, your {event} is tomorrow, {time}. Reply STOP to opt out.";
export const DEFAULT_1H = "{business}: your {event} starts at {time} (in about an hour). Details are in your email. Reply STOP to opt out.";

/** Fill a reminder: {first}, {business}, {event}, {time}, {date}. Always ends with how to opt out. */
export function fillReminder(template: string, v: { first: string; business: string; event: string; time: string; date: string }): string {
  let s = template
    .replace(/\{first\}/gi, v.first || "there")
    .replace(/\{business\}/gi, v.business)
    .replace(/\{event\}/gi, v.event)
    .replace(/\{time\}/gi, v.time)
    .replace(/\{date\}/gi, v.date)
    .replace(/\s+/g, " ")
    .trim();
  if (!/\bSTOP\b/i.test(s)) s = `${s} Reply STOP to opt out.`;
  // The first words must say who is texting.
  if (!s.toLowerCase().includes(v.business.toLowerCase())) s = `${v.business}: ${s}`;
  return s.slice(0, 480);
}

/** Texts only go out between 8 AM and 9 PM where the person is. */
export function inQuietHours(at: Date, tz: string): boolean {
  let h: number;
  try {
    h = Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(at));
  } catch {
    h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", hour: "numeric", hourCycle: "h23" }).format(at));
  }
  return h < 8 || h >= 21;
}

/** The consent words shown next to the tick box (also sent to Twilio for the number's approval). */
export const consentText = (business: string) =>
  `Text me reminders about this booking from ${business}. Up to 2 texts per booking. Msg & data rates may apply. Reply STOP to opt out, HELP for help.`;

export interface Business {
  legalName: string;
  dba: string;
  website: string;
  type: "PRIVATE_PROFIT" | "SOLE_PROPRIETOR" | "NON_PROFIT" | "PUBLIC_PROFIT" | "GOVERNMENT";
  ein: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  postal: string;
  contactFirst: string;
  contactLast: string;
  contactEmail: string;
  contactPhone: string;
  privacyUrl: string;
}

const s = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const TYPES = ["PRIVATE_PROFIT", "SOLE_PROPRIETOR", "NON_PROFIT", "PUBLIC_PROFIT", "GOVERNMENT"] as const;

export function cleanBusiness(raw: unknown): Business {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const url = (v: unknown) => {
    const x = s(v, 300);
    if (!x) return "";
    return /^https?:\/\//i.test(x) ? x : `https://${x}`;
  };
  return {
    legalName: s(r.legalName, 120),
    dba: s(r.dba, 120),
    website: url(r.website),
    type: (TYPES as readonly string[]).includes(String(r.type)) ? (r.type as Business["type"]) : "PRIVATE_PROFIT",
    ein: s(r.ein, 20).replace(/[^0-9-]/g, ""),
    street: s(r.street, 120),
    street2: s(r.street2, 120),
    city: s(r.city, 80),
    state: s(r.state, 40),
    postal: s(r.postal, 12),
    contactFirst: s(r.contactFirst, 60),
    contactLast: s(r.contactLast, 60),
    contactEmail: s(r.contactEmail, 120).toLowerCase(),
    contactPhone: s(r.contactPhone, 30),
    privacyUrl: url(r.privacyUrl),
  };
}

/** What's still missing before the number can be sent for approval (empty when ready). */
export function businessGaps(b: Business): string[] {
  const gaps: string[] = [];
  if (!b.legalName) gaps.push("legal business name");
  if (!b.website) gaps.push("website");
  if (b.type !== "SOLE_PROPRIETOR" && !/^\d{2}-?\d{7}$/.test(b.ein)) gaps.push("EIN (9 digits)");
  if (!b.street || !b.city || !b.state || !b.postal) gaps.push("business address");
  if (!b.contactFirst || !b.contactLast) gaps.push("contact name");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.contactEmail)) gaps.push("contact email");
  if (!toE164(b.contactPhone)) gaps.push("contact phone");
  return gaps;
}
