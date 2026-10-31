"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { CURRENCIES, CURRENCY_NAMES, type Currency } from "@/lib/currency";
import { setHomeCurrencyCache, useHomeCurrency } from "@/components/money/useHomeCurrency";

// The account's home currency (task 1520): what new offers, bills and money entries start in. Each item can still be
// set to the other currency, and the two are always totalled separately, never converted.
export default function CurrencyCard() {
  const { currency, canChoose } = useHomeCurrency();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!canChoose) return null;

  async function save(next: Currency) {
    if (next === currency) return;
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/account/currency", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currency: next }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r?.ok) {
      setMsg({ ok: false, text: d.error || "Couldn't save the currency. Please try again." });
      return;
    }
    setHomeCurrencyCache(next);
    setMsg({ ok: true, text: `Saved. New offers, bills and money entries now start in ${CURRENCY_NAMES[next]}. Nothing you already have changed.` });
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Currency</h3>
        <p className="text-sm text-[#7a8a99]">
          Your main currency. New offers, invoices, bills and money entries start in it, and you can switch any one of
          them to the other currency. US and Canadian dollars are always kept separate: each has its own totals, and
          the Suite never converts one into the other.
        </p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Main currency">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={currency === c}
              disabled={busy}
              onClick={() => save(c)}
              className={`px-4 py-2 rounded-lg border text-sm ${currency === c ? "border-[#c9a227] bg-[#c9a227]/10 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]" : "border-[#1a2b4a]/20 text-[#1a2b4a]/80 dark:text-[#F8F5F0]/80"}`}
            >
              {CURRENCY_NAMES[c]}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#7a8a99]">
          Getting paid in Canadian dollars: Stripe pays you in your Stripe account&apos;s own currency. To receive
          Canadian dollars without conversion, connect a Canadian Stripe account (a Canadian business and bank
          account). A US Stripe account can still charge in CAD, but Stripe converts it to US dollars and charges a
          conversion fee.
        </p>
        {msg && <p className={`text-sm ${msg.ok ? "text-green-700 dark:text-green-400" : "text-red-600"}`}>{msg.text}</p>}
      </CardContent>
    </Card>
  );
}
