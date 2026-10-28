/**
 * Canadian GST/HST (task 1520 follow-up). A business registered for GST/HST charges it by where the customer is
 * (the place of supply for services is the customer's province). Rates checked 2026-10-28 against 2026 tax tables
 * (Nova Scotia's HST fell from 15% to 14% on April 1, 2025). Customers outside Canada: 0%, since services exported
 * to non-residents are generally zero-rated. Not handled: Quebec QST, provincial PST (BC, SK, MB), filing with the CRA.
 *
 * The Suite keeps the tax apart from income: finance_entries.amount is the amount before tax and tax_amount the
 * GST/HST collected (income) or paid (expense, an input tax credit). The GST/HST report totals them per period.
 */

export type Province = "AB" | "BC" | "MB" | "NB" | "NL" | "NS" | "NT" | "NU" | "ON" | "PE" | "QC" | "SK" | "YT";
export type TaxPlace = Province | "OUTSIDE";

export const PROVINCES: { code: Province; name: string; kind: "GST" | "HST"; rate: number }[] = [
  { code: "AB", name: "Alberta", kind: "GST", rate: 5 },
  { code: "BC", name: "British Columbia", kind: "GST", rate: 5 },
  { code: "MB", name: "Manitoba", kind: "GST", rate: 5 },
  { code: "NB", name: "New Brunswick", kind: "HST", rate: 15 },
  { code: "NL", name: "Newfoundland and Labrador", kind: "HST", rate: 15 },
  { code: "NS", name: "Nova Scotia", kind: "HST", rate: 14 },
  { code: "NT", name: "Northwest Territories", kind: "GST", rate: 5 },
  { code: "NU", name: "Nunavut", kind: "GST", rate: 5 },
  { code: "ON", name: "Ontario", kind: "HST", rate: 13 },
  { code: "PE", name: "Prince Edward Island", kind: "HST", rate: 15 },
  { code: "QC", name: "Quebec", kind: "GST", rate: 5 },
  { code: "SK", name: "Saskatchewan", kind: "GST", rate: 5 },
  { code: "YT", name: "Yukon", kind: "GST", rate: 5 },
];

export const OUTSIDE_LABEL = "Outside Canada";

export function isTaxPlace(v: unknown): v is TaxPlace {
  return v === "OUTSIDE" || PROVINCES.some((p) => p.code === v);
}

export type TaxLine = { place: TaxPlace; kind: "GST" | "HST" | "none"; rate: number; label: string };

/** The GST/HST to charge a customer in this place. */
export function taxFor(place: TaxPlace): TaxLine {
  const p = PROVINCES.find((x) => x.code === place);
  if (!p) return { place: "OUTSIDE", kind: "none", rate: 0, label: "No GST/HST (customer outside Canada)" };
  return { place: p.code, kind: p.kind, rate: p.rate, label: `${p.kind} ${p.rate}% (${p.name})` };
}

/** Tax in cents on an amount in cents, rounded to the cent. */
export function taxCents(baseCents: number, rate: number): number {
  return Math.round((baseCents * rate) / 100);
}

/**
 * Where a contact is, from their stored address. A province code or name with Canada (or no country) → that
 * province; another country → outside Canada; not enough to tell → null (ask).
 */
export function placeFromAddress(region: string | null | undefined, country: string | null | undefined): TaxPlace | null {
  const c = (country || "").trim().toLowerCase();
  const inCanada = !c || c === "ca" || c === "can" || c === "canada";
  if (!inCanada) return "OUTSIDE";
  const r = (region || "").trim().toLowerCase().replace(/\./g, "");
  if (!r) return null;
  const byCode = PROVINCES.find((p) => p.code.toLowerCase() === r);
  if (byCode) return byCode.code;
  const byName = PROVINCES.find((p) => p.name.toLowerCase() === r || (r === "pei" && p.code === "PE") || (r === "newfoundland" && p.code === "NL"));
  return byName ? byName.code : null;
}

// ── Filing periods ───────────────────────────────────────────────────────────

export type Frequency = "monthly" | "quarterly" | "annual";
export type Period = { start: string; end: string; label: string; fileBy: string; payBy: string };

const pad = (n: number) => String(n).padStart(2, "0");
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1-12
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** One month after the period ends (the CRA rule for monthly and quarterly filers). */
function monthAfter(y: number, m: number): string {
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${pad(nm)}-${pad(lastDay(ny, nm))}`;
}

/**
 * Every filing period in a calendar year. Annual filers are assumed to have a December 31 year end: a sole
 * proprietor files by June 15 and pays by April 30; a corporation's return is due three months after year end.
 */
export function periodsFor(frequency: Frequency, year: number): Period[] {
  if (frequency === "annual") {
    return [{ start: `${year}-01-01`, end: `${year}-12-31`, label: `${year}`, fileBy: `${year + 1}-06-15`, payBy: `${year + 1}-04-30` }];
  }
  const step = frequency === "monthly" ? 1 : 3;
  const out: Period[] = [];
  for (let m = 1; m <= 12; m += step) {
    const endM = m + step - 1;
    const due = monthAfter(year, endM);
    out.push({
      start: `${year}-${pad(m)}-01`,
      end: `${year}-${pad(endM)}-${pad(lastDay(year, endM))}`,
      label: frequency === "monthly" ? `${MONTHS[m - 1]} ${year}` : `Q${(m + 2) / 3} ${year} (${MONTHS[m - 1].slice(0, 3)} to ${MONTHS[endM - 1].slice(0, 3)})`,
      fileBy: due,
      payBy: due,
    });
  }
  return out;
}

/** The period a day falls in. */
export function periodOf(frequency: Frequency, day: string): Period {
  const y = Number(day.slice(0, 4));
  return periodsFor(frequency, y).find((p) => day >= p.start && day <= p.end) ?? periodsFor(frequency, y)[0];
}

// ── The GST/HST return ───────────────────────────────────────────────────────

export type TaxRow = { type: string; amount: number; tax_amount?: number | string | null; currency?: string | null; occurred_on: string; tax_province?: string | null; category?: string | null };

/** A refund given back to a customer, with the GST/HST that went back too: an expense row in "Refunds" with tax. */
export function isTaxRefund(r: Pick<TaxRow, "type" | "category" | "tax_amount">): boolean {
  return r.type !== "income" && (r.category || "").trim().toLowerCase() === "refunds" && (Number(r.tax_amount ?? 0) || 0) > 0;
}

export type GstReturn = {
  /** Line 101: sales and other revenue (before tax), Canadian dollars. */
  line101: number;
  /** Line 103: GST/HST collected or collectible. */
  line103: number;
  /** Line 106: input tax credits (GST/HST paid on business expenses). */
  line106: number;
  /** Line 109: net tax (positive = owing, negative = refund). */
  line109: number;
  /** Tax collected per province (for the accountant's check). */
  byProvince: Record<string, number>;
  /** US-dollar income and tax left out: the CRA needs Canadian dollars, and the Suite never converts. */
  usdLeftOut: { sales: number; tax: number; taxPaid: number };
  /** Canadian-dollar refunds already taken off lines 101 and 103 (before-tax amount and the tax given back). */
  refunds: { sales: number; tax: number };
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Totals for one period from finance entries. Only Canadian-dollar rows are counted; US-dollar rows are listed
 * apart for the accountant to convert. Adjustments (lines 104 and 107) are left to the accountant.
 */
export function gstReturn(rows: TaxRow[], from: string, to: string): GstReturn {
  const out: GstReturn = { line101: 0, line103: 0, line106: 0, line109: 0, byProvince: {}, usdLeftOut: { sales: 0, tax: 0, taxPaid: 0 }, refunds: { sales: 0, tax: 0 } };
  for (const r of rows) {
    if (r.occurred_on < from || r.occurred_on > to) continue;
    let tax = Number(r.tax_amount ?? 0) || 0;
    let amt = Number(r.amount) || 0;
    const cad = (r.currency || "usd").toLowerCase() === "cad";
    // A refund with its GST/HST is a sale reversed: it lowers sales and tax collected, never tax paid on expenses.
    const refund = isTaxRefund(r);
    if (refund) {
      if (cad) {
        out.refunds.sales += amt;
        out.refunds.tax += tax;
      }
      amt = -amt;
      tax = -tax;
    }
    if (r.type === "income" || refund) {
      if (!cad) {
        out.usdLeftOut.sales += amt;
        out.usdLeftOut.tax += tax;
        continue;
      }
      out.line101 += amt;
      out.line103 += tax;
      if (tax) {
        const k = r.tax_province || "Not recorded";
        out.byProvince[k] = r2((out.byProvince[k] ?? 0) + tax);
      }
    } else if (cad) out.line106 += tax;
    else out.usdLeftOut.taxPaid += tax;
  }
  out.line101 = r2(out.line101);
  out.line103 = r2(out.line103);
  out.line106 = r2(out.line106);
  out.line109 = r2(out.line103 - out.line106);
  out.usdLeftOut = { sales: r2(out.usdLeftOut.sales), tax: r2(out.usdLeftOut.tax), taxPaid: r2(out.usdLeftOut.taxPaid) };
  out.refunds = { sales: r2(out.refunds.sales), tax: r2(out.refunds.tax) };
  return out;
}

// ── The $30,000 small-supplier line ──────────────────────────────────────────

export const SMALL_SUPPLIER_LIMIT = 30000;

/**
 * Sales (Canadian dollars, before tax) over the last four calendar quarters ending with the current one. Past
 * $30,000 in four consecutive quarters (or in one quarter) a business must register; the Suite warns from 80%.
 */
export function fourQuarterSales(rows: TaxRow[], today: string): number {
  const y = Number(today.slice(0, 4));
  const q = Math.floor((Number(today.slice(5, 7)) - 1) / 3); // 0-3
  const startQ = q - 3;
  const sy = startQ < 0 ? y - 1 : y;
  const sm = ((startQ + 4) % 4) * 3 + 1;
  const from = `${sy}-${pad(sm)}-01`;
  return r2(rows.filter((r) => r.type === "income" && (r.currency || "usd").toLowerCase() === "cad" && r.occurred_on >= from && r.occurred_on <= today).reduce((s, r) => s + (Number(r.amount) || 0), 0));
}

// ── Provincial sales tax: Quebec QST, BC PST, Saskatchewan PST, Manitoba RST ─────────────────────────────────────
//
// Charged only when the business is registered in that province AND the customer is there. QST applies to nearly
// everything GST does, so it follows GST/HST on every item; PST/RST mostly cover goods, software and digital products
// (most coaching and consulting is not taxable), so it is charged only on items the client ticks (pst_applies). The
// Suite never decides what is taxable: the client does, with their accountant. QST paid on expenses can be claimed
// back by a Quebec business (an input tax refund); PST/RST paid is generally a cost and is not tracked for a claim.
// Rates checked 2026-10-28. Manitoba's rules for out-of-province and cloud-software sellers were unclear in the
// sources found, which is one more reason the choice stays with the client.

export type ProvTaxProvince = "QC" | "BC" | "SK" | "MB";
export type ProvTaxKind = "QST" | "PST" | "RST";

export const PROVINCIAL_TAXES: { code: ProvTaxProvince; name: string; kind: ProvTaxKind; rate: number; title: string; followsGst: boolean; claimable: boolean }[] = [
  { code: "QC", name: "Quebec", kind: "QST", rate: 9.975, title: "Quebec sales tax (QST)", followsGst: true, claimable: true },
  { code: "BC", name: "British Columbia", kind: "PST", rate: 7, title: "BC provincial sales tax (PST)", followsGst: false, claimable: false },
  { code: "SK", name: "Saskatchewan", kind: "PST", rate: 6, title: "Saskatchewan provincial sales tax (PST)", followsGst: false, claimable: false },
  { code: "MB", name: "Manitoba", kind: "RST", rate: 7, title: "Manitoba retail sales tax (RST)", followsGst: false, claimable: false },
];

export type ProvReg = { registered: boolean; number: string; frequency: Frequency };
export type ProvRegs = Partial<Record<ProvTaxProvince, ProvReg>>;

export function isProvTaxProvince(v: unknown): v is ProvTaxProvince {
  return PROVINCIAL_TAXES.some((p) => p.code === v);
}

/** Cleans a stored or posted registrations object. */
export function cleanProvRegs(v: unknown): ProvRegs {
  const out: ProvRegs = {};
  if (!v || typeof v !== "object") return out;
  for (const p of PROVINCIAL_TAXES) {
    const r = (v as Record<string, unknown>)[p.code] as Record<string, unknown> | undefined;
    if (!r || typeof r !== "object") continue;
    const frequency = (["monthly", "quarterly", "annual"].includes(r.frequency as string) ? r.frequency : "quarterly") as Frequency;
    out[p.code] = { registered: r.registered === true, number: typeof r.number === "string" ? r.number.trim().toUpperCase().slice(0, 30) : "", frequency };
  }
  return out;
}

export type ProvTaxLine = { place: ProvTaxProvince; kind: ProvTaxKind; rate: number; label: string };

/**
 * The provincial tax to add for a customer in this place, or null. `pstApplies` is the item's own tick; QST ignores
 * it (it follows GST/HST), PST/RST need it.
 */
export function provincialFor(place: TaxPlace | null, regs: ProvRegs, pstApplies: boolean): ProvTaxLine | null {
  if (!place || place === "OUTSIDE") return null;
  const p = PROVINCIAL_TAXES.find((x) => x.code === place);
  if (!p || !regs[p.code]?.registered) return null;
  if (!p.followsGst && !pstApplies) return null;
  return { place: p.code, kind: p.kind, rate: p.rate, label: `${p.kind} ${p.rate}% (${p.name})` };
}

/** True when any provincial registration is on. */
export function anyProvincial(regs: ProvRegs): boolean {
  return PROVINCIAL_TAXES.some((p) => regs[p.code]?.registered);
}

export type ProvRow = TaxRow & { prov_tax_amount?: number | string | null };

export type ProvReturn = {
  province: ProvTaxProvince;
  kind: ProvTaxKind;
  /** Sales (before tax) on which this province's tax was charged, Canadian dollars. */
  taxableSales: number;
  /** Tax collected from customers in this province (refunds already taken off). */
  collected: number;
  /** QST paid on business expenses that a Quebec business can claim back (input tax refunds); 0 for PST/RST. */
  claimable: number;
  /** collected minus claimable: positive = to pay. */
  net: number;
  /** Tax given back on refunds (already taken off `collected`). */
  refunded: number;
  /** US-dollar tax left out (the return needs Canadian dollars). */
  usdLeftOut: number;
};

/**
 * One province's return for a period, from finance entries. Income rows with prov_tax_amount and tax_province = the
 * province count as collected; a Refunds expense row with prov_tax_amount gives tax back; for Quebec, other expense
 * rows with prov_tax_amount are QST paid that can be claimed back (any province: QST is QST wherever it was paid).
 */
export function provincialReturn(rows: ProvRow[], province: ProvTaxProvince, from: string, to: string): ProvReturn {
  const p = PROVINCIAL_TAXES.find((x) => x.code === province)!;
  const out: ProvReturn = { province, kind: p.kind, taxableSales: 0, collected: 0, claimable: 0, net: 0, refunded: 0, usdLeftOut: 0 };
  for (const r of rows) {
    if (r.occurred_on < from || r.occurred_on > to) continue;
    const ptax = Number(r.prov_tax_amount ?? 0) || 0;
    if (!ptax) continue;
    const cad = (r.currency || "usd").toLowerCase() === "cad";
    const refund = r.type !== "income" && (r.category || "").trim().toLowerCase() === "refunds";
    const here = (r.tax_province || "") === province;
    if (r.type === "income" && here) {
      if (!cad) out.usdLeftOut += ptax;
      else {
        out.collected += ptax;
        out.taxableSales += Number(r.amount) || 0;
      }
    } else if (refund && here) {
      if (!cad) out.usdLeftOut -= ptax;
      else {
        out.collected -= ptax;
        out.refunded += ptax;
        out.taxableSales -= Number(r.amount) || 0;
      }
    } else if (!refund && r.type !== "income" && p.claimable && cad) {
      out.claimable += ptax;
    }
  }
  out.taxableSales = r2(out.taxableSales);
  out.collected = r2(out.collected);
  out.claimable = r2(out.claimable);
  out.refunded = r2(out.refunded);
  out.usdLeftOut = r2(out.usdLeftOut);
  out.net = r2(out.collected - out.claimable);
  return out;
}
