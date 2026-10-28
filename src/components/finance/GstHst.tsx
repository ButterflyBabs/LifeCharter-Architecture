"use client";

import { useEffect, useState } from "react";
import { MoneyInput } from "@/components/finance/MoneyInput";
import { formatMoney, type Currency } from "@/lib/currency";
import { PROVINCES, PROVINCIAL_TAXES, OUTSIDE_LABEL, anyProvincial, cleanProvRegs, provincialFor, taxFor, isTaxPlace, type Province, type ProvRegs } from "@/lib/salesTax";

// GST/HST on finance entries (task 1520 follow-up), and QST / PST / RST (provincial follow-up). Everything here shows
// ONLY when the account is registered (Settings > Integrations); for everyone else the forms and lists look exactly
// as before.

type State = { registered: boolean; province: Province | null; provincial: ProvRegs };
let cached: State | null = null;
let pending: Promise<State> | null = null;

function fetchState(): Promise<State> {
  if (!pending) {
    pending = fetch("/api/account/sales-tax", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => ({
        registered: Boolean(d?.registered),
        province: d?.province && isTaxPlace(d.province) && d.province !== "OUTSIDE" ? (d.province as Province) : null,
        provincial: cleanProvRegs(d?.provincial),
      }))
      .catch(() => ({ registered: false, province: null, provincial: {} }))
      .then((s) => {
        cached = s;
        return s;
      });
  }
  return pending;
}

/** Whether this account records GST/HST, its home province, and its provincial registrations. Not registered until loaded. */
export function useSalesTax(): State {
  const [s, setS] = useState<State>(cached ?? { registered: false, province: null, provincial: {} });
  useEffect(() => {
    let live = true;
    if (cached) setS(cached);
    else void fetchState().then((x) => live && setS(x));
    return () => {
      live = false;
    };
  }, []);
  return s;
}

const RATES = [5, 13, 14, 15];

/** True when the sales tax box belongs on an add form: registered for GST/HST, or for a provincial tax. */
export function showTaxFields(s: State): boolean {
  return s.registered || anyProvincial(s.provincial);
}

const QST_RATE = PROVINCIAL_TAXES.find((p) => p.code === "QC")!.rate;
const hasPstReg = (regs: ProvRegs) => PROVINCIAL_TAXES.some((p) => !p.followsGst && regs[p.code]?.registered);
const pct = (amt: number, rate: number) => String(Math.round(amt * rate) / 100);

/**
 * The GST/HST box on an add form. value is the tax as a plain number string. On income, province is where the
 * customer is (it picks the rate); "Work it out" fills rate% of the amount.
 */
export function GstHstField(props: {
  type: "income" | "expense";
  amount: string;
  value: string;
  onChange: (v: string) => void;
  province?: string;
  onProvinceChange?: (p: string) => void;
  homeProvince?: Province | null;
  currency?: Currency;
  home?: Currency;
  /** "modal" uses the plain input look of the small add pop-up. */
  look?: "page" | "modal";
  /** The QST / PST / RST box (only shown when the account has a provincial registration). */
  provValue?: string;
  onProvChange?: (v: string) => void;
}) {
  const { type, amount, value, onChange, province = "", onProvinceChange, homeProvince, provValue = "", onProvChange } = props;
  const st = useSalesTax();
  const regs = st.provincial;
  // No provincial registration: exactly the GST/HST box as before.
  const provOn = anyProvincial(regs) && Boolean(onProvChange);
  const gstOn = st.registered || !provOn;
  const qstExpense = provOn && type === "expense" && Boolean(regs.QC?.registered);
  const pstTick = provOn && type === "income" && hasPstReg(regs);
  const [pstApplies, setPstApplies] = useState(true);
  // An expense with no QST box (e.g. switched from a sale) never keeps a provincial amount.
  useEffect(() => {
    if (type === "expense" && !qstExpense && provValue) onProvChange?.("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, qstExpense]);
  const startRate = province && isTaxPlace(province) ? taxFor(province).rate : homeProvince ? taxFor(homeProvince).rate : 13;
  const [rate, setRate] = useState<number>(RATES.includes(startRate) ? startRate : 5);
  const amt = Number(amount);
  const hasAmt = Number.isFinite(amt) && amt > 0;
  const work = (r = rate) => {
    if (!hasAmt) return;
    onChange(String(Math.round(amt * r) / 100));
  };
  // The provincial tax for where the customer is (income): QST always, PST/RST only when the tick is on.
  const fillProv = (place: string, applies = pstApplies) => {
    if (!provOn || !onProvChange) return;
    const line = place && isTaxPlace(place) ? provincialFor(place, regs, applies) : null;
    if (!line) return onProvChange("");
    if (hasAmt) onProvChange(pct(amt, line.rate));
  };
  const provKinds = Array.from(new Set(PROVINCIAL_TAXES.filter((p) => regs[p.code]?.registered).map((p) => p.kind))).join(" / ");
  const labelCls = props.look === "modal" ? "block text-xs font-medium text-gray-500" : "block text-xs font-medium text-[#b8a898] mb-1";
  const selectCls =
    props.look === "modal"
      ? "h-10 rounded-lg border border-[#1a2b4a]/20 bg-white px-2 text-sm text-[#1a2b4a]"
      : "h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]";
  return (
    <div className="mt-3 rounded-lg border border-[#2E7C83]/20 bg-[#2E7C83]/5 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {gstOn && (
          <div>
            <span className={labelCls}>GST/HST</span>
            <MoneyInput value={value} onChange={onChange} placeholder="0.00" aria-label="GST/HST" currency={props.currency} home={props.home} />
          </div>
        )}
        {provOn && type === "income" && (
          <div>
            <span className={labelCls}>{provKinds} you charged</span>
            <MoneyInput value={provValue} onChange={(v) => onProvChange?.(v)} placeholder="0.00" aria-label={`${provKinds} you charged`} currency={props.currency} home={props.home} />
          </div>
        )}
        {qstExpense && (
          <div>
            <span className={labelCls}>QST you paid (you can claim it back)</span>
            <MoneyInput value={provValue} onChange={(v) => onProvChange?.(v)} placeholder="0.00" aria-label="QST you paid" currency={props.currency} home={props.home} />
            <button
              type="button"
              onClick={() => hasAmt && onProvChange?.(pct(amt, QST_RATE))}
              disabled={!hasAmt}
              className="mt-1 text-[11px] font-medium text-[#2E7C83] hover:underline disabled:opacity-50"
            >
              Fill in {QST_RATE}% of the amount
            </button>
          </div>
        )}
        {type === "income" && onProvinceChange && (
          <label className={labelCls}>
            Where the customer is
            <select
              value={province}
              onChange={(e) => {
                const p = e.target.value;
                onProvinceChange(p);
                if (p === "OUTSIDE") {
                  onChange("0");
                  if (provOn) onProvChange?.("");
                } else if (p && isTaxPlace(p)) {
                  const r = taxFor(p).rate;
                  setRate(r);
                  if (gstOn && hasAmt) work(r);
                  fillProv(p);
                }
              }}
              className={`${selectCls} mt-1 w-full`}
            >
              <option value="">Not set</option>
              {PROVINCES.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.kind} {p.rate}%)
                </option>
              ))}
              <option value="OUTSIDE">{OUTSIDE_LABEL} (no GST/HST)</option>
            </select>
          </label>
        )}
      </div>
      {pstTick && (
        <label className="mt-2 flex items-start gap-2 text-xs text-[#3F4654] dark:text-[#e8e4f0]">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={pstApplies}
            onChange={(e) => {
              setPstApplies(e.target.checked);
              fillProv(province, e.target.checked);
            }}
          />
          <span>
            Provincial sales tax applies (BC, Saskatchewan, Manitoba). <span className="text-[#7b6b8d]">Most coaching and consulting is not taxable; software, digital products and goods often are. Ask your accountant.</span>
          </span>
        </label>
      )}
      <p className={`mt-1.5 text-[11px] text-[#7b6b8d] ${type === "expense" && !gstOn && !qstExpense ? "hidden" : ""}`}>
        {type === "income"
          ? provOn
            ? "The tax you charged, not part of the amount above. Choosing where the customer is fills it in."
            : "The tax you charged, not part of the amount above."
          : gstOn
            ? "GST/HST you paid that you can claim back (an input tax credit). Leave it at 0 if the receipt shows none."
            : qstExpense
              ? "Leave it at 0 if the receipt shows none."
              : ""}
      </p>
      {provOn && type === "expense" && hasPstReg(regs) && (
        <p className="mt-1 text-[11px] text-[#7b6b8d]">PST or RST you paid on a purchase can&apos;t be claimed back: it is part of the cost, so leave it in the amount above.</p>
      )}
      {gstOn && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#7b6b8d]">
          <span>Work it out:</span>
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))} aria-label="GST/HST rate" className={`${selectCls} h-8`}>
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r}%{r === 5 ? " GST" : " HST"}
              </option>
            ))}
          </select>
          <span>of the amount</span>
          <button
            type="button"
            onClick={() => {
              work();
              if (type === "income" && province) fillProv(province);
            }}
            disabled={!hasAmt}
            className="rounded-md border border-[#2E7C83]/40 px-2.5 py-1 font-medium text-[#2E7C83] hover:bg-[#2E7C83]/10 disabled:opacity-50"
          >
            Fill it in
          </button>
        </div>
      )}
    </div>
  );
}

/** "+ HST $13.00" (and "+ QST $9.98" / "+ PST $7.00") under an amount in a list, when the entry has sales tax. */
export function TaxNote({ taxAmount, provTaxAmount, province, type, currency, home }: { taxAmount?: number | null; provTaxAmount?: number | null; province?: string | null; type?: "income" | "expense"; currency: Currency; home: Currency }) {
  const t = Number(taxAmount ?? 0) || 0;
  const pt = Number(provTaxAmount ?? 0) || 0;
  if (t <= 0 && pt <= 0) return null;
  const word = province && isTaxPlace(province) && province !== "OUTSIDE" ? taxFor(province).kind : "GST/HST";
  // QST paid on an expense is QST wherever it was paid; on a sale it is the customer's province's tax.
  const pword = type === "expense" ? "QST" : PROVINCIAL_TAXES.find((p) => p.code === province)?.kind ?? "QST/PST";
  const cls = "block text-right text-[11px] font-normal text-[#7b6b8d]";
  return (
    <>
      {t > 0 && <span className={cls}>+ {word} {formatMoney(t, currency, { home, cents: true })}</span>}
      {pt > 0 && <span className={cls}>+ {pword} {formatMoney(pt, currency, { home, cents: true })}</span>}
    </>
  );
}

/**
 * The sales tax fields to post with a new entry: only when registered, and the province only on income. `provTax`
 * (the QST / PST box) is sent only when the form has one.
 */
export function taxBody(registered: boolean, type: "income" | "expense", tax: string, province: string, provTax?: string): Record<string, unknown> {
  if (!registered) return {};
  const n = Number(tax);
  const pn = Number(provTax);
  return {
    taxAmount: Number.isFinite(n) && n > 0 ? n : 0,
    ...(type === "income" && province ? { taxProvince: province } : {}),
    ...(provTax !== undefined ? { provTaxAmount: Number.isFinite(pn) && pn > 0 ? pn : 0 } : {}),
  };
}
