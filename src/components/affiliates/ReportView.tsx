import type { AffiliateReport } from "@/lib/affiliates";

// One affiliate's month, laid out the same everywhere (their portal, their in-app
// partnership view, and the owner's view). No hooks: works in server and client pages.
const money = (n: number) => (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
const day = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const monthLabel = (m: string) => new Date(`${m}-15T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default function ReportView({ r }: { r: AffiliateReport }) {
  const stat = "rounded-xl border border-[#EADFCF] bg-white p-3 dark:bg-[#1a2b4a]/30 dark:border-white/10";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Clicks", value: String(r.clicks) },
          { label: "People referred", value: String(r.referrals.length) },
          { label: "Sales", value: `${r.sales.length} · ${money(r.month_totals.revenue)}` },
          { label: "Commission earned", value: money(r.month_totals.commission) },
          { label: "Paid this month", value: money(r.month_totals.paid) },
        ].map((s) => (
          <div key={s.label} className={stat}>
            <p className="text-lg font-semibold text-[#1F3A3D] dark:text-[#F8F5F0]">{s.value}</p>
            <p className="text-xs text-[#7a8a99]">{s.label}</p>
          </div>
        ))}
      </div>
      {r.month_totals.pending > 0 && <p className="text-xs text-[#6b5410]">{r.month_totals.pending} sale{r.month_totals.pending === 1 ? " is" : "s are"} being confirmed.</p>}

      {r.byLink.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-semibold text-[#1F3A3D] dark:text-[#F8F5F0]">Your links, all time</p>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[#7a8a99]"><tr><th className="pb-1">Link</th><th className="pb-1">Expires</th><th className="pb-1 text-right">Clicks</th><th className="pb-1 text-right">Referred</th><th className="pb-1 text-right">Sales</th><th className="pb-1 text-right">Commission</th></tr></thead>
            <tbody className="divide-y divide-[#F0E8DA] dark:divide-white/10">
              {r.byLink.map((l) => (
                <tr key={l.code}><td className="py-1.5">{l.product}</td><td className="py-1.5 whitespace-nowrap">{l.expiresAt ? day(l.expiresAt) : "—"}</td><td className="py-1.5 text-right">{l.clicks}</td><td className="py-1.5 text-right">{l.referrals}</td><td className="py-1.5 text-right">{money(l.revenue)}</td><td className="py-1.5 text-right">{money(l.commission)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {r.byProduct.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-semibold text-[#1F3A3D] dark:text-[#F8F5F0]">By product</p>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[#7a8a99]"><tr><th className="pb-1">Product</th><th className="pb-1 text-right">Sales</th><th className="pb-1 text-right">Revenue</th><th className="pb-1 text-right">Commission</th></tr></thead>
            <tbody className="divide-y divide-[#F0E8DA] dark:divide-white/10">
              {r.byProduct.map((p) => (
                <tr key={p.product}><td className="py-1.5">{p.product}</td><td className="py-1.5 text-right">{p.sales}</td><td className="py-1.5 text-right">{money(p.amount)}</td><td className="py-1.5 text-right">{money(p.commission)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-[#1F3A3D] dark:text-[#F8F5F0]">Sales</p>
          {r.sales.length ? (
            <ul className="divide-y divide-[#F0E8DA] text-sm dark:divide-white/10">
              {r.sales.map((s, i) => (
                <li key={i} className="flex justify-between gap-2 py-1.5">
                  <span>{day(s.date)} · {s.description}</span>
                  <span className="whitespace-nowrap">{s.status === "review" ? "being confirmed" : `${money(s.commission)} · ${s.status === "owed" && s.payableOn ? `payable ${day(s.payableOn)}` : s.status}`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#7a8a99]">No sales this month.</p>
          )}
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-[#1F3A3D] dark:text-[#F8F5F0]">People referred</p>
          {r.referrals.length ? (
            <ul className="divide-y divide-[#F0E8DA] text-sm dark:divide-white/10">
              {r.referrals.map((x, i) => (
                <li key={i} className="flex justify-between py-1.5"><span>{x.firstName} · {x.kind === "booking" ? "booked a call" : x.kind === "manual" ? "credited" : "signed up"}</span><span className="text-[#7a8a99]">{day(x.date)}</span></li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#7a8a99]">No one this month.</p>
          )}
        </div>
      </div>

      <p className="text-xs text-[#7a8a99]">
        All time: {r.lifetime.clicks} clicks · {r.lifetime.referrals} referred · {money(r.lifetime.revenue)} in sales · {money(r.lifetime.commissionPaid)} paid · {money(r.lifetime.commissionOwed)} owed now
      </p>
    </div>
  );
}
