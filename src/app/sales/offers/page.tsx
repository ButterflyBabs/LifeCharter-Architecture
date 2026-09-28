"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Package, Pencil, Trash2, X, ExternalLink, Users } from "lucide-react";
import { OFFER_BILLING, OFFER_FORMATS, OFFER_STATUSES, offerPriceLabel, type Offer } from "@/lib/sales/offers";
import SalesNav from "@/components/sales/SalesNav";

type Business = { id: number; name: string };
type Form = {
  id: string | null;
  name: string;
  format: string;
  price: string;
  billing: string;
  paymentCount: string;
  deliverables: string;
  transformation: string;
  idealClient: string;
  notFor: string;
  guarantee: string;
  duration: string;
  capacity: string;
  link: string;
  status: string;
  businessId: string;
};

const EMPTY: Form = {
  id: null, name: "", format: "one_to_one", price: "", billing: "one_time", paymentCount: "", deliverables: "", transformation: "",
  idealClient: "", notFor: "", guarantee: "", duration: "", capacity: "", link: "", status: "active", businessId: "",
};

const toForm = (o: Offer): Form => ({
  id: o.id, name: o.name, format: o.format, price: o.price === null ? "" : String(o.price), billing: o.billing,
  paymentCount: o.paymentCount === null ? "" : String(o.paymentCount), deliverables: o.deliverables.join("\n"),
  transformation: o.transformation, idealClient: o.idealClient, notFor: o.notFor, guarantee: o.guarantee, duration: o.duration,
  capacity: o.capacity === null ? "" : String(o.capacity), link: o.link, status: o.status, businessId: o.businessId ? String(o.businessId) : "",
});

const label = "block text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898] mb-1";
const input = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";
const formatLabel = (id: string) => OFFER_FORMATS.find((f) => f.id === id)?.label ?? id;

// Offers & Packages: every offer the client sells, with price, what's included and who it's for.
// Deals on the Pipeline point to these, and Executive Home shows which offer is bringing in the most.
export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBiz, setCurrentBiz] = useState<number | null>(null);
  const [filter, setFilter] = useState<"active" | "draft" | "retired" | "all">("active");
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/offers", { cache: "no-store" });
    const d = await res.json().catch(() => ({}));
    setOffers(d.offers ?? []);
    setBusinesses(d.businesses ?? []);
    setCurrentBiz(d.currentBusinessId ?? null);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => (offers ?? []).filter((o) => filter === "all" || o.status === filter), [offers, filter]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { active: 0, draft: 0, retired: 0, all: 0 };
    for (const o of offers ?? []) {
      c[o.status] = (c[o.status] ?? 0) + 1;
      c.all += 1;
    }
    return c;
  }, [offers]);

  async function save() {
    if (!form) return;
    setBusy(true);
    setError("");
    const payload = {
      ...form,
      deliverables: form.deliverables.split("\n").map((s) => s.replace(/^[-•*]\s*/, "").trim()).filter(Boolean),
      businessId: form.businessId || null,
    };
    try {
      const res = await fetch(form.id ? `/api/offers/${form.id}` : "/api/offers", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Couldn't save.");
      setForm(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!form?.id) return;
    setBusy(true);
    const res = await fetch(`/api/offers/${form.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return setError("Couldn't delete it.");
    setForm(null);
    setConfirmDelete(false);
    load();
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => (f ? { ...f, [k]: e.target.value } : f));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <SalesNav />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Strategic Planning</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Offers &amp; Packages</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-[#5b5f73] dark:text-[#b8a898]">
            Everything you sell, in one place: price, what&rsquo;s included, and who it&rsquo;s for. Deals on your{" "}
            <Link href="/sales/pipeline" className="text-[#2E7C83] underline">Pipeline</Link> point to these offers.
          </p>
        </div>
        <button
          onClick={() => { setForm({ ...EMPTY, businessId: currentBiz ? String(currentBiz) : "" }); setError(""); setConfirmDelete(false); }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1a2b4a] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add an offer
        </button>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Show offers">
        {(["active", "draft", "retired", "all"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={filter === k}
            onClick={() => setFilter(k)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${filter === k ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/15 text-[#1a2b4a] hover:border-[#c9a227] dark:text-[#F8F5F0] dark:border-white/15"}`}
          >
            {k === "all" ? "All" : OFFER_STATUSES.find((s) => s.id === k)?.label} <span className="opacity-70">{counts[k] ?? 0}</span>
          </button>
        ))}
      </div>

      {!offers ? (
        <p className="text-sm text-[#7b6b8d]">Loading…</p>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c9a227]/60 bg-white p-8 text-center dark:bg-[#1a2b4a]/30">
          <Package className="mx-auto h-8 w-8 text-[#c9a227]" />
          <p className="mt-3 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{offers.length ? "Nothing here with this filter." : "No offers yet."}</p>
          <p className="mt-1 text-sm text-[#5b5f73] dark:text-[#b8a898]">Add your first offer: your signature program, a package, a retainer, a product.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((o) => (
            <article key={o.id} className="flex flex-col rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold leading-snug text-[#1a2b4a] dark:text-[#F8F5F0]">{o.name}</h2>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${o.status === "active" ? "bg-green-500/10 text-[#2f7d55]" : o.status === "draft" ? "bg-[#c9a227]/15 text-[#8a6a15]" : "bg-[#7b6b8d]/10 text-[#7b6b8d]"}`}>
                  {OFFER_STATUSES.find((s) => s.id === o.status)?.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#7b6b8d]">
                {formatLabel(o.format)}
                {o.duration ? ` · ${o.duration}` : ""}
                {o.businessId && businesses.length > 1 ? ` · ${businesses.find((b) => b.id === o.businessId)?.name ?? ""}` : ""}
              </p>
              <p className="mt-3 text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{offerPriceLabel(o)}</p>
              {o.transformation && <p className="mt-2 line-clamp-3 text-sm text-[#5b5f73] dark:text-[#b8a898]">{o.transformation}</p>}
              {o.deliverables.length > 0 && (
                <ul className="mt-3 list-disc space-y-0.5 pl-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                  {o.deliverables.slice(0, 4).map((d, i) => <li key={i}>{d}</li>)}
                  {o.deliverables.length > 4 && <li className="list-none text-[#7b6b8d]">+ {o.deliverables.length - 4} more</li>}
                </ul>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-sm">
                {o.capacity !== null && <span className="inline-flex items-center gap-1 text-[#7b6b8d]"><Users className="h-3.5 w-3.5" /> {o.capacity} spots</span>}
                {o.link && <a href={o.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2E7C83] hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Sales page</a>}
                <button onClick={() => { setForm(toForm(o)); setError(""); setConfirmDelete(false); }} className="ml-auto inline-flex items-center gap-1 font-medium text-[#2E7C83] hover:underline">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog" aria-modal="true" aria-label={form.id ? "Edit offer" : "Add an offer"} onClick={(e) => e.target === e.currentTarget && !busy && setForm(null)}>
          <div className="h-full w-full max-w-xl overflow-y-auto bg-[#FAF8F3] p-6 shadow-xl dark:bg-[#141f38]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{form.id ? "Edit offer" : "Add an offer"}</h2>
              <button onClick={() => setForm(null)} aria-label="Close" className="rounded-lg p-2 hover:bg-black/5"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className={label} htmlFor="o-name">Offer name</label><input id="o-name" className={input} value={form.name} onChange={set("name")} placeholder="e.g. The Alignment Intensive" /></div>
              <div><label className={label} htmlFor="o-format">Format</label><select id="o-format" className={input} value={form.format} onChange={set("format")}>{OFFER_FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
              <div><label className={label} htmlFor="o-status">Status</label><select id="o-status" className={input} value={form.status} onChange={set("status")}>{OFFER_STATUSES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
              <div><label className={label} htmlFor="o-price">Price (USD)</label><input id="o-price" inputMode="decimal" className={input} value={form.price} onChange={set("price")} placeholder="2500" /></div>
              <div><label className={label} htmlFor="o-billing">How it&rsquo;s paid</label><select id="o-billing" className={input} value={form.billing} onChange={set("billing")}>{OFFER_BILLING.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
              {form.billing === "payment_plan" && <div><label className={label} htmlFor="o-payments">Number of payments</label><input id="o-payments" inputMode="numeric" className={input} value={form.paymentCount} onChange={set("paymentCount")} placeholder="3" /></div>}
              <div><label className={label} htmlFor="o-duration">Length</label><input id="o-duration" className={input} value={form.duration} onChange={set("duration")} placeholder="e.g. 12 weeks" /></div>
              <div><label className={label} htmlFor="o-capacity">Spots available</label><input id="o-capacity" inputMode="numeric" className={input} value={form.capacity} onChange={set("capacity")} placeholder="Leave blank if unlimited" /></div>
              {businesses.length > 1 && (
                <div><label className={label} htmlFor="o-biz">Business</label><select id="o-biz" className={input} value={form.businessId} onChange={set("businessId")}><option value="">All businesses</option>{businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              )}
              <div className="sm:col-span-2"><label className={label} htmlFor="o-transform">The transformation</label><textarea id="o-transform" rows={3} className={input} value={form.transformation} onChange={set("transformation")} placeholder="Where your client is when they finish" /></div>
              <div className="sm:col-span-2"><label className={label} htmlFor="o-deliv">What&rsquo;s included (one per line)</label><textarea id="o-deliv" rows={5} className={input} value={form.deliverables} onChange={set("deliverables")} placeholder={"6 private sessions\nWorkbook\nVoxer access between sessions"} /></div>
              <div><label className={label} htmlFor="o-ideal">Who it&rsquo;s for</label><textarea id="o-ideal" rows={3} className={input} value={form.idealClient} onChange={set("idealClient")} /></div>
              <div><label className={label} htmlFor="o-notfor">Who it&rsquo;s not for</label><textarea id="o-notfor" rows={3} className={input} value={form.notFor} onChange={set("notFor")} /></div>
              <div className="sm:col-span-2"><label className={label} htmlFor="o-guarantee">Guarantee</label><input id="o-guarantee" className={input} value={form.guarantee} onChange={set("guarantee")} /></div>
              <div className="sm:col-span-2"><label className={label} htmlFor="o-link">Sales page or checkout link</label><input id="o-link" inputMode="url" className={input} value={form.link} onChange={set("link")} placeholder="yourbusiness.com/offer" /></div>
            </div>
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[#b03a2e]">{error}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={save} disabled={busy} className="rounded-lg bg-[#1a2b4a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{busy ? "Saving…" : "Save offer"}</button>
              <button onClick={() => setForm(null)} className="rounded-lg border border-[#1a2b4a]/20 px-4 py-2.5 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Cancel</button>
              {form.id && (confirmDelete ? (
                <span className="ml-auto text-sm">Delete this offer? <button onClick={remove} className="font-semibold text-[#b03a2e] underline">Yes, delete</button> · <button onClick={() => setConfirmDelete(false)} className="underline">Keep</button></span>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="ml-auto inline-flex items-center gap-1 text-sm text-[#b03a2e] hover:underline"><Trash2 className="h-4 w-4" /> Delete</button>
              ))}
            </div>
            {form.id && <p className="mt-3 text-xs text-[#7b6b8d]">Tip: to stop selling an offer but keep its history, set it to Retired instead of deleting it.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
