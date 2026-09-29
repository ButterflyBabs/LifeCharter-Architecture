"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X, Trash2, Settings2, ArrowUp, ArrowDown, AlertCircle, Clock } from "lucide-react";
import type { Deal, Stage } from "@/lib/sales/pipeline";
import { STALE_DAYS } from "@/lib/sales/pipeline";
import { formatMoney } from "@/lib/sales/offers";
import { ACTIVITY_TYPES, OUTCOMES, typeLabel, outcomeLabel } from "@/lib/salesActivities";
import SalesNav from "@/components/sales/SalesNav";
import ContactLookupInput, { lookupName, type LookupContact } from "@/components/crm/ContactLookupInput";

type OfferLite = { id: string; name: string; price: number | null; status: string };
type Business = { id: number; name: string };
type Touch = { id: string; type: string; title: string; contactName: string; outcome: string; occurredOn: string | null; notes: string };
type DealForm = {
  id: string | null; stageId: string; contactName: string; company: string; email: string; offerId: string; value: string;
  probability: string; useStageDefault: boolean; expectedClose: string; nextStep: string; nextStepDue: string; source: string; notes: string; businessId: string;
};

const label = "block text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898] mb-1";
const input = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";
const todayLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const shortDate = (iso: string | null) => (iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");

export default function PipelinePage() {
  return (
    <>
      <SalesNav className="mx-auto max-w-7xl px-4 pt-6 sm:px-6" />
      <Suspense fallback={<p className="p-8 text-sm text-[#7b6b8d]">Loading…</p>}>
        <PipelineBoard />
      </Suspense>
    </>
  );
}

// Pipeline: the client's deals board. Every deal has a value and a probability of closing (its own,
// or its column's default), so the board shows both the open and the weighted pipeline.
function PipelineBoard() {
  const router = useRouter();
  const params = useSearchParams();
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [offers, setOffers] = useState<OfferLite[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bizFilter, setBizFilter] = useState("");
  const [currentBiz, setCurrentBiz] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<DealForm | null>(null);
  const [editStages, setEditStages] = useState<Stage[] | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [touches, setTouches] = useState<{ linked: Touch[]; recent: Touch[] } | null>(null);
  const [touch, setTouch] = useState({ type: "call", title: "", outcome: "", notes: "" });
  const [pendingOpen, setPendingOpen] = useState<Deal | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/pipeline", { cache: "no-store" });
    const d = await res.json().catch(() => ({}));
    setStages(d.stages ?? []);
    setDeals(d.deals ?? []);
    setOffers(d.offers ?? []);
    setBusinesses(d.businesses ?? []);
    setCurrentBiz(d.currentBusinessId ?? null);
    return d as { deals?: Deal[] };
  }, []);

  const stageById = useMemo(() => new Map(stages.map((s) => [s.id, s])), [stages]);
  const today = todayLocal();
  const staleCutoff = new Date(Date.now() - STALE_DAYS * 86400_000).toISOString();

  const openForm = useCallback((d: Deal | null, stageId?: string) => {
    setError("");
    setConfirmDelete(false);
    setTouches(null);
    setTouch({ type: "call", title: "", outcome: "", notes: "" });
    if (!d) {
      const first = stageId || stages.find((s) => s.kind === "open")?.id || stages[0]?.id || "";
      setForm({ id: null, stageId: first, contactName: "", company: "", email: "", offerId: "", value: "", probability: "", useStageDefault: true, expectedClose: "", nextStep: "", nextStepDue: "", source: "", notes: "", businessId: currentBiz ? String(currentBiz) : "" });
      return;
    }
    setForm({
      id: d.id, stageId: d.stageId, contactName: d.contactName, company: d.company, email: d.email, offerId: d.offerId ?? "",
      value: d.value === null ? "" : String(d.value), probability: d.probability === null ? "" : String(d.probability), useStageDefault: d.probability === null,
      expectedClose: d.expectedClose ?? "", nextStep: d.nextStep, nextStepDue: d.nextStepDue ?? "", source: d.source, notes: d.notes, businessId: d.businessId ? String(d.businessId) : "",
    });
    fetch(`/api/pipeline/deals/${d.id}/activities`, { cache: "no-store" }).then((r) => r.json()).then((t) => setTouches({ linked: t.linked ?? [], recent: t.recent ?? [] })).catch(() => {});
  }, [stages, currentBiz]);

  // Deep link from Executive Home / Daily Compass: /sales/pipeline?deal=<id>
  useEffect(() => {
    load().then((d) => {
      const id = params.get("deal");
      const deal = id ? (d.deals ?? []).find((x) => x.id === id) : null;
      if (deal) setPendingOpen(deal);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (pendingOpen && stages.length) {
      openForm(pendingOpen);
      setPendingOpen(null);
    }
  }, [pendingOpen, stages, openForm]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (deals ?? []).filter((d) => (!bizFilter || String(d.businessId ?? "") === bizFilter) && (!needle || `${d.contactName} ${d.company} ${d.email}`.toLowerCase().includes(needle)));
  }, [deals, q, bizFilter]);

  const totals = useMemo(() => {
    const open = visible.filter((d) => stageById.get(d.stageId)?.kind === "open");
    const month = today.slice(0, 7);
    const won = visible.filter((d) => stageById.get(d.stageId)?.kind === "won" && (d.closedAt || "").slice(0, 7) === month);
    return {
      openValue: open.reduce((s, d) => s + (d.value ?? 0), 0),
      weighted: open.reduce((s, d) => s + d.weightedValue, 0),
      openCount: open.length,
      wonValue: won.reduce((s, d) => s + (d.value ?? 0), 0),
      wonCount: won.length,
    };
  }, [visible, stageById, today]);

  async function moveDeal(id: string, stageId: string) {
    const prev = deals;
    setDeals((ds) => (ds ?? []).map((d) => (d.id === id ? { ...d, stageId } : d)));
    const res = await fetch(`/api/pipeline/deals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stageId }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setDeals(prev); return; }
    setDeals((ds) => (ds ?? []).map((x) => (x.id === id ? d.deal : x)));
  }

  async function saveDeal() {
    if (!form) return;
    setBusy(true);
    setError("");
    const payload = {
      stageId: form.stageId, contactName: form.contactName, company: form.company, email: form.email, offerId: form.offerId || null,
      value: form.value === "" ? null : form.value, probability: form.useStageDefault ? null : form.probability === "" ? null : form.probability,
      expectedClose: form.expectedClose || null, nextStep: form.nextStep, nextStepDue: form.nextStepDue || null, source: form.source, notes: form.notes, businessId: form.businessId || null,
    };
    try {
      const res = await fetch(form.id ? `/api/pipeline/deals/${form.id}` : "/api/pipeline", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Couldn't save.");
      closeForm();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteDeal() {
    if (!form?.id) return;
    setBusy(true);
    const res = await fetch(`/api/pipeline/deals/${form.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return setError("Couldn't delete it.");
    closeForm();
    load();
  }

  function closeForm() {
    setForm(null);
    if (params.get("deal")) router.replace("/sales/pipeline");
  }

  async function logTouch() {
    if (!form?.id) return;
    const res = await fetch(`/api/pipeline/deals/${form.id}/activities`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(touch) });
    if (res.ok) {
      setTouch({ type: "call", title: "", outcome: "", notes: "" });
      const t = await fetch(`/api/pipeline/deals/${form.id}/activities`, { cache: "no-store" }).then((r) => r.json());
      setTouches({ linked: t.linked ?? [], recent: t.recent ?? [] });
    }
  }
  async function attachTouch(activityId: string) {
    if (!form?.id || !activityId) return;
    await fetch(`/api/pipeline/deals/${form.id}/activities`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activityId }) });
    const t = await fetch(`/api/pipeline/deals/${form.id}/activities`, { cache: "no-store" }).then((r) => r.json());
    setTouches({ linked: t.linked ?? [], recent: t.recent ?? [] });
  }
  async function detachTouch(activityId: string) {
    if (!form?.id) return;
    await fetch(`/api/pipeline/deals/${form.id}/activities?activityId=${encodeURIComponent(activityId)}`, { method: "DELETE" });
    const t = await fetch(`/api/pipeline/deals/${form.id}/activities`, { cache: "no-store" }).then((r) => r.json());
    setTouches({ linked: t.linked ?? [], recent: t.recent ?? [] });
  }

  async function saveStages() {
    if (!editStages) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/pipeline/stages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stages: editStages, moveTo: moveTo || undefined }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(d.error || "Couldn't save the columns.");
    setEditStages(null);
    load();
  }

  // Picked someone already in Contacts: fill in their name, company and email.
  const fillFromContact = (c: LookupContact) =>
    setForm((f) => (f ? { ...f, contactName: lookupName(c), company: c.company || f.company, email: c.email } : f));
  const set = (k: keyof DealForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => (f ? { ...f, [k]: e.target.value } : f));
  const formStage = form ? stageById.get(form.stageId) : undefined;
  const removedWithDeals = editStages ? stages.filter((s) => !editStages.some((e) => e.id === s.id) && (deals ?? []).some((d) => d.stageId === s.id)) : [];

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Strategic Planning</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Pipeline</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-[#5b5f73] dark:text-[#b8a898]">
            Every deal you&rsquo;re working, from first conversation to won. Give each deal a value and your honest odds of closing it. Offers come from{" "}
            <Link href="/sales/offers" className="text-[#2E7C83] underline">Offers &amp; Packages</Link>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setEditStages(stages.map((s) => ({ ...s }))); setMoveTo(""); setError(""); }} className="inline-flex items-center gap-2 rounded-lg border border-[#1a2b4a]/20 px-4 py-2.5 text-sm font-medium text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:text-[#F8F5F0]">
            <Settings2 className="h-4 w-4" /> Edit columns
          </button>
          <button onClick={() => openForm(null)} className="inline-flex items-center gap-2 rounded-lg bg-[#1a2b4a] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> Add a deal
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Open pipeline", v: formatMoney(totals.openValue) || "$0", s: `${totals.openCount} open deal${totals.openCount === 1 ? "" : "s"}` },
          { l: "Weighted by probability", v: formatMoney(totals.weighted) || "$0", s: "What you can expect to close" },
          { l: "Won this month", v: formatMoney(totals.wonValue) || "$0", s: `${totals.wonCount} deal${totals.wonCount === 1 ? "" : "s"}` },
          { l: "Deals to move today", v: String(visible.filter((d) => stageById.get(d.stageId)?.kind === "open" && ((d.nextStepDue && d.nextStepDue <= today) || (d.stageChangedAt < staleCutoff && (!d.nextStepDue || d.nextStepDue < today)))).length), s: "Due, overdue or stuck" },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d]">{x.l}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{x.v}</p>
            <p className="text-xs text-[#7b6b8d]">{x.s}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search deals" aria-label="Search deals" className={`${input} max-w-xs`} />
        {businesses.length > 1 && !currentBiz && (
          <select value={bizFilter} onChange={(e) => setBizFilter(e.target.value)} aria-label="Business" className={`${input} max-w-xs`}>
            <option value="">All businesses</option>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {!deals ? (
        <p className="text-sm text-[#7b6b8d]">Loading…</p>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
          <div className="flex min-w-max gap-4">
            {stages.map((s) => {
              const col = visible.filter((d) => d.stageId === s.id);
              const colValue = col.reduce((a, d) => a + (d.value ?? 0), 0);
              return (
                <section
                  key={s.id}
                  aria-label={s.name}
                  onDragOver={(e) => { if (dragId) e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); if (dragId) moveDeal(dragId, s.id); setDragId(null); }}
                  className={`flex w-72 shrink-0 flex-col rounded-2xl border p-3 ${s.kind === "won" ? "border-green-500/30 bg-green-500/5" : s.kind === "lost" ? "border-[#7b6b8d]/20 bg-[#7b6b8d]/5" : "border-[#1a2b4a]/10 bg-[#1a2b4a]/[0.03] dark:border-white/10 dark:bg-white/5"}`}
                >
                  <div className="mb-3 px-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.name}</h2>
                      <span className="text-xs text-[#7b6b8d]">{col.length}</span>
                    </div>
                    <p className="text-xs text-[#7b6b8d] tabular-nums">{formatMoney(colValue) || "$0"}{s.kind === "open" ? ` · ${s.probability}% default` : ""}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {col.map((d) => {
                      const overdue = s.kind === "open" && d.nextStepDue && d.nextStepDue < today;
                      const due = s.kind === "open" && d.nextStepDue === today;
                      const stale = s.kind === "open" && !overdue && !due && d.stageChangedAt < staleCutoff;
                      const offer = offers.find((o) => o.id === d.offerId);
                      return (
                        <article
                          key={d.id}
                          draggable
                          onDragStart={() => setDragId(d.id)}
                          onDragEnd={() => setDragId(null)}
                          className="rounded-xl border border-[#1a2b4a]/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/60"
                        >
                          <button onClick={() => openForm(d)} className="block w-full text-left">
                            <p className="font-semibold leading-snug text-[#1a2b4a] dark:text-[#F8F5F0]">{d.contactName}</p>
                            {(d.company || offer) && <p className="text-xs text-[#7b6b8d]">{[d.company, offer?.name].filter(Boolean).join(" · ")}</p>}
                            <p className="mt-1.5 text-sm tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">
                              <span className="font-semibold">{d.value === null ? "No value" : formatMoney(d.value)}</span>
                              {s.kind === "open" && <span className="text-[#7b6b8d]"> · {d.effectiveProbability}%{d.probability === null ? "" : " (yours)"}</span>}
                            </p>
                            {s.kind === "open" && (d.nextStep || d.nextStepDue) && (
                              <p className={`mt-1.5 flex items-start gap-1 text-xs ${overdue ? "font-semibold text-[#b03a2e]" : due ? "font-semibold text-[#8a6a15]" : "text-[#5b5f73] dark:text-[#b8a898]"}`}>
                                {overdue ? <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" /> : <Clock className="mt-px h-3.5 w-3.5 shrink-0" />}
                                <span>{d.nextStep || "Next step"}{d.nextStepDue ? ` · ${overdue ? "overdue since " : due ? "today" : ""}${due ? "" : shortDate(d.nextStepDue)}` : ""}</span>
                              </p>
                            )}
                            {stale && <p className="mt-1.5 text-xs font-medium text-[#7b6b8d]">No movement in {STALE_DAYS}+ days</p>}
                          </button>
                          <label className="mt-2 flex items-center gap-2 text-xs text-[#7b6b8d]">
                            <span className="sr-only sm:not-sr-only">Move to</span>
                            <select aria-label={`Move ${d.contactName} to`} value={d.stageId} onChange={(e) => moveDeal(d.id, e.target.value)} className="min-w-0 flex-1 rounded-md border border-[#1a2b4a]/15 bg-transparent px-2 py-1 text-xs text-[#1a2b4a] dark:text-[#F8F5F0]">
                              {stages.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                            </select>
                          </label>
                        </article>
                      );
                    })}
                    {s.kind === "open" && (
                      <button onClick={() => openForm(null, s.id)} className="rounded-xl border border-dashed border-[#1a2b4a]/20 px-3 py-2 text-sm text-[#7b6b8d] hover:border-[#c9a227] hover:text-[#1a2b4a] dark:text-[#b8a898]">
                        + Add a deal here
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog" aria-modal="true" aria-label={form.id ? "Edit deal" : "Add a deal"} onClick={(e) => e.target === e.currentTarget && !busy && closeForm()}>
          <div className="h-full w-full max-w-xl overflow-y-auto bg-[#FAF8F3] p-6 shadow-xl dark:bg-[#141f38]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{form.id ? "Edit deal" : "Add a deal"}</h2>
              <button onClick={closeForm} aria-label="Close" className="rounded-lg p-2 hover:bg-black/5"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><label className={label} htmlFor="d-name">Who it&rsquo;s with</label><ContactLookupInput id="d-name" className={input} value={form.contactName} onChange={(v) => setForm((f) => (f ? { ...f, contactName: v } : f))} onPick={fillFromContact} placeholder="Name, or search your contacts" /></div>
              <div><label className={label} htmlFor="d-company">Company</label><input id="d-company" className={input} value={form.company} onChange={set("company")} /></div>
              <div className="sm:col-span-2"><label className={label} htmlFor="d-email">Email</label><ContactLookupInput id="d-email" type="email" className={input} value={form.email} onChange={(v) => setForm((f) => (f ? { ...f, email: v } : f))} onPick={fillFromContact} /></div>
              <div><label className={label} htmlFor="d-stage">Stage</label><select id="d-stage" className={input} value={form.stageId} onChange={set("stageId")}>{stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div>
                <label className={label} htmlFor="d-offer">Offer</label>
                <select
                  id="d-offer"
                  className={input}
                  value={form.offerId}
                  onChange={(e) => {
                    const o = offers.find((x) => x.id === e.target.value);
                    setForm((f) => (f ? { ...f, offerId: e.target.value, value: f.value === "" && o?.price !== null && o?.price !== undefined ? String(o.price) : f.value } : f));
                  }}
                >
                  <option value="">No offer</option>
                  {offers.filter((o) => o.status !== "retired" || o.id === form.offerId).map((o) => <option key={o.id} value={o.id}>{o.name}{o.price !== null ? ` (${formatMoney(o.price)})` : ""}</option>)}
                </select>
              </div>
              <div><label className={label} htmlFor="d-value">Deal value (USD)</label><input id="d-value" inputMode="decimal" className={input} value={form.value} onChange={set("value")} placeholder="Fills in from the offer" /></div>
              <div>
                <label className={label} htmlFor="d-prob">Probability of closing</label>
                {formStage && formStage.kind !== "open" ? (
                  <p className="py-2 text-sm text-[#5b5f73] dark:text-[#b8a898]">{formStage.kind === "won" ? "100% (won)" : "0% (lost)"}</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <input id="d-prob" type="number" min={0} max={100} step={5} disabled={form.useStageDefault} className={`${input} w-24`} value={form.useStageDefault ? String(formStage?.probability ?? 0) : form.probability} onChange={set("probability")} />
                      <span className="text-sm text-[#7b6b8d]">%</span>
                    </div>
                    <label className="mt-1.5 flex items-center gap-2 text-xs text-[#5b5f73] dark:text-[#b8a898]">
                      <input type="checkbox" checked={form.useStageDefault} onChange={(e) => setForm((f) => (f ? { ...f, useStageDefault: e.target.checked, probability: e.target.checked ? "" : String(formStage?.probability ?? 0) } : f))} />
                      Use the stage&rsquo;s default ({formStage?.probability ?? 0}%)
                    </label>
                  </>
                )}
              </div>
              {form.value !== "" && formStage?.kind === "open" && Number.isFinite(Number(form.value)) && (
                <p className="sm:col-span-2 -mt-2 text-xs text-[#7b6b8d]">
                  Weighted value: {formatMoney((Number(form.value) * (form.useStageDefault ? formStage.probability : Number(form.probability) || 0)) / 100)}
                </p>
              )}
              <div className="sm:col-span-2"><label className={label} htmlFor="d-next">Next step</label><input id="d-next" className={input} value={form.nextStep} onChange={set("nextStep")} placeholder="e.g. Send the proposal" /></div>
              <div><label className={label} htmlFor="d-due">Next step due</label><input id="d-due" type="date" className={input} value={form.nextStepDue} onChange={set("nextStepDue")} /></div>
              <div><label className={label} htmlFor="d-close">Expected close</label><input id="d-close" type="date" className={input} value={form.expectedClose} onChange={set("expectedClose")} /></div>
              <div><label className={label} htmlFor="d-source">Where they came from</label><input id="d-source" className={input} value={form.source} onChange={set("source")} placeholder="Referral, MasterClass, Instagram…" /></div>
              {businesses.length > 1 && (
                <div><label className={label} htmlFor="d-biz">Business</label><select id="d-biz" className={input} value={form.businessId} onChange={set("businessId")}><option value="">—</option>{businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              )}
              <div className="sm:col-span-2"><label className={label} htmlFor="d-notes">Notes</label><textarea id="d-notes" rows={4} className={input} value={form.notes} onChange={set("notes")} /></div>
            </div>
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[#b03a2e]">{error}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={saveDeal} disabled={busy} className="rounded-lg bg-[#1a2b4a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{busy ? "Saving…" : "Save deal"}</button>
              <button onClick={closeForm} className="rounded-lg border border-[#1a2b4a]/20 px-4 py-2.5 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Cancel</button>
              {form.id && (confirmDelete ? (
                <span className="ml-auto text-sm">Delete this deal? <button onClick={deleteDeal} className="font-semibold text-[#b03a2e] underline">Yes, delete</button> · <button onClick={() => setConfirmDelete(false)} className="underline">Keep</button></span>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="ml-auto inline-flex items-center gap-1 text-sm text-[#b03a2e] hover:underline"><Trash2 className="h-4 w-4" /> Delete</button>
              ))}
            </div>

            {form.id && (
              <section className="mt-8 border-t border-[#1a2b4a]/10 pt-5 dark:border-white/10">
                <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Calls and follow-ups</h3>
                <p className="text-xs text-[#7b6b8d]">These also show in Daily Compass › Sales Activities.</p>
                {!touches ? (
                  <p className="mt-3 text-sm text-[#7b6b8d]">Loading…</p>
                ) : (
                  <>
                    {touches.linked.length === 0 ? (
                      <p className="mt-3 text-sm text-[#7b6b8d]">Nothing logged for this deal yet.</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {touches.linked.map((t) => (
                          <li key={t.id} className="rounded-lg bg-white p-2.5 text-sm dark:bg-[#1a2b4a]/40">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{typeLabel(t.type)}{t.title ? `: ${t.title}` : ""}</span>
                              <span className="shrink-0 text-xs text-[#7b6b8d]">{shortDate(t.occurredOn)}</span>
                            </div>
                            {(t.outcome || t.notes) && <p className="text-xs text-[#5b5f73] dark:text-[#b8a898]">{[t.outcome ? outcomeLabel(t.outcome) : "", t.notes].filter(Boolean).join(" · ")}</p>}
                            <button onClick={() => detachTouch(t.id)} className="mt-1 text-xs text-[#7b6b8d] underline">Remove from this deal</button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <select aria-label="Type" className={input} value={touch.type} onChange={(e) => setTouch({ ...touch, type: e.target.value })}>{ACTIVITY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
                      <input aria-label="What happened" className={`${input} sm:col-span-2`} value={touch.title} onChange={(e) => setTouch({ ...touch, title: e.target.value })} placeholder="What happened" />
                      <select aria-label="Outcome" className={input} value={touch.outcome} onChange={(e) => setTouch({ ...touch, outcome: e.target.value })}>{OUTCOMES.map((o) => <option key={o.id} value={o.id}>{o.id ? o.label : "Outcome"}</option>)}</select>
                      <input aria-label="Notes" className={`${input} sm:col-span-2`} value={touch.notes} onChange={(e) => setTouch({ ...touch, notes: e.target.value })} placeholder="Notes (optional)" />
                    </div>
                    <button onClick={logTouch} disabled={!touch.title.trim()} className="mt-2 rounded-lg border border-[#1a2b4a]/20 px-4 py-2 text-sm font-medium text-[#1a2b4a] disabled:opacity-50 dark:text-[#F8F5F0]">Log it on this deal</button>
                    {touches.recent.length > 0 && (
                      <div className="mt-4">
                        <label className={label} htmlFor="d-attach">Or attach one you already logged</label>
                        <select id="d-attach" className={input} value="" onChange={(e) => attachTouch(e.target.value)}>
                          <option value="">Choose from the last 90 days…</option>
                          {touches.recent.map((t) => <option key={t.id} value={t.id}>{shortDate(t.occurredOn)} · {typeLabel(t.type)} · {t.contactName || t.title || "—"}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </div>
        </div>
      )}

      {editStages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-label="Edit columns" onClick={(e) => e.target === e.currentTarget && !busy && setEditStages(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#FAF8F3] p-6 shadow-xl dark:bg-[#141f38]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Edit columns</h2>
              <button onClick={() => setEditStages(null)} aria-label="Close" className="rounded-lg p-2 hover:bg-black/5"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-1 text-sm text-[#5b5f73] dark:text-[#b8a898]">Rename, reorder, add or remove columns. The % is the default probability for deals in that column; any deal can have its own.</p>
            <ul className="mt-4 space-y-2">
              {editStages.map((s, i) => (
                <li key={s.id || `new-${i}`} className="flex items-center gap-2">
                  <input aria-label="Column name" className={`${input} flex-1`} value={s.name} onChange={(e) => setEditStages(editStages.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <select aria-label="Column type" className={`${input} w-28`} value={s.kind} onChange={(e) => setEditStages(editStages.map((x, j) => (j === i ? { ...x, kind: e.target.value as Stage["kind"] } : x)))}>
                    <option value="open">Open</option><option value="won">Won</option><option value="lost">Lost</option>
                  </select>
                  {s.kind === "open" ? (
                    <input aria-label="Default probability" type="number" min={0} max={100} className={`${input} w-20`} value={s.probability} onChange={(e) => setEditStages(editStages.map((x, j) => (j === i ? { ...x, probability: Number(e.target.value) } : x)))} />
                  ) : (
                    <span className="w-20 text-center text-sm text-[#7b6b8d]">{s.kind === "won" ? "100" : "0"}</span>
                  )}
                  <button aria-label="Move up" disabled={i === 0} onClick={() => { const a = [...editStages]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; setEditStages(a); }} className="rounded p-1 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button aria-label="Move down" disabled={i === editStages.length - 1} onClick={() => { const a = [...editStages]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; setEditStages(a); }} className="rounded p-1 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button aria-label="Remove column" onClick={() => setEditStages(editStages.filter((_, j) => j !== i))} className="rounded p-1 text-[#b03a2e]"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
            <button onClick={() => setEditStages([...editStages, { id: "", name: "New column", kind: "open", probability: 50, sortOrder: editStages.length }])} className="mt-3 text-sm font-medium text-[#2E7C83] hover:underline">+ Add a column</button>
            {removedWithDeals.length > 0 && (
              <div className="mt-4 rounded-lg bg-[#c9a227]/10 p-3 text-sm">
                <label className={label} htmlFor="s-move">Deals in {removedWithDeals.map((s) => s.name).join(", ")} move to</label>
                <select id="s-move" className={input} value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                  <option value="">The first open column</option>
                  {editStages.filter((s) => s.id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[#b03a2e]">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button onClick={saveStages} disabled={busy} className="rounded-lg bg-[#1a2b4a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{busy ? "Saving…" : "Save columns"}</button>
              <button onClick={() => setEditStages(null)} className="rounded-lg border border-[#1a2b4a]/20 px-4 py-2.5 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
