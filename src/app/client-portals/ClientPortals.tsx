"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Check, Copy, ExternalLink, Loader2, Minus, Palette, Paperclip, Plus, Send, Trash2, UsersRound } from "lucide-react";
import { COLOR_PRESETS, PORTAL_FONTS, onAccent, type PortalLook } from "@/lib/portalLook";
import ContactLookupInput, { lookupName, type LookupContact } from "@/components/crm/ContactLookupInput";

type Portal = { contactId: string; name: string; email: string; active: boolean; sentAt: string | null; lastSeenAt: string | null; unread: number };
type Pkg = { id: string; name: string; sessions_total: number; used: number; calendar_ids: string[]; expires_on: string | null; status: string };
type Item = { id: string; kind: "homework" | "goal" | "resource"; title: string; body: string | null; url: string | null; file_name: string | null; file_path: string | null; due_on: string | null; status: string; done_by: string | null };
type Detail = {
  contact: { id: string; email: string; first_name: string | null; last_name: string | null };
  portal: { active: boolean; welcome: string | null; sent_at: string | null; last_seen_at: string | null; url: string; look: PortalLook } | null;
  defaultLook: PortalLook;
  accountLogo: string | null;
  packages: Pkg[];
  items: Item[];
  messages: { id: string; author: "owner" | "client"; body: string; read_at: string | null; created_at: string }[];
  reports: { id: string; title: string; session_date: string; shared_at: string | null }[];
  offers: { id: string; name: string }[];
  calendars: { id: string; name: string; slug: string; active: boolean }[];
};

const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-[0_8px_24px_rgba(26,43,74,0.08)] dark:border-white/10 dark:bg-[#1a2b4a]/40";
const label = "block text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898] mb-1";
const input = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/15 px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] hover:bg-[#1a2b4a]/5 disabled:opacity-50 dark:text-[#F8F5F0]";
const primary = "inline-flex items-center gap-1.5 rounded-full bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
const h2 = "mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]";
const ago = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "never");
const KIND_LABEL = { homework: "Homework", goal: "Goals", resource: "Files and links" } as const;

export default function ClientPortals({ contactId }: { contactId: string | null }) {
  const [list, setList] = useState<Portal[] | null>(null);
  const [sel, setSel] = useState<string | null>(contactId);
  const [d, setD] = useState<Detail | null>(null);
  const [pick, setPick] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    const r = await fetch("/api/client-portal", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    setList(j.portals ?? []);
  }, []);
  const loadOne = useCallback(async (id: string) => {
    const r = await fetch(`/api/client-portal?contact=${id}`, { cache: "no-store" });
    if (!r.ok) return setMsg("That contact could not be found.");
    const j = (await r.json()) as Detail;
    setD(j);
    if (j.messages.some((m) => m.author === "client" && !m.read_at)) {
      await fetch("/api/client-portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read", contactId: id }) });
      void loadList();
    }
  }, [loadList]);
  useEffect(() => {
    void loadList();
  }, [loadList]);
  useEffect(() => {
    setD(null);
    if (sel) {
      void loadOne(sel);
      window.history.replaceState(null, "", `/client-portals?contact=${sel}`);
    }
  }, [sel, loadOne]);

  const act = useCallback(
    async (body: Record<string, unknown>, ok?: string) => {
      if (!sel) return false;
      setBusy(true);
      setMsg("");
      const r = await fetch("/api/client-portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId: sel, ...body }) });
      const j = await r.json().catch(() => ({}));
      setBusy(false);
      if (!r.ok) {
        setMsg(j.error || "That didn't work.");
        return false;
      }
      if (ok) setMsg(ok);
      await Promise.all([loadOne(sel), loadList()]);
      return true;
    },
    [sel, loadOne, loadList],
  );

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6">
      <header className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1a2b4a] to-[#2E7C83]"><UsersRound className="h-6 w-6 text-white" /></div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Clients &amp; Sales</p>
          <h1 className="text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Client Portals</h1>
          <p className="mt-1 max-w-3xl text-[15px] text-[#5b5f73] dark:text-[#b8a898]">Give each client a private page with your name on it: sessions left, upcoming bookings, invoices to pay, session notes you choose to share, homework they tick off, goals, files and messages. They open it from a private link, no password needed.</p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className={card}>
            <label className={label} htmlFor="portal-add">Add a client</label>
            <ContactLookupInput id="portal-add" value={pick} onChange={setPick} onPick={(c: LookupContact) => { setPick(lookupName(c)); setSel(c.id); }} placeholder="Name or email" className={input} pickLabel="Open" />
          </div>
          <div className={`${card} p-0`}>
            {list === null ? <p className="p-4 text-sm text-[#7b6b8d]">Loading…</p> : !list.length ? <p className="p-4 text-sm text-[#7b6b8d]">No portals yet. Add a client above.</p> : (
              <ul className="divide-y divide-[#1a2b4a]/10">
                {list.map((p) => (
                  <li key={p.contactId}>
                    <button type="button" onClick={() => setSel(p.contactId)} className={`block w-full px-4 py-3 text-left hover:bg-[#1a2b4a]/5 ${sel === p.contactId ? "bg-[#c9a227]/10" : ""}`}>
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{p.name}</span>
                        {p.unread > 0 && <span className="rounded-full bg-[#2E7C83] px-2 text-[11px] font-semibold text-white">{p.unread}</span>}
                      </span>
                      <span className="block text-xs text-[#7b6b8d]">{p.active ? `Last visit ${ago(p.lastSeenAt)}` : "Turned off"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          {msg && <p className="rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm" role="status">{msg}</p>}
          {!sel && <p className="text-sm text-[#7b6b8d]">Choose a client, or add one.</p>}
          {sel && !d && <p className="flex items-center gap-2 text-sm text-[#7b6b8d]"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>}
          {d && <Detail d={d} act={act} busy={busy} setMsg={setMsg} reload={() => loadOne(sel!)} />}
        </main>
      </div>
    </div>
  );
}

function Detail({ d, act, busy, setMsg, reload }: { d: Detail; act: (b: Record<string, unknown>, ok?: string) => Promise<boolean>; busy: boolean; setMsg: (m: string) => void; reload: () => Promise<void> }) {
  const name = [d.contact.first_name, d.contact.last_name].filter(Boolean).join(" ") || d.contact.email;
  const [copied, setCopied] = useState(false);
  const [welcome, setWelcome] = useState(d.portal?.welcome ?? "");
  const [pkg, setPkg] = useState({ offerId: "", name: "", sessions: "6", calendarIds: [] as string[], expiresOn: "" });
  const [note, setNote] = useState("");

  async function copy() {
    if (!d.portal) return;
    try {
      await navigator.clipboard.writeText(d.portal.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMsg(d.portal.url);
    }
  }

  if (!d.portal)
    return (
      <section className={card}>
        <h2 className={h2}>{name}</h2>
        <p className="text-sm text-[#5b5f73] dark:text-[#b8a898]">{name} doesn&apos;t have a portal yet.</p>
        <button className={`${primary} mt-3`} disabled={busy} onClick={() => void act({ action: "create" }, "Portal created. Email them the link when you're ready.")}><Plus className="h-4 w-4" />Create {d.contact.first_name ? `${d.contact.first_name}'s` : "their"} portal</button>
      </section>
    );

  return (
    <>
      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{name}</h2>
            <p className="text-xs text-[#7b6b8d]">{d.contact.email} · {d.portal.active ? "Portal on" : "Portal off"} · link emailed {ago(d.portal.sent_at)} · last visit {ago(d.portal.last_seen_at)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={btn} disabled={busy || !d.portal.active} onClick={() => void act({ action: "send" }, `Portal link emailed to ${d.contact.email}.`)}><Send className="h-3.5 w-3.5" />Email them the link</button>
            <button className={btn} onClick={() => void copy()}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy link"}</button>
            <a className={btn} href={d.portal.url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" />See what they see</a>
            <button className={btn} disabled={busy} onClick={() => void act({ action: "active", on: !d.portal!.active }, d.portal!.active ? "Portal turned off. The link no longer opens." : "Portal turned on.")}>{d.portal.active ? "Turn off" : "Turn on"}</button>
            <button className={btn} disabled={busy} onClick={() => void act({ action: "newlink" }, "New link made. The old one no longer opens; email them the new one.")}>New link</button>
          </div>
        </div>
        <div className="mt-4">
          <label className={label} htmlFor="portal-welcome">Note at the top of their portal (optional)</label>
          <textarea id="portal-welcome" rows={2} className={input} value={welcome} onChange={(e) => setWelcome(e.target.value)} placeholder="So glad we're working together. Here's everything in one place." />
          <button className={`${btn} mt-2`} disabled={busy || welcome === (d.portal.welcome ?? "")} onClick={() => void act({ action: "welcome", text: welcome }, "Note saved.")}>Save note</button>
        </div>
      </section>

      <LookEditor d={d} act={act} busy={busy} setMsg={setMsg} reload={reload} />

      <section className={card}>
        <h2 className={h2}>Packages and sessions</h2>
        <p className="mb-3 text-xs text-[#7b6b8d]">A session is used when you mark their booking Attended in Calendars. Use − and + to adjust by hand.</p>
        <ul className="mb-4 space-y-2">
          {d.packages.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#1a2b4a]/5 px-3 py-2 text-sm">
              <span><span className="font-semibold">{p.name}</span> · {p.used} of {p.sessions_total} used{p.expires_on ? ` · use by ${p.expires_on}` : ""}{p.status !== "active" ? ` · ${p.status}` : ""}</span>
              <span className="flex items-center gap-1">
                <button className={btn} aria-label="Give a session back" disabled={busy} onClick={() => void act({ action: "package-adjust", packageId: p.id, delta: -1 })}><Minus className="h-3.5 w-3.5" /></button>
                <button className={btn} aria-label="Use a session" disabled={busy} onClick={() => void act({ action: "package-adjust", packageId: p.id, delta: 1 })}><Plus className="h-3.5 w-3.5" /></button>
                <select aria-label="Package status" className="rounded-full border border-[#1a2b4a]/15 bg-transparent px-2 py-1 text-xs" value={p.status} onChange={(e) => void act({ action: "package-status", packageId: p.id, status: e.target.value })}>
                  <option value="active">Active</option><option value="done">Done</option><option value="cancelled">Cancelled</option>
                </select>
              </span>
            </li>
          ))}
        </ul>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div><label className={label} htmlFor="pkg-offer">From an offer</label><select id="pkg-offer" className={input} value={pkg.offerId} onChange={(e) => setPkg({ ...pkg, offerId: e.target.value })}><option value="">None</option>{d.offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
          <div><label className={label} htmlFor="pkg-name">Package name</label><input id="pkg-name" className={input} value={pkg.name} onChange={(e) => setPkg({ ...pkg, name: e.target.value })} placeholder={pkg.offerId ? "Same as the offer" : "6 coaching sessions"} /></div>
          <div><label className={label} htmlFor="pkg-sessions">Sessions</label><input id="pkg-sessions" inputMode="numeric" className={input} value={pkg.sessions} onChange={(e) => setPkg({ ...pkg, sessions: e.target.value })} /></div>
          <div><label className={label} htmlFor="pkg-exp">Use by (optional)</label><input id="pkg-exp" type="date" className={input} value={pkg.expiresOn} onChange={(e) => setPkg({ ...pkg, expiresOn: e.target.value })} /></div>
        </div>
        {d.calendars.length > 0 && (
          <fieldset className="mt-3">
            <legend className={label}>Bookings on these calendars count (none ticked = any)</legend>
            <div className="flex flex-wrap gap-3 text-sm">
              {d.calendars.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5"><input type="checkbox" checked={pkg.calendarIds.includes(c.id)} onChange={(e) => setPkg({ ...pkg, calendarIds: e.target.checked ? [...pkg.calendarIds, c.id] : pkg.calendarIds.filter((x) => x !== c.id) })} />{c.name}</label>
              ))}
            </div>
          </fieldset>
        )}
        <button className={`${primary} mt-3`} disabled={busy} onClick={async () => { if (await act({ action: "package-add", ...pkg, sessions: Number(pkg.sessions) }, "Package added.")) setPkg({ offerId: "", name: "", sessions: "6", calendarIds: [], expiresOn: "" }); }}><Plus className="h-4 w-4" />Add package</button>
      </section>

      {(["homework", "goal", "resource"] as const).map((k) => <ItemsSection key={k} kind={k} d={d} act={act} busy={busy} setMsg={setMsg} reload={reload} />)}

      <section className={card}>
        <h2 className={h2}>Session notes from LC Volant</h2>
        {!d.reports.length ? <p className="text-sm text-[#7b6b8d]">No LC Volant reports are linked to {d.contact.first_name || "this client"} yet. Link a report to them in LC Volant to share it here.</p> : (
          <ul className="space-y-2 text-sm">
            {d.reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                <span><span className="font-semibold">{r.title}</span> · {r.session_date}</span>
                <button className={btn} disabled={busy} onClick={() => void act({ action: "share-report", id: r.id, on: !r.shared_at }, r.shared_at ? "Hidden from their portal." : "Shared in their portal. Your private notes and drafts never show.")}>{r.shared_at ? "Shared ✓ (hide)" : "Share in portal"}</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className={h2}>Messages</h2>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {!d.messages.length && <p className="text-sm text-[#7b6b8d]">No messages yet.</p>}
          {d.messages.map((m) => (
            <div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.author === "owner" ? "ml-auto bg-[#2E7C83] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className={`mt-0.5 text-[11px] ${m.author === "owner" ? "text-white/80" : "text-[#7b6b8d]"}`}>{m.author === "owner" ? "You" : d.contact.first_name || "Client"} · {new Date(m.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <label htmlFor="owner-msg" className="sr-only">Message</label>
          <textarea id="owner-msg" rows={2} className={`${input} min-w-0 flex-1`} value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Write to ${d.contact.first_name || "them"}. They get an email with a link to reply.`} />
          <button className={`${primary} self-end`} disabled={busy || !note.trim()} onClick={async () => { if (await act({ action: "message", body: note }, "Message sent.")) setNote(""); }}><Send className="h-4 w-4" />Send</button>
        </div>
      </section>
    </>
  );
}

function ItemsSection({ kind, d, act, busy, setMsg, reload }: { kind: "homework" | "goal" | "resource"; d: Detail; act: (b: Record<string, unknown>, ok?: string) => Promise<boolean>; busy: boolean; setMsg: (m: string) => void; reload: () => Promise<void> }) {
  const items = d.items.filter((i) => i.kind === kind);
  const [f, setF] = useState({ title: "", body: "", url: "", dueOn: "" });
  const [uploading, setUploading] = useState(false);
  const statuses = kind === "goal" ? [["open", "In progress"], ["achieved", "Achieved"], ["paused", "Paused"]] : kind === "homework" ? [["open", "Open"], ["done", "Done"]] : null;
  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("contactId", d.contact.id);
    fd.append("file", file);
    if (f.title) fd.append("title", f.title);
    const r = await fetch("/api/client-portal/upload", { method: "POST", body: fd });
    setUploading(false);
    if (!r.ok) return setMsg((await r.json().catch(() => ({}))).error || "The file didn't upload.");
    setF({ title: "", body: "", url: "", dueOn: "" });
    setMsg("File shared in their portal.");
    await reload();
  }
  return (
    <section className={card}>
      <h2 className={h2}>{KIND_LABEL[kind]}</h2>
      {!items.length && <p className="mb-3 text-sm text-[#7b6b8d]">Nothing yet.</p>}
      <ul className="mb-4 space-y-2">
        {items.map((i) => (
          <li key={i.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-[#1a2b4a]/5 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className={`font-semibold ${i.status === "done" ? "line-through text-[#7b6b8d]" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                {i.file_path ? <a href={`/api/client-portal/file?id=${i.id}`} className="underline">{i.title}</a> : i.url ? <a href={i.url} target="_blank" rel="noreferrer" className="underline">{i.title}</a> : i.title}
                {kind === "resource" && i.done_by === "client" && <span className="ml-1 text-xs font-normal text-[#2E7C83]">from {d.contact.first_name || "client"}</span>}
                {kind === "homework" && i.status === "done" && i.done_by === "client" && <span className="ml-1 text-xs font-normal text-[#2E7C83]">done by {d.contact.first_name || "client"}</span>}
              </p>
              {i.body && <p className="whitespace-pre-wrap text-[#5b5f73] dark:text-[#b8a898]">{i.body}</p>}
              {i.due_on && <p className="text-xs text-[#7b6b8d]">By {i.due_on}</p>}
            </div>
            <span className="flex items-center gap-1">
              {statuses && <select aria-label="Status" className="rounded-full border border-[#1a2b4a]/15 bg-transparent px-2 py-1 text-xs" value={i.status} onChange={(e) => void act({ action: "item-update", id: i.id, status: e.target.value })}>{statuses.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
              <button className={btn} aria-label={`Delete ${i.title}`} disabled={busy} onClick={() => void act({ action: "item-delete", id: i.id }, "Removed.")}><Trash2 className="h-3.5 w-3.5" /></button>
            </span>
          </li>
        ))}
      </ul>
      <div className="grid gap-3 md:grid-cols-2">
        <div><label className={label} htmlFor={`${kind}-title`}>{kind === "resource" ? "Title" : kind === "goal" ? "Goal" : "Homework"}</label><input id={`${kind}-title`} className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={kind === "homework" ? "Draft your three offers" : kind === "goal" ? "Book 10 discovery calls this month" : "Session worksheet"} /></div>
        {kind === "resource" ? (
          <div><label className={label} htmlFor={`${kind}-url`}>Link (or attach a file below)</label><input id={`${kind}-url`} className={input} value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://" /></div>
        ) : (
          <div><label className={label} htmlFor={`${kind}-due`}>By (optional)</label><input id={`${kind}-due`} type="date" className={input} value={f.dueOn} onChange={(e) => setF({ ...f, dueOn: e.target.value })} /></div>
        )}
        <div className="md:col-span-2"><label className={label} htmlFor={`${kind}-body`}>Details (optional)</label><textarea id={`${kind}-body`} rows={2} className={input} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button className={primary} disabled={busy || !f.title.trim()} onClick={async () => { if (await act({ action: "item-add", kind, ...f }, "Added to their portal.")) setF({ title: "", body: "", url: "", dueOn: "" }); }}><Plus className="h-4 w-4" />Add</button>
        {kind === "resource" && (
          <label className={`${btn} cursor-pointer`}>
            <input type="file" className="sr-only" disabled={uploading} onChange={(e) => void upload(e.target.files?.[0])} />
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}Attach a file
          </label>
        )}
      </div>
    </section>
  );
}

// How this one client's portal looks: colors, font, heading, logo, banner and the sections (shown, renamed, ordered).
function LookEditor({ d, act, busy, setMsg, reload }: { d: Detail; act: (b: Record<string, unknown>, ok?: string) => Promise<boolean>; busy: boolean; setMsg: (m: string) => void; reload: () => Promise<void> }) {
  const saved = d.portal!.look;
  const [open, setOpen] = useState(false);
  const [l, setL] = useState<PortalLook>(saved);
  const [uploading, setUploading] = useState("");
  // After a save or an upload the saved look changes: start from it again (the panel stays open).
  const savedKey = JSON.stringify(saved);
  useEffect(() => setL(JSON.parse(savedKey) as PortalLook), [savedKey]);
  const dirty = JSON.stringify(l) !== JSON.stringify(saved);
  const ink = onAccent(l.accent);
  const font = PORTAL_FONTS.find((f) => f.key === l.font) ?? PORTAL_FONTS[0];
  const move = (i: number, dir: -1 | 1) => {
    const next = [...l.sections];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setL({ ...l, sections: next });
  };
  async function upload(asset: "logo" | "banner", file: File | undefined) {
    if (!file) return;
    setUploading(asset);
    const fd = new FormData();
    fd.append("contactId", d.contact.id);
    fd.append("asset", asset);
    fd.append("file", file);
    const r = await fetch("/api/client-portal/upload", { method: "POST", body: fd });
    setUploading("");
    if (!r.ok) return setMsg((await r.json().catch(() => ({}))).error || "The image didn't upload.");
    setMsg(asset === "logo" ? "Logo added to this portal." : "Banner added to this portal.");
    await reload();
  }
  const first = d.contact.first_name || "there";
  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><Palette className="h-4 w-4 text-[#c9a227]" />How {d.contact.first_name ? `${d.contact.first_name}'s` : "their"} portal looks</h2>
        <button className={btn} onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? "Close" : "Customize"}</button>
      </div>
      {/* A small live preview of the header, always visible. */}
      <div className="mt-3 overflow-hidden rounded-xl border border-[#1a2b4a]/10" style={{ background: l.background }}>
        <div className="h-1" style={{ background: l.accent }} />
        <div className="flex items-center gap-3 px-4 py-3">
          {(l.useAccountLogo ? d.accountLogo : l.logoPath) && <span className="h-9 w-9 shrink-0 rounded-full bg-white" style={{ boxShadow: `0 0 0 2px ${l.accent}22` }} />}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: l.accent }}>Your business</p>
            <p className="truncate text-lg font-semibold text-[#1F2B3A]" style={{ fontFamily: font.heading }}>{l.heading.replace(/\{first\}/gi, first)}</p>
          </div>
          <span className="ml-auto rounded-full px-3 py-1 text-xs font-semibold" style={{ background: l.accent, color: ink }}>Button</span>
        </div>
      </div>
      {open && (
        <div className="mt-4 space-y-5">
          <div>
            <p className={label}>Colors</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button key={c.name} type="button" onClick={() => setL({ ...l, accent: c.accent, background: c.background })} className="flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/15 px-2.5 py-1 text-xs font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]" aria-pressed={l.accent === c.accent}>
                  <span className="h-4 w-4 rounded-full" style={{ background: c.accent, boxShadow: `0 0 0 3px ${c.background}` }} />{c.name}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">Accent <input type="color" value={l.accent} onChange={(e) => setL({ ...l, accent: e.target.value })} className="h-8 w-12 cursor-pointer rounded border border-[#1a2b4a]/15" /></label>
              <label className="flex items-center gap-2">Background <input type="color" value={l.background} onChange={(e) => setL({ ...l, background: e.target.value })} className="h-8 w-12 cursor-pointer rounded border border-[#1a2b4a]/15" /></label>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className={label} htmlFor="look-font">Font style</label><select id="look-font" className={input} value={l.font} onChange={(e) => setL({ ...l, font: e.target.value as PortalLook["font"] })}>{PORTAL_FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}</select></div>
            <div><label className={label} htmlFor="look-heading">Heading ({"{first}"} = their first name)</label><input id="look-heading" className={input} value={l.heading} maxLength={80} onChange={(e) => setL({ ...l, heading: e.target.value })} /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className={label}>Logo</p>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={l.useAccountLogo} onChange={(e) => setL({ ...l, useAccountLogo: e.target.checked })} />Use my account logo{d.accountLogo ? "" : " (none set yet)"}</label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className={`${btn} cursor-pointer`}><input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="sr-only" disabled={!!uploading} onChange={(e) => void upload("logo", e.target.files?.[0])} />{uploading === "logo" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}{l.logoPath ? "Replace this portal's logo" : "Upload a logo for this portal"}</label>
                {l.logoPath && <button className={btn} disabled={busy} onClick={() => void act({ action: "look", look: { ...l, useAccountLogo: true }, removeLogo: true }, "Logo removed.")}>Remove</button>}
              </div>
            </div>
            <div>
              <p className={label}>Banner image (optional, wide)</p>
              <div className="flex flex-wrap items-center gap-2">
                <label className={`${btn} cursor-pointer`}><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" disabled={!!uploading} onChange={(e) => void upload("banner", e.target.files?.[0])} />{uploading === "banner" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}{l.bannerPath ? "Replace banner" : "Upload a banner"}</label>
                {l.bannerPath && <button className={btn} disabled={busy} onClick={() => void act({ action: "look", look: l, removeBanner: true }, "Banner removed.")}>Remove</button>}
              </div>
            </div>
          </div>
          <div>
            <p className={label}>Sections: show, rename and order</p>
            <ul className="space-y-2">
              {l.sections.map((sec, i) => (
                <li key={sec.key} className="flex flex-wrap items-center gap-2">
                  <input type="checkbox" aria-label={`Show ${sec.title}`} checked={!sec.hidden} onChange={(e) => setL({ ...l, sections: l.sections.map((x) => (x.key === sec.key ? { ...x, hidden: !e.target.checked } : x)) })} />
                  <input aria-label={`Name for ${sec.key}`} className={`${input} max-w-xs flex-1 ${sec.hidden ? "opacity-50" : ""}`} value={sec.title} maxLength={60} onChange={(e) => setL({ ...l, sections: l.sections.map((x) => (x.key === sec.key ? { ...x, title: e.target.value } : x)) })} />
                  <button className={btn} aria-label={`Move ${sec.title} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button className={btn} aria-label={`Move ${sec.title} down`} disabled={i === l.sections.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-[#7b6b8d]">Sections with nothing in them (for example To pay with no invoices) stay out of sight on their own.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className={primary} disabled={busy || !dirty} onClick={() => void act({ action: "look", look: l }, "Look saved. Open See what they see to check it.")}>Save this look</button>
            <button className={btn} disabled={busy || dirty} onClick={() => void act({ action: "look-default" }, "Saved as your default: every new portal starts with this look.")} title={dirty ? "Save this look first" : undefined}>Use as my default for new portals</button>
            <button className={btn} disabled={busy} onClick={() => void act({ action: "look-reset" }, "Your default look is back on this portal.")}>Reset to my default</button>
          </div>
        </div>
      )}
    </section>
  );
}
