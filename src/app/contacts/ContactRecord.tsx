"use client";

import { useCallback, useEffect, useState } from "react";
import { X, FileText, StickyNote, Mail, ShoppingBag, Tag, UserPlus, ClipboardList, Pencil, Plus, Trash2, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import ContactEmails from "./ContactEmails";

export interface ContactFull {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  birthday: string | null;
  facebook: string | null;
  linkedin: string | null;
  instagram: string | null;
  youtube: string | null;
  relationships: string[];
  custom: Record<string, string>;
  tags: string[];
  source: string | null;
  unsubscribed_at: string | null;
  created_at: string;
}
interface Event {
  id: string;
  kind: string;
  title: string;
  detail: Record<string, unknown>;
  created_at: string;
}
interface Series {
  id: string;
  status: string;
  name: string;
  sent: number;
}
interface TagChange {
  id: string;
  tag: string;
  action: "added" | "removed";
  source: string | null;
  approximate: boolean;
  created_at: string;
}
export interface CustomField {
  id: string;
  key: string;
  label: string;
  type: "text" | "long_text" | "number" | "date" | "url" | "select";
  options: string[];
}

export const RELATIONSHIPS = ["Client", "Prospect", "Coach", "Affiliate", "Referral partner", "Partner", "Vendor", "Speaker", "Media", "Team", "Friend", "Family"];

const ICON: Record<string, typeof Mail> = { form: ClipboardList, note: StickyNote, purchase: ShoppingBag, sequence: Mail, tag: Tag, manual: UserPlus, email: Mail };
const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
const fullName = (c: Pick<ContactFull, "first_name" | "last_name" | "email">) => [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
const box = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 py-2 text-sm";
const label = "block text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]";
const heading = "text-xs font-semibold uppercase tracking-wide text-[#7a8a99] mb-2";

// A tag or relationship as a readable pill button.
export function Pill({ children, onClick, onRemove, tone = "teal", title }: { children: React.ReactNode; onClick?: () => void; onRemove?: () => void; tone?: "teal" | "gold"; title?: string }) {
  const colors = tone === "gold" ? "bg-[#c9a227]/15 text-[#6b5410] border-[#c9a227]/40 dark:text-[#f0d98a]" : "bg-[#2E7C83]/10 text-[#1F5E63] border-[#2E7C83]/30 dark:text-[#9fd3d6]";
  return (
    <span className={`inline-flex items-center rounded-full border text-xs font-medium ${colors}`}>
      <button type="button" onClick={onClick} title={title} className={`px-2.5 py-1 ${onClick ? "hover:underline" : "cursor-default"}`}>
        {children}
      </button>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${String(children)}`} className="pr-2 pl-0.5 py-1 opacity-60 hover:opacity-100">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

// Type a tag and press Enter (or pick one already in use) to add it.
export function TagAdder({ existing, current, onAdd }: { existing: string[]; current: string[]; onAdd: (tag: string) => void }) {
  const [text, setText] = useState("");
  const add = (t: string) => {
    const tag = t.trim().toLowerCase();
    if (tag && !current.includes(tag)) onAdd(tag);
    setText("");
  };
  const matches = existing.filter((t) => !current.includes(t) && (!text || t.includes(text.toLowerCase()))).slice(0, 8);
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(text);
            }
          }}
          placeholder="Add a tag…"
          aria-label="Add a tag"
        />
        <Button variant="outline" onClick={() => add(text)} disabled={!text.trim()} aria-label="Add tag">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {matches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {matches.map((t) => (
            <button key={t} type="button" onClick={() => add(t)} className="rounded-full border border-dashed border-[#2E7C83]/40 px-2.5 py-0.5 text-xs text-[#2E7C83] hover:bg-[#2E7C83]/10">
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// A social profile as typed (a link or an @handle) → a link to open.
const SOCIALS = [
  { key: "instagram", label: "Instagram", base: "https://instagram.com/" },
  { key: "facebook", label: "Facebook", base: "https://facebook.com/" },
  { key: "linkedin", label: "LinkedIn", base: "https://www.linkedin.com/in/" },
  { key: "youtube", label: "YouTube", base: "https://youtube.com/@" },
] as const;
function socialHref(base: string, v: string) {
  const t = v.trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (/^(www\.)?[a-z0-9-]+\.[a-z]{2,}\//i.test(t)) return `https://${t}`;
  return base + t.replace(/^@/, "");
}

// Where a tag change came from, in plain words.
function sourceLabel(s: string | null) {
  if (!s) return "";
  if (s.startsWith("form:")) return `form: ${s.slice(5).replace(/-/g, " ")}`;
  if (s.startsWith("booking:")) return `booking: ${s.slice(8).replace(/-/g, " ")}`;
  if (s.startsWith("manual:")) return `by ${s.slice(7)}`;
  if (s === "manual") return "added by hand";
  return s;
}

type Draft = Record<string, string> & { relationships?: never };
type HistoryItem = { id: string; title: string; date: string; detail?: string | null; amount?: number | null; source: string; recordId?: string };
const SOURCE_LABEL: Record<string, string> = { booking: "booked call", zoom: "Zoom", purchase: "checkout", stripe: "checkout", deal: "Pipeline", manual: "added by hand" };
const histDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 ? 2 : 0 });

// Calls they attended or what they bought: newest first, with a small form to log one by hand.
function HistorySection({ kind, title, items, contactId, onChanged, setMsg }: { kind: "attended" | "purchase"; title: string; items: HistoryItem[]; contactId: string; onChanged: () => void; setMsg: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", occurredOn: new Date().toISOString().slice(0, 10), amount: "", offerId: "" });
  const [offers, setOffers] = useState<{ id: string; name: string; price: number | null }[]>([]);
  useEffect(() => {
    if (kind !== "purchase" || !open || offers.length) return;
    fetch("/api/offers", { cache: "no-store" }).then((r) => r.json()).then((d) => setOffers(d.offers ?? [])).catch(() => {});
  }, [kind, open, offers.length]);
  async function save() {
    const r = await fetch(`/api/crm/contacts/${contactId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ record: { kind, ...f } }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Couldn't save.");
    setF({ title: "", occurredOn: new Date().toISOString().slice(0, 10), amount: "", offerId: "" });
    setOpen(false);
    onChanged();
  }
  const total = items.reduce((t, i) => t + (i.amount ?? 0), 0);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">
          {title} ({items.length}){kind === "purchase" && total > 0 ? ` · ${usd(total)}` : ""}
        </p>
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-xs text-[#2E7C83] hover:underline">{open ? "Cancel" : "+ Add"}</button>
      </div>
      {open && (
        <div className="mb-2 space-y-2 rounded-lg border border-[#1a2b4a]/10 p-2">
          {kind === "purchase" && (
            <select
              value={f.offerId}
              onChange={(e) => { const o = offers.find((x) => x.id === e.target.value); setF({ ...f, offerId: e.target.value, title: o?.name ?? f.title, amount: o?.price != null ? String(o.price) : f.amount }); }}
              className={`${box} h-10`}
              aria-label="Offer"
            >
              <option value="">Choose an offer (or type below)</option>
              {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={kind === "purchase" ? "What they bought" : "Which call (e.g. Weekly Alignment Anchor)"} aria-label={kind === "purchase" ? "What they bought" : "Which call"} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={f.occurredOn} onChange={(e) => setF({ ...f, occurredOn: e.target.value })} aria-label="Date" />
            {kind === "purchase" && <Input type="number" min={0} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="Amount $" aria-label="Amount" />}
          </div>
          <Button onClick={save} disabled={!f.title.trim()}>{kind === "purchase" ? "Add purchase" : "Add call"}</Button>
        </div>
      )}
      {items.length ? (
        <ul className="space-y-1.5">
          {items.map((i) => (
            <li key={i.id} className="flex items-start justify-between gap-2 text-sm">
              <span className="min-w-0">
                <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{i.title}</span>
                <span className="block text-xs text-[#7a8a99]">
                  {histDate(i.date)}
                  {i.amount != null ? ` · ${usd(i.amount)}` : ""}
                  {i.detail ? ` · ${i.detail}` : ""}
                  {SOURCE_LABEL[i.source] ? ` · ${SOURCE_LABEL[i.source]}` : ""}
                </span>
              </span>
              {i.recordId && (
                <button
                  type="button"
                  aria-label={`Remove ${i.title}`}
                  onClick={async () => { if (!confirm(`Remove “${i.title}”?`)) return; await fetch(`/api/crm/contacts/${contactId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deleteRecord: i.recordId }) }); onChanged(); }}
                  className="shrink-0 p-1 text-[#7a8a99] hover:text-[#D83A34]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#7a8a99]">{kind === "purchase" ? "No purchases yet." : "No calls attended yet."}</p>
      )}
    </div>
  );
}

export default function ContactRecord({
  id,
  allTags,
  onClose,
  onChanged,
  onFilterTag,
  setMsg,
}: {
  id: string;
  allTags: string[];
  onClose: () => void;
  onChanged: () => void;
  onFilterTag: (tag: string) => void;
  setMsg: (m: string) => void;
}) {
  const [c, setC] = useState<ContactFull | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [history, setHistory] = useState<TagChange[]>([]);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [attended, setAttended] = useState<HistoryItem[]>([]);
  const [purchases, setPurchases] = useState<HistoryItem[]>([]);
  const [pipelines, setPipelines] = useState<{ id: string; board: string; stage: string; followUpOn: string | null }[]>([]);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({} as Draft);
  const [rels, setRels] = useState<string[]>([]);
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [newRel, setNewRel] = useState("");
  const [managing, setManaging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; active: boolean }[]>([]);
  const [pickCampaign, setPickCampaign] = useState("");

  const load = useCallback(async () => {
    const d = await fetch(`/api/crm/contacts/${id}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setC(d.contact ?? null);
    setEvents(d.events ?? []);
    setSeries(d.series ?? []);
    setHistory(d.tagHistory ?? []);
    setFields(d.customFields ?? []);
    setPipelines(d.pipelines ?? []);
    setAttended(d.attended ?? []);
    setPurchases(d.purchases ?? []);
  }, [id]);
  useEffect(() => {
    fetch("/api/sequences", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCampaigns(((d.sequences ?? []) as { id: string; name: string; active: boolean }[]).map((x) => ({ id: x.id, name: x.name, active: x.active }))))
      .catch(() => {});
  }, []);
  useEffect(() => {
    setEditing(false);
    setManaging(false);
    void load();
  }, [load]);

  function startEdit() {
    if (!c) return;
    setDraft({
      email: c.email,
      firstName: c.first_name ?? "",
      lastName: c.last_name ?? "",
      phone: c.phone ?? "",
      company: c.company ?? "",
      jobTitle: c.job_title ?? "",
      website: c.website ?? "",
      addressLine1: c.address_line1 ?? "",
      addressLine2: c.address_line2 ?? "",
      city: c.city ?? "",
      region: c.region ?? "",
      postalCode: c.postal_code ?? "",
      country: c.country ?? "",
      birthday: c.birthday ?? "",
      instagram: c.instagram ?? "",
      facebook: c.facebook ?? "",
      linkedin: c.linkedin ?? "",
      youtube: c.youtube ?? "",
    } as Draft);
    setRels(c.relationships ?? []);
    setCustom({ ...(c.custom ?? {}) });
    setEditing(true);
  }

  async function patch(body: Record<string, unknown>, ok?: string) {
    const r = await fetch(`/api/crm/contacts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(d.error || "Couldn't save.");
      return false;
    }
    if (ok) setMsg(ok);
    await load();
    onChanged();
    return true;
  }

  async function saveEdit() {
    setSaving(true);
    const done = await patch({ ...draft, relationships: rels, custom }, "Contact saved.");
    setSaving(false);
    if (done) setEditing(false);
  }

  async function addNote() {
    if (!note.trim()) return;
    const r = await fetch(`/api/crm/contacts/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }) });
    if (!r.ok) return setMsg("Couldn't save the note.");
    setNote("");
    void load();
    onChanged();
  }

  if (!c) return <Card><CardContent className="p-5 text-sm text-[#7a8a99]">Loading…</CardContent></Card>;

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, [k]: e.target.value }) as Draft);
  const address = [c.address_line1, c.address_line2, [c.city, c.region].filter(Boolean).join(", ") + (c.postal_code ? ` ${c.postal_code}` : ""), c.country].map((x) => (x ?? "").trim()).filter(Boolean);
  const details: [string, React.ReactNode][] = [
    ["Company", c.company],
    ["Title", c.job_title],
    ["Website", c.website ? <a href={/^https?:\/\//.test(c.website) ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" className="text-[#2E7C83] break-all">{c.website}</a> : null],
    ["Address", address.length ? <span className="whitespace-pre-line">{address.join("\n")}</span> : null],
    ["Birthday", c.birthday ? new Date(`${c.birthday}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null],
    ...SOCIALS.map((s) => {
      const v = (c[s.key] ?? "").trim();
      return [s.label, v ? <a href={socialHref(s.base, v)} target="_blank" rel="noreferrer" className="text-[#2E7C83] break-all">{v}</a> : null] as [string, React.ReactNode];
    }),
    ...fields.map((f) => [f.label, c.custom?.[f.key] ? (f.type === "url" ? <a href={c.custom[f.key]} target="_blank" rel="noreferrer" className="text-[#2E7C83] break-all">{c.custom[f.key]}</a> : <span className="whitespace-pre-line">{c.custom[f.key]}</span>) : null] as [string, React.ReactNode]),
  ];
  const filled = details.filter(([, v]) => v);

  return (
    <Card className="lg:sticky lg:top-4 self-start">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{fullName(c)}</p>
            <a href={`mailto:${c.email}`} className="text-sm text-[#2E7C83] break-all">{c.email}</a>
            {c.phone && <p className="text-sm text-[#5a6472]"><a href={`tel:${c.phone}`}>{c.phone}</a></p>}
            <p className="text-xs text-[#7a8a99] mt-1">
              Since {when(c.created_at)}
              {c.source ? ` · from ${sourceLabel(c.source)}` : ""}
              {c.unsubscribed_at ? " · unsubscribed from emails" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!editing && (
              <Button variant="outline" onClick={startEdit} aria-label="Edit contact">
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
            )}
            <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-[#1a2b4a]/5"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4 rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/5 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>First name<Input value={draft.firstName} onChange={set("firstName")} /></label>
              <label className={label}>Last name<Input value={draft.lastName} onChange={set("lastName")} /></label>
              <label className={`${label} sm:col-span-2`}>Email<Input type="email" value={draft.email} onChange={set("email")} /></label>
              <label className={label}>Phone<Input type="tel" value={draft.phone} onChange={set("phone")} /></label>
              <label className={label}>Birthday<Input type="date" value={draft.birthday} onChange={set("birthday")} /></label>
              <label className={label}>Company<Input value={draft.company} onChange={set("company")} /></label>
              <label className={label}>Title<Input value={draft.jobTitle} onChange={set("jobTitle")} /></label>
              <label className={`${label} sm:col-span-2`}>Website<Input value={draft.website} onChange={set("website")} placeholder="https://" /></label>
              <label className={`${label} sm:col-span-2`}>Street address<Input value={draft.addressLine1} onChange={set("addressLine1")} /></label>
              <label className={`${label} sm:col-span-2`}>Apartment, suite, etc.<Input value={draft.addressLine2} onChange={set("addressLine2")} /></label>
              <label className={label}>City<Input value={draft.city} onChange={set("city")} /></label>
              <label className={label}>State / region<Input value={draft.region} onChange={set("region")} /></label>
              <label className={label}>Postal code<Input value={draft.postalCode} onChange={set("postalCode")} /></label>
              <label className={label}>Country<Input value={draft.country} onChange={set("country")} /></label>
              <label className={label}>Instagram<Input value={draft.instagram} onChange={set("instagram")} placeholder="@handle or link" /></label>
              <label className={label}>Facebook<Input value={draft.facebook} onChange={set("facebook")} placeholder="Profile link or name" /></label>
              <label className={label}>LinkedIn<Input value={draft.linkedin} onChange={set("linkedin")} placeholder="Profile link" /></label>
              <label className={label}>YouTube<Input value={draft.youtube} onChange={set("youtube")} placeholder="@channel or link" /></label>
            </div>

            <div>
              <p className={label}>Relationship</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {Array.from(new Set([...RELATIONSHIPS, ...rels])).map((r) => {
                  const on = rels.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setRels((x) => (on ? x.filter((y) => y !== r) : [...x, r]))}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${on ? "bg-[#c9a227] border-[#c9a227] text-white" : "border-[#1a2b4a]/20 text-[#5a6472] hover:border-[#c9a227]"}`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-2">
                <Input value={newRel} onChange={(e) => setNewRel(e.target.value)} placeholder="Add your own (e.g. Mentor)" onKeyDown={(e) => {
                  if (e.key === "Enter" && newRel.trim()) {
                    e.preventDefault();
                    setRels((x) => Array.from(new Set([...x, newRel.trim()])));
                    setNewRel("");
                  }
                }} />
                <Button variant="outline" disabled={!newRel.trim()} onClick={() => { setRels((x) => Array.from(new Set([...x, newRel.trim()]))); setNewRel(""); }} aria-label="Add relationship"><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className={label}>Custom fields</p>
                <button type="button" onClick={() => setManaging((v) => !v)} className="inline-flex items-center gap-1 text-xs text-[#2E7C83] hover:underline">
                  <Settings2 className="w-3.5 h-3.5" /> {managing ? "Done" : "Add or remove fields"}
                </button>
              </div>
              {managing && <CustomFieldsManager fields={fields} onChanged={load} setMsg={setMsg} />}
              {fields.map((f) => (
                <label key={f.id} className={label}>
                  {f.label}
                  {f.type === "long_text" ? (
                    <textarea rows={3} value={custom[f.key] ?? ""} onChange={(e) => setCustom((x) => ({ ...x, [f.key]: e.target.value }))} className={`${box} mt-1`} />
                  ) : f.type === "select" ? (
                    <select value={custom[f.key] ?? ""} onChange={(e) => setCustom((x) => ({ ...x, [f.key]: e.target.value }))} className={`${box} mt-1 h-10`}>
                      <option value="">—</option>
                      {f.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <Input type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "url" ? "url" : "text"} value={custom[f.key] ?? ""} onChange={(e) => setCustom((x) => ({ ...x, [f.key]: e.target.value }))} />
                  )}
                </label>
              ))}
              {!fields.length && !managing && <p className="text-xs text-[#7a8a99]">None yet. Use &ldquo;Add or remove fields&rdquo; to add your own, like Referred by or Program.</p>}
            </div>

            <div className="flex gap-2">
              <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
              <Button variant="outline" onClick={() => { setEditing(false); setManaging(false); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            {(c.relationships?.length ?? 0) > 0 && (
              <div>
                <p className={heading}>Relationship</p>
                <div className="flex flex-wrap gap-1.5">{c.relationships.map((r) => <Pill key={r} tone="gold">{r}</Pill>)}</div>
              </div>
            )}
            {filled.length > 0 ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                {filled.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-[#7a8a99]">{k}</dt>
                    <dd className="text-[#1a2b4a] dark:text-[#F8F5F0] min-w-0 break-words">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <button type="button" onClick={startEdit} className="text-sm text-[#2E7C83] hover:underline">+ Add address, company, socials, relationship and more</button>
            )}
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <HistorySection kind="attended" title="Calls attended" items={attended} contactId={c.id} onChanged={() => { void load(); onChanged(); }} setMsg={setMsg} />
          <HistorySection kind="purchase" title="Purchases" items={purchases} contactId={c.id} onChanged={() => { void load(); onChanged(); }} setMsg={setMsg} />
        </div>

        {pipelines.length > 0 && (
          <div>
            <p className={heading}>Pipelines</p>
            <ul className="space-y-1">
              {pipelines.map((p) => (
                <li key={p.id} className="text-sm">
                  <a href="/dm-pipeline" className="font-medium text-[#2E7C83] hover:underline">{p.board}</a>
                  <span className="text-[#5a6472] dark:text-[#b8c2cf]"> · {p.stage}</span>
                  {p.followUpOn && <span className="text-xs text-[#7a8a99]"> · follow up {new Date(`${p.followUpOn}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        <div>
          <p className={heading}>Tags</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {c.tags.map((t) => (
              <Pill key={t} title="Show everyone with this tag" onClick={() => onFilterTag(t)} onRemove={() => void patch({ tags: c.tags.filter((x) => x !== t) })}>
                {t}
              </Pill>
            ))}
            {!c.tags.length && <span className="text-sm text-[#7a8a99]">No tags yet.</span>}
          </div>
          <TagAdder existing={allTags} current={c.tags} onAdd={(t) => void patch({ tags: [...c.tags, t] })} />
        </div>

        {/* Tag history */}
        {history.length > 0 && (
          <div>
            <p className={heading}>Tag history</p>
            <ol className="space-y-1.5">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                  <span className={`text-xs font-semibold ${h.action === "added" ? "text-[#2E7C83]" : "text-[#C76F56]"}`}>{h.action === "added" ? "Added" : "Removed"}</span>
                  <Pill onClick={() => onFilterTag(h.tag)} title="Show everyone with this tag">{h.tag}</Pill>
                  <span className="text-xs text-[#7a8a99]">
                    {h.approximate ? `by ${when(h.created_at)}` : when(h.created_at)}
                    {h.source ? ` · ${sourceLabel(h.source)}` : ""}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div>
          <p className={heading}>Email campaigns</p>
          {series.map((s) => (
            <p key={s.id} className="text-sm">{s.name} · <span className="capitalize">{s.status}</span> · {s.sent} sent</p>
          ))}
          {campaigns.length > 0 && !c.unsubscribed_at && (
            <div className="mt-2 flex gap-2">
              <select value={pickCampaign} onChange={(e) => setPickCampaign(e.target.value)} className={`${box} h-10`} aria-label="Add to a campaign">
                <option value="">Add to a campaign…</option>
                {campaigns.filter((x) => !series.some((s) => s.name === x.name)).map((x) => (
                  <option key={x.id} value={x.id}>{x.name}{x.active ? "" : " (paused)"}</option>
                ))}
              </select>
              <Button
                variant="outline"
                disabled={!pickCampaign}
                onClick={async () => {
                  const r = await fetch(`/api/sequences/${pickCampaign}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "enrol", email: c.email }) });
                  const d = await r.json().catch(() => ({}));
                  if (!r.ok) return setMsg(d.error || "Couldn't add them.");
                  setMsg(`Added to ${campaigns.find((x) => x.id === pickCampaign)?.name ?? "the campaign"}.`);
                  setPickCampaign("");
                  void load();
                  onChanged();
                }}
              >
                Add
              </Button>
            </div>
          )}
          {!series.length && !campaigns.length && <p className="text-sm text-[#7a8a99]">Not in any campaigns.</p>}
        </div>

        <div>
          <p className={heading}>Add a note</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="A call, a conversation, a next step…" className={box} />
          <Button className="mt-2" onClick={addNote}>Save note</Button>
        </div>

        <ContactEmails contactId={c.id} name={fullName(c)} />

        <div>
          <p className={heading}>Timeline</p>
          <ol className="space-y-3">
            {events.map((e) => {
              const Icon = ICON[e.kind] ?? FileText;
              const data = (e.detail?.data as Record<string, string> | undefined) ?? null;
              return (
                <li key={e.id} className="flex gap-3">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0 text-[#c9a227]" />
                  <div className="min-w-0">
                    <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0] whitespace-pre-wrap break-words">{e.title}</p>
                    {data && (
                      <dl className="mt-1 text-xs text-[#5a6472] space-y-0.5">
                        {Object.entries(data)
                          .filter(([k]) => !["email", "name"].includes(k))
                          .map(([k, v]) => (
                            <div key={k}>
                              <dt className="inline font-medium">{k.replace(/_/g, " ")}: </dt>
                              <dd className="inline whitespace-pre-wrap">{v}</dd>
                            </div>
                          ))}
                      </dl>
                    )}
                    <p className="text-xs text-[#7a8a99]">{when(e.created_at)}</p>
                  </div>
                </li>
              );
            })}
            {!events.length && <li className="text-sm text-[#7a8a99]">Nothing yet.</li>}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

// Add or remove the account's own contact fields (they show on every contact).
function CustomFieldsManager({ fields, onChanged, setMsg }: { fields: CustomField[]; onChanged: () => void; setMsg: (m: string) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomField["type"]>("text");
  const [options, setOptions] = useState("");

  async function add() {
    const r = await fetch("/api/crm/custom-fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: name, type, options: options.split(",").map((o) => o.trim()).filter(Boolean) }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Couldn't add the field.");
    setName("");
    setOptions("");
    setType("text");
    onChanged();
  }
  async function remove(f: CustomField) {
    if (!confirm(`Remove the “${f.label}” field from every contact? Anything filled in for it is deleted.`)) return;
    const r = await fetch(`/api/crm/custom-fields/${f.id}`, { method: "DELETE" });
    if (!r.ok) return setMsg("Couldn't remove it.");
    onChanged();
  }

  return (
    <div className="rounded-lg border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/30 p-3 space-y-2">
      <p className="text-xs text-[#7a8a99]">Fields you add here appear on every contact in your account.</p>
      {fields.map((f) => (
        <div key={f.id} className="flex items-center justify-between text-sm">
          <span>{f.label} <span className="text-xs text-[#7a8a99]">({f.type.replace("_", " ")}{f.options.length ? `: ${f.options.join(", ")}` : ""})</span></span>
          <button type="button" onClick={() => void remove(f)} aria-label={`Remove ${f.label}`} className="p-1 text-[#7a8a99] hover:text-[#D83A34]"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Field name, e.g. Referred by" />
        <select value={type} onChange={(e) => setType(e.target.value as CustomField["type"])} className={`${box} h-10`} aria-label="Field type">
          <option value="text">Short text</option>
          <option value="long_text">Long text</option>
          <option value="number">Number</option>
          <option value="date">Date</option>
          <option value="url">Link</option>
          <option value="select">Choice list</option>
        </select>
      </div>
      {type === "select" && <Input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Choices, separated by commas" />}
      <Button variant="outline" onClick={add} disabled={!name.trim()}><Plus className="w-4 h-4 mr-1" /> Add field</Button>
    </div>
  );
}
