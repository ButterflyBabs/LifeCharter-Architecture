"use client";

import { useEffect, useState } from "react";
import { Link2, Plus, X, Copy, CheckCircle, ExternalLink, Trash2, Pencil, Power, QrCode, BarChart3, Download, Globe, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { shortUrlFor } from "@/lib/shortLinks";

const box = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";
const day = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

type DomainStatus = "not_started" | "pending" | "verified" | "failed";
type DomainView = {
  domain: string | null;
  status: DomainStatus;
  verification: { type: string; domain: string; value: string; reason: string }[];
  dns: { type: string; name: string; value: string } | null;
  checkedAt: string | null;
};

type LinkRow = {
  id: string;
  code: string;
  destination_url: string;
  title: string | null;
  active: boolean;
  click_count: number;
  created_at: string;
};

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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-label={title} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#15233d]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-[#1a2b4a]/5"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function QrModal({ link, domain, onClose }: { link: LinkRow; domain: DomainView | null; onClose: () => void }) {
  const short = shortUrlFor(link.code, domain);
  const src = `/api/short-links/${link.id}/qr`;
  return (
    <Modal title={`QR code — /l/${link.code}`} onClose={onClose}>
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`QR code for ${short}`} className="h-56 w-56 rounded-lg border border-[#1a2b4a]/10" />
        <p className="break-all text-center text-sm text-[#5a6472]">{short}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href={src}
            download={`${link.code}-qr.png`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a2b4a] px-3 py-2 text-sm font-medium text-white hover:bg-[#1a2b4a]/90"
          >
            <Download className="w-4 h-4" /> Download PNG
          </a>
          <CopyButton text={short} label="Copy link" />
        </div>
        <p className="text-center text-xs text-[#7a8a99]">
          Scanning this always goes wherever /l/{link.code} points right now — if you change the destination later, the same code (and
          the same printed QR code) keeps working.
        </p>
      </div>
    </Modal>
  );
}

type Analytics = { byDay: { date: string; count: number }[]; byReferrer: { referrer: string; count: number }[]; sampled: boolean };

function StatsModal({ link, onClose }: { link: LinkRow; onClose: () => void }) {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch(`/api/short-links/${link.id}/analytics`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [link.id]);

  const max = data ? Math.max(1, ...data.byDay.map((d) => d.count)) : 1;
  const totalReferrer = data ? data.byReferrer.reduce((s, r) => s + r.count, 0) : 0;

  return (
    <Modal title={`Clicks — /l/${link.code}`} onClose={onClose}>
      {!data ? (
        <p className="text-sm text-[#7a8a99]">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#7a8a99]">Last 30 days</p>
            <div className="flex h-20 items-end gap-[2px]">
              {data.byDay.map((d) => (
                <div
                  key={d.date}
                  className="flex-1 rounded-t bg-[#2E7C83]"
                  title={`${day(d.date)}: ${d.count} click${d.count === 1 ? "" : "s"}`}
                  style={{ height: `${Math.max(4, (d.count / max) * 100)}%`, opacity: d.count ? 0.85 : 0.15 }}
                />
              ))}
            </div>
            {data.byDay.length > 0 && (
              <div className="mt-1 flex justify-between text-[10px] text-[#7a8a99]">
                <span>{day(data.byDay[0].date)}</span>
                <span>{day(data.byDay[data.byDay.length - 1].date)}</span>
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#7a8a99]">Where clicks came from</p>
            {data.byReferrer.length === 0 ? (
              <p className="text-sm text-[#7a8a99]">No clicks yet.</p>
            ) : (
              <div className="space-y-1.5">
                {data.byReferrer.map((r) => (
                  <div key={r.referrer} className="flex items-center gap-2 text-sm">
                    <span className="w-32 flex-shrink-0 truncate text-[#1a2b4a] dark:text-[#F8F5F0]" title={r.referrer}>
                      {r.referrer}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1a2b4a]/5 dark:bg-white/10">
                      <div className="h-full rounded-full bg-[#c9a227]" style={{ width: `${totalReferrer ? (r.count / totalReferrer) * 100 : 0}%` }} />
                    </div>
                    <span className="w-8 flex-shrink-0 text-right text-[#5a6472]">{r.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {data.sampled && (
            <p className="text-xs text-[#7a8a99]">Based on the most recent 2,000 clicks. The total click count on the card is always exact.</p>
          )}
        </div>
      )}
    </Modal>
  );
}

function CreateLink({ domain, onClose, onSaved }: { domain: DomainView | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [destinationUrl, setDestinationUrl] = useState("");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const prefix = domain?.status === "verified" && domain.domain ? `${domain.domain}/` : "lccommandsuite.com/l/";

  async function save() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/short-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationUrl, title: title || undefined, code: code || undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Couldn't create that link.");
      onSaved(`Short link created: ${shortUrlFor(d.link.code, domain)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create that link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="New short link" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#5a6472]">Where it should go</label>
          <Input value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} placeholder="https://..." autoFocus />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#5a6472]">What it&apos;s for (optional, just for you)</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sneak Peek invite on Instagram" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#5a6472]">Custom code (optional)</label>
          <div className="flex items-center gap-1 text-sm text-[#5a6472]">
            <span className="whitespace-nowrap">{prefix}</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="auto-generated if left blank" className={box} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy || !destinationUrl.trim()}>{busy ? "Creating…" : "Create link"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function EditLink({ link, domain, onClose, onSaved }: { link: LinkRow; domain: DomainView | null; onClose: () => void; onSaved: () => void }) {
  const [destinationUrl, setDestinationUrl] = useState(link.destination_url);
  const [title, setTitle] = useState(link.title ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/short-links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationUrl, title }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Couldn't save.");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Edit ${shortUrlFor(link.code, domain).replace(/^https?:\/\//, "")}`} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#5a6472]">Where it should go</label>
          <Input value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#5a6472]">What it&apos;s for</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy || !destinationUrl.trim()}>{busy ? "Saving…" : "Save"}</Button>
        </div>
      </div>
    </Modal>
  );
}

const DOMAIN_BADGE: Record<DomainStatus, { label: string; cls: string; Icon: typeof Clock }> = {
  verified: { label: "Verified — in use", cls: "bg-[#2E7C83]/15 text-[#1F5E63] dark:text-[#9fd3d6]", Icon: CheckCircle },
  pending: { label: "Checking…", cls: "bg-[#c9a227]/15 text-[#8a6d12] dark:text-[#e6c96a]", Icon: Clock },
  not_started: { label: "Not set up", cls: "bg-[#1a2b4a]/10 text-[#1a2b4a] dark:text-[#F8F5F0]", Icon: Clock },
  failed: { label: "Not found yet", cls: "bg-[#C76F56]/15 text-[#a4513a] dark:text-[#f0a893]", Icon: AlertTriangle },
};

function DomainPanel({ view, onChange }: { view: DomainView | null; onChange: (v: DomainView) => void }) {
  const [open, setOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/short-links/domain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Something went wrong.");
        return;
      }
      onChange(d);
      setNewDomain("");
    } finally {
      setBusy(false);
    }
  }

  if (!view) return null;
  const badge = DOMAIN_BADGE[view.status];

  return (
    <div className="mb-6 rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#15233d] dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
          <Globe className="w-4 h-4" /> Your short-link domain
          {view.domain && (
            <span className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
              <badge.Icon className="w-3 h-3" /> {badge.label}
            </span>
          )}
        </span>
        <span className="text-xs text-[#7a8a99]">{view.domain || "Using lccommandsuite.com/l/ — set your own below"}</span>
      </button>

      {open && (
        <div className="border-t border-[#1a2b4a]/10 px-4 py-4 dark:border-white/10">
          <p className="mb-3 text-sm text-[#5a6472] dark:text-[#b8a898]">
            Point your own domain (or a subdomain like go.yourbusiness.com) at your short links, so people see YOUR address, never
            lccommandsuite.com.
          </p>

          {!view.domain ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="go.yourbusiness.com" className="max-w-xs" />
              <Button onClick={() => act({ action: "add-domain", domain: newDomain })} disabled={busy || !newDomain.trim()}>
                {busy ? "Adding…" : "Add domain"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {view.status !== "verified" && view.dns && (
                <div className="rounded-lg bg-[#1a2b4a]/[0.03] p-3 text-sm dark:bg-white/5">
                  <p className="mb-1 font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Add this record at your domain provider:</p>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-xs text-[#5a6472] dark:text-[#b8a898]">
                    <span>Type</span>
                    <span>{view.dns.type}</span>
                    <span>Name</span>
                    <span>{view.dns.name}</span>
                    <span>Value</span>
                    <span>{view.dns.value}</span>
                  </div>
                  {view.verification.length > 0 && (
                    <>
                      <p className="mt-3 mb-1 font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                        Also add this ownership record (Vercel asked for it specifically):
                      </p>
                      {view.verification.map((c, i) => (
                        <div key={i} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-xs text-[#5a6472] dark:text-[#b8a898]">
                          <span>Type</span>
                          <span>{c.type}</span>
                          <span>Name</span>
                          <span>{c.domain}</span>
                          <span>Value</span>
                          <span>{c.value}</span>
                        </div>
                      ))}
                    </>
                  )}
                  <p className="mt-2 text-xs text-[#7a8a99]">DNS changes can take a few minutes to a few hours to take effect.</p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => act({ action: "check-domain" })} disabled={busy}>
                  <RefreshCw className="w-3.5 h-3.5" /> {busy ? "Checking…" : "Check verification"}
                </Button>
                <button
                  onClick={() => act({ action: "remove-domain" })}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove domain
                </button>
              </div>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default function ShortLinks() {
  const [links, setLinks] = useState<LinkRow[] | null>(null);
  const [domain, setDomain] = useState<DomainView | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<LinkRow | null>(null);
  const [qrFor, setQrFor] = useState<LinkRow | null>(null);
  const [statsFor, setStatsFor] = useState<LinkRow | null>(null);
  const [msg, setMsg] = useState("");

  const load = () =>
    fetch("/api/short-links", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { links: [] }))
      .then((d) => setLinks(d.links ?? []))
      .catch(() => setLinks([]));

  useEffect(() => {
    load();
    fetch("/api/short-links/domain", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setDomain(d))
      .catch(() => {});
  }, []);

  async function toggleActive(l: LinkRow) {
    await fetch(`/api/short-links/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !l.active }),
    });
    load();
  }

  async function remove(l: LinkRow) {
    if (!confirm(`Delete ${shortUrlFor(l.code, domain)}? Anyone who already has that link will land on a "not found" page instead.`)) return;
    await fetch(`/api/short-links/${l.id}`, { method: "DELETE" });
    load();
  }

  const totalClicks = (links ?? []).reduce((sum, l) => sum + l.click_count, 0);

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
          <Link2 className="w-7 h-7" /> Short Links
        </h1>
        <Button onClick={() => setAdding(true)}><Plus className="w-4 h-4" /> New short link</Button>
      </div>
      <p className="text-[#7a8a99] mb-6">
        Turn any long web address into a short link — for a bio, a slide, a QR code, a text message. Every click is counted, and you can
        repoint or turn off a link any time without changing it wherever you&apos;ve already shared it. Set up your own domain below so
        people see your address, not lccommandsuite.com.
      </p>

      <DomainPanel view={domain} onChange={setDomain} />

      {msg && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-[#2E7C83]/30 bg-[#2E7C83]/10 px-3 py-2 text-sm text-[#1F5E63]">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} aria-label="Dismiss"><X className="w-4 h-4" /></button>
        </div>
      )}

      {links === null ? (
        <p className="text-sm text-[#7a8a99]">Loading…</p>
      ) : links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1a2b4a]/20 p-8 text-center text-[#7a8a99]">
          No short links yet. Create one to get a short address for any web page.
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-[#7a8a99]">
            {links.length} link{links.length === 1 ? "" : "s"} · {totalClicks} click{totalClicks === 1 ? "" : "s"} total
          </p>
          <div className="space-y-2">
            {links.map((l) => {
              const short = shortUrlFor(l.code, domain);
              return (
                <div key={l.id} className="rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#15233d] dark:border-white/10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{short.replace(/^https?:\/\//, "")}</span>
                        {!l.active && (
                          <span className="rounded-full bg-[#1a2b4a]/10 px-2 py-0.5 text-[11px] font-semibold text-[#5a6472] dark:bg-white/10 dark:text-[#b8a898]">
                            Off
                          </span>
                        )}
                        <CopyButton text={short} label="Copy link" />
                      </div>
                      {l.title && <p className="mt-0.5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{l.title}</p>}
                      <a
                        href={l.destination_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#5a6472] hover:underline dark:text-[#b8a898]"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{l.destination_url}</span>
                      </a>
                      <p className="mt-1 text-xs text-[#7a8a99]">
                        {l.click_count} click{l.click_count === 1 ? "" : "s"} · created {day(l.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button
                        onClick={() => setStatsFor(l)}
                        aria-label="View clicks"
                        title="Clicks over time and where they came from"
                        className="rounded-lg p-2 text-[#5a6472] hover:bg-[#1a2b4a]/5 dark:text-[#b8a898] dark:hover:bg-white/10"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setQrFor(l)}
                        aria-label="QR code"
                        title="QR code"
                        className="rounded-lg p-2 text-[#5a6472] hover:bg-[#1a2b4a]/5 dark:text-[#b8a898] dark:hover:bg-white/10"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditing(l)}
                        aria-label="Edit"
                        className="rounded-lg p-2 text-[#5a6472] hover:bg-[#1a2b4a]/5 dark:text-[#b8a898] dark:hover:bg-white/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(l)}
                        aria-label={l.active ? "Turn off" : "Turn on"}
                        title={l.active ? "Turn off" : "Turn on"}
                        className={`rounded-lg p-2 hover:bg-[#1a2b4a]/5 dark:hover:bg-white/10 ${l.active ? "text-[#2E7C83]" : "text-[#5a6472] dark:text-[#b8a898]"}`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => remove(l)}
                        aria-label="Delete"
                        className="rounded-lg p-2 text-[#5a6472] hover:bg-red-50 hover:text-red-600 dark:text-[#b8a898]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {adding && (
        <CreateLink
          domain={domain}
          onClose={() => setAdding(false)}
          onSaved={(m) => {
            setAdding(false);
            setMsg(m);
            load();
          }}
        />
      )}
      {editing && (
        <EditLink
          link={editing}
          domain={domain}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {qrFor && <QrModal link={qrFor} domain={domain} onClose={() => setQrFor(null)} />}
      {statsFor && <StatsModal link={statsFor} onClose={() => setStatsFor(null)} />}
    </div>
  );
}
