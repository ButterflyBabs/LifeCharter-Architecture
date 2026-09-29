"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, Search, Plus, X, FileText, Copy, ExternalLink, StickyNote, Mail, ShoppingBag, Tag, UserPlus, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import BroadcastsTab from "./BroadcastsTab";
import EmailSendingTab from "./EmailSendingTab";
import ImportContacts, { ExportContactsLink } from "./ImportContacts";

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  tags: string[];
  source: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  last_activity_at: string | null;
  timezone?: string;
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
  start_date: string;
}
interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
}
interface Form {
  id: string;
  key: string;
  name: string;
  description: string | null;
  fields: Field[];
  tags: string[];
  sequence_key: string | null;
  notify: boolean;
  success_message: string;
  active: boolean;
  submissions?: number;
  last_submission?: string | null;
}
interface Submission {
  id: string;
  data: Record<string, string>;
  page_url: string | null;
  created_at: string;
  contact_id: string | null;
}

const TABS = ["contacts", "forms", "broadcasts", "sending"] as const;
type Tab = (typeof TABS)[number];
const APP = typeof window !== "undefined" ? window.location.origin : "https://lccommandsuite.com";
const fullName = (c: Pick<Contact, "first_name" | "last_name" | "email">) => [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
const ICON: Record<string, typeof Mail> = { form: ClipboardList, note: StickyNote, purchase: ShoppingBag, sequence: Mail, tag: Tag, manual: UserPlus, email: Mail };
const chip = "inline-flex items-center gap-1 rounded-full bg-[#2E7C83]/10 px-2.5 py-0.5 text-xs text-[#1F5E63] dark:text-[#9fd3d6]";
const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 p-3 text-sm";

export default function ContactsCrm() {
  const [tab, setTab] = useState<Tab>("contacts");
  const [msg, setMsg] = useState("");
  // Deep link: /contacts?tab=sending (the "Set up email sending" links point here).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && (TABS as readonly string[]).includes(t)) setTab(t as Tab);
  }, []);
  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a227] to-[#1a2b4a] flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Contacts</h1>
          <p className="text-[#7a8a99]">Everyone who has reached you: form sign-ups, buyers and people you add. Every touch lands on their timeline.</p>
        </div>
      </div>
      <div className="flex gap-2 mb-5">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === t ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
            {t === "contacts" ? "Contacts" : t === "forms" ? "Forms" : t === "broadcasts" ? "Broadcasts" : "Email sending"}
          </button>
        ))}
      </div>
      {msg && (
        <button onClick={() => setMsg("")} className="mb-4 block w-full text-left rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm">
          {msg}
        </button>
      )}
      {tab === "contacts" ? <ContactsTab setMsg={setMsg} /> : tab === "forms" ? <FormsTab setMsg={setMsg} /> : tab === "broadcasts" ? <BroadcastsTab setMsg={setMsg} /> : <EmailSendingTab setMsg={setMsg} />}
    </div>
  );
}

/* ───────────────────────────── Contacts ───────────────────────────── */
function ContactsTab({ setMsg }: { setMsg: (m: string) => void }) {
  const [list, setList] = useState<Contact[] | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [openId, setOpenId] = useState("");
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [add, setAdd] = useState({ email: "", firstName: "", lastName: "", phone: "", tags: "", note: "" });

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (tag) p.set("tag", tag);
    const d = await fetch(`/api/crm/contacts?${p}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setList(d.contacts ?? []);
    setTags(d.tags ?? []);
  }, [q, tag]);
  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  async function saveNew() {
    const r = await fetch("/api/crm/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...add, tags: add.tags.split(",").map((t) => t.trim()).filter(Boolean) }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Couldn't save.");
    setMsg(d.created ? "Contact added." : "They were already here, so I updated them.");
    setAdding(false);
    setAdd({ email: "", firstName: "", lastName: "", phone: "", tags: "", note: "" });
    setOpenId(d.id);
    void load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8a99]" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="pl-9" />
          </div>
          <select value={tag} onChange={(e) => setTag(e.target.value)} className="h-10 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 text-sm" aria-label="Filter by tag">
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <Button onClick={() => setAdding((v) => !v)}>
            <Plus className="w-4 h-4 mr-1" /> Add contact
          </Button>
          <Button variant="outline" onClick={() => setImporting((v) => !v)}>Import contacts</Button>
          <ExportContactsLink />
        </div>
        {importing && <ImportContacts onClose={() => setImporting(false)} onImported={load} onViewTag={(t) => { setQ(""); setTag(t); setImporting(false); }} />}
        {adding && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder="Email *" value={add.email} onChange={(e) => setAdd({ ...add, email: e.target.value })} />
                <Input placeholder="Phone" value={add.phone} onChange={(e) => setAdd({ ...add, phone: e.target.value })} />
                <Input placeholder="First name" value={add.firstName} onChange={(e) => setAdd({ ...add, firstName: e.target.value })} />
                <Input placeholder="Last name" value={add.lastName} onChange={(e) => setAdd({ ...add, lastName: e.target.value })} />
              </div>
              <Input placeholder="Tags, separated by commas" value={add.tags} onChange={(e) => setAdd({ ...add, tags: e.target.value })} />
              <textarea placeholder="Note (optional)" rows={2} value={add.note} onChange={(e) => setAdd({ ...add, note: e.target.value })} className={field} />
              <div className="flex gap-2">
                <Button onClick={saveNew}>Save</Button>
                <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="overflow-x-auto rounded-xl border border-[#1a2b4a]/10">
          <table className="w-full text-sm">
            <thead className="bg-[#1a2b4a]/5 text-left">
              <tr>
                <th className="p-3">Person</th>
                <th className="p-3">Tags</th>
                <th className="p-3 whitespace-nowrap">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {(list ?? []).map((c) => (
                <tr key={c.id} onClick={() => setOpenId(c.id)} className={`cursor-pointer border-t border-[#1a2b4a]/10 hover:bg-[#1a2b4a]/5 ${c.id === openId ? "bg-[#c9a227]/10" : ""}`}>
                  <td className="p-3">
                    <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{fullName(c)}</p>
                    <p className="text-xs text-[#7a8a99]">
                      {c.email}
                      {c.unsubscribed_at ? " · unsubscribed" : ""}
                    </p>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 4).map((t) => (
                        <span key={t} className={chip}>
                          {t}
                        </span>
                      ))}
                      {c.tags.length > 4 && <span className="text-xs text-[#7a8a99]">+{c.tags.length - 4}</span>}
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap text-[#5a6472]">{when(c.last_activity_at || c.created_at)}</td>
                </tr>
              ))}
              {list && !list.length && (
                <tr>
                  <td colSpan={3} className="p-4 text-[#7a8a99]">
                    {q || tag ? "No one matches." : "No contacts yet. Form sign-ups and buyers will appear here."}
                  </td>
                </tr>
              )}
              {!list && (
                <tr>
                  <td colSpan={3} className="p-4 text-[#7a8a99]">Loading…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {openId ? <ContactPanel id={openId} onClose={() => setOpenId("")} onChanged={load} setMsg={setMsg} /> : <div className="hidden lg:block text-sm text-[#7a8a99] pt-3">Choose someone to see their timeline.</div>}
    </div>
  );
}

function ContactPanel({ id, onClose, onChanged, setMsg }: { id: string; onClose: () => void; onChanged: () => void; setMsg: (m: string) => void }) {
  const [c, setC] = useState<Contact | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [note, setNote] = useState("");
  const [tagText, setTagText] = useState("");

  const load = useCallback(async () => {
    const d = await fetch(`/api/crm/contacts/${id}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setC(d.contact ?? null);
    setEvents(d.events ?? []);
    setSeries(d.series ?? []);
    setTagText(((d.contact?.tags as string[]) ?? []).join(", "));
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);

  async function saveTags() {
    const r = await fetch(`/api/crm/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: tagText.split(",").map((t) => t.trim()).filter(Boolean) }),
    });
    if (!r.ok) return setMsg("Couldn't save the tags.");
    void load();
    onChanged();
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
  return (
    <Card className="lg:sticky lg:top-4 self-start">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{fullName(c)}</p>
            <a href={`mailto:${c.email}`} className="text-sm text-[#2E7C83] break-all">{c.email}</a>
            {c.phone && <p className="text-sm text-[#5a6472]">{c.phone}</p>}
            <p className="text-xs text-[#7a8a99] mt-1">
              Since {when(c.created_at)}
              {c.source ? ` · from ${c.source.replace(/^form:/, "form ")}` : ""}
              {c.unsubscribed_at ? " · unsubscribed from emails" : ""}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-[#1a2b4a]/5"><X className="w-4 h-4" /></button>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7a8a99] mb-1">Tags</p>
          <div className="flex gap-2">
            <Input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="Separated by commas" />
            <Button variant="outline" onClick={saveTags}>Save</Button>
          </div>
        </div>

        {series.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7a8a99] mb-1">Email series</p>
            {series.map((s) => (
              <p key={s.id} className="text-sm">{s.name} · <span className="capitalize">{s.status}</span> · {s.sent} sent</p>
            ))}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7a8a99] mb-1">Add a note</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="A call, a conversation, a next step…" className={field} />
          <Button className="mt-2" onClick={addNote}>Save note</Button>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7a8a99] mb-2">Timeline</p>
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

/* ───────────────────────────── Forms ───────────────────────────── */
function FormsTab({ setMsg }: { setMsg: (m: string) => void }) {
  const [forms, setForms] = useState<Form[] | null>(null);
  const [openId, setOpenId] = useState("");
  const [newName, setNewName] = useState("");
  const [seqs, setSeqs] = useState<{ key: string; name: string }[]>([]);

  const load = useCallback(async () => {
    const d = await fetch("/api/crm/forms", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setForms(d.forms ?? []);
  }, []);
  useEffect(() => {
    void load();
    fetch("/api/sequences", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSeqs((d.sequences ?? []).map((s: { key: string; name: string }) => ({ key: s.key, name: s.name }))))
      .catch(() => {});
  }, [load]);

  async function create() {
    if (!newName.trim()) return;
    const r = await fetch("/api/crm/forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Couldn't create it.");
    setNewName("");
    setOpenId(d.form.id);
    void load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="space-y-2">
        {(forms ?? []).map((f) => (
          <button key={f.id} onClick={() => setOpenId(f.id)} className={`w-full text-left rounded-xl border p-3 transition ${f.id === openId ? "border-[#c9a227] bg-[#c9a227]/10" : "border-[#1a2b4a]/10 hover:bg-[#1a2b4a]/5"}`}>
            <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{f.name}</p>
            <p className="text-xs text-[#7a8a99]">
              {f.active ? "" : "Off · "}
              {f.submissions ?? 0} submissions{f.last_submission ? ` · last ${when(f.last_submission)}` : ""}
            </p>
          </button>
        ))}
        {forms && !forms.length && <p className="text-sm text-[#7a8a99]">No forms yet.</p>}
        <div className="flex gap-2 pt-2">
          <Input placeholder="New form name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={create} aria-label="Create form"><Plus className="w-4 h-4" /></Button>
        </div>
      </div>
      {openId ? <FormEditor id={openId} seqs={seqs} setMsg={setMsg} onChanged={load} /> : <p className="text-sm text-[#7a8a99] pt-3">Choose a form to see its submissions, link and settings.</p>}
    </div>
  );
}

function FormEditor({ id, seqs, setMsg, onChanged }: { id: string; seqs: { key: string; name: string }[]; setMsg: (m: string) => void; onChanged: () => void }) {
  const [form, setForm] = useState<Form | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [fieldsText, setFieldsText] = useState("");
  const [tagText, setTagText] = useState("");

  const load = useCallback(async () => {
    const d = await fetch(`/api/crm/forms/${id}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setForm(d.form ?? null);
    setSubs(d.submissions ?? []);
    setFieldsText(((d.form?.fields as Field[]) ?? []).map((f) => `${f.label}${f.required ? " *" : ""}${f.type && f.type !== "text" && f.type !== "select" ? ` (${f.type})` : ""}${f.options?.length ? `: ${f.options.join(" | ")}` : ""}`).join("\n"));
    setTagText(((d.form?.tags as string[]) ?? []).join(", "));
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);

  async function save(patch: Record<string, unknown>, ok = "Saved.") {
    const r = await fetch(`/api/crm/forms/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || "Couldn't save.");
    setMsg(ok);
    setForm(d.form);
    onChanged();
  }

  // One field per line: "Label *" = required, "(email|tel|date|textarea)" sets
  // the type, and ": a | b | c" makes it a choice list. Field names follow the
  // label, except the fixed ones the CRM knows (name, email, phone).
  function parseFields() {
    return fieldsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const at = l.indexOf(":");
        const head = at >= 0 ? l.slice(0, at) : l;
        const opts = at >= 0 ? l.slice(at + 1) : "";
        const required = /\*\s*(\(|$)/.test(head) || head.includes(" *");
        const typeMatch = head.match(/\((email|tel|date|textarea)\)/i);
        const label = head.replace(/\((email|tel|date|textarea)\)/i, "").replace("*", "").trim();
        const low = label.toLowerCase();
        const name = low === "your name" || low === "full name" ? "name" : low.startsWith("email") ? "email" : low.startsWith("phone") ? "phone" : undefined;
        return { label, name, required, type: typeMatch ? typeMatch[1].toLowerCase() : undefined, options: opts ? opts.split("|").map((o) => o.trim()).filter(Boolean) : undefined };
      });
  }

  if (!form) return <p className="text-sm text-[#7a8a99]">Loading…</p>;
  const link = `${APP}/f/${form.id}`;
  return (
    <div className="space-y-4 min-w-0">
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{form.name}</p>
            <Button variant="outline" onClick={() => save({ active: !form.active }, form.active ? "Form turned off. It won't take new submissions." : "Form is on.")}>
              {form.active ? "Turn off" : "Turn on"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[#7a8a99]">Share link:</span>
            <a href={link} target="_blank" rel="noreferrer" className="text-[#2E7C83] break-all inline-flex items-center gap-1">
              {link} <ExternalLink className="w-3 h-3" />
            </a>
            <button onClick={() => navigator.clipboard.writeText(link).then(() => setMsg("Link copied."))} className="p-1 rounded hover:bg-[#1a2b4a]/5" aria-label="Copy link">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[#7a8a99]">Form id for the websites: {form.id}</p>
          <p className="text-xs text-[#7a8a99]">
            On your own website: link to the share link above, or point a plain HTML form at{" "}
            <code className="break-all">{`<form method="post" action="${APP}/api/forms/${form.id}">`}</code> with inputs named {form.fields.map((f) => f.name).join(", ")}.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Settings</p>
          <label className="block text-sm">
            Tags every submitter gets
            <Input value={tagText} onChange={(e) => setTagText(e.target.value)} onBlur={() => save({ tags: tagText.split(",").map((t) => t.trim()).filter(Boolean) }, "Tags saved.")} />
          </label>
          <label className="block text-sm">
            Start this email series when they submit
            <select
              value={form.sequence_key || ""}
              onChange={(e) => save({ sequenceKey: e.target.value }, "Saved.")}
              className="mt-1 h-10 w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 text-sm"
            >
              <option value="">None</option>
              {seqs.map((s) => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.notify} onChange={(e) => save({ notify: e.target.checked })} /> Email me each new submission
          </label>
          <label className="block text-sm">
            Thank-you message
            <textarea defaultValue={form.success_message} rows={2} onBlur={(e) => e.target.value !== form.success_message && save({ successMessage: e.target.value })} className={field} />
          </label>
          <label className="block text-sm">
            Fields, one per line
            <textarea value={fieldsText} onChange={(e) => setFieldsText(e.target.value)} rows={8} className={`${field} font-mono text-xs`} />
            <span className="text-xs text-[#7a8a99]">Add * for required, (email), (tel), (date) or (textarea) for the kind, and &ldquo;: choice | choice&rdquo; for a list. Email is always included.</span>
          </label>
          <Button onClick={() => save({ fields: parseFields() }, "Fields saved.")}>Save fields</Button>
        </CardContent>
      </Card>

      <div>
        <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">Submissions ({subs.length})</p>
        <div className="space-y-2">
          {subs.map((s) => (
            <div key={s.id} className="rounded-xl border border-[#1a2b4a]/10 p-3 text-sm">
              <p className="text-xs text-[#7a8a99] mb-1">{when(s.created_at)}{s.page_url ? ` · ${s.page_url}` : ""}</p>
              <dl className="space-y-0.5">
                {Object.entries(s.data).map(([k, v]) => (
                  <div key={k}>
                    <dt className="inline font-medium text-[#5a6472]">{k.replace(/_/g, " ")}: </dt>
                    <dd className="inline whitespace-pre-wrap">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          {!subs.length && <p className="text-sm text-[#7a8a99]">No submissions yet.</p>}
        </div>
      </div>
    </div>
  );
}
