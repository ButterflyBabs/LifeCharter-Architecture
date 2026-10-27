"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Check, Copy, FolderKanban, Plus, Search, Upload, Users, X, BookOpen } from "lucide-react";
import MyCalendar from "../sales-reference/MyCalendar";
import Resources from "./Resources";
import { LEADS_TEMPLATE_CSV, readLeadsCsv } from "@/lib/c2cLeads";

interface Stage { id: string; key: string | null; name: string; kind: string }
interface Card {
  id: string; stageId: string; name: string; businessName: string; email: string; phone: string; linkedin: string; facebook: string; instagram: string;
  leadTag: string; discoveryAt: string | null; outcome: "attended" | "no_show" | null; followupAt: string | null; closedTier: string; closedOn: string | null;
  tags: string[]; inCrm: boolean; notes: string;
}
interface Data {
  consultant: string; board: { id: string; name: string }; stages: Stage[]; cards: Card[];
  tags: { lead: string; discovery: string; followup: string }; tiers: { id: string; label: string }[];
  affiliateCode: string | null; shareLink: string | null; bookingLink: string;
}
type Tab = "pipeline" | "contacts" | "calendar" | "resources";

const FIELD = "w-full rounded-lg border border-[#1a2b4a]/15 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]";
const LABEL = "mb-1 block text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0]";
const CARD = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/20";
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/Denver", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " MT" : "");
const localInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function CallToClose({ as }: { as: string | null }) {
  const q = as ? `?as=${encodeURIComponent(as)}` : "";
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>("pipeline");
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/c2c${q}`, { cache: "no-store" });
    const d = await res.json().catch(() => null);
    if (res.ok && d?.board) setData(d);
    else setErr(d?.error || "Couldn't load your pipeline.");
  }, [q]);
  useEffect(() => {
    void load();
  }, [load]);

  const post = async (body: Record<string, unknown>) => {
    setErr("");
    const res = await fetch(`/api/c2c${q}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(d.error || "That didn't save.");
      return null;
    }
    await load();
    return d;
  };

  const stageName = useMemo(() => new Map((data?.stages ?? []).map((s) => [s.id, s.name])), [data]);
  const current = data?.cards.find((c) => c.id === open) ?? null;

  if (!data) return <div className="px-4 py-10 text-[#7a8a99]">{err || "Loading…"}</div>;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "pipeline", label: "My Pipeline", icon: <FolderKanban className="h-4 w-4" /> },
    { id: "contacts", label: "My Contacts", icon: <Users className="h-4 w-4" /> },
    { id: "calendar", label: "My Calendar", icon: <Calendar className="h-4 w-4" /> },
    { id: "resources", label: "Sales Resources", icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Call to Close</p>
      <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{data.consultant}&rsquo;s workspace</h1>
      <p className="mb-5 mt-1 max-w-3xl text-sm text-[#7a8a99]">Your prospects, your calendar and your sales resources. Everything here is yours alone.</p>

      <div className="mb-5 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-[#1a2b4a]/5 p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ${tab === t.id ? "bg-white text-[#1a2b4a] shadow-sm dark:bg-[#1a2b4a] dark:text-[#F8F5F0]" : "text-[#7a8a99] hover:text-[#1a2b4a]"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {err && <p role="alert" className="mb-3 text-sm text-[#8a2f2f]">{err}</p>}

      {tab === "pipeline" && (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add a prospect</button>
            <span className="text-xs text-[#7a8a99]">New prospects are tagged <b>{data.tags.lead}</b>. They reach the CRM when they book a call with you.</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {data.stages.map((s) => {
              const cards = data.cards.filter((c) => c.stageId === s.id);
              return (
                <section key={s.id} className="w-72 flex-none rounded-2xl bg-[#1a2b4a]/5 p-3">
                  <h2 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#1a2b4a] dark:text-[#F8F5F0]">{s.name}<span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#7a8a99] dark:bg-[#1a2b4a]/40">{cards.length}</span></h2>
                  <div className="space-y-2">
                    {cards.map((c) => (
                      <button key={c.id} onClick={() => setOpen(c.id)} className="block w-full rounded-xl border border-[#1a2b4a]/10 bg-white p-3 text-left shadow-sm hover:border-[#2E7C83]/50 dark:bg-[#1a2b4a]/30">
                        <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{c.name}</p>
                        {c.businessName && <p className="text-xs text-[#7a8a99]">{c.businessName}</p>}
                        {c.discoveryAt && <p className="mt-1 text-xs text-[#2E7C83]">Call: {when(c.discoveryAt)}</p>}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {c.outcome && <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c.outcome === "attended" ? "bg-[#EAF3DE] text-[#27500A]" : "bg-[#FBECEA] text-[#B0342C]"}`}>{c.outcome === "attended" ? "Attended" : "No-show"}</span>}
                          {c.closedTier && <span className="rounded-full bg-[#c9a227]/20 px-2 py-0.5 text-[10px] font-medium text-[#7a5d00]">Closed · {c.closedTier}</span>}
                          {c.inCrm && <span className="rounded-full bg-[#2E7C83]/12 px-2 py-0.5 text-[10px] font-medium text-[#2E7C83]">In CRM</span>}
                        </div>
                      </button>
                    ))}
                    {cards.length === 0 && <p className="px-1 py-2 text-xs text-[#7a8a99]">No one here yet.</p>}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {tab === "contacts" && <Contacts data={data} stageName={stageName} search={search} setSearch={setSearch} onOpen={setOpen} onImport={(rows) => post({ action: "import", rows })} />}
      {tab === "calendar" && (
        <div className="space-y-4">
          <div className={CARD}>
            <p className="mb-1 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Your booking page</p>
            <p className="mb-2 text-xs text-[#7a8a99]">Send this to a prospect to book a 30-minute discovery and closing call with you on Zoom. Each booking has its own Zoom link.</p>
            <CopyLine text={data.bookingLink} />
          </div>
          <MyCalendar />
        </div>
      )}
      {tab === "resources" && <Resources consultant={data.consultant} bookingLink={data.bookingLink} shareLink={data.shareLink} />}

      {adding && <AddProspect onClose={() => setAdding(false)} onSave={async (b) => { const d = await post({ action: "add", ...b }); if (d) setAdding(false); }} />}
      {current && <Drawer key={current.id} card={current} data={data} stageName={stageName} onClose={() => setOpen(null)} post={post} />}
    </div>
  );
}

function CopyLine({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input readOnly value={text} onFocus={(e) => e.currentTarget.select()} aria-label="Link" className={FIELD} />
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* select and copy by hand */ } }} className="inline-flex flex-none items-center gap-1 rounded-lg border border-[#2E7C83] px-3 py-2 text-sm font-medium text-[#2E7C83]">
        {done ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
      </button>
    </div>
  );
}

function Contacts({ data, stageName, search, setSearch, onOpen, onImport }: { data: Data; stageName: Map<string, string>; search: string; setSearch: (s: string) => void; onOpen: (id: string) => void; onImport: (rows: Record<string, string>[]) => Promise<unknown> }) {
  const [msg, setMsg] = useState("");
  const needle = search.trim().toLowerCase();
  const list = data.cards.filter((c) => !needle || [c.name, c.businessName, c.email, c.phone, c.linkedin, c.facebook, c.instagram].some((v) => v.toLowerCase().includes(needle)));
  const file = async (f: File | undefined) => {
    if (!f) return;
    const { rows, unreadable } = readLeadsCsv(await f.text());
    if (unreadable || !rows.length) return setMsg("I couldn't read that file. The first row must name the columns (Name, Business, Email, Phone, LinkedIn, Facebook, Instagram, Notes).");
    const res = (await onImport(rows)) as { added?: number; skipped?: number } | null;
    setMsg(res ? `Added ${res.added ?? 0}${res.skipped ? `, skipped ${res.skipped} (already on your list or missing a name)` : ""}.` : "");
  };
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#7a8a99]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your contacts" aria-label="Search your contacts" className={`${FIELD} pl-9`} />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#2E7C83] px-3 py-2 text-sm font-medium text-[#2E7C83]">
          <Upload className="h-4 w-4" /> Load a list (CSV)
          <input type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={(e) => { void file(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(LEADS_TEMPLATE_CSV)}`} download="call-to-close-leads-template.csv" className="text-xs text-[#2E7C83] underline">Download the template</a>
      </div>
      {msg && <p className="mb-3 text-sm text-[#5b5f73]">{msg}</p>}
      <p className="mb-2 text-xs text-[#7a8a99]">{list.length} of {data.cards.length} contacts. Everyone on your list is a card on your pipeline.</p>
      <div className="overflow-x-auto rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-[#7a8a99]"><tr><th className="p-3">Name</th><th className="p-3">Business</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Stage</th><th className="p-3">Call</th></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} onClick={() => onOpen(c.id)} className="cursor-pointer border-t border-[#1a2b4a]/8 hover:bg-[#1a2b4a]/5">
                <td className="p-3 font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{c.name}</td>
                <td className="p-3">{c.businessName}</td>
                <td className="p-3">{c.email}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3">{stageName.get(c.stageId)}</td>
                <td className="p-3 text-xs">{when(c.discoveryAt)}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-[#7a8a99]">No contacts yet. Add a prospect on your pipeline, or load a list.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddProspect({ onClose, onSave }: { onClose: () => void; onSave: (b: Record<string, string>) => Promise<void> }) {
  const [f, setF] = useState({ name: "", businessName: "", email: "", phone: "", linkedin: "", facebook: "", instagram: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-label="Add a prospect" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#F8F5F0] p-5 shadow-2xl dark:bg-[#14213a]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Add a prospect</h2><button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-[#7a8a99]"><X className="h-5 w-5" /></button></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={LABEL} htmlFor="ap-name">Name *</label><input id="ap-name" className={FIELD} value={f.name} onChange={set("name")} /></div>
          <div><label className={LABEL} htmlFor="ap-biz">Business name</label><input id="ap-biz" className={FIELD} value={f.businessName} onChange={set("businessName")} /></div>
          <div><label className={LABEL} htmlFor="ap-email">Email</label><input id="ap-email" type="email" className={FIELD} value={f.email} onChange={set("email")} /></div>
          <div><label className={LABEL} htmlFor="ap-phone">Phone</label><input id="ap-phone" type="tel" className={FIELD} value={f.phone} onChange={set("phone")} /></div>
          <div><label className={LABEL} htmlFor="ap-li">LinkedIn</label><input id="ap-li" className={FIELD} value={f.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/…" /></div>
          <div><label className={LABEL} htmlFor="ap-fb">Facebook</label><input id="ap-fb" className={FIELD} value={f.facebook} onChange={set("facebook")} /></div>
          <div><label className={LABEL} htmlFor="ap-ig">Instagram</label><input id="ap-ig" className={FIELD} value={f.instagram} onChange={set("instagram")} placeholder="@handle" /></div>
          <div className="sm:col-span-2"><label className={LABEL} htmlFor="ap-notes">Notes</label><textarea id="ap-notes" rows={3} className={FIELD} value={f.notes} onChange={set("notes")} /></div>
        </div>
        <div className="mt-4 flex gap-2">
          <button disabled={busy || !f.name.trim()} onClick={async () => { setBusy(true); await onSave(f); setBusy(false); }} className="rounded-lg bg-[#1a2b4a] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Adding…" : "Add prospect"}</button>
          <button onClick={onClose} className="rounded-lg border border-[#1a2b4a]/20 px-4 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Drawer({ card, data, stageName, onClose, post }: { card: Card; data: Data; stageName: Map<string, string>; onClose: () => void; post: (b: Record<string, unknown>) => Promise<Record<string, unknown> | null> }) {
  const [f, setF] = useState({ name: card.name, businessName: card.businessName, email: card.email, phone: card.phone, linkedin: card.linkedin, facebook: card.facebook, instagram: card.instagram, notes: card.notes, followupAt: localInput(card.followupAt) });
  const [tier, setTier] = useState("");
  const [pay, setPay] = useState("full");
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const closed = data.stages.find((s) => s.id === card.stageId)?.key === "c2c_closed";
  const tierLabel = data.tiers.find((t) => t.id === tier)?.label ?? "";

  const save = async () => {
    setBusy(true);
    await post({ action: "update", cardId: card.id, ...f, followupAt: f.followupAt ? new Date(f.followupAt).toISOString() : null });
    setBusy(false);
    setNote("Saved.");
  };
  const sendAgreement = async () => {
    setNote("");
    const res = await fetch("/api/sales/send-agreement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, email: f.email, phone: f.phone, businessName: f.businessName, tier: tierLabel, payment: pay }) });
    const d = await res.json().catch(() => ({}));
    setNote(res.ok ? "The Year-1 agreement is on its way to them for signature." : d.error || "Couldn't send it.");
  };
  const makeLink = async () => {
    setNote("");
    setLink("");
    const res = await fetch("/api/sales/checkout-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier, email: f.email || undefined, fullName: f.name, sessionSource: "call-to-close", split: pay === "split", annual: pay === "annual", affiliate: data.affiliateCode || undefined }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.url) setLink(d.url);
    else setNote(d.error || "Couldn't make the checkout link.");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside role="dialog" aria-label="Prospect" className="h-full w-full max-w-lg overflow-y-auto bg-[#F8F5F0] p-5 shadow-2xl dark:bg-[#14213a]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{card.name}</h2><button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-[#7a8a99]"><X className="h-5 w-5" /></button></div>

        <div className="mb-4 grid gap-2 rounded-xl bg-[#1a2b4a]/5 p-3 text-xs text-[#1a2b4a] dark:text-[#F8F5F0]">
          <p><b>Stage:</b> {stageName.get(card.stageId)} {card.inCrm ? "· in the CRM" : "· not in the CRM yet (until they book a call)"}</p>
          {card.leadTag && <p><b>Lead source:</b> {card.leadTag}</p>}
          <p><b>Discovery call:</b> {card.discoveryAt ? when(card.discoveryAt) : "not booked"}{card.outcome ? ` · ${card.outcome === "attended" ? "attended" : "no-show"}` : ""}</p>
          {card.closedTier && <p><b>Closed:</b> {card.closedTier}{card.closedOn ? ` on ${card.closedOn}` : ""}</p>}
          {card.tags.length > 0 && <p className="flex flex-wrap gap-1"><b>Tags:</b> {card.tags.map((t) => <span key={t} className="rounded-full bg-white px-2 py-0.5 dark:bg-[#1a2b4a]/40">{t}</span>)}</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={LABEL} htmlFor="d-name">Name</label><input id="d-name" className={FIELD} value={f.name} onChange={set("name")} /></div>
          <div><label className={LABEL} htmlFor="d-biz">Business name</label><input id="d-biz" className={FIELD} value={f.businessName} onChange={set("businessName")} /></div>
          <div><label className={LABEL} htmlFor="d-email">Email</label><input id="d-email" type="email" className={FIELD} value={f.email} onChange={set("email")} /></div>
          <div><label className={LABEL} htmlFor="d-phone">Phone</label><input id="d-phone" type="tel" className={FIELD} value={f.phone} onChange={set("phone")} /></div>
          <div><label className={LABEL} htmlFor="d-li">LinkedIn</label><input id="d-li" className={FIELD} value={f.linkedin} onChange={set("linkedin")} /></div>
          <div><label className={LABEL} htmlFor="d-fb">Facebook</label><input id="d-fb" className={FIELD} value={f.facebook} onChange={set("facebook")} /></div>
          <div><label className={LABEL} htmlFor="d-ig">Instagram</label><input id="d-ig" className={FIELD} value={f.instagram} onChange={set("instagram")} /></div>
          <div className="sm:col-span-2"><label className={LABEL} htmlFor="d-fu">Follow-up call (Mountain time of your device)</label><input id="d-fu" type="datetime-local" className={FIELD} value={f.followupAt} onChange={set("followupAt")} /></div>
          <div className="sm:col-span-2"><label className={LABEL} htmlFor="d-notes">Notes</label><textarea id="d-notes" rows={4} className={FIELD} value={f.notes} onChange={set("notes")} /></div>
        </div>
        <div className="mt-3 flex items-center gap-3"><button disabled={busy || !f.name.trim()} onClick={save} className="rounded-lg bg-[#1a2b4a] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>{note && <span className="text-sm text-[#2c6b3f]">{note}</span>}</div>

        <div className="mt-5 space-y-4">
          <div className={CARD}>
            <p className="mb-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Move this prospect</p>
            <select aria-label="Stage" value={card.stageId} onChange={(e) => void post({ action: "move", cardId: card.id, stageId: e.target.value })} disabled={closed} className={FIELD}>
              {data.stages.filter((s) => s.key !== "c2c_closed" || closed).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="mt-2 flex gap-2">
              <button onClick={() => void post({ action: "outcome", cardId: card.id, outcome: "attended" })} className="rounded-lg border border-[#2E7C83] px-3 py-1.5 text-sm text-[#2E7C83]">Mark attended</button>
              <button onClick={() => void post({ action: "outcome", cardId: card.id, outcome: "no_show" })} className="rounded-lg border border-[#8a2f2f] px-3 py-1.5 text-sm text-[#8a2f2f]">Mark no-show</button>
            </div>
            <p className="mt-1 text-[11px] text-[#7a8a99]">Attendance is also read from Zoom for you, within about 30 minutes of the call ending.</p>
          </div>

          <div className={CARD}>
            <p className="mb-1 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Enroll this client</p>
            <p className="mb-2 text-xs text-[#7a8a99]">Choose the plan and how they pay. Send the Year-1 agreement for signature, then give them the checkout link. Both are credited to you. An account is made only after they have signed and paid.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <select aria-label="Plan" value={tier} onChange={(e) => { setTier(e.target.value); setLink(""); }} className={FIELD}><option value="">Choose a plan</option>{data.tiers.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
              <select aria-label="How they pay" value={pay} onChange={(e) => { setPay(e.target.value); setLink(""); }} className={FIELD}><option value="full">Implementation fee in full, then monthly</option><option value="split">50/50 implementation fee, then monthly</option><option value="annual">Annual, paid in full</option></select>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button disabled={!tier || !f.email} onClick={sendAgreement} className="rounded-lg border border-[#2E7C83] px-3 py-1.5 text-sm font-medium text-[#2E7C83] disabled:opacity-50">1. Send the Year-1 agreement</button>
              <button disabled={!tier} onClick={makeLink} className="rounded-lg border border-[#2E7C83] px-3 py-1.5 text-sm font-medium text-[#2E7C83] disabled:opacity-50">2. Get the checkout link</button>
            </div>
            {!f.email && tier && <p className="mt-1 text-[11px] text-[#8a2f2f]">Add their email above and save, to send the agreement.</p>}
            {link && <div className="mt-2"><CopyLine text={link} /></div>}
            <div className="mt-3 border-t border-[#1a2b4a]/10 pt-3">
              <p className="mb-1 text-xs text-[#7a8a99]">When they have paid and signed, close the card with their plan:</p>
              <button disabled={!tier || closed} onClick={() => void post({ action: "close", cardId: card.id, tier })} className="rounded-lg bg-[#c9a227] px-4 py-1.5 text-sm font-semibold text-[#1a2b4a] disabled:opacity-50">{closed ? "Closed" : `Mark closed${tierLabel ? ` · ${tierLabel}` : ""}`}</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
