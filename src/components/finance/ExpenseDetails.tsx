"use client";

import { Input } from "@/components/ui/Input";
import { CADENCE_LABEL, type BillCadence } from "@/lib/finance/billDates";

export type PaymentType = "one_time" | "recurring";
export type Renewal = "auto" | "manual";
export type Frequency = Exclude<BillCadence, "once">;

export const FREQUENCIES: Frequency[] = ["weekly", "biweekly", "monthly", "quarterly", "semiannual", "annual"];

const selectCls =
  "w-full h-10 px-3 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]";
const pill = (on: boolean) =>
  `px-3 py-1.5 text-sm rounded-lg border ${on ? "border-[#b06a5a] bg-[#b06a5a]/10 text-[#b06a5a]" : "border-[#1a2b4a]/15 text-[#b8a898]"}`;

/** A short badge for lists: "Recurring · Monthly · Auto-renews" (or "" for a one-time payment). */
export function recurringBadge(e: { paymentType?: string; frequency?: string | null; renewal?: string | null }): string {
  if (e.paymentType !== "recurring") return "";
  const f = e.frequency ? CADENCE_LABEL[e.frequency as BillCadence] : "";
  const r = e.renewal === "manual" ? "Renew manually" : e.renewal === "auto" ? "Auto-renews" : "";
  return ["Recurring", f, r].filter(Boolean).join(" · ");
}

/**
 * The expense-only fields: who was paid, one-time or recurring, how often, and how it renews.
 * Shared by the Financial Pulse add form and the Expenses page so they stay identical.
 */
export function ExpenseDetails(props: {
  vendor: string;
  setVendor: (v: string) => void;
  paymentType: PaymentType;
  setPaymentType: (v: PaymentType) => void;
  frequency: Frequency;
  setFrequency: (v: Frequency) => void;
  renewal: Renewal;
  setRenewal: (v: Renewal) => void;
}) {
  const { vendor, setVendor, paymentType, setPaymentType, frequency, setFrequency, renewal, setRenewal } = props;
  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#b8a898] mb-1">Paid to (vendor or person)</label>
          <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Zoom, Canva, Jane Smith" maxLength={120} />
        </div>
        <div>
          <span className="block text-xs font-medium text-[#b8a898] mb-1">Type of payment</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPaymentType("one_time")} className={pill(paymentType === "one_time")}>
              One-time
            </button>
            <button type="button" onClick={() => setPaymentType("recurring")} className={pill(paymentType === "recurring")}>
              Recurring
            </button>
          </div>
        </div>
      </div>
      {paymentType === "recurring" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-[#b06a5a]/25 bg-[#b06a5a]/5 p-3">
          <div>
            <label className="block text-xs font-medium text-[#b8a898] mb-1">How often</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)} className={selectCls}>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {CADENCE_LABEL[f]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-xs font-medium text-[#b8a898] mb-1">Renewal</span>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => setRenewal("auto")} className={pill(renewal === "auto")}>
                Auto-renews
              </button>
              <button type="button" onClick={() => setRenewal("manual")} className={pill(renewal === "manual")}>
                I renew it manually
              </button>
            </div>
          </div>
          <p className="sm:col-span-2 text-[11px] text-[#7b6b8d]">
            The next renewal is added to your Bills &amp; cash calendar, so you can see what&apos;s coming
            {renewal === "manual" ? " and mark it paid when you renew." : "."}
          </p>
        </div>
      )}
    </div>
  );
}
