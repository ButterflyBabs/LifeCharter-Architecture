"use client";

import { useCallback, useEffect, useState } from "react";
import { Handshake, Plus, X, Copy, CheckCircle, ExternalLink, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import ContactLookupInput, { lookupName } from "@/components/crm/ContactLookupInput";
import DmPipeline from "../dm-pipeline/DmPipeline";
import MonthlyReport from "@/components/affiliates/MonthlyReport";

type Affiliate = {
  id: string;
  name: string;
  email: string | null;
  code: string;
  status: "active" | "paused";
  default_rate: number | null;
  payout_delay_days?: number | null;
  contact_id: string | null;
  portal_token: string;
  landing_url: string | null;
  clicks: number;
  referrals: number;
  salesCount: number;
  revenue: number;
  owed: number;
  paid: number;
  review: number;
};
type Offer = { id: string; name: string; price: number | null; affiliate_rate: number | null; status: string | null };
type Earning = { id: string; amount: number; earned_on: string; status: "expected" | "paid"; note: string | null };
type Program = { id: string; name: string; website: string | null; my_link: string | null; my_code: string | null; commission_terms: string | null; login_url: string | null; status: string; notes: string | null; earnings: Earning[]; expected: number; paid: number };
type Sale = { id: string; description: string; amount: number; rate: number | null; commission: number; sale_date: string; payable_on?: string | null; status: "review" | "owed" | "paid" | "void"; source: string; offer_id: string | null };
type Referral = { id: string; kind: string; source: string | null; created_at: string; seq_contacts: { id: string; first_name: string | null; last_name: string | null; email: string } | null };

const TABS = [
  { id: "recruit", label: "Recruiting" },
  { id: "mine", label: "My affiliates" },
  { id: "programs", label: "Programs I promote" },
  { id: "partner", label: "My partnerships" },
] as const;
type Partnership = { id: string; business: string; code: string; status: string; link: string };
const APP = "https://lccommandsuite.com";
const money = (n: number) => (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
const box = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";
const LOOKUP = "flex h-10 w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] placeholder:text-[#b8a898] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50 focus:border-[#c9a227] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]";
const day = (d: string) => new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-label={title} className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#15233d]`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-[#1a2b4a]/5"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
      className="inline-flex items-center gap-1 rounded-lg border border-[#1a2b4a]/15 px-2 py-1 text-xs text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:text-[#F8F5F0]"
    >
      {done ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {done ? "Copied" : label}
    </button>
  );
}

export default function Affiliates() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("mine");
  const [affiliates, setAffiliates] = useState<Affiliate[] | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [msg, setMsg] = useState("");
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [programEdit, setProgramEdit] = useState<Partial<Program> | null>(null);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [partnerId, setPartnerId] = useState<string>("");

  useEffect(() => {
    try {
      const t = localStorage.getItem("affiliates-tab");
      if (t === "recruit" || t === "mine" || t === "programs" || t === "partner") setTab(t);
    } catch {
      /* none */
    }
  }, []);

  const load = useCallback(async () => {
    const d = await fetch("/api/affiliates", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    if (d.error) setMsg(d.error);
    setAffiliates(d.affiliates ?? []);
    setOffers(d.offers ?? []);
    setPrograms(d.programs ?? []);
  }, []);
  useEffect(() => {
    void load();
    // Is the signed-in person someone's affiliate (LifeCharter's, for most clients)?
    fetch("/api/affiliates/mine", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setPartnerships(d.partnerships ?? []); if (d.affiliateId) setPartnerId(d.affiliateId); })
      .catch(() => {});
  }, [load]);

  async function post(body: Record<string, unknown>) {
    const r = await fetch("/api/affiliates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(d.error || "Something went wrong.");
      return null;
    }
    return d;
  }

  const totals = (affiliates ?? []).reduce((t, a) => ({ owed: t.owed + a.owed, paid: t.paid + a.paid, revenue: t.revenue + a.revenue, clicks: t.clicks + a.clicks, referrals: t.referrals + a.referrals }), { owed: 0, paid: 0, revenue: 0, clicks: 0, referrals: 0 });

  return (
    <div className="py-8 px-4 sm:px-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a227] to-[#1a2b4a] flex items-center justify-center">
          <Handshake className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Affiliates</h1>
          <p className="text-[#7a8a99]">Recruit partners, give each a tracked link, pay commissions by product, and keep the programs you promote in one place.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5" role="tablist">
        {TABS.filter((t) => t.id !== "partner" || partnerships.length > 0).map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => { setTab(t.id); try { localStorage.setItem("affiliates-tab", t.id); } catch { /* none */ } }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === t.id ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <button onClick={() => setMsg("")} className="mb-4 block w-full text-left rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm">
          {msg}
        </button>
      )}

      {tab === "recruit" && (
        <div>
          <p className="mb-3 text-sm text-[#5a6472] dark:text-[#b8c2cf]">Track people you&rsquo;d like as affiliates. Drag them to <strong>Active affiliate</strong> and they&rsquo;re added to My affiliates with their own link.</p>
          <DmPipeline purpose="affiliate" embedded />
        </div>
      )}

      {tab === "mine" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Affiliates", value: String((affiliates ?? []).filter((a) => a.status === "active").length) },
              { label: "Clicks", value: String(totals.clicks) },
              { label: "Referred", value: String(totals.referrals) },
              { label: "Commission owed", value: money(totals.owed) },
              { label: "Commission paid", value: money(totals.paid) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/30 p-4">
                <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.value}</p>
                <p className="text-xs text-[#7a8a99]">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/30 p-4">
            <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Commission by product</p>
            <p className="mb-3 text-xs text-[#7a8a99]">The % an affiliate earns on each offer. You can set a different % for any one affiliate on their page.</p>
            {offers.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {offers.map((o) => (
                  <label key={o.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#1a2b4a]/10 px-3 py-2 text-sm">
                    <span className="min-w-0">
                      <span className="block font-medium text-[#1a2b4a] dark:text-[#F8F5F0] truncate">{o.name}</span>
                      {o.price != null && <span className="text-xs text-[#7a8a99]">{money(Number(o.price))}</span>}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={o.affiliate_rate ?? ""}
                        placeholder="—"
                        aria-label={`${o.name} commission %`}
                        onBlur={async (e) => {
                          const v = e.target.value;
                          if (String(o.affiliate_rate ?? "") === v) return;
                          if (await post({ action: "offer-rate", offerId: o.id, rate: v === "" ? null : Number(v) })) setOffers((os) => os.map((x) => (x.id === o.id ? { ...x, affiliate_rate: v === "" ? null : Number(v) } : x)));
                        }}
                        className="w-16 rounded-lg border border-[#1a2b4a]/20 px-2 py-1 text-right text-sm"
                      />
                      <span className="text-xs text-[#7a8a99]">%</span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7a8a99]">Add your offers in Growth → Offers &amp; Packages first.</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Your affiliates</p>
            <Button onClick={() => setAdding(true)}><Plus className="w-4 h-4 mr-1" /> Add an affiliate</Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#1a2b4a]/10">
            <table className="w-full text-sm">
              <thead className="bg-[#1a2b4a]/5 text-left">
                <tr>
                  <th className="p-3">Affiliate</th>
                  <th className="p-3">Link</th>
                  <th className="p-3 text-right">Clicks</th>
                  <th className="p-3 text-right">Referred</th>
                  <th className="p-3 text-right">Sales</th>
                  <th className="p-3 text-right">Owed</th>
                  <th className="p-3 text-right">Paid</th>
                </tr>
              </thead>
              <tbody>
                {(affiliates ?? []).map((a) => (
                  <tr key={a.id} className="border-t border-[#1a2b4a]/10 hover:bg-[#1a2b4a]/[0.03]">
                    <td className="p-3">
                      <button onClick={() => setOpenId(a.id)} className="text-left">
                        <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] hover:underline">{a.name}</span>
                        {a.status === "paused" && <span className="ml-2 rounded-full bg-[#7a8a99]/15 px-2 py-0.5 text-[10px] text-[#5a6472]">Paused</span>}
                        {a.review > 0 && <span className="ml-2 rounded-full bg-[#c9a227]/20 px-2 py-0.5 text-[10px] text-[#6b5410]">{a.review} to review</span>}
                        {a.email && <span className="block text-xs text-[#7a8a99]">{a.email}</span>}
                      </button>
                    </td>
                    <td className="p-3 whitespace-nowrap"><span className="mr-2 text-xs text-[#5a6472]">/r/{a.code}</span><CopyButton text={`${APP}/r/${a.code}`} /></td>
                    <td className="p-3 text-right">{a.clicks}</td>
                    <td className="p-3 text-right">{a.referrals}</td>
                    <td className="p-3 text-right">{a.salesCount ? `${a.salesCount} · ${money(a.revenue)}` : "0"}</td>
                    <td className="p-3 text-right font-medium">{money(a.owed)}</td>
                    <td className="p-3 text-right text-[#5a6472]">{money(a.paid)}</td>
                  </tr>
                ))}
                {affiliates && !affiliates.length && (
                  <tr><td colSpan={7} className="p-4 text-[#7a8a99]">No affiliates yet. Add one, or move someone to Active affiliate in Recruiting.</td></tr>
                )}
                {!affiliates && <tr><td colSpan={7} className="p-4 text-[#7a8a99]">Loading…</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "partner" && partnerships.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">You&rsquo;re an affiliate for {partnerships.map((p) => p.business).join(" and ")}. Here&rsquo;s your link and your report, month by month.</p>
          {partnerships.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {partnerships.map((p) => (
                <button key={p.id} onClick={() => setPartnerId(p.id)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${partnerId === p.id ? "bg-[#1a2b4a] text-white border-[#1a2b4a]" : "border-[#1a2b4a]/15"}`}>{p.business}</button>
              ))}
            </div>
          )}
          {(() => {
            const p = partnerships.find((x) => x.id === partnerId) ?? partnerships[0];
            return (
              <>
                <div className="rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/30 p-4">
                  <p className="text-xs font-semibold text-[#7a8a99]">Your {p.business} link</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2"><span className="text-sm break-all">{p.link}</span><CopyButton text={p.link} label="Copy link" /></div>
                  {p.status !== "active" && <p className="mt-1 text-xs text-[#6b5410]">Paused right now.</p>}
                </div>
                <div className="rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/30 p-4">
                  <MonthlyReport endpoint="/api/affiliates/mine" params={{ affiliateId: p.id }} />
                </div>
              </>
            );
          })()}
        </div>
      )}

      {tab === "programs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">Affiliate programs you belong to: your links and codes in one place, plus what each has earned you.</p>
            <Button onClick={() => setProgramEdit({ status: "active" })}><Plus className="w-4 h-4 mr-1" /> Add a program</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {programs.map((p) => (
              <ProgramCard key={p.id} p={p} onEdit={() => setProgramEdit(p)} onChanged={load} post={post} />
            ))}
            {!programs.length && <p className="text-sm text-[#7a8a99]">No programs yet.</p>}
          </div>
        </div>
      )}

      {adding && <AddAffiliate onClose={() => setAdding(false)} onSaved={() => { setAdding(false); void load(); setMsg("Affiliate added. Copy their link and their private dashboard from their page."); }} post={post} />}
      {openId && <AffiliateDetail id={openId} offers={offers} onClose={() => { setOpenId(null); void load(); }} post={post} setMsg={setMsg} />}
      {programEdit && <ProgramEditor p={programEdit} onClose={() => setProgramEdit(null)} onSaved={() => { setProgramEdit(null); void load(); }} post={post} />}
    </div>
  );
}

function AddAffiliate({ onClose, onSaved, post }: { onClose: () => void; onSaved: () => void; post: (b: Record<string, unknown>) => Promise<Record<string, unknown> | null> }) {
  const [d, setD] = useState({ name: "", email: "", contactId: null as string | null, code: "", defaultRate: "", payoutDelayDays: "", landingUrl: "", notes: "" });
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Add an affiliate" onClose={onClose}>
      <div className="space-y-3">
        <label className="block text-xs font-medium text-[#5a6472]">Name (or search your contacts)
          <ContactLookupInput className={LOOKUP} value={d.name} onChange={(v) => setD({ ...d, name: v, contactId: null })} pickLabel="Use" onPick={(c) => setD({ ...d, name: lookupName(c), email: c.email, contactId: c.id })} />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[#5a6472]">Email<Input type="email" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} disabled={Boolean(d.contactId)} /></label>
          <label className="block text-xs font-medium text-[#5a6472]">Link code<Input value={d.code} onChange={(e) => setD({ ...d, code: e.target.value })} placeholder={d.name.split(/\s+/)[0]?.toLowerCase() || "grace"} /></label>
          <label className="block text-xs font-medium text-[#5a6472]">Default commission % (when a product has none)<Input type="number" min={0} max={100} value={d.defaultRate} onChange={(e) => setD({ ...d, defaultRate: e.target.value })} /></label>
          <label className="block text-xs font-medium text-[#5a6472]">Pay commission this many days after the payment (optional)<Input type="number" min={0} max={365} value={d.payoutDelayDays} onChange={(e) => setD({ ...d, payoutDelayDays: e.target.value })} placeholder="30" /></label>
          <label className="block text-xs font-medium text-[#5a6472]">Their link goes to (optional)<Input value={d.landingUrl} onChange={(e) => setD({ ...d, landingUrl: e.target.value })} placeholder="Your website" /></label>
        </div>
        <label className="block text-xs font-medium text-[#5a6472]">Notes<textarea rows={2} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} className={box} /></label>
        <div className="flex gap-2 pt-1">
          <Button disabled={busy || !d.name.trim()} onClick={async () => { setBusy(true); const r = await post({ action: "affiliate-create", ...d, defaultRate: d.defaultRate === "" ? null : Number(d.defaultRate) }); setBusy(false); if (r) onSaved(); }}>{busy ? "Adding…" : "Add affiliate"}</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

function AffiliateDetail({ id, offers, onClose, post, setMsg }: { id: string; offers: Offer[]; onClose: () => void; post: (b: Record<string, unknown>) => Promise<Record<string, unknown> | null>; setMsg: (m: string) => void }) {
  const [a, setA] = useState<(Affiliate & { notes: string | null; agreement_on: string | null }) | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [refs, setRefs] = useState<Referral[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clicks30, setClicks30] = useState(0);
  const [edit, setEdit] = useState({ name: "", email: "", code: "", status: "active", defaultRate: "", payoutDelayDays: "", landingUrl: "", notes: "", agreementOn: "" });
  const [sale, setSale] = useState({ offerId: "", description: "", amount: "", saleDate: new Date().toISOString().slice(0, 10), rate: "" });
  const [refName, setRefName] = useState("");

  const load = useCallback(async () => {
    const d = await fetch(`/api/affiliates?id=${id}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    if (!d.affiliate) return;
    setA(d.affiliate);
    setRates(Object.fromEntries((d.rates ?? []).map((r: { offer_id: string; rate: number }) => [r.offer_id, Number(r.rate)])));
    setRefs(d.referrals ?? []);
    setSales(d.sales ?? []);
    setClicks30(d.clicks30 ?? 0);
    const f = d.affiliate;
    setEdit({ name: f.name, email: f.email ?? "", code: f.code, status: f.status, defaultRate: f.default_rate == null ? "" : String(f.default_rate), payoutDelayDays: f.payout_delay_days == null ? "" : String(f.payout_delay_days), landingUrl: f.landing_url ?? "", notes: f.notes ?? "", agreementOn: f.agreement_on ?? "" });
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);

  if (!a) return <Modal title="Affiliate" onClose={onClose}><p className="text-sm text-[#7a8a99]">Loading…</p></Modal>;
  const link = `${APP}/r/${a.code}`;
  const portal = `${APP}/a/${a.portal_token}`;
  const owed = sales.filter((s) => s.status === "owed").reduce((t, s) => t + Number(s.commission), 0);

  return (
    <Modal title={a.name} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[#1a2b4a]/10 p-3">
            <p className="text-xs font-semibold text-[#7a8a99]">Their tracked link</p>
            <p className="text-sm break-all text-[#1a2b4a] dark:text-[#F8F5F0]">{link}</p>
            <div className="mt-1.5"><CopyButton text={link} label="Copy link" /></div>
          </div>
          <div className="rounded-lg border border-[#1a2b4a]/10 p-3">
            <p className="text-xs font-semibold text-[#7a8a99]">Their private dashboard (send this to them)</p>
            <p className="text-sm break-all text-[#1a2b4a] dark:text-[#F8F5F0]">{portal}</p>
            <div className="mt-1.5 flex gap-2">
              <CopyButton text={portal} label="Copy dashboard link" />
              <a href={portal} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-[#1a2b4a]/15 px-2 py-1 text-xs"><ExternalLink className="w-3.5 h-3.5" /> Open</a>
              <button onClick={async () => { if (confirm("Make a new dashboard link? The old one stops working.")) { const r = await post({ action: "portal-reset", id: a.id }); if (r) void load(); } }} className="inline-flex items-center gap-1 rounded-lg border border-[#1a2b4a]/15 px-2 py-1 text-xs"><RefreshCw className="w-3.5 h-3.5" /> New link</button>
            </div>
          </div>
        </div>
        <p className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">{clicks30} clicks in the last 30 days · {refs.length} referred · {money(owed)} owed</p>

        <details className="rounded-lg border border-[#1a2b4a]/10 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Details</summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#5a6472]">Name<Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <label className="block text-xs font-medium text-[#5a6472]">Email<Input value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></label>
            <label className="block text-xs font-medium text-[#5a6472]">Link code<Input value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value })} /></label>
            <label className="block text-xs font-medium text-[#5a6472]">Status
              <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} className={`${box} h-10`}><option value="active">Active</option><option value="paused">Paused (link stops crediting)</option></select>
            </label>
            <label className="block text-xs font-medium text-[#5a6472]">Default commission %<Input type="number" min={0} max={100} value={edit.defaultRate} onChange={(e) => setEdit({ ...edit, defaultRate: e.target.value })} /></label>
            <label className="block text-xs font-medium text-[#5a6472]">Pay this many days after each payment (applies to new sales)<Input type="number" min={0} max={365} value={edit.payoutDelayDays} onChange={(e) => setEdit({ ...edit, payoutDelayDays: e.target.value })} placeholder="none" /></label>
            <label className="block text-xs font-medium text-[#5a6472]">Agreement date<Input type="date" value={edit.agreementOn} onChange={(e) => setEdit({ ...edit, agreementOn: e.target.value })} /></label>
            <label className="block text-xs font-medium text-[#5a6472] sm:col-span-2">Their link goes to<Input value={edit.landingUrl} onChange={(e) => setEdit({ ...edit, landingUrl: e.target.value })} placeholder="Your website" /></label>
            <label className="block text-xs font-medium text-[#5a6472] sm:col-span-2">Notes<textarea rows={2} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} className={box} /></label>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={async () => { const r = await post({ action: "affiliate-update", id: a.id, ...edit, defaultRate: edit.defaultRate === "" ? null : Number(edit.defaultRate) }); if (r) { setMsg("Saved."); void load(); } }}>Save details</Button>
            <button onClick={async () => { if (confirm(`Remove ${a.name} as an affiliate? Their link stops working and their history is deleted.`) && (await post({ action: "affiliate-delete", id: a.id }))) onClose(); }} className="ml-auto inline-flex items-center gap-1 text-sm text-[#C76F56] hover:underline"><Trash2 className="w-4 h-4" /> Remove affiliate</button>
          </div>
        </details>

        {offers.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Commission for {a.name.split(/\s+/)[0]} by product</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {offers.map((o) => (
                <label key={o.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#1a2b4a]/10 px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-[#1a2b4a] dark:text-[#F8F5F0]">{o.name}</span>
                    <span className="text-xs text-[#7a8a99]">Product: {o.affiliate_rate != null ? `${o.affiliate_rate}%` : "not set"}</span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={rates[o.id] ?? ""}
                      placeholder="same"
                      aria-label={`${a.name} commission % on ${o.name}`}
                      onBlur={async (e) => {
                        const v = e.target.value;
                        if (String(rates[o.id] ?? "") === v) return;
                        if (await post({ action: "relationship-rate", affiliateId: a.id, offerId: o.id, rate: v === "" ? null : Number(v) })) setRates((r) => { const n = { ...r }; if (v === "") delete n[o.id]; else n[o.id] = Number(v); return n; });
                      }}
                      className="w-16 rounded-lg border border-[#1a2b4a]/20 px-2 py-1 text-right text-sm"
                    />
                    <span className="text-xs text-[#7a8a99]">%</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Sales &amp; commissions</p>
          <div className="mb-3 grid gap-2 rounded-lg bg-[#1a2b4a]/[0.03] p-3 sm:grid-cols-[1fr_110px_140px_80px_auto]">
            <select
              value={sale.offerId}
              onChange={(e) => { const o = offers.find((x) => x.id === e.target.value); setSale({ ...sale, offerId: e.target.value, description: o?.name ?? sale.description, amount: o?.price != null ? String(o.price) : sale.amount }); }}
              className={`${box} h-10`}
              aria-label="Offer"
            >
              <option value="">Offer (or type below)</option>
              {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <Input type="number" min={0} value={sale.amount} onChange={(e) => setSale({ ...sale, amount: e.target.value })} placeholder="Amount $" aria-label="Sale amount" />
            <Input type="date" value={sale.saleDate} onChange={(e) => setSale({ ...sale, saleDate: e.target.value })} aria-label="Sale date" />
            <Input type="number" min={0} max={100} value={sale.rate} onChange={(e) => setSale({ ...sale, rate: e.target.value })} placeholder="auto %" aria-label="Commission % (leave empty for the usual)" />
            <Button
              variant="outline"
              disabled={!sale.amount}
              onClick={async () => {
                const r = await post({ action: "sale-add", affiliateId: a.id, ...sale, amount: Number(sale.amount), rate: sale.rate === "" ? null : Number(sale.rate) });
                if (r) { setSale({ offerId: "", description: "", amount: "", saleDate: new Date().toISOString().slice(0, 10), rate: "" }); void load(); }
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Add sale
            </Button>
            {!sale.offerId && <Input className="sm:col-span-5" value={sale.description} onChange={(e) => setSale({ ...sale, description: e.target.value })} placeholder="What was sold (if not an offer above)" aria-label="What was sold" />}
          </div>
          {sales.length ? (
            <div className="overflow-x-auto rounded-lg border border-[#1a2b4a]/10">
              <table className="w-full text-sm">
                <thead className="bg-[#1a2b4a]/5 text-left text-xs">
                  <tr><th className="p-2">Date</th><th className="p-2">Sale</th><th className="p-2 text-right">Amount</th><th className="p-2 text-right">%</th><th className="p-2 text-right">Commission</th><th className="p-2">Payable</th><th className="p-2">Status</th></tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} className={`border-t border-[#1a2b4a]/10 ${s.status === "void" ? "opacity-50" : ""}`}>
                      <td className="p-2 whitespace-nowrap text-[#5a6472]">{day(s.sale_date)}</td>
                      <td className="p-2">{s.description}{s.source === "stripe" && <span className="ml-1 text-[10px] text-[#7a8a99]">(auto)</span>}</td>
                      <td className="p-2 text-right">{money(s.amount)}</td>
                      <td className="p-2 text-right">
                        {s.status === "review" ? (
                          <input type="number" min={0} max={100} placeholder="%" aria-label="Set commission %" className="w-14 rounded border border-[#c9a227] px-1 py-0.5 text-right" onBlur={async (e) => { if (e.target.value !== "" && (await post({ action: "sale-update", saleId: s.id, rate: Number(e.target.value) }))) void load(); }} />
                        ) : s.rate != null ? `${s.rate}%` : "—"}
                      </td>
                      <td className="p-2 text-right font-medium">{money(s.commission)}</td>
                      <td className="p-2 whitespace-nowrap text-xs text-[#5a6472]">{s.payable_on && s.status !== "paid" && s.status !== "void" ? (s.payable_on <= new Date().toISOString().slice(0, 10) ? <span className="font-semibold text-[#2c6b3f]">Ready to pay</span> : `Hold until ${day(s.payable_on)}`) : "—"}</td>
                      <td className="p-2">
                        <select value={s.status} onChange={async (e) => { if (await post({ action: "sale-update", saleId: s.id, status: e.target.value })) void load(); }} className="rounded border border-[#1a2b4a]/20 px-1 py-0.5 text-xs" aria-label="Status">
                          <option value="review">Needs a %</option>
                          <option value="owed">Owed</option>
                          <option value="paid">Paid</option>
                          <option value="void">Void</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[#7a8a99]">No sales yet. Sales through your Suite checkout are added automatically; add others here.</p>
          )}
        </div>

        <details className="rounded-lg border border-[#1a2b4a]/10 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Monthly report (what {a.name.split(/\s+/)[0]} sees)</summary>
          <div className="mt-3"><MonthlyReport endpoint="/api/affiliates/report" params={{ affiliateId: a.id }} /></div>
        </details>

        <div>
          <p className="mb-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">People they referred ({refs.length})</p>
          <div className="mb-2 max-w-md">
            <ContactLookupInput className={LOOKUP} value={refName} onChange={setRefName} placeholder="Credit someone by hand: search your contacts" pickLabel="Credit" onPick={async (c) => { setRefName(""); if (await post({ action: "referral-add", affiliateId: a.id, contactId: c.id })) void load(); }} />
          </div>
          {refs.length ? (
            <ul className="divide-y divide-[#1a2b4a]/10 text-sm">
              {refs.map((r) => (
                <li key={r.id} className="flex justify-between py-1.5">
                  <span>{r.seq_contacts ? [r.seq_contacts.first_name, r.seq_contacts.last_name].filter(Boolean).join(" ") || r.seq_contacts.email : "Someone"} <span className="text-xs text-[#7a8a99]">· {r.kind === "booking" ? "booked a call" : r.kind === "manual" ? "added by hand" : "signed up"}{r.source ? ` (${r.source})` : ""}</span></span>
                  <span className="text-xs text-[#7a8a99]">{day(r.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#7a8a99]">No one yet.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ProgramCard({ p, onEdit, onChanged, post }: { p: Program; onEdit: () => void; onChanged: () => void; post: (b: Record<string, unknown>) => Promise<Record<string, unknown> | null> }) {
  const [amt, setAmt] = useState("");
  return (
    <div className="rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/30 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{p.name} <span className="ml-1 rounded-full bg-[#1a2b4a]/5 px-2 py-0.5 text-[10px] capitalize text-[#5a6472]">{p.status}</span></p>
          {p.commission_terms && <p className="text-xs text-[#7a8a99]">{p.commission_terms}</p>}
        </div>
        <button onClick={onEdit} className="text-xs text-[#2E7C83] hover:underline">Edit</button>
      </div>
      {p.my_link && <div className="flex flex-wrap items-center gap-2 text-sm"><span className="break-all text-[#5a6472]">{p.my_link}</span><CopyButton text={p.my_link} label="Copy link" /></div>}
      {p.my_code && <div className="flex items-center gap-2 text-sm"><span className="text-[#5a6472]">Code: <strong>{p.my_code}</strong></span><CopyButton text={p.my_code} label="Copy code" /></div>}
      <div className="flex flex-wrap gap-3 text-xs">
        {p.login_url && <a href={p.login_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2E7C83] hover:underline">Program dashboard <ExternalLink className="w-3 h-3" /></a>}
        {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2E7C83] hover:underline">Website <ExternalLink className="w-3 h-3" /></a>}
      </div>
      {p.notes && <p className="text-xs text-[#5a6472] whitespace-pre-line">{p.notes}</p>}
      <div className="border-t border-[#1a2b4a]/10 pt-2">
        <p className="text-xs text-[#5a6472]">Earnings: <strong>{money(p.paid)}</strong> paid · {money(p.expected)} expected</p>
        <div className="mt-1.5 flex gap-2">
          <Input type="number" min={0} value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Add earnings $" aria-label={`Earnings from ${p.name}`} />
          <Button variant="outline" disabled={!amt} onClick={async () => { if (await post({ action: "earning-add", programId: p.id, amount: Number(amt) })) { setAmt(""); onChanged(); } }}>Add</Button>
        </div>
        {p.earnings.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs">
            {p.earnings.slice(0, 6).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2">
                <span className="text-[#5a6472]">{day(e.earned_on)} · {money(e.amount)}</span>
                <span className="flex items-center gap-2">
                  <button onClick={async () => { if (await post({ action: "earning-update", id: e.id, status: e.status === "paid" ? "expected" : "paid" })) onChanged(); }} className={`rounded-full px-2 py-0.5 ${e.status === "paid" ? "bg-green-500/10 text-green-700" : "bg-[#c9a227]/15 text-[#6b5410]"}`}>{e.status === "paid" ? "Paid" : "Expected"}</button>
                  <button onClick={async () => { if (await post({ action: "earning-delete", id: e.id })) onChanged(); }} aria-label="Delete" className="text-[#7a8a99] hover:text-[#D83A34]"><Trash2 className="w-3.5 h-3.5" /></button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ProgramEditor({ p, onClose, onSaved, post }: { p: Partial<Program>; onClose: () => void; onSaved: () => void; post: (b: Record<string, unknown>) => Promise<Record<string, unknown> | null> }) {
  const [d, setD] = useState({ name: p.name ?? "", website: p.website ?? "", myLink: p.my_link ?? "", myCode: p.my_code ?? "", commissionTerms: p.commission_terms ?? "", loginUrl: p.login_url ?? "", status: p.status ?? "active", notes: p.notes ?? "" });
  return (
    <Modal title={p.id ? `Edit ${p.name}` : "Add a program"} onClose={onClose}>
      <div className="space-y-3">
        <label className="block text-xs font-medium text-[#5a6472]">Program name<Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="e.g. Amazon Associates" /></label>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[#5a6472]">Your affiliate link<Input value={d.myLink} onChange={(e) => setD({ ...d, myLink: e.target.value })} /></label>
          <label className="block text-xs font-medium text-[#5a6472]">Your code<Input value={d.myCode} onChange={(e) => setD({ ...d, myCode: e.target.value })} /></label>
          <label className="block text-xs font-medium text-[#5a6472]">Commission terms<Input value={d.commissionTerms} onChange={(e) => setD({ ...d, commissionTerms: e.target.value })} placeholder="e.g. 30% recurring" /></label>
          <label className="block text-xs font-medium text-[#5a6472]">Status
            <select value={d.status} onChange={(e) => setD({ ...d, status: e.target.value })} className={`${box} h-10`}><option value="applied">Applied</option><option value="active">Active</option><option value="paused">Paused</option><option value="ended">Ended</option></select>
          </label>
          <label className="block text-xs font-medium text-[#5a6472]">Program dashboard (login)<Input value={d.loginUrl} onChange={(e) => setD({ ...d, loginUrl: e.target.value })} /></label>
          <label className="block text-xs font-medium text-[#5a6472]">Website<Input value={d.website} onChange={(e) => setD({ ...d, website: e.target.value })} /></label>
        </div>
        <label className="block text-xs font-medium text-[#5a6472]">Notes<textarea rows={2} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} className={box} /></label>
        <p className="text-xs text-[#7a8a99]">Keep passwords in your password manager, not here.</p>
        <div className="flex gap-2">
          <Button disabled={!d.name.trim()} onClick={async () => { if (await post({ action: "program-save", id: p.id, ...d })) onSaved(); }}>Save</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {p.id && <button onClick={async () => { if (confirm(`Delete ${p.name}?`) && (await post({ action: "program-delete", id: p.id }))) onSaved(); }} className="ml-auto inline-flex items-center gap-1 text-sm text-[#C76F56] hover:underline"><Trash2 className="w-4 h-4" /> Delete</button>}
        </div>
      </div>
    </Modal>
  );
}
