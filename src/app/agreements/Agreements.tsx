"use client";

import { useCallback, useEffect, useState } from "react";
import { FileSignature, PenLine, Plus, Send, Upload, Download, Copy, Ban, BellRing, Trash2, ArrowUp, ArrowDown, Eye, X } from "lucide-react";
import ContactLookupInput, { lookupName, type LookupContact } from "@/components/crm/ContactLookupInput";

// Clients & Sales › LC Plume, agreements and proposals with e-signature (task 1072): write or upload a document, add signers, send for signature
// (emailed link + 6-digit code), follow every step, and download the sealed copy with its certificate of completion.

type Row = { id: string; title: string; kind: string; status: string; source: string; sent_at: string | null; completed_at: string | null; updated_at: string; signers: { name: string; status: string }[]; needsMe?: boolean };
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
                      <span className="flex items-center justify-between gap-2"><span className="truncate font-semibold">{x.title}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${x.needsMe ? "bg-[#c9a227]/25 text-[#6b5410]" : TONE[x.status] ?? ""}`}>{x.needsMe ? "Needs your signature" : STATUS[x.status] ?? x.status}</span></span>
                      <span className="block text-xs text-[#7b6b8d]">{x.kind === "proposal" ? "Proposal" : "Agreement"} · {x.signers.filter((s) => s.status === "signed").length} of {x.signers.length} signed</span>
                    </button>
                    {(x.needsMe || x.status === "sent" || x.status === "completed") && (
                      <div className="flex flex-wrap gap-2 px-4 pb-3">
                        {x.needsMe && <button className={btn} disabled={busy} onClick={async () => { const r = await act({ action: "sign-now", id: x.id }); if (r?.url) window.location.href = String(r.url); }}><PenLine className="h-3.5 w-3.5" />Sign now</button>}
                        {x.status === "sent" && <button className={btn} disabled={busy} onClick={async () => { const r = await act({ action: "resend", id: x.id }); if (r) setMsg({ ok: true, text: `Sent again to ${((r.to as string[]) ?? []).join(", ") || "everyone waiting"}.` }); }}><Send className="h-3.5 w-3.5" />Resend</button>}
                        {x.status === "completed" && <button className={btn} disabled={busy} onClick={async () => { const r = await act({ action: "resend", id: x.id }); if (r) setMsg({ ok: true, text: `The signed copy was emailed to ${((r.to as string[]) ?? []).join(", ") || "everyone who signed"}.` }); }}><Send className="h-3.5 w-3.5" />Email signed copy</button>}
                      </div>
                    )}
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
  const [fixFor, setFixFor] = useState<string | null>(null);
  const [fixEmail, setFixEmail] = useState("");
  const others = d.signers.filter((s) => !s.is_owner);
  const [f, setF] = useState({ title: doc.title, kind: doc.kind, body: doc.body ?? "", message: doc.message ?? "", expiresOn: doc.expires_on ?? "", amount: doc.amount ? String(doc.amount) : "", offerId: doc.offer_id ?? "", ownerSigns: doc.owner_signs });
  const [signers, setSigners] = useState(others.length ? others.map((s) => ({ name: s.name, email: s.email, order: s.order_no })) : [{ name: "", email: "", order: 1 }]);
  const [fills, setFills] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
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
          <ul className="space-y-2 text-sm">
            {d.signers.map((s) => {
              const waiting = doc.status === "sent" && (s.status === "sent" || s.status === "viewed");
              return (
                <li key={s.id}>
                  <div>{s.order_no}. <strong>{s.name}</strong> ({s.email}){s.is_owner ? " · you" : ""} · {s.status === "signed" ? `signed ${s.signed_at ? when(s.signed_at) : ""}` : s.status === "declined" ? `declined${s.decline_reason ? `: ${s.decline_reason}` : ""}` : s.status === "viewed" ? "opened it" : s.status === "sent" ? "emailed" : "waiting their turn"}</div>
                  {waiting && s.is_owner && (
                    <div className="mt-1"><button className={primary} disabled={busy} onClick={async () => { const r = await act({ action: "sign-now", id: doc.id }); if (r?.url) window.location.href = String(r.url); }}><PenLine className="h-4 w-4" />Sign now</button> <span className="text-xs text-[#7b6b8d]">No need to find the email: you are signed in.</span></div>
                  )}
                  {waiting && !s.is_owner && (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <button className={btn} disabled={busy} onClick={() => act({ action: "resend", id: doc.id, signerId: s.id }, `Sent again to ${s.email}.`)}><Send className="h-3.5 w-3.5" />Resend</button>
                      {fixFor === s.id ? (
                        <>
                          <input type="email" aria-label={`New email for ${s.name}`} className={`${input} max-w-xs`} placeholder="Their correct email" value={fixEmail} onChange={(e) => setFixEmail(e.target.value)} />
                          <button className={primary} disabled={busy || !fixEmail.trim()} onClick={async () => { const r = await act({ action: "resend", id: doc.id, signerId: s.id, email: fixEmail }, `Sent to ${fixEmail.trim()}. The old link stops working.`); if (r) { setFixFor(null); setFixEmail(""); } }}>Send to this email</button>
                          <button className={btn} onClick={() => { setFixFor(null); setFixEmail(""); }}>Cancel</button>
                        </>
                      ) : (
                        <button className={btn} disabled={busy} onClick={() => { setFixFor(s.id); setFixEmail(""); }}>Send to a different email</button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {draft && <button className={primary} disabled={busy} onClick={() => act(payload(), "Saved.")}>Save</button>}
        {draft && <button className={btn} disabled={busy} onClick={() => setPreview(true)}><Eye className="h-3.5 w-3.5" />Preview</button>}
        {draft && <button className={primary} disabled={busy || blanks.length > 0} onClick={() => setPreview(true)}><Send className="h-4 w-4" />Preview and send</button>}
        {doc.status === "sent" && <button className={btn} disabled={busy} onClick={() => act({ action: "remind", id: doc.id }, "Reminder sent.")}><BellRing className="h-3.5 w-3.5" />Remind now</button>}
        {["sent", "declined", "expired"].includes(doc.status) && <button className={btn} disabled={busy} onClick={() => { const reason = window.prompt("Void this document? Its links stop working. Reason (optional):"); if (reason !== null) void act({ action: "void", id: doc.id, reason }, "Voided."); }}><Ban className="h-3.5 w-3.5" />Void</button>}
        {doc.final_path && <button className={btn} disabled={busy} onClick={async () => { const r = await act({ action: "download", id: doc.id }); if (r?.url) window.location.href = String(r.url); }}><Download className="h-3.5 w-3.5" />Download signed PDF</button>}
        {doc.status === "completed" && doc.final_path && <button className={btn} disabled={busy} onClick={() => act({ action: "resend", id: doc.id }, "The signed copy was emailed to everyone who signed.")}><Send className="h-3.5 w-3.5" />Email the signed copy again</button>}
        <button className={btn} disabled={busy} onClick={async () => { const r = await act({ action: "duplicate", id: doc.id }, "Copied as a new draft."); if (r?.id) window.location.href = `/agreements?doc=${r.id}`; }}><Copy className="h-3.5 w-3.5" />Make a copy</button>
        {draft && !isPdf && <button className={btn} disabled={busy || !f.body.trim()} onClick={() => { const name = window.prompt("Save as your own template. Name:", f.title); if (name) void act({ action: "save-template", name, kind: f.kind, body: f.body }, "Saved to your templates."); }}>Save as my template</button>}
        {draft && <button className={`${btn} text-red-700`} disabled={busy} onClick={() => { if (window.confirm("Delete this draft?")) void act({ action: "delete", id: doc.id }, "Deleted.").then(() => (window.location.href = "/agreements")); }}><Trash2 className="h-3.5 w-3.5" />Delete draft</button>}
      </div>

      {preview && (
        <PreviewModal
          title={f.title}
          body={f.body}
          isPdf={isPdf}
          fileName={doc.file_name}
          kind={f.kind}
          amount={f.amount}
          expiresOn={f.expiresOn}
          message={f.message}
          signers={signers}
          ownerSigns={f.ownerSigns}
          blanks={blanks}
          busy={busy}
          onClose={() => setPreview(false)}
          onSend={async () => {
            if (await act(payload())) {
              const sent = await act({ action: "send", id: doc.id }, "Sent. The first signer has their email.");
              if (sent) setPreview(false);
            }
          }}
        />
      )}

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

const BLANK = /(\{\{\s*[^{}]{1,60}?\s*\}\})/g;
function WithBlanks({ text }: { text: string }) {
  return (
    <>
      {text.split(BLANK).map((part, i) =>
        /^\{\{/.test(part) ? <mark key={i} className="rounded bg-amber-200 px-1 text-amber-900">{part}</mark> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

/** What each signer will see, before anything is sent. Matches the signing page; blanks still empty are highlighted. */
function PreviewModal({ title, body, isPdf, fileName, kind, amount, expiresOn, message, signers, ownerSigns, blanks, busy, onClose, onSend }: {
  title: string; body: string; isPdf: boolean; fileName: string | null; kind: string; amount: string; expiresOn: string; message: string;
  signers: { name: string; email: string; order: number }[]; ownerSigns: boolean; blanks: string[]; busy: boolean; onClose: () => void; onSend: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const paras = body.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const people = signers.filter((x) => x.name.trim() || x.email.trim());
  const problems = [
    ...(blanks.length ? [`${blanks.length} blank${blanks.length === 1 ? "" : "s"} still empty: ${blanks.join(", ")}`] : []),
    ...(!people.length ? ["Add at least one signer."] : []),
    ...people.filter((x) => !x.name.trim() || !/\S+@\S+\.\S+/.test(x.email)).map((x) => `Check the name and email for signer ${x.order}.`),
    ...(!isPdf && !body.trim() ? ["The document is empty."] : []),
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Preview before sending">
      <div className="w-full max-w-3xl rounded-2xl bg-[#FAF8F3] shadow-2xl dark:bg-[#12203a]">
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-t-2xl border-b border-[#1a2b4a]/10 bg-[#FAF8F3] px-5 py-3 dark:bg-[#12203a]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Preview</p>
            <p className="text-sm text-[#5b5f73] dark:text-[#b8a898]">This is what each signer will see. Nothing has been sent.</p>
          </div>
          <button className={btn} onClick={onClose} aria-label="Close preview"><X className="h-3.5 w-3.5" />Close</button>
        </div>
        <div className="space-y-4 p-5">
          {problems.length > 0 && (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">
              <p className="font-semibold">Fix these before sending</p>
              <ul className="mt-1 list-disc pl-5">{problems.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
          <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{title || "Untitled"}</h2>
          {message.trim() && <p className="rounded-xl bg-white px-4 py-3 text-sm dark:bg-[#1a2b4a]/40"><span className="font-semibold">Your note in the email: </span>{message}</p>}
          {isPdf ? (
            <p className="rounded-2xl border border-[#E5DDCF] bg-white p-6 text-sm dark:bg-[#1a2b4a]/40">Uploaded PDF: <strong>{fileName}</strong>. The signer sees this file, and a signature page is added at the end.</p>
          ) : (
            <article className="space-y-3 rounded-2xl border border-[#E5DDCF] bg-white p-6 text-[15px] leading-relaxed text-[#1f2b3a] sm:p-8">
              {paras.map((p, i) => {
                if (!/^#{1,3}\s/.test(p)) return <p key={i} className="whitespace-pre-line"><WithBlanks text={p} /></p>;
                const [first, ...rest] = p.split("\n");
                return (
                  <div key={i}>
                    <h3 className="pt-2 text-lg font-semibold"><WithBlanks text={first.replace(/^#{1,3}\s+/, "")} /></h3>
                    {rest.join("\n").trim() && <p className="mt-2 whitespace-pre-line"><WithBlanks text={rest.join("\n").trim()} /></p>}
                  </div>
                );
              })}
            </article>
          )}
          {kind === "proposal" && amount && <p className="rounded-xl bg-white px-4 py-3 text-[15px] dark:bg-[#1a2b4a]/40">Investment: <strong>${Number(amount).toLocaleString("en-US")}</strong></p>}
          <div className="rounded-2xl border border-[#E5DDCF] bg-white p-5 text-sm dark:bg-[#1a2b4a]/40">
            <p className="font-semibold">Signatures{expiresOn ? ` · sign by ${expiresOn}` : ""}</p>
            <ol className="mt-2 space-y-2">
              {people.map((x) => (
                <li key={x.order} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-[#1a2b4a]/20 pb-2">
                  <span>{x.order}. <strong>{x.name || "(name missing)"}</strong> <span className="text-[#7b6b8d]">{x.email}</span></span>
                  <span className="text-xs text-[#7b6b8d]">signature goes here</span>
                </li>
              ))}
              {ownerSigns && <li className="flex flex-wrap items-baseline justify-between gap-2 pb-1"><span>{people.length + 1}. <strong>You</strong> <span className="text-[#7b6b8d]">(last, after everyone else)</span></span><span className="text-xs text-[#7b6b8d]">signature goes here</span></li>}
            </ol>
          </div>
          <p className="text-xs text-[#7b6b8d]">When you send, the first signer gets an email with a private link, confirms a 6-digit code, and signs. The document can&apos;t be changed after it is sent.</p>
        </div>
        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 rounded-b-2xl border-t border-[#1a2b4a]/10 bg-[#FAF8F3] px-5 py-3 dark:bg-[#12203a]">
          <button className={btn} onClick={onClose}>Back to editing</button>
          <button className={primary} disabled={busy || problems.length > 0} onClick={onSend}><Send className="h-4 w-4" />Looks right, send for signature</button>
        </div>
      </div>
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
