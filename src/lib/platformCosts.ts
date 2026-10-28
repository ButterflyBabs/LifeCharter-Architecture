// Platform Costs (Alignment Architect, Babs only). The real monthly bills behind hosting, database, AI and tools,
// kept month by month so the cost per client can be watched over time.
//
// Receipts arrive in the house mailbox (Microsoft 365). A monthly scan finds them, reads the amount and files each
// as "proposed"; nothing counts until Babs confirms it on the page. Amounts typed in by hand count straight away.
// Pure helpers (receipt reading, month maths, summary) live here so they can be tested without a database.

export interface Vendor {
  key: string;
  label: string;
  category: "hosting" | "database" | "ai" | "email" | "tools";
  /** Sender domain used to find this vendor's receipts in the mailbox. */
  domain: string;
  /** Whether a receipt counts toward the platform cost by default. Babs can flip it on the page. */
  countsByDefault: boolean;
  /** Shown on the page when the receipt needs a human decision. */
  hint?: string;
}

export const VENDORS: Vendor[] = [
  { key: "vercel", label: "Vercel", category: "hosting", domain: "vercel.com", countsByDefault: true },
  { key: "supabase", label: "Supabase", category: "database", domain: "supabase.com", countsByDefault: true, hint: "One invoice per org: check the label (main org, test branches, old org)." },
  { key: "anthropic", label: "Anthropic", category: "ai", domain: "anthropic.com", countsByDefault: false, hint: "Often your own Claude use, not the platform. Turn on only what the Suite itself spends." },
  { key: "openai", label: "OpenAI", category: "ai", domain: "openai.com", countsByDefault: true },
  { key: "modal", label: "Modal (Fledge clips)", category: "hosting", domain: "modal.com", countsByDefault: true },
  { key: "resend", label: "Resend", category: "email", domain: "resend.com", countsByDefault: true },
  { key: "cloudflare", label: "Cloudflare", category: "hosting", domain: "cloudflare.com", countsByDefault: true },
];

export const vendorByKey = (k: string) => VENDORS.find((v) => v.key === k) ?? null;
export const vendorLabel = (k: string) => vendorByKey(k)?.label ?? (k ? k[0].toUpperCase() + k.slice(1) : "Other");

/** The first day of the month (UTC date string, YYYY-MM-01) a timestamp falls in, in Mountain time. */
export function monthOf(ts: string | number | Date, tz = "America/Denver"): string {
  const d = new Date(ts);
  const ymd = d.toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
  return `${ymd.slice(0, 7)}-01`;
}

/** "$1,234.56" -> 123456 cents. */
export function dollarsToCents(s: string): number {
  return Math.round(parseFloat(s.replace(/[$,\s]/g, "")) * 100);
}

const MONEY = /\$\s?([\d]{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})/;
const strip = (s: string) =>
  s
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/[​-‏⁠﻿­͏]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export interface ParsedReceipt {
  amountCents: number;
  refund: boolean;
}

/**
 * Reads the amount of a vendor receipt or invoice email from its subject and body (HTML or text).
 * Looks first for the phrases vendors put next to the paid amount, then falls back to the first dollar figure.
 * A refund comes back as a negative amount. Returns null when no dollar figure is found.
 */
export function parseReceipt(subject: string, body: string): ParsedReceipt | null {
  const text = `${subject} . ${strip(body)}`;
  const refund = /\brefund(ed)?\b/i.test(subject) || /\bRefunded\s+\$/i.test(text);
  const phrases = [
    /(?:Refunded|Amount paid|Total paid|has been charged|Amount due|Receipt from [A-Za-z0-9 .,&'-]{2,40}?)\D{0,24}?\$\s?((?:\d{1,3}(?:,\d{3})*|\d+)\.\d{2})/i,
    /\$\s?((?:\d{1,3}(?:,\d{3})*|\d+)\.\d{2})\s+(?:has been charged|paid|was charged)/i,
  ];
  for (const p of phrases) {
    const m = text.match(p);
    if (m) return { amountCents: (refund ? -1 : 1) * dollarsToCents(m[1]), refund };
  }
  const m = text.match(MONEY);
  if (!m) return null;
  return { amountCents: (refund ? -1 : 1) * dollarsToCents(m[1]), refund };
}

/** Is this email a receipt/invoice/refund and not marketing? Cheap subject test used before reading the body. */
export function looksLikeReceipt(subject: string): boolean {
  // "New invoice from …" is the notice before the "Payment received" email for the same bill: counting both would double it.
  if (/^\s*new invoice\b/i.test(subject)) return false;
  return /\b(receipt|invoice|payment (received|successful)|refund|charged|your .{0,20}(bill|statement))\b/i.test(subject);
}

export interface Entry {
  id: string;
  month: string; // YYYY-MM-01
  vendor: string;
  label: string | null;
  amountCents: number;
  counts: boolean;
  status: "proposed" | "confirmed" | "rejected";
  source: "receipt" | "manual";
  receiptSubject: string | null;
  note: string | null;
}

export interface MonthRow {
  month: string;
  platformCents: number; // confirmed entries that count
  byVendor: { vendor: string; cents: number }[];
  proposedCount: number;
}

/** Rolls entries up by month (newest first). Only confirmed entries with counts=true add to the platform total. */
export function summarizeMonths(entries: Entry[]): MonthRow[] {
  const by = new Map<string, MonthRow>();
  const row = (month: string) => {
    let r = by.get(month);
    if (!r) by.set(month, (r = { month, platformCents: 0, byVendor: [], proposedCount: 0 }));
    return r;
  };
  for (const e of entries) {
    const r = row(e.month);
    if (e.status === "proposed") r.proposedCount += 1;
    if (e.status !== "confirmed" || !e.counts) continue;
    r.platformCents += e.amountCents;
    const v = r.byVendor.find((x) => x.vendor === e.vendor);
    if (v) v.cents += e.amountCents;
    else r.byVendor.push({ vendor: e.vendor, cents: e.amountCents });
  }
  return Array.from(by.values()).sort((a, b) => (a.month < b.month ? 1 : -1));
}

/** The month to headline: the latest finished month that has confirmed bills (the current month is still filling in). */
export function headlineMonth(months: MonthRow[], today: string): MonthRow | null {
  const thisMonth = `${today.slice(0, 7)}-01`;
  const full = months.filter((m) => m.month < thisMonth && m.platformCents > 0);
  return full[0] ?? months.find((m) => m.platformCents > 0) ?? null;
}

/** Cost per client in cents; null when there are no clients to divide by. */
export function perClientCents(totalCents: number, clients: number): number | null {
  return clients > 0 ? Math.round(totalCents / clients) : null;
}

/** Gross margin (0..1) of one client paying `priceCents` a month, given the cost per client. */
export function marginOf(priceCents: number, costPerClientCents: number): number | null {
  return priceCents > 0 ? (priceCents - costPerClientCents) / priceCents : null;
}

// Babs's own platform costs and Suite plan prices are in US dollars (task 1520 leaves this USD).
export const money = (cents: number) => {
  const neg = cents < 0;
  const s = (Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${neg ? "-" : ""}$${s}`;
};
