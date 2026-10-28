import { currentBusiness } from "@/lib/businessScope";
import type { ActionCtx, ActionTool } from "./types";
import { nextAfter, type BillCadence } from "@/lib/finance/billDates";
import { formatMoney, isCurrency, toCurrency, type Currency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";
import { anyProvincial, isTaxPlace, periodsFor, PROVINCIAL_TAXES, taxFor } from "@/lib/salesTax";
import { gstSummary, provSummaries } from "@/lib/finance/gstServer";
import { lastEndedPeriod, placeName } from "@/lib/finance/gstReport";

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const FREQS: BillCadence[] = ["weekly", "biweekly", "monthly", "quarterly", "semiannual", "annual"];
// The entry's currency (task 1520): USD or CAD when the client said so, else the account's home currency.
const currencyOf = async (args: Record<string, unknown>, ctx: ActionCtx): Promise<{ currency: Currency; home: Currency }> => {
  const home = await homeCurrency(ctx.planId, ctx.db);
  return { currency: isCurrency(args.currency) ? toCurrency(args.currency) : home, home };
};
// GST/HST on the entry (task 1520 follow-up): the amount stays before tax; tax_amount is kept apart.
const taxOf = (args: Record<string, unknown>): { taxAmount: number; taxProvince: string | null } | { error: string } => {
  const raw = args.tax_amount;
  const n = raw === undefined || raw === null || raw === "" ? 0 : Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100_000_000) return { error: "I need the GST/HST as 0 or more." };
  const p = typeof args.tax_province === "string" ? args.tax_province.trim().toUpperCase() : "";
  if (p && !isTaxPlace(p)) return { error: "The province for the GST/HST should be a two-letter code (like ON) or OUTSIDE." };
  return { taxAmount: Math.round(n * 100) / 100, taxProvince: p || null };
};
// QST / PST / RST on the entry (provincial follow-up): kept apart too, in prov_tax_amount.
const provTaxOf = (args: Record<string, unknown>): number | { error: string } => {
  const raw = args.prov_tax_amount;
  const n = raw === undefined || raw === null || raw === "" ? 0 : Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100_000_000) return { error: "I need the QST / PST as 0 or more." };
  return Math.round(n * 100) / 100;
};
const recurringOf = (args: Record<string, unknown>) => args.type === "expense" && args.payment_type === "recurring" && FREQS.includes(args.frequency as BillCadence);

export const addFinanceEntry: ActionTool = {
  name: "add_finance_entry",
  kind: "write",
  apiPath: "/api/finance/entries",
  description: "Record one income or expense entry in the client's finance ledger (amount in the account's home currency unless the client says US or Canadian dollars, date YYYY-MM-DD, optional category and note). For an account registered for Canadian GST/HST, amount is BEFORE tax and tax_amount is the GST/HST charged (income) or paid (expense); never fold the tax into amount. For an account registered for Quebec QST or BC/Saskatchewan/Manitoba PST, prov_tax_amount is that provincial tax charged (income), or QST paid (expense; PST paid stays in amount as part of the cost). The client approves first.",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["income", "expense"] },
      amount: { type: "number", description: "Positive, in the currency below." },
      currency: { type: "string", enum: ["usd", "cad"], description: "Only when the client says the money was in US dollars (usd) or Canadian dollars (cad). Leave out to use their home currency. Never convert." },
      date: { type: "string", description: "YYYY-MM-DD (the day it happened)." },
      category: { type: "string" },
      description: { type: "string" },
      vendor: { type: "string", description: "Who was paid (expense) or who it came from (income)." },
      payment_type: { type: "string", enum: ["one_time", "recurring"], description: "Expenses only. Default one_time." },
      frequency: { type: "string", enum: ["weekly", "biweekly", "monthly", "quarterly", "semiannual", "annual"], description: "Only when recurring." },
      renewal: { type: "string", enum: ["auto", "manual"], description: "Only when recurring: auto-renews, or the client renews it by hand." },
      tax_amount: { type: "number", description: "Optional GST/HST in the same currency: charged to the customer (income) or paid on the purchase (expense, which they can claim back). Not part of amount." },
      tax_province: { type: "string", enum: ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT", "OUTSIDE"], description: "Income only, optional: the customer's province, or OUTSIDE for outside Canada." },
      prov_tax_amount: { type: "number", description: "Optional QST, PST or RST in the same currency: charged to the customer (income, with tax_province set to their province) or QST paid on a purchase (expense, which a Quebec registrant can claim back). Not part of amount, and not part of tax_amount." },
    },
    required: ["type", "amount", "date"],
  },
  plan: async (args, ctx) => {
    const amount = Number(args.amount);
    if (!(args.type === "income" || args.type === "expense")) return { error: "Is it income or an expense?" };
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) return { error: "I need the amount as a positive number." };
    const date = str(args.date, 10);
    if (!isDay(date)) return { error: "I need the date as a real date." };
    const { currency, home } = await currencyOf(args, ctx);
    const tax = taxOf(args);
    if ("error" in tax) return { error: tax.error };
    const ptax = provTaxOf(args);
    if (typeof ptax !== "number") return { error: ptax.error };
    const taxLine = tax.taxAmount > 0 ? [`GST/HST: ${formatMoney(tax.taxAmount, currency, { home, cents: true })}${tax.taxProvince ? ` (${placeName(tax.taxProvince)})` : ""}, kept apart from the amount`] : [];
    const pword = args.type === "expense" ? "QST" : PROVINCIAL_TAXES.find((p) => p.code === tax.taxProvince)?.kind ?? "QST / PST";
    if (ptax > 0) taxLine.push(`${pword}: ${formatMoney(ptax, currency, { home, cents: true })}, kept apart from the amount`);
    return {
      preview: {
        title: `Record ${args.type === "income" ? "income" : "an expense"}: ${formatMoney(amount, currency, { home })}`,
        lines: [`Date: ${date}`, ...(str(args.category, 80) ? [`Category: ${str(args.category, 80)}`] : []), ...(str(args.description, 200) ? [`Note: ${str(args.description, 200)}`] : []), ...(str(args.vendor, 120) ? [`${args.type === "income" ? "From" : "Paid to"}: ${str(args.vendor, 120)}`] : []), ...(recurringOf(args) ? [`Recurring: ${args.frequency}${args.renewal === "manual" ? ", renewed manually" : ", auto-renews"}`] : []), ...taxLine],
      },
    };
  },
  run: async (args, ctx) => {
    const amount = Math.round(Number(args.amount) * 100) / 100;
    const recurring = recurringOf(args);
    const vendor = str(args.vendor, 120) || null;
    const { currency, home } = await currencyOf(args, ctx);
    const tax = taxOf(args);
    if ("error" in tax) throw new Error(tax.error);
    const ptax = provTaxOf(args);
    if (typeof ptax !== "number") throw new Error(ptax.error);
    // Added while a business is chosen in the header: it belongs to that business.
    const assistantBusinessId = (await currentBusiness(ctx.planId).catch(() => null))?.businessId ?? null;
    // A recurring expense also becomes a bill so its next renewal shows on the Bills & cash calendar.
    let billId: string | null = null;
    if (recurring) {
      const next = nextAfter(str(args.date, 10), args.frequency as BillCadence);
      if (next) {
        const { data: bill } = await ctx.db
          .from("finance_bills")
          .insert({
            master_plan_id: ctx.planId,
            name: (vendor || str(args.category, 80) || str(args.description, 120) || "Recurring expense").slice(0, 120),
            vendor,
            amount,
            currency,
            category: str(args.category, 80) || null,
            cadence: args.frequency,
            next_due: next,
            autopay: args.renewal !== "manual",
            notes: str(args.description, 200) || null,
            last_paid_on: str(args.date, 10),
            business_id: assistantBusinessId,
          })
          .select("id")
          .single();
        billId = (bill?.id as string) ?? null;
      }
    }
    const { data, error } = await ctx.db
      .from("finance_entries")
      .insert({
        master_plan_id: ctx.planId,
        type: args.type === "income" ? "income" : "expense",
        amount,
        currency,
        category: str(args.category, 80) || null,
        description: str(args.description, 200) || null,
        occurred_on: str(args.date, 10),
        source: "assistant",
        vendor,
        payment_type: recurring ? "recurring" : "one_time",
        frequency: recurring ? (args.frequency as string) : null,
        renewal: recurring ? (args.renewal === "manual" ? "manual" : "auto") : null,
        bill_id: billId,
        business_id: assistantBusinessId,
        tax_amount: tax.taxAmount,
        tax_province: args.type === "income" ? tax.taxProvince : null,
        prov_tax_amount: ptax,
      })
      .select("id")
      .single();
    if (error || !data) {
      if (billId) await ctx.db.from("finance_bills").delete().eq("id", billId);
      throw new Error("The entry didn't save.");
    }
    return { summary: `Recorded ${args.type === "income" ? "income" : "an expense"} of ${formatMoney(amount, currency, { home })}${recurring ? " and added its next renewal to Bills" : ""}.`, result: { id: data.id }, undo: { id: data.id, billId } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("finance_entries").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    if (u.billId) await ctx.db.from("finance_bills").delete().eq("id", u.billId as string).eq("master_plan_id", ctx.planId);
    return "Removed the entry.";
  },
};

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** A period the client named ("Q3 2026", "September 2026", "2025", "last", a YYYY-MM-DD inside it) for their frequency. */
function namedPeriod(frequency: "monthly" | "quarterly" | "annual", raw: string, today: string): string | null {
  const s = raw.trim().toLowerCase();
  if (!s || s === "current" || s === "this") return null;
  const year = Number((s.match(/\b(20\d\d)\b/) || [])[1]) || Number(today.slice(0, 4));
  const all = periodsFor(frequency, year);
  const day = (s.match(/\b(\d{4}-\d{2}-\d{2})\b/) || [])[1];
  const within = (d: string) => all.find((p) => d >= p.start && d <= p.end) ?? periodsFor(frequency, Number(d.slice(0, 4))).find((p) => d >= p.start && d <= p.end);
  if (day) return within(day)?.start ?? null;
  if (/^(last|previous)\b/.test(s)) return lastEndedPeriod(frequency, today).start;
  const q = s.match(/\bq([1-4])\b/);
  if (q) return within(`${year}-${String((Number(q[1]) - 1) * 3 + 1).padStart(2, "0")}-01`)?.start ?? null;
  const mi = MONTHS.findIndex((m) => s.includes(m) || s.includes(m.slice(0, 3)));
  if (mi >= 0) return within(`${year}-${String(mi + 1).padStart(2, "0")}-01`)?.start ?? null;
  if (/^20\d\d$/.test(s)) return all[0].start;
  return null;
}

export { namedPeriod as gstNamedPeriod };

export const gstHstSummary: ActionTool = {
  name: "gst_hst_summary",
  kind: "read",
  apiPath: "/api/finance/gst-hst",
  description:
    "The client's Canadian GST/HST return numbers for one filing period (default the current one): sales before tax (line 101), GST/HST collected (line 103), GST/HST paid they can claim back (line 106), net tax to pay or refund (line 109), file-by and pay-by dates, tax collected per province, US-dollar money left out, and CAD sales with no GST/HST recorded. Only Canadian-dollar entries count; never convert. A guide for their accountant, not tax advice. Says so when the account is not registered for GST/HST. Also gives each provincial registration (Quebec QST, BC/Saskatchewan PST, Manitoba RST) for its own filing period: sales taxed, tax collected, QST they can claim back, net to pay, due dates.",
  parameters: {
    type: "object",
    properties: {
      period: { type: "string", description: "Optional: 'current' (default), 'last', 'Q3 2026', 'September 2026', '2025', or a YYYY-MM-DD inside the period." },
    },
  },
  read: async (args, ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    const first = await gstSummary(ctx.planId, { db: ctx.db, today });
    const provLines = await provincialLines(ctx, first.settings, typeof args.period === "string" ? args.period : "", today);
    if (!first.registered || !first.report) {
      if (provLines.length) return ["GST/HST is not turned on for this account (Settings > Integrations > GST/HST).", ...provLines].join("\n");
      return "GST/HST is not turned on for this account (Settings > Integrations > GST/HST). There is no return to report. If their sales in Canadian dollars are near $30,000 over four quarters, they may need to register: suggest their accountant.";
    }
    const start = namedPeriod(first.settings.frequency, typeof args.period === "string" ? args.period : "", today);
    const s = start && start !== first.report.period.start ? await gstSummary(ctx.planId, { db: ctx.db, today, start }) : first;
    const r = s.report!;
    const cad = (n: number) => formatMoney(n, "cad", { home: "cad", cents: true });
    const usd = (n: number) => formatMoney(n, "usd", { home: "cad", cents: true });
    const L = r.ret;
    const prov = Object.entries(L.byProvince).map(([p, n]) => `${placeName(p)}${isTaxPlace(p) && p !== "OUTSIDE" ? ` ${taxFor(p).kind}` : ""} ${cad(n)}`);
    const usdBits = [L.usdLeftOut.sales > 0 && `${usd(L.usdLeftOut.sales)} sales`, L.usdLeftOut.tax > 0 && `${usd(L.usdLeftOut.tax)} GST/HST collected`, L.usdLeftOut.taxPaid > 0 && `${usd(L.usdLeftOut.taxPaid)} GST/HST paid`].filter(Boolean);
    return [
      `GST/HST for ${r.period.label} (${r.period.start} to ${r.period.end}), filing ${s.settings.frequency}${s.settings.businessNumber ? `, ${s.settings.businessNumber}` : ""}:`,
      `- Sales before tax (line 101): ${cad(L.line101)}`,
      `- GST/HST collected (line 103): ${cad(L.line103)}`,
      `- GST/HST paid they can claim back (line 106): ${cad(L.line106)}`,
      `- Net tax (line 109): ${L.line109 >= 0 ? `${cad(L.line109)} to pay` : `${cad(-L.line109)} refund`}`,
      `- File by ${r.period.fileBy}, pay by ${r.period.payBy}`,
      `- Collected by province: ${prov.length ? prov.join("; ") : "none"}`,
      ...(L.refunds.tax > 0 ? [`- Refunds already taken off: ${cad(L.refunds.sales)} sales, ${cad(L.refunds.tax)} tax`] : []),
      `- US-dollar money left out (the CRA needs Canadian dollars; their accountant converts): ${usdBits.length ? usdBits.join(", ") : "none"}`,
      `- CAD sales with no GST/HST recorded to check (zero-rated, outside Canada, or tax missing): ${r.check.length}`,
      "Full report and CSV for the accountant: /finance/gst-hst. Not tax advice; adjustments (lines 104 and 107) are for their accountant.",
      ...provLines,
    ].join("\n");
  },
};

/** Each provincial registration's lines for the period the client named (each in its own filing frequency). */
async function provincialLines(ctx: ActionCtx, settings: Awaited<ReturnType<typeof gstSummary>>["settings"], period: string, today: string): Promise<string[]> {
  if (!anyProvincial(settings.provincial)) return [];
  const starts: Record<string, string | null> = {};
  for (const t of PROVINCIAL_TAXES) {
    const reg = settings.provincial[t.code];
    if (reg?.registered) starts[t.code] = namedPeriod(reg.frequency, period, today);
  }
  const all = await provSummaries(ctx.planId, { db: ctx.db, today, settings, starts });
  const cad = (n: number) => formatMoney(n, "cad", { home: "cad", cents: true });
  const usd = (n: number) => formatMoney(n, "usd", { home: "cad", cents: true });
  const out: string[] = [];
  for (const { section: x } of all) {
    const r = x.ret;
    out.push(
      `${x.title} for ${x.period.label} (${x.period.start} to ${x.period.end}), filing ${x.frequency}${x.number ? `, ${x.number}` : ""}:`,
      `- Sales taxed (before tax): ${cad(r.taxableSales)}`,
      `- ${x.kind} collected${r.refunded > 0 ? ` (after ${cad(r.refunded)} given back on refunds)` : ""}: ${cad(r.collected)}`,
      ...(x.claimable ? [`- QST paid they can claim back (input tax refunds): ${cad(r.claimable)}`] : []),
      `- ${x.claimable ? "Net QST" : `${x.kind} to pay`}: ${r.net >= 0 ? `${cad(r.net)} to pay` : `${cad(-r.net)} refund`}`,
      `- File by ${x.period.fileBy}, pay by ${x.period.payBy} (same dates as GST/HST; ${x.province === "QC" ? "Revenu Québec's" : "the province's"} own due date can differ, so confirm with their accountant)`,
      ...(r.usdLeftOut ? [`- US-dollar ${x.kind} left out: ${usd(r.usdLeftOut)}`] : []),
    );
  }
  if (out.length) out.push("Provincial sections and CSVs: /finance/gst-hst. Not tax advice.");
  return out;
}

export const FINANCE_TOOLS: ActionTool[] = [addFinanceEntry, gstHstSummary];
