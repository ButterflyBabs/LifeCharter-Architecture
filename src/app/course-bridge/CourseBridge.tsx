"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Copy, Plus } from "lucide-react";

type Platform = { key: string; label: string; how: string };
type Conn = { id: string; platform: string; url: string; hasKey: boolean; active: boolean; last_event_at: string | null };
type Product = { id: string; platform: string; product_key: string; product_name: string | null; tags: string[]; record_income: boolean; sequence_key: string | null; program_id: string | null };
type Ev = { id: string; platform: string; kind: string; email: string | null; product_name: string | null; amount: number | null; created_at: string; contact_id: string | null };
type Data = { platforms: Platform[]; connections: Conn[]; products: Product[]; events: Ev[]; sequences: { key: string; name: string; active: boolean }[]; programs: { id: string; name: string; kind: string }[] };

const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-[0_8px_24px_rgba(26,43,74,0.08)] dark:border-white/10 dark:bg-[#1a2b4a]/40";
const input = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/15 px-3 py-1.5 text-xs font-semibold text-[#1a2b4a] hover:bg-[#1a2b4a]/5 disabled:opacity-50 dark:text-[#F8F5F0]";
const primary = "inline-flex items-center gap-1.5 rounded-full bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
const h2 = "mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]";
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function CourseBridge() {
  const [d, setD] = useState<Data | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState("kajabi");
  const [keys, setKeys] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const r = await fetch("/api/bridge-settings", { cache: "no-store" });
    if (r.ok) setD(await r.json());
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function act(body: Record<string, unknown>, ok?: string) {
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/bridge-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(j.error || "That didn't work.");
    if (ok) setMsg(typeof ok === "string" ? ok : "");
    await load();
    return j;
  }

  if (!d) return <div className="p-6 text-sm text-[#7b6b8d]">Loading…</div>;
  const label = (k: string) => d.platforms.find((p) => p.key === k)?.label ?? k;
  const unconnected = d.platforms.filter((p) => !d.connections.some((c) => c.platform === p.key));

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6">
      <a href="/programs" className="inline-flex items-center gap-1 text-sm font-semibold text-[#2E7C83] hover:underline"><ArrowLeft className="h-4 w-4" />Courses &amp; Memberships</a>
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Courses &amp; Memberships</p>
        <h1 className="text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Bring your buyers over</h1>
        <p className="mt-1 max-w-3xl text-[15px] text-[#5b5f73] dark:text-[#b8a898]">Still selling on Kajabi, Teachable, Thinkific or Payhip while you move your courses into the Suite? Connect it here and every sale lands in your Suite: the buyer in Contacts with tags, the money in Finance, a follow-up campaign, and a seat in the matching Suite course.</p>
      </header>
      {msg && <p className="rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm" role="status">{msg}</p>}

      <section className={card}>
        <h2 className={h2}>Connect a platform</h2>
        {unconnected.length ? (
          <div className="flex flex-wrap items-end gap-2">
            <select className={`${input} max-w-xs`} value={unconnected.some((p) => p.key === pick) ? pick : unconnected[0].key} onChange={(e) => setPick(e.target.value)} aria-label="Platform">
              {unconnected.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <button className={primary} disabled={busy} onClick={() => void act({ action: "connect", platform: unconnected.some((p) => p.key === pick) ? pick : unconnected[0].key }, "Connected. Copy your address below and paste it into the platform.")}><Plus className="h-4 w-4" />Connect</button>
          </div>
        ) : <p className="text-sm text-[#7b6b8d]">Every platform is connected.</p>}
      </section>

      {d.connections.map((c) => {
        const p = d.platforms.find((x) => x.key === c.platform);
        return (
          <section key={c.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{label(c.platform)}{c.active ? "" : " (paused)"}</h2>
              <span className="text-xs text-[#7b6b8d]">{c.last_event_at ? `Last sale received ${when(c.last_event_at)}` : "Nothing received yet"}</span>
            </div>
            <p className="mt-1 text-sm text-[#5b5f73] dark:text-[#b8a898]">{p?.how}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input readOnly className={`${input} min-w-0 flex-1 font-mono text-xs`} value={c.url} onFocus={(e) => e.target.select()} aria-label={`${label(c.platform)} address`} />
              <button className={btn} onClick={() => { navigator.clipboard.writeText(c.url); setMsg("Address copied. Keep it private: anyone with it can send sales to your account."); }}><Copy className="h-3.5 w-3.5" />Copy</button>
            </div>
            {c.platform === "payhip" && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input type="password" className={`${input} max-w-sm`} placeholder={c.hasKey ? "Payhip API key saved" : "Your Payhip API key (optional, for signature checks)"} value={keys[c.id] ?? ""} onChange={(e) => setKeys({ ...keys, [c.id]: e.target.value })} aria-label="Payhip API key" />
                <button className={btn} disabled={busy || !(keys[c.id] ?? "").trim()} onClick={async () => { await act({ action: "key", id: c.id, signingKey: keys[c.id] }, "Payhip key saved. Messages without Payhip's signature are now refused."); setKeys({ ...keys, [c.id]: "" }); }}>Save key</button>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button className={btn} disabled={busy || !c.active} onClick={() => void act({ action: "test", id: c.id }, "Test sale received from Eloise (no money). It's in Recent sales below and in Contacts.")}>Send a test sale</button>
              <button className={btn} disabled={busy} onClick={() => void act({ action: c.active ? "pause" : "resume", id: c.id }, c.active ? "Paused: new sales from it are refused." : "Back on.")}>{c.active ? "Pause" : "Resume"}</button>
              <button className={btn} disabled={busy} onClick={() => window.confirm(`Disconnect ${label(c.platform)}? Its address stops working.`) && void act({ action: "remove", id: c.id }, "Disconnected.")}>Disconnect</button>
            </div>
          </section>
        );
      })}

      <section className={card}>
        <h2 className={h2}>Products</h2>
        <p className="mb-3 text-sm text-[#5b5f73] dark:text-[#b8a898]">Each product appears here after its first sale (or a test sale). Every buyer is tagged customer, from-the-platform and bought-the-product. Choose what else happens:</p>
        {!d.products.length ? <p className="text-sm text-[#7b6b8d]">No products yet.</p> : (
          <div className="space-y-3">
            {d.products.map((p) => <ProductRow key={p.id} p={p} d={d} label={label} busy={busy} act={act} />)}
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className={h2}>Recent sales</h2>
        {!d.events.length ? <p className="text-sm text-[#7b6b8d]">Nothing yet.</p> : (
          <ul className="divide-y divide-[#1a2b4a]/10 text-sm">
            {d.events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-semibold">{e.kind === "sale" ? "Sale" : e.kind === "refund" ? "Refund" : e.kind === "cancel" ? "Cancelled" : "Enrolled"}</span> · {label(e.platform)} · {e.product_name || "product"}{e.amount ? ` · $${Number(e.amount).toFixed(2)}` : ""} · {e.contact_id ? <a href={`/contacts?contact=${e.contact_id}`} className="text-[#2E7C83] hover:underline">{e.email}</a> : e.email}
                </span>
                <span className="text-xs text-[#7b6b8d]">{when(e.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ProductRow({ p, d, label, busy, act }: { p: Product; d: Data; label: (k: string) => string; busy: boolean; act: (b: Record<string, unknown>, ok?: string) => Promise<unknown> }) {
  const [f, setF] = useState({ tags: (p.tags ?? []).join(", "), recordIncome: p.record_income, sequenceKey: p.sequence_key ?? "", programId: p.program_id ?? "" });
  return (
    <div className="rounded-xl bg-[#1a2b4a]/5 p-3">
      <p className="text-sm font-semibold">{p.product_name || p.product_key} <span className="text-xs font-normal text-[#7b6b8d]">· {label(p.platform)}</span></p>
      <div className="mt-2 grid gap-2 md:grid-cols-3">
        <label className="text-xs">Extra tags (commas)<input className={input} value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="vip, 2027-cohort" /></label>
        <label className="text-xs">Start a campaign<select className={input} value={f.sequenceKey} onChange={(e) => setF({ ...f, sequenceKey: e.target.value })}><option value="">None</option>{d.sequences.map((s) => <option key={s.key} value={s.key}>{s.name}{s.active ? "" : " (off)"}</option>)}</select></label>
        <label className="text-xs">Give them a seat in<select className={input} value={f.programId} onChange={(e) => setF({ ...f, programId: e.target.value })}><option value="">No Suite course</option>{d.programs.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={f.recordIncome} onChange={(e) => setF({ ...f, recordIncome: e.target.checked })} />Record the sale as income in Finance (a refund takes it back out)</label>
        <button className={btn} disabled={busy} onClick={() => void act({ action: "product", id: p.id, ...f }, "Saved.")}>Save</button>
      </div>
    </div>
  );
}
