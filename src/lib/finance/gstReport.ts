// The GST/HST report (task 1520 follow-up), the pure parts: the period to show, the four lines, the sales to check
// and the CSV for the accountant. Server reads live in /api/finance/gst-hst; this file never touches the database.

import { gstReturn, isTaxRefund, periodOf, periodsFor, taxFor, isTaxPlace, OUTSIDE_LABEL, SMALL_SUPPLIER_LIMIT, type Frequency, type GstReturn, type Period, type TaxRow } from "@/lib/salesTax";

export type GstRow = TaxRow & { id: string; description?: string | null; vendor?: string | null };

/** The day before an ISO day. */
function dayBefore(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}
function dayAfter(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** The period before or after this one. */
export function shiftPeriod(frequency: Frequency, p: Period, dir: -1 | 1): Period {
  return periodOf(frequency, dir < 0 ? dayBefore(p.start) : dayAfter(p.end));
}

/** The period named by its start day (as the page sends it), else the one today falls in. */
export function pickPeriod(frequency: Frequency, today: string, start?: string | null): Period {
  if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
    const hit = periodsFor(frequency, Number(start.slice(0, 4))).find((p) => p.start === start);
    if (hit) return hit;
  }
  return periodOf(frequency, today);
}

/** The filing period that ended most recently before today (the one whose return is coming due). */
export function lastEndedPeriod(frequency: Frequency, today: string): Period {
  return shiftPeriod(frequency, periodOf(frequency, today), -1);
}

/** A place code in words ("ON" → "Ontario"). */
export function placeName(code: string | null | undefined): string {
  if (!code) return "Not recorded";
  if (code === "OUTSIDE") return OUTSIDE_LABEL;
  if (isTaxPlace(code)) {
    const t = taxFor(code);
    return t.label.replace(/^.*\((.*)\)$/, "$1");
  }
  return code;
}

/** "GST" or "HST" for a place, or "GST/HST" when it is unknown. */
export function taxWord(province: string | null | undefined): string {
  if (province && isTaxPlace(province) && province !== "OUTSIDE") return taxFor(province).kind;
  return "GST/HST";
}

export type GstReport = {
  period: Period;
  ret: GstReturn;
  /** Canadian-dollar sales in the period with no GST/HST recorded and not marked outside Canada: zero-rated, or tax missing. */
  check: { id: string; date: string; description: string; amount: number }[];
  counts: { sales: number; expenses: number; refunds: number };
};

const inPeriod = (r: TaxRow, p: Period) => r.occurred_on >= p.start && r.occurred_on <= p.end;
const isCad = (r: TaxRow) => (r.currency || "usd").toLowerCase() === "cad";
const what = (r: GstRow) => [r.vendor, r.category, r.description].map((v) => (v || "").trim()).filter(Boolean).join(" · ");

export function buildGstReport(rows: GstRow[], period: Period): GstReport {
  const mine = rows.filter((r) => inPeriod(r, period));
  const check = mine
    .filter((r) => r.type === "income" && isCad(r) && !(Number(r.tax_amount ?? 0) > 0) && r.tax_province !== "OUTSIDE")
    .map((r) => ({ id: r.id, date: r.occurred_on, description: what(r) || "Sale", amount: Number(r.amount) || 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    period,
    ret: gstReturn(mine, period.start, period.end),
    check,
    counts: {
      sales: mine.filter((r) => r.type === "income").length,
      expenses: mine.filter((r) => r.type !== "income" && !isTaxRefund(r)).length,
      refunds: mine.filter((r) => isTaxRefund(r)).length,
    },
  };
}

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Every row in the period, for the accountant: date, type, description, amount before tax, GST/HST, province, currency. */
export function gstCsv(rows: GstRow[], period: Period): string {
  const head = ["Date", "Type", "Description", "Amount before tax", "GST/HST", "Province", "Currency", "Category"];
  const body = rows
    .filter((r) => inPeriod(r, period))
    .sort((a, b) => a.occurred_on.localeCompare(b.occurred_on))
    .map((r) => {
      const type = r.type === "income" ? "Sale" : isTaxRefund(r) ? "Refund" : "Expense";
      const tax = Number(r.tax_amount ?? 0) || 0;
      return [
        r.occurred_on,
        type,
        what(r),
        (Number(r.amount) || 0).toFixed(2),
        tax.toFixed(2),
        r.tax_province ? placeName(r.tax_province) : "",
        (r.currency || "usd").toUpperCase(),
        r.category || "",
      ].map(cell).join(",");
    });
  return [head.join(","), ...body].join("\n") + "\n";
}

/**
 * taxAmount (0 or more, rounded to the cent) and taxProvince (a province code or OUTSIDE) from a request body, as the
 * finance entry APIs accept them. Missing taxAmount = 0; an empty taxProvince = none.
 */
export function parseTax(body: Record<string, unknown>): { taxAmount: number; taxProvince: string | null } | { error: string } {
  const raw = body.taxAmount;
  const taxAmount = raw === undefined || raw === null || raw === "" ? 0 : Number(raw);
  if (!Number.isFinite(taxAmount) || taxAmount < 0 || taxAmount > 100_000_000) return { error: "Enter the GST/HST as 0 or more." };
  const p = body.taxProvince;
  if (p !== undefined && p !== null && p !== "" && !isTaxPlace(p)) return { error: "Choose a province (or Outside Canada) for the GST/HST." };
  return { taxAmount: Math.round(taxAmount * 100) / 100, taxProvince: p && isTaxPlace(p) ? p : null };
}

// ── Alerts ───────────────────────────────────────────────────────────────────

export type GstAlert = { nkey: string; type: string; title: string; body: string; href: string };

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/**
 * The GST/HST bell alerts. Registered: the return for the period just ended, from 14 days before its pay-by date
 * until that day (once per period). Not registered with Canadian dollars as home currency: close to (80%) or past
 * the $30,000 small-supplier line over the last four quarters (once per calendar quarter).
 */
export function gstAlerts(x: {
  today: string;
  registered: boolean;
  registeredFrom: string | null;
  frequency: Frequency;
  homeCurrency: string;
  fourQuarterSales?: number;
}): GstAlert[] {
  const out: GstAlert[] = [];
  const nice = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-CA", { month: "short", day: "numeric", timeZone: "UTC" });
  };
  if (x.registered) {
    const p = lastEndedPeriod(x.frequency, x.today);
    const counts = !x.registeredFrom || x.registeredFrom <= p.end;
    if (counts && x.today >= addDays(p.payBy, -14) && x.today <= p.payBy) {
      out.push({
        nkey: `gst-due:${p.start}`,
        type: "action",
        title: `GST/HST return due ${nice(p.payBy)}`,
        body: `${p.label}: ${p.fileBy === p.payBy ? `file and pay by ${nice(p.payBy)}` : `pay by ${nice(p.payBy)}, file by ${nice(p.fileBy)}`}. Your numbers are ready on the GST/HST page.`,
        href: `/finance/gst-hst?start=${p.start}`,
      });
    }
    return out;
  }
  if ((x.homeCurrency || "").toLowerCase() !== "cad") return out;
  const sales = x.fourQuarterSales ?? 0;
  const q = Math.floor((Number(x.today.slice(5, 7)) - 1) / 3) + 1;
  const qKey = `${x.today.slice(0, 4)}-Q${q}`;
  const amt = `CA$${Math.round(sales).toLocaleString("en-US")}`;
  if (sales >= SMALL_SUPPLIER_LIMIT) {
    out.push({
      nkey: `gst-line:over:${qKey}`,
      type: "warning",
      title: "You've passed the $30,000 GST/HST registration line",
      body: `Your sales over the last four quarters are ${amt}. Past $30,000, most businesses must register for GST/HST and start charging it. Ask your accountant how soon, then turn it on in Settings.`,
      href: "/finance/gst-hst",
    });
  } else if (sales >= SMALL_SUPPLIER_LIMIT * 0.8) {
    out.push({
      nkey: `gst-line:near:${qKey}`,
      type: "action",
      title: "You're close to the $30,000 GST/HST registration line",
      body: `Your sales over the last four quarters are ${amt}. Past $30,000 you must register for GST/HST and start charging it. Worth a word with your accountant now.`,
      href: "/finance/gst-hst",
    });
  }
  return out;
}
