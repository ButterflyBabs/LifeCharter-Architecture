"use client";

import { useCallback, useEffect, useState } from "react";
import { FileSignature, Plus, Send, Upload, Download, Copy, Ban, BellRing, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import ContactLookupInput, { lookupName, type LookupContact } from "@/components/crm/ContactLookupInput";

// Clients & Sales › LC Plume, agreements and proposals with e-signature (task 1072): write or upload a document, add signers, send for signature
// (emailed link + 6-digit code), follow every step, and download the sealed copy with its certificate of completion.

type Row = { id: string; title: string; kind: string; status: string; source: string; sent_at: string | null; completed_at: string | null; updated_at: string; signers: { name: string; status: string }[] };
type Tpl = { id: string; name: string; kind: string; review_note: string | null; starter: boolean };
type Signer = { id: string; order_no: number; name: string; email: string; is_owner: boolean; status: string; signed_at: string | null; decline_reason: string | null };
type Detail = {
  doc: { id: string; title: string; kind: string; source: string; body: string | null; file_name: string | null; contact_id: string | null; offer_id: string | null; amount: number | null; message: string | null; status: string; owner_signs: boolean; expires_on: string | null; final_hash: string | null; original_hash: string | null; final_path: string | null };
  signers: Signer[];
  events: { event: string; signer_id: string | null; detail: string | null; ip: string | null; at: string }[];
  placeholders: string[];
};

const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-[0_8px_24px_rgba(26,43,74,0.08)] dark:border-white/10 dark:bg-[#1a2b4a]/40";
const label = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d]";
const input = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/15 px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] hover:bg-[#1a2b4a]/5 disabled:opacity-50 dark:text-[#F8F5F0]";
const primary = "inline-flex items-center gap-1.5 rounded-full bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
const STATUS: Record<string, string> = { draft: "Draft", sent: "Out for signature", completed: "Signed by everyone", declined: "Declined", voided: "Voided", expired: "Expired" };
const TONE: Record<string, string> = { draft: "bg-amber-100 text-amber-800", sent: "bg-sky-100 text-sky-800", completed: "bg-emerald-100 text-emerald-800", declined: "bg-red-100 text-red-800", voided: "bg-gray-100 text-gray-600", expired: "bg-gray-100 text-gray-600" };
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

async function call(body: Record<string, unknown>) {
  const r = await fetch("/api/agreements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, d: await r.json().catch(() => ({})) };
}

export default function Agreements() {
  const [list, setList] = useState<{ docs: Row[]; templates: Tpl[]; offers: { id: string; name: string; price: number | null }[] } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [d, setD] = useState<Detail | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [newKind, setNewKind] = useState<"agreement" | "proposal">("agreement");
  const [tplId, setTplId] = useState("");
  const [who, setWho] = useState("");
  const [pick, setPick] = useState<LookupContact | null>(null);

  const loadList = useCallback(async () => {
    const r = await fetch("/api/agreements", { cache: "no-store" });
    if (r.ok) setList(await r.json());
  }, []);
  const loadOne = useCallback(async (id: string) => {
    const r = await fetch(`/api/agreements?id=${id}`, { cache: "no-store" });
    if (r.ok) setD(await r.json());
  }, []);
  useEffect(() => {
    void loadList();
    const q = new URLSearchParams(window.location.search).get("doc");
    if (q) setSel(q);
  }, [loadList]);
  useEffect(() => {
    setD(null);
    if (sel) {
      void loadOne(sel);
      window.history.replaceState(null, "", `/agreements?doc=${sel}`);
    }
  }, [sel, loadOne]);

  async function act(body: Record<string, unknown>, ok?: string) {
    setBusy(true);
    setMsg(null);
    const r = await call(body);
    setBusy(false);
    if (!r.ok) {
      setMsg({ ok: false, text: r.d.error || "That didn't work." });
      return null;
    }
    if (ok) setMsg({ ok: true, text: ok });
    await loadList();
    if (sel) await loadOne(sel);
    return r.d as Record<string, unknown>;
  }

  async function create() {
    const r = await act({ action: "create", kind: newKind, templateId: tplId || undefined, contactId: pick?.id }, "Created. Fill it in, check the signers, then press Send.");
    if (r?.id) {
      setSel(String(r.id));
      setWho("");
      setPick(null);
      setTplId("");
    }
  }

  if (!list) return <div className="p-6 text-sm text-[#7b6b8d]">Loading…</div>;
  const tpls = list.templates.filter((t) => t.kind === newKind);

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6">
      <header className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1a2b4a] to-[#c9a227]"><FileSignature className="h-6 w-6 text-white" /></div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Clients &amp; Sales · Agreements &amp; Proposals</p>
          <h1 className="text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">LC Plume</h1>
          <p className="mt-1 max-w-3xl text-[15px] text-[#5b5f73] dark:text-[#b8a898]">Write or upload an agreement or proposal, send it for e-signature, and get back a sealed PDF with a certificate of completion. Signers open a private link and confirm a code sent to their email; every step is recorded.</p>
        </div>
      </header>
      {msg && <p className={`rounded-lg px-4 py-2 text-sm ${msg.ok ? "bg-[#2E7C83]/10" : "bg-red-50 text-red-800"}`} role="status">{msg.text}</p>}

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className={card}>
            <label className={label} htmlFor="ag-kind">New</label>
            <select id="ag-kind" className={`${input} mb-2`} value={newKind} onChange={(e) => { setNewKind(e.target.value as "agreement" | "proposal"); setTplId(""); }}>
              <option value="agreement">Agreement</option>
              <option value="proposal">Proposal</option>
            </select>
            <label className={label} htmlFor="ag-tpl">Start from</label>
            <select id="ag-tpl" className={`${input} mb-2`} value={tplId} onChange={(e) => setTplId(e.target.value)}>
              <option value="">A blank page (or upload a PDF or Word file next)</option>
              {tpls.map((t) => <option key={t.id} value={t.id}>{t.name}{t.starter ? " (starter)" : ""}</option>)}
            </select>
            {tplId && tpls.find((t) => t.id === tplId)?.review_note && <p className="mb-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-900">{tpls.find((t) => t.id === tplId)?.review_note}</p>}
            <label className={label} htmlFor="ag-who">For (optional)</label>
            <ContactLookupInput id="ag-who" value={who} onChange={(v) => { setWho(v); setPick(null); }} onPick={(c) => { setPick(c); setWho(lookupName(c)); }} placeholder="Name or email" className={input} pickLabel="Choose" />
            <button className={`${primary} mt-3`} disabled={busy} onClick={create}><Plus className="h-4 w-4" />Create</button>
          </div>
          <div className={`${card} p-0`}>
            {!list.docs.length ? <p className="p-4 text-sm text-[#7b6b8d]">Nothing yet.</p> : (
              <ul className="divide-y divide-[#1a2b4a]/10">
                {list.docs.map((x) => (
                  <li key={x.id}>
                    <button onClick={() => setSel(x.id)} className={`block w-full px-4 py-3 text-left hover:bg-[#1a2b4a]/5 ${sel === x.id ? "bg-[#c9a227]/10" : ""}`}>
                      <span className="flex items-center justify-between gap-2"><span className="truncate font-semibold">{x.title}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONE[x.status] ?? ""}`}>{STATUS[x.status] ?? x.status}</span></span>
                      <span className="block text-xs text-[#7b6b8d]">{x.kind === "proposal" ? "Proposal" : "Agreement"} · {x.signers.filter((s) => s.status === "signed").length} of {x.signers.length} signed</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <TemplatesCard templates={list.templates} reload={loadList} setMsg={setMsg} />
        </aside>
        <main className="min-w-0">
          {!sel && <p className="text-sm text-[#7b6b8d]">Choose a document, or create one.</p>}
          {sel && !d && <p className="text-sm text-[#7b6b8d]">Loading…</p>}
          {d && <Editor key={d.doc.id + d.doc.status} d={d} offers={list.offers} act={act} busy={busy} reload={() => loadOne(sel!)} setMsg={setMsg} />}
        </main>
      </div>
    </div>
  );
}

function Editor({ d, offers, act, busy, reload, setMsg }: { d: Detail; offers: { id: string; name: string; price: number | null }[]; act: (b: Record<string, unknown>, ok?: string) => Promise<Record<string, unknown> | null>; busy: boolean; reload: () => Promise<void>; setMsg: (m: { ok: boolean; text: string } | null) => void }) {
  const doc = d.doc;
  const draft = doc.status === "draft";
  const others = d.signers.filter((s) => !s.is_owner);
  const [f, setF] = useState({ title: doc.title, kind: doc.kind, body: doc.body ?? "", message: doc.message ?? "", expiresOn: doc.expires_on ?? "", amount: doc.amount ? String(doc.amount) : "", offerId: doc.offer_id ?? "", ownerSigns: doc.owner_signs });
  const [signers, setSigners] = useState(others.length ? others.map((s) => ({ name: s.name, email: s.email, order: s.order_no })) : [{ name: "", email: "", order: 1 }]);
  const [fills, setFills] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const blanks = Array.from(new Set((f.body.match(/\{\{\s*([^{}]{1,60}?)\s*\}\}/g) || []).map((m) => m.replace(/[{}]/g, "").trim())));
  const isPdf = doc.source === "upload" && /\.pdf$/i.test(doc.file_name || "");
  const payload = () => ({ action: "save", id: doc.id, ...f, signers });

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!(await act(payload()))) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("id", doc.id);
    fd.append("file", file);
    const r = await fetch("/api/agreements/upload", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setUploading(false);
    if (!r.ok) return setMsg({ ok: false, text: j.error || "The file didn't upload." });
    setMsg({ ok: true, text: j.kind === "pdf" ? "PDF attached. Signatures go on a page added at the end." : "Word file turned into text you can edit." });
    await reload();
  }
  const fillBlank = (name: string) => {
    const v = (fills[name] || "").trim();
    if (!v) return;
    setF({ ...f, body: f.body.replace(new RegExp(`\\{\\{\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\}\\}`, "g"), v) });
  };
  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= signers.length) return;
    const next = [...signers];
    [next[i], next[j]] = [next[j], next[i]];
    setSigners(next.map((s, k) => ({ ...s, order: k + 1 })));
  };
  const nameOf = (id: string | null) => d.signers.find((s) => s.id === id)?.name ?? null;

  return (
    <div className="space-y-5">
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{doc.title}</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[doc.status] ?? ""}`}>{STATUS[doc.status] ?? doc.status}</span>
        </div>
        {draft ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div><label className={label} htmlFor="d-title">Title</label><input id="d-title" className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div><label className={label} htmlFor="d-kind">Type</label><select id="d-kind" className={input} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="agreement">Agreement</option><option value="proposal">Proposal</option></select></div>
            {f.kind === "proposal" && (
              <>
                <div><label className={label} htmlFor="d-offer">Offer (optional)</label><select id="d-offer" className={input} value={f.offerId} onChange={(e) => { const o = offers.find((x) => x.id === e.target.value); setF({ ...f, offerId: e.target.value, amount: o?.price ? String(o.price) : f.amount }); }}><option value="">None</option>{offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                <div><label className={label} htmlFor="d-amount">Amount (shown to the signer)</label><input id="d-amount" inputMode="decimal" className={input} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/[^0-9.]/g, "") })} placeholder="2497" /></div>
              </>
            )}
            <div><label className={label} htmlFor="d-exp">Sign by (optional)</label><input id="d-exp" type="date" className={input} value={f.expiresOn} onChange={(e) => setF({ ...f, expiresOn: e.target.value })} /></div>
            <div className="md:col-span-2"><label className={label} htmlFor="d-msg">Note in the email (optional)</label><textarea id="d-msg" rows={2} className={input} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-[#7b6b8d]">{doc.kind === "proposal" ? "Proposal" : "Agreement"}{doc.amount ? ` · $${Number(doc.amount).toLocaleString("en-US")}` : ""}{doc.expires_on ? ` · sign by ${doc.expires_on}` : ""}</p>
        )}
      </section>

      <section className={card}>
        <h3 className="mb-2 font-semibold">Document</h3>
        {isPdf ? (
          <p className="text-sm">Uploaded PDF: <strong>{doc.file_name}</strong>. Signatures and the certificate go on pages added at the end.</p>
        ) : draft ? (
          <>
            <p className="mb-2 text-xs text-[#7b6b8d]">Write it here, or upload a PDF or Word file. Put a blank between double braces, like {"{{Start date}}"}; every blank must be filled before sending. A line starting with ## becomes a heading.</p>
            <textarea className={`${input} font-mono text-[13px] leading-relaxed`} rows={18} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
            {blanks.length > 0 && (
              <div className="mt-3 space-y-2 rounded-xl bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-900">Fill in the blanks ({blanks.length})</p>
                {blanks.map((b) => (
                  <div key={b} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="w-40 shrink-0 font-medium">{b}</span>
                    <input className={`${input} max-w-xs`} value={fills[b] ?? ""} onChange={(e) => setFills({ ...fills, [b]: e.target.value })} />
                    <button className={btn} onClick={() => fillBlank(b)}>Fill</button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto whitespace-pre-line rounded-xl bg-[#1a2b4a]/5 p-4 text-sm">{doc.body}</div>
        )}
        {draft && (
          <label className={`${btn} mt-3 cursor-pointer`}>
            <Upload className="h-3.5 w-3.5" />{uploading ? "Uploading…" : isPdf ? "Replace the PDF" : "Upload a PDF or Word file"}
            <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
        )}
      </section>

      <section className={card}>
        <h3 className="mb-2 font-semibold">Signers</h3>
        {draft ? (
          <>
            <p className="mb-2 text-xs text-[#7b6b8d]">They sign in this order. Each gets a private link and confirms a code sent to their email.</p>
            {signers.map((s, i) => (
              <div key={i} className="mb-2 flex flex-wrap items-center gap-2">
                <span className="w-6 text-sm font-semibold text-[#7b6b8d]">{i + 1}.</span>
                <input className={`${input} max-w-[200px]`} placeholder="Full name" value={s.name} onChange={(e) => setSigners(signers.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
                <input className={`${input} max-w-[240px]`} placeholder="Email" type="email" value={s.email} onChange={(e) => setSigners(signers.map((x, k) => (k === i ? { ...x, email: e.target.value } : x)))} />
                <button className={btn} aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-3 w-3" /></button>
                <button className={btn} aria-label="Move down" onClick={() => move(i, 1)} disabled={i === signers.length - 1}><ArrowDown className="h-3 w-3" /></button>
                <button className={btn} aria-label="Remove signer" onClick={() => setSigners(signers.filter((_, k) => k !== i).map((x, k) => ({ ...x, order: k + 1 })))}><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
            <button className={btn} onClick={() => setSigners([...signers, { name: "", email: "", order: signers.length + 1 }])}><Plus className="h-3 w-3" />Add a signer</button>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.ownerSigns} onChange={(e) => setF({ ...f, ownerSigns: e.target.checked })} />I sign too (last, after everyone else)</label>
          </>
        ) : (
          <ul className="space-y-1 text-sm">
            {d.signers.map((s) => (
              <li key={s.id}>{s.order_no}. <strong>{s.name}</strong> ({s.email}){s.is_owner ? " · you" : ""} · {s.status === "signed" ? `signed ${s.signed_at ? when(s.signed_at) : ""}` : s.status === "declined" ? `declined${s.decline_reason ? `: ${s.decline_reason}` : ""}` : s.status === "viewed" ? "opened it" : s.status === "sent" ? "emailed" : "waiting their turn"}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {draft && <button className={primary} disabled={busy} onClick={() => act(payload(), "Saved.")}>Save</button>}
        {draft && <button className={primary} disabled={busy || blanks.length > 0} onClick={async () => { if (!window.confirm("Send it for signature now? The first signer gets an email right away, and the document can't be changed after it's sent.")) return; if (await act(payload())) await act({ action: "send", id: doc.id }, "Sent. The first signer has their email."); }}><Send className="h-4 w-4" />Send for signature</button>}
        {doc.status === "sent" && <button className={btn} disabled={busy} onClick={() => act({ action: "remind", id: doc.id }, "Reminder sent.")}><BellRing className="h-3.5 w-3.5" />Remind now</button>}
        {["sent", "declined", "expired"].includes(doc.status) && <button className={btn} disabled={busy} onClick={() => { const reason = window.prompt("Void this document? Its links stop working. Reason (optional):"); if (reason !== null) void act({ action: "void", id: doc.id, reason }, "Voided."); }}><Ban className="h-3.5 w-3.5" />Void</button>}
        {doc.final_path && <button className={btn} disabled={busy} onClick={async () => { const r = await act({ action: "download", id: doc.id }); if (r?.url) window.location.href = String(r.url); }}><Download className="h-3.5 w-3.5" />Download signed PDF</button>}
        <button className={btn} disabled={busy} onClick={async () => { const r = await act({ action: "duplicate", id: doc.id }, "Copied as a new draft."); if (r?.id) window.location.href = `/agreements?doc=${r.id}`; }}><Copy className="h-3.5 w-3.5" />Make a copy</button>
        {draft && !isPdf && <button className={btn} disabled={busy || !f.body.trim()} onClick={() => { const name = window.prompt("Save as your own template. Name:", f.title); if (name) void act({ action: "save-template", name, kind: f.kind, body: f.body }, "Saved to your templates."); }}>Save as my template</button>}
        {draft && <button className={`${btn} text-red-700`} disabled={busy} onClick={() => { if (window.confirm("Delete this draft?")) void act({ action: "delete", id: doc.id }, "Deleted.").then(() => (window.location.href = "/agreements")); }}><Trash2 className="h-3.5 w-3.5" />Delete draft</button>}
      </div>

      {!draft && (
        <section className={card}>
          <h3 className="mb-2 font-semibold">Audit trail</h3>
          <ul className="space-y-1 text-xs">
            {d.events.map((e, i) => (
              <li key={i}><span className="text-[#7b6b8d]">{when(e.at)}</span> · {e.event}{nameOf(e.signer_id) ? ` · ${nameOf(e.signer_id)}` : ""}{e.ip ? ` · IP ${e.ip}` : ""}</li>
            ))}
          </ul>
          {doc.final_hash && <p className="mt-2 break-all text-[11px] text-[#7b6b8d]">Sealed copy SHA-256: {doc.final_hash}</p>}
        </section>
      )}
    </div>
  );
}

function TemplatesCard({ templates, reload, setMsg }: { templates: Tpl[]; reload: () => Promise<void>; setMsg: (m: { ok: boolean; text: string } | null) => void }) {
  const own = templates.filter((t) => !t.starter);
  if (!own.length) return null;
  return (
    <div className={card}>
      <p className={label}>My templates</p>
      <ul className="space-y-1 text-sm">
        {own.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2">
            <span className="truncate">{t.name}</span>
            <button className="text-xs text-red-700 underline" onClick={async () => { if (!window.confirm(`Delete the template "${t.name}"?`)) return; await call({ action: "delete-template", templateId: t.id }); setMsg({ ok: true, text: "Template deleted." }); await reload(); }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
