"use client";

import { useEffect, useState } from "react";
import { MoneyInput } from "@/components/finance/MoneyInput";
import { formatMoney, type Currency } from "@/lib/currency";
import { PROVINCES, OUTSIDE_LABEL, taxFor, isTaxPlace, type Province } from "@/lib/salesTax";

// GST/HST on finance entries (task 1520 follow-up). Everything here shows ONLY when the account is registered for
// GST/HST (Settings > Integrations); for everyone else the forms and lists look exactly as before.

type State = { registered: boolean; province: Province | null };
let cached: State | null = null;
let pending: Promise<State> | null = null;

function fetchState(): Promise<State> {
  if (!pending) {
    pending = fetch("/api/account/sales-tax", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => ({ registered: Boolean(d?.registered), province: d?.province && isTaxPlace(d.province) && d.province !== "OUTSIDE" ? (d.province as Province) : null }))
      .catch(() => ({ registered: false, province: null }))
      .then((s) => {
        cached = s;
        return s;
      });
  }
  return pending;
}

/** Whether this account records GST/HST, and its home province. Not registered until loaded. */
export function useSalesTax(): State {
  const [s, setS] = useState<State>(cached ?? { registered: false, province: null });
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
}) {
  const { type, amount, value, onChange, province = "", onProvinceChange, homeProvince } = props;
  const startRate = province && isTaxPlace(province) ? taxFor(province).rate : homeProvince ? taxFor(homeProvince).rate : 13;
  const [rate, setRate] = useState<number>(RATES.includes(startRate) ? startRate : 5);
  const amt = Number(amount);
  const work = (r = rate) => {
    if (!Number.isFinite(amt) || amt <= 0) return;
    onChange(String(Math.round(amt * r) / 100));
  };
  const labelCls = props.look === "modal" ? "block text-xs font-medium text-gray-500" : "block text-xs font-medium text-[#b8a898] mb-1";
  const selectCls =
    props.look === "modal"
      ? "h-10 rounded-lg border border-[#1a2b4a]/20 bg-white px-2 text-sm text-[#1a2b4a]"
      : "h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]";
  return (
    <div className="mt-3 rounded-lg border border-[#2E7C83]/20 bg-[#2E7C83]/5 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <span className={labelCls}>GST/HST</span>
          <MoneyInput value={value} onChange={onChange} placeholder="0.00" aria-label="GST/HST" currency={props.currency} home={props.home} />
        </div>
        {type === "income" && onProvinceChange && (
          <label className={labelCls}>
            Where the customer is
            <select
              value={province}
              onChange={(e) => {
                const p = e.target.value;
                onProvinceChange(p);
                if (p === "OUTSIDE") onChange("0");
                else if (p && isTaxPlace(p)) {
                  const r = taxFor(p).rate;
                  setRate(r);
                  if (Number.isFinite(amt) && amt > 0) work(r);
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
      <p className="mt-1.5 text-[11px] text-[#7b6b8d]">
        {type === "income"
          ? "The tax you charged, not part of the amount above."
          : "GST/HST you paid that you can claim back (an input tax credit). Leave it at 0 if the receipt shows none."}
      </p>
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
          onClick={() => work()}
          disabled={!(Number.isFinite(amt) && amt > 0)}
          className="rounded-md border border-[#2E7C83]/40 px-2.5 py-1 font-medium text-[#2E7C83] hover:bg-[#2E7C83]/10 disabled:opacity-50"
        >
          Fill it in
        </button>
      </div>
    </div>
  );
}

/** "+ HST $13.00" under an amount in a list, when the entry has GST/HST. */
export function TaxNote({ taxAmount, province, currency, home }: { taxAmount?: number | null; province?: string | null; currency: Currency; home: Currency }) {
  const t = Number(taxAmount ?? 0) || 0;
  if (t <= 0) return null;
  const word = province && isTaxPlace(province) && province !== "OUTSIDE" ? taxFor(province).kind : "GST/HST";
  return <span className="block text-right text-[11px] font-normal text-[#7b6b8d]">+ {word} {formatMoney(t, currency, { home, cents: true })}</span>;
}

/** The GST/HST fields to post with a new entry: only when registered, and the province only on income. */
export function taxBody(registered: boolean, type: "income" | "expense", tax: string, province: string): Record<string, unknown> {
  if (!registered) return {};
  const n = Number(tax);
  return { taxAmount: Number.isFinite(n) && n > 0 ? n : 0, ...(type === "income" && province ? { taxProvince: province } : {}) };
}
