"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star, Plus, Copy, Mail, Trash2, Loader2, Sparkles, CheckCircle2, X, Send } from "lucide-react";
import { SocialProofRead } from "@/components/planning/AssistantPanels";

// Reviews & Testimonials — this client's own. They send a personal link to one
// of THEIR clients; the review lands here to approve, feature and reuse in their
// marketing. Everything on this page is real data from their account.

interface Testimonial {
  id: string; client_name: string; program: string; rating: number | null; type: string; headline: string; content: string;
  media_url: string; status: "pending" | "approved" | "featured" | "hidden"; source: string; shares: number; created_at: string;
}
interface Req { id: string; token: string; client_name: string; client_email: string | null; program: string; from_name: string; message: string; status: "sent" | "opened" | "completed"; created_at: string }
interface Stats { total: number; thisMonth: number; averageRating: number | null; pending: number; approved: number; featured: number; shares: number; requestsSent: number; requestsCompleted: number; responseRate: number | null }

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#c9a227]/15 text-[#8a6a15]", approved: "bg-[#2E7C83]/12 text-[#2E7C83]", featured: "bg-[#5E3B6C]/12 text-[#5E3B6C]", hidden: "bg-[#1a2b4a]/8 text-[#7a8a99]",
};
const REQ_STYLE: Record<string, string> = { sent: "bg-[#1a2b4a]/8 text-[#7a8a99]", opened: "bg-[#c9a227]/15 text-[#8a6a15]", completed: "bg-[#2c6b3f]/12 text-[#2c6b3f]" };

const input = "w-full px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]";

const Stars = ({ n }: { n: number | null }) =>
  n ? (
    <span className="flex gap-0.5" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`w-4 h-4 ${i <= n ? "fill-[#c9a227] text-[#c9a227]" : "text-[#b8a898]"}`} />)}
    </span>
  ) : null;

export default function ReviewsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "featured" | "hidden">("all");
  const [reqOpen, setReqOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await (await fetch("/api/reviews", { cache: "no-store" })).json();
      setItems(d.testimonials ?? []);
      setRequests(d.requests ?? []);
      setStats(d.stats ?? null);
    } finally {
      setLoaded(true);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const send = async (method: string, url: string, body?: unknown) => {
    const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(d.error || "Couldn't do that."); return null; }
    setErr("");
    return d;
  };

  const setStatus = async (id: string, status: Testimonial["status"]) => {
    setItems((p) => p.map((t) => (t.id === id ? { ...t, status } : t)));
    await send("PATCH", "/api/reviews", { id, status });
    load();
  };
  const remove = async (id: string) => {
    if (!window.confirm("Delete this review?")) return;
    setItems((p) => p.filter((t) => t.id !== id));
    await send("DELETE", `/api/reviews?id=${id}`);
    load();
  };
  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard blocked */ }
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? "" : c)), 1800);
  };
  const linkFor = (r: Req) => `${window.location.origin}/reviews/collect?t=${r.token}`;
  const messageFor = (r: Req) => (r.message ? r.message.replace(/\[review link\]/gi, linkFor(r)) : `Hi ${r.client_name.split(" ")[0]}, I'd love to hear how working together has gone. Would you share a few words? ${linkFor(r)}`);

  // Hand a review to the Content Calendar composer as a post draft (kept out of the URL).
  const makePost = async (t: Testimonial) => {
    const caption = `“${t.content.trim()}”\n\n— ${t.client_name}${t.program ? `, ${t.program}` : ""}`;
    try { sessionStorage.setItem("composer-seed", JSON.stringify({ title: `Review from ${t.client_name.split(" ")[0]}`, caption })); } catch { /* seed not kept */ }
    await send("PATCH", "/api/reviews", { id: t.id, action: "share" });
    window.location.href = "/daily-compass/calendar?new=1";
  };

  const shown = useMemo(() => items.filter((t) => filter === "all" || t.status === filter), [items, filter]);

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#c9a227]/20 flex items-center justify-center"><Star className="w-6 h-6 text-[#c9a227]" /></div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Reviews &amp; Testimonials</h1>
            <p className="text-[#7a8a99]">Ask your clients for a few words, approve what comes in, and put it to work in your marketing.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-xl border border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"><Plus className="w-4 h-4" /> Add one I received</button>
          <button onClick={() => setReqOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2.5 rounded-xl bg-[#2E7C83] text-white hover:bg-[#256b71]"><Send className="w-4 h-4" /> Request a review</button>
        </div>
      </div>

      {err && <p className="mb-4 text-sm text-[#8a2f2f]">{err}</p>}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,150px),1fr))] gap-3 mb-6">
        {[
          { label: "Reviews", value: stats ? String(stats.total) : "—", sub: stats ? `${stats.thisMonth} this month` : "" },
          { label: "Average rating", value: stats?.averageRating ? `${stats.averageRating} / 5` : "—", sub: stats?.averageRating ? "from rated reviews" : "no ratings yet" },
          { label: "Waiting for you", value: stats ? String(stats.pending) : "—", sub: `${stats?.approved ?? 0} approved · ${stats?.featured ?? 0} featured` },
          { label: "Response rate", value: stats?.responseRate != null ? `${stats.responseRate}%` : "—", sub: stats ? `${stats.requestsCompleted} of ${stats.requestsSent} requests answered` : "" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-4">
            <p className="text-xs text-[#7a8a99]">{c.label}</p>
            <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{c.value}</p>
            <p className="text-[11px] text-[#7a8a99]">{c.sub}</p>
          </div>
        ))}
      </div>

      <SocialProofRead />

      {/* Reviews */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {(["all", "pending", "approved", "featured", "hidden"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize ${filter === f ? "bg-[#2E7C83] text-white border-[#2E7C83]" : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"}`}>{f}</button>
        ))}
      </div>
      {!loaded ? <p className="text-sm text-[#7a8a99]">Loading…</p> : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1a2b4a]/20 p-8 text-center mb-8">
          <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{items.length === 0 ? "No reviews yet." : "Nothing here."}</p>
          <p className="text-sm text-[#7a8a99] mt-1">{items.length === 0 ? "Request a review from a client you've served well — they get a personal link, and their words land here for you to approve." : "Try a different filter."}</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {shown.map((t) => (
            <div key={t.id} className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{t.client_name}</span>
                  {t.program && <span className="text-xs text-[#7a8a99]">· {t.program}</span>}
                  <Stars n={t.rating} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[t.status]}`}>{t.status}</span>
                  <span className="text-[11px] text-[#7a8a99]">{new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>
              {t.headline && <p className="mt-2 font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{t.headline}</p>}
              <p className="mt-1 text-sm text-[#3F4654] dark:text-[#d8d2c8] whitespace-pre-wrap">{t.content}</p>
              {t.media_url && <a href={t.media_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[#2E7C83] underline">Open {t.type} link</a>}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {t.status !== "approved" && t.status !== "featured" && <button onClick={() => setStatus(t.id, "approved")} className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71]">Approve</button>}
                {t.status !== "featured" && <button onClick={() => setStatus(t.id, "featured")} className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#5E3B6C]/40 text-[#5E3B6C] hover:bg-[#5E3B6C]/8">Feature</button>}
                {t.status !== "hidden" && <button onClick={() => setStatus(t.id, "hidden")} className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#1a2b4a]/15 text-[#7a8a99] hover:bg-[#1a2b4a]/5">Hide</button>}
                <button onClick={() => copy(t.content, `t-${t.id}`)} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5">{copied === `t-${t.id}` ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy</button>
                {(t.status === "approved" || t.status === "featured") && <button onClick={() => makePost(t)} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#2E7C83]/40 text-[#2E7C83] hover:bg-[#2E7C83]/10"><Sparkles className="w-3.5 h-3.5" /> Make a post{t.shares ? ` · used ${t.shares}×` : ""}</button>}
                <button onClick={() => remove(t.id)} aria-label="Delete" className="ml-auto text-[#b06a5a] hover:text-[#8a2f2f]"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requests */}
      <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">Requests you&apos;ve sent</h2>
      {requests.length === 0 ? <p className="text-sm text-[#7a8a99]">None yet.</p> : (
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center gap-3 flex-wrap rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 px-3 py-2.5">
              <span className="font-medium text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{r.client_name}</span>
              {r.program && <span className="text-xs text-[#7a8a99]">{r.program}</span>}
              <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${REQ_STYLE[r.status]}`}>{r.status === "opened" ? "opened the link" : r.status}</span>
              <span className="text-[11px] text-[#7a8a99]">{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              {r.status !== "completed" && (
                <span className="ml-auto flex items-center gap-2">
                  <button onClick={() => copy(messageFor(r), `r-${r.id}`)} className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7C83] hover:underline">{copied === `r-${r.id}` ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy message + link</button>
                  {r.client_email && <a href={`mailto:${r.client_email}?subject=${encodeURIComponent("Would you share a few words?")}&body=${encodeURIComponent(messageFor(r))}`} className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7C83] hover:underline"><Mail className="w-3.5 h-3.5" /> Email</a>}
                  <button onClick={async () => { await send("DELETE", `/api/reviews/requests?id=${r.id}`); load(); }} aria-label="Delete request" className="text-[#b06a5a]"><X className="w-4 h-4" /></button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {reqOpen && <RequestModal onClose={() => setReqOpen(false)} onCreated={() => { setReqOpen(false); load(); }} send={send} messageFor={messageFor} />}
      {addOpen && <AddModal onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load(); }} send={send} />}
      <p className="mt-8 text-xs text-[#7a8a99]">Only reviews you approve or feature are used in your marketing or shared with your assistant as proof. <Link href="/marketing-plan" className="underline">Marketing Plan</Link></p>
    </div>
  );
}

type Sender = (method: string, url: string, body?: unknown) => Promise<Record<string, unknown> | null>;

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9998] bg-black/40 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white dark:bg-[#111d33] rounded-2xl shadow-2xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2b4a]/10">
          <h2 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{title}</h2>
          <button onClick={onClose} aria-label="Close"><X className="w-5 h-5 text-[#b8a898]" /></button>
        </div>
        <div className="p-5 space-y-3">{children}</div>
      </div>
    </div>
  );
}

function RequestModal({ onClose, onCreated, send }: { onClose: () => void; onCreated: () => void; send: Sender; messageFor: (r: Req) => string }) {
  const [f, setF] = useState({ clientName: "", clientEmail: "", program: "", fromName: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [note, setNote] = useState("");

  const draft = async () => {
    setDrafting(true);
    setNote("");
    const d = await send("POST", "/api/reviews/request-message", { clientName: f.clientName, program: f.program });
    if (d?.message) setF((x) => ({ ...x, message: String(d.message) }));
    else if (d?.needsKey) setNote("Connect your AI key in Settings to have your assistant draft this.");
    setDrafting(false);
  };
  const create = async () => {
    if (!f.clientName.trim()) return setNote("Who is this request for?");
    setBusy(true);
    const d = await send("POST", "/api/reviews/requests", f);
    setBusy(false);
    if (d) onCreated();
  };
  return (
    <Modal title="Request a review" onClose={onClose}>
      <input aria-label="Client name" className={input} placeholder="Their name" value={f.clientName} onChange={(e) => setF({ ...f, clientName: e.target.value })} />
      <input aria-label="Client email" className={input} placeholder="Their email (optional — lets you email the link)" value={f.clientEmail} onChange={(e) => setF({ ...f, clientEmail: e.target.value })} />
      <input aria-label="What you worked on" className={input} placeholder="What you worked on together (optional)" value={f.program} onChange={(e) => setF({ ...f, program: e.target.value })} />
      <input aria-label="From" className={input} placeholder="Your name as they'll see it (defaults to your profile name)" value={f.fromName} onChange={(e) => setF({ ...f, fromName: e.target.value })} />
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-[#7a8a99]">Your note (the link is added when you send it)</span>
          <button onClick={draft} disabled={drafting} className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7C83] hover:underline disabled:opacity-60">{drafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Draft with my assistant</button>
        </div>
        <textarea aria-label="Your note" rows={5} className="w-full px-3 py-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]" placeholder="Hi Jane — it's been a joy working together… [review link]" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
      </div>
      {note && <p className="text-xs text-[#8a6a15]">{note}</p>}
      <p className="text-xs text-[#7a8a99]">Nothing is sent from here. You get a personal link and a message to send yourself, by email or however you talk to them.</p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]">Cancel</button>
        <button onClick={create} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60">{busy && <Loader2 className="w-4 h-4 animate-spin" />} Create link</button>
      </div>
    </Modal>
  );
}

function AddModal({ onClose, onSaved, send }: { onClose: () => void; onSaved: () => void; send: Sender }) {
  const [f, setF] = useState({ clientName: "", program: "", rating: 5, headline: "", content: "", consent: false });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const save = async () => {
    if (!f.clientName.trim() || !f.content.trim()) return setNote("Add who said it and what they said.");
    setBusy(true);
    const d = await send("POST", "/api/reviews", f);
    setBusy(false);
    if (d) onSaved();
  };
  return (
    <Modal title="Add a review you received" onClose={onClose}>
      <input aria-label="Who said it" className={input} placeholder="Who said it" value={f.clientName} onChange={(e) => setF({ ...f, clientName: e.target.value })} />
      <input aria-label="What you worked on" className={input} placeholder="What you worked on together (optional)" value={f.program} onChange={(e) => setF({ ...f, program: e.target.value })} />
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={f.rating === i} aria-label={`${i} stars`} onClick={() => setF({ ...f, rating: i })}><Star className={`w-6 h-6 ${i <= f.rating ? "fill-[#c9a227] text-[#c9a227]" : "text-[#b8a898]"}`} /></button>
        ))}
      </div>
      <input aria-label="Headline" className={input} placeholder="Headline (optional)" value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} />
      <textarea aria-label="What they said" rows={5} className="w-full px-3 py-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]" placeholder="Paste what they said, word for word" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
      <label className="flex items-start gap-2 text-xs text-[#5a6472] dark:text-[#c3ccd8]"><input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} className="mt-0.5" /> They&apos;ve said I can share this in my marketing.</label>
      {note && <p className="text-xs text-[#8a6a15]">{note}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]">Cancel</button>
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60">{busy && <Loader2 className="w-4 h-4 animate-spin" />} Save review</button>
      </div>
    </Modal>
  );
}
