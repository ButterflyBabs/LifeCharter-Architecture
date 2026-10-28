"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PROVINCES } from "@/lib/salesTax";
import { useHomeCurrency } from "@/components/money/useHomeCurrency";

type S = { registered: boolean; businessNumber: string; province: string | null; frequency: string; registeredFrom: string | null };

// Canadian GST/HST (task 1520 follow-up): shown to Canadian-dollar accounts, or any account already registered.
export default function GstHstCard() {
  const { currency } = useHomeCurrency();
  const [s, setS] = useState<S | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    fetch("/api/account/sales-tax", { cache: "no-store" }).then((r) => r.json()).then(setS).catch(() => null);
  }, []);
  if (!s || (currency !== "cad" && !s.registered)) return null;

  const field = "w-full h-10 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";
  async function save() {
    if (!s) return;
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/account/sales-tax", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r?.ok) return setMsg({ ok: false, text: d.error || "Couldn't save. Please try again." });
    setS(d);
    setMsg({ ok: true, text: d.registered ? "Saved. New invoices, payment links and paid bookings now add GST/HST. If you made payment links before today, press Remake on each offer so they charge it too." : "Saved. GST/HST is off." });
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">GST/HST (Canadian sales tax)</h3>
        <p className="text-sm text-[#7a8a99]">
          If your business is registered for GST/HST, the Suite adds it to your invoices, payment links and paid
          bookings at the rate for your customer&apos;s province (no tax for customers outside Canada), records the tax
          apart from your income and expenses, and gives you a GST/HST report for each filing period at Finance, then
          GST/HST. You or your accountant still file the return with the CRA.
        </p>
        <label className="flex items-center gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
          <input type="checkbox" checked={s.registered} onChange={(e) => setS({ ...s, registered: e.target.checked })} />
          My business is registered for GST/HST
        </label>
        {s.registered && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              GST/HST number
              <Input value={s.businessNumber} onChange={(e) => setS({ ...s, businessNumber: e.target.value })} placeholder="123456789 RT0001" />
            </label>
            <label className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              Your business&apos;s province
              <select className={field} value={s.province ?? ""} onChange={(e) => setS({ ...s, province: e.target.value || null })}>
                <option value="">Choose…</option>
                {PROVINCES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              How often you file
              <select className={field} value={s.frequency} onChange={(e) => setS({ ...s, frequency: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Yearly</option>
              </select>
            </label>
            <label className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              Registered since (optional)
              <Input type="date" value={s.registeredFrom ?? ""} onChange={(e) => setS({ ...s, registeredFrom: e.target.value || null })} />
            </label>
          </div>
        )}
        <p className="text-xs text-[#7a8a99]">
          Not registered yet? A business generally has to register once its sales pass $30,000 over four calendar
          quarters in a row; the Suite warns you as you get close. Quebec sales tax (QST) and provincial sales tax in
          BC, Saskatchewan and Manitoba are not handled yet. This is a tool, not tax advice: please confirm your setup
          with your accountant.
        </p>
        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save GST/HST settings"}</Button>
        {msg && <p className={`text-sm ${msg.ok ? "text-green-700 dark:text-green-400" : "text-red-600"}`}>{msg.text}</p>}
      </CardContent>
    </Card>
  );
}
