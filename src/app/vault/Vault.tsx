"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Check, Eye, EyeOff, KeyRound, Lock, Pencil, Plus, Search, Trash2, X, Dices, ExternalLink } from "lucide-react";

type Item = { id: string; label: string; url: string | null; username: string | null; category: string; lastRevealedAt: string | null; updatedAt: string };
type Draft = { id?: string; label: string; url: string; username: string; category: string; password: string; notes: string };
type Evt = { id: string; item_label: string | null; action: string; at: string };

const CATEGORIES = ["Website", "Email", "Banking", "Social media", "Software", "Other"];
const blank = (): Draft => ({ label: "", url: "", username: "", category: "Website", password: "", notes: "" });
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]";

// A strong random password from the browser's own secure random numbers.
function generate(len = 18) {
  const sets = ["abcdefghijkmnopqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%^&*-_=+?"];
  const all = sets.join("");
  const pick = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];
  const chars = sets.map(pick);
  while (chars.length < len) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export default function Vault() {
  const [state, setState] = useState<"loading" | "locked" | "open" | "signedout">("loading");
  const [items, setItems] = useState<Item[]>([]);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showDraftPw, setShowDraftPw] = useState(false);
  const [shown, setShown] = useState<{ id: string; password: string; notes: string } | null>(null);
  const [copied, setCopied] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [events, setEvents] = useState<Evt[] | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/vault", { cache: "no-store" }).catch(() => null);
    if (!r || r.status === 401) { setState("signedout"); return; }
    const d = await r.json().catch(() => ({}));
    if (d.unlocked) {
      setItems(d.items ?? []);
      setState("open");
      if (lockTimer.current) clearTimeout(lockTimer.current);
      lockTimer.current = setTimeout(() => { setState("locked"); setShown(null); setItems([]); setDraft(null); }, 15 * 60_000);
    } else {
      setState("locked");
    }
  }, []);
  useEffect(() => {
    void load();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, [load]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/vault/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    setPw("");
    if (!r || !r.ok) { setErr(d.error || "That didn't work. Please try again."); return; }
    await load();
  }
  async function lock() {
    await fetch("/api/vault/lock", { method: "POST" }).catch(() => {});
    setShown(null);
    setItems([]);
    setEvents(null);
    setState("locked");
  }

  async function reveal(id: string): Promise<{ password: string; notes: string } | null> {
    const r = await fetch("/api/vault/reveal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) {
      if (d.locked) setState("locked");
      setErr(d.error || "Couldn't open that.");
      return null;
    }
    return { password: d.password ?? "", notes: d.notes ?? "" };
  }
  async function show(id: string) {
    setErr("");
    if (shown?.id === id) { setShown(null); return; }
    const v = await reveal(id);
    if (!v) return;
    setShown({ id, ...v });
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShown(null), 20_000);
  }
  async function copyPassword(id: string) {
    setErr("");
    const v = await reveal(id);
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v.password);
      setCopied(id);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setErr("Couldn't copy. Use Show and copy it by hand.");
    }
  }
  async function copyText(key: string, text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 2000); } catch { /* shown on screen anyway */ }
  }

  async function edit(it: Item) {
    const v = await reveal(it.id);
    if (!v) return;
    setShowDraftPw(false);
    setDraft({ id: it.id, label: it.label, url: it.url ?? "", username: it.username ?? "", category: it.category, password: "", notes: v.notes });
  }
  async function save() {
    if (!draft) return;
    if (!draft.label.trim()) { setErr("Give it a name, for example the website or app."); return; }
    setBusy(true);
    setErr("");
    const body = draft.id ? { ...draft, password: draft.password || undefined } : draft;
    const r = await fetch("/api/vault", { method: draft.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) { if (r?.status === 403) setState("locked"); setErr(d.error || "Couldn't save that."); return; }
    setDraft(null);
    setShown(null);
    await load();
  }
  async function remove(id: string) {
    await fetch(`/api/vault?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    setConfirmDel(null);
    setShown(null);
    await load();
  }
  async function loadEvents() {
    if (events) { setEvents(null); return; }
    const r = await fetch("/api/vault/audit", { cache: "no-store" }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setEvents(d.events ?? []);
  }

  const needle = q.trim().toLowerCase();
  const list = items.filter((i) => !needle || `${i.label} ${i.username ?? ""} ${i.url ?? ""} ${i.category}`.toLowerCase().includes(needle));

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2 text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]"><KeyRound className="h-7 w-7 text-[#c9a227]" /> Logins &amp; Passwords</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#5a6472] dark:text-[#b8c2cf]">
        A private place for your own logins and passwords. Each person has their own, and nobody else on your team or at LifeCharter sees yours in the app. Passwords are stored encrypted, are never shown in the list, are only decrypted for you after you re-enter your Suite password, and are never given to the AI Assistant. Please do not store bank card numbers or government ID numbers here.
      </p>

      {state === "loading" && <p className="mt-6 text-sm text-[#7a8a99]">Loading…</p>}
      {state === "signedout" && <p className="mt-6 text-sm text-[#7a8a99]">Please sign in to use your vault.</p>}

      {state === "locked" && (
        <form onSubmit={unlock} className="mt-6 max-w-md rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-sm dark:bg-[#1a2b4a]/30">
          <p className="flex items-center gap-2 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><Lock className="h-4 w-4" /> Your vault is locked</p>
          <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">Enter your Suite password to open it for 15 minutes.</p>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required placeholder="Your Suite password" aria-label="Your Suite password" className={`${field} mt-3`} />
          {err && <p className="mt-2 text-sm text-[#8a2f2f] dark:text-[#f0b8b8]" role="alert">{err}</p>}
          <button type="submit" disabled={busy || !pw} className="mt-3 rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Checking…" : "Open my vault"}</button>
        </form>
      )}

      {state === "open" && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#7a8a99]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your logins" aria-label="Search your logins" className={`${field} pl-9`} />
            </div>
            <button onClick={() => { setShowDraftPw(false); setDraft(blank()); setErr(""); }} className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white hover:bg-[#256b71]"><Plus className="h-4 w-4" /> Add a login</button>
            <button onClick={lock} className="inline-flex items-center gap-1.5 rounded-lg border border-[#1a2b4a]/25 px-3 py-2 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]"><Lock className="h-4 w-4" /> Lock now</button>
          </div>
          {err && !draft && <p className="mt-3 text-sm text-[#8a2f2f] dark:text-[#f0b8b8]" role="alert">{err}</p>}

          {!list.length ? (
            <p className="mt-6 text-sm text-[#7a8a99]">{items.length ? "Nothing matches that." : "Nothing here yet. Press Add a login to save your first one."}</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {list.map((it) => (
                <li key={it.id} className="rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{it.label}</p>
                      <span className="mt-0.5 inline-block rounded-full bg-[#2E7C83]/12 px-2 py-0.5 text-[11px] font-semibold text-[#1f6a70] dark:text-[#7fd0d6]">{it.category}</span>
                    </div>
                    {it.url && /^https?:\/\//i.test(it.url) && (
                      <a href={it.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg p-1.5 text-[#2E7C83] hover:bg-[#2E7C83]/10" aria-label={`Open ${it.label}`} title="Open this site"><ExternalLink className="h-4 w-4" /></a>
                    )}
                  </div>
                  {it.username && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-[#4a5568] dark:text-[#c9d1dc]">
                      <span className="min-w-0 truncate">{it.username}</span>
                      <button onClick={() => void copyText(`u${it.id}`, it.username!)} className="shrink-0 text-[#2E7C83]" aria-label="Copy username" title="Copy username">{copied === `u${it.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>
                    </p>
                  )}
                  {shown?.id === it.id && (
                    <div className="mt-2 rounded-lg bg-[#F8F5F0] p-2 text-sm dark:bg-[#0e1830]" aria-live="polite">
                      <p className="break-all font-mono text-[#1a2b4a] dark:text-[#F8F5F0]">{shown.password || "(no password saved)"}</p>
                      {shown.notes && <p className="mt-1 whitespace-pre-wrap text-xs text-[#5a6472] dark:text-[#b8c2cf]">{shown.notes}</p>}
                      <p className="mt-1 text-[11px] text-[#7a8a99]">Hides itself in 20 seconds.</p>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <button onClick={() => void show(it.id)} className="inline-flex items-center gap-1 rounded-lg border border-[#1a2b4a]/20 px-2.5 py-1.5 text-[#1a2b4a] dark:text-[#F8F5F0]">{shown?.id === it.id ? <><EyeOff className="h-3.5 w-3.5" /> Hide</> : <><Eye className="h-3.5 w-3.5" /> Show</>}</button>
                    <button onClick={() => void copyPassword(it.id)} className="inline-flex items-center gap-1 rounded-lg border border-[#1a2b4a]/20 px-2.5 py-1.5 text-[#1a2b4a] dark:text-[#F8F5F0]">{copied === it.id ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy password</>}</button>
                    <button onClick={() => void edit(it)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[#2E7C83]"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                    {confirmDel === it.id ? (
                      <span className="inline-flex items-center gap-1 text-[#8a2f2f]">Delete it? <button onClick={() => void remove(it.id)} className="rounded bg-[#8a2f2f] px-2 py-1 text-white">Yes</button><button onClick={() => setConfirmDel(null)} className="px-1 underline">No</button></span>
                    ) : (
                      <button onClick={() => setConfirmDel(it.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[#8a2f2f]" aria-label={`Delete ${it.label}`}><Trash2 className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <button onClick={() => void loadEvents()} className="text-sm font-semibold text-[#2E7C83] hover:underline">{events ? "Hide recent activity" : "Show recent activity"}</button>
            {events && (
              <ul className="mt-2 divide-y divide-[#1a2b4a]/10 rounded-xl border border-[#1a2b4a]/10 bg-white text-sm dark:bg-[#1a2b4a]/30">
                {!events.length && <li className="p-3 text-[#7a8a99]">Nothing yet.</li>}
                {events.map((e) => (
                  <li key={e.id} className="flex flex-wrap justify-between gap-2 p-3"><span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{e.item_label ? `${e.item_label}: ` : ""}{e.action}</span><span className="text-xs text-[#7a8a99]">{when(e.at)}</span></li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={draft.id ? "Edit login" : "Add a login"}>
          <div className="my-6 w-full max-w-lg rounded-2xl bg-[#FBF8F1] p-5 shadow-xl dark:bg-[#12203a]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{draft.id ? "Edit login" : "Add a login"}</h2>
              <button onClick={() => setDraft(null)} aria-label="Close" className="rounded-lg p-1.5 text-[#5a6472] hover:bg-[#1a2b4a]/10"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-3 space-y-3 text-sm">
              <label className="block font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Name<input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. Instagram, QuickBooks" className={`${field} mt-1 font-normal`} autoComplete="off" /></label>
              <label className="block font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Website address (optional)<input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://" className={`${field} mt-1 font-normal`} autoComplete="off" /></label>
              <label className="block font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Username or email<input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} className={`${field} mt-1 font-normal`} autoComplete="off" /></label>
              <label className="block font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Type
                <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={`${field} mt-1 font-normal`}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
              </label>
              <div>
                <label className="block font-medium text-[#1a2b4a] dark:text-[#F8F5F0]" htmlFor="vault-pw">Password{draft.id ? " (leave blank to keep the saved one)" : ""}</label>
                <div className="mt-1 flex gap-2">
                  <input id="vault-pw" type={showDraftPw ? "text" : "password"} value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} className={`${field} font-mono`} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowDraftPw((s) => !s)} className="rounded-lg border border-[#1a2b4a]/20 px-3" aria-label={showDraftPw ? "Hide password" : "Show password"}>{showDraftPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  <button type="button" onClick={() => { setDraft({ ...draft, password: generate() }); setShowDraftPw(true); }} className="inline-flex items-center gap-1 rounded-lg border border-[#2E7C83]/50 px-3 text-xs font-semibold text-[#1f6a70] dark:text-[#7fd0d6]" title="Make a strong random password"><Dices className="h-4 w-4" /> Make one</button>
                </div>
              </div>
              <label className="block font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Notes (optional, stored encrypted too)<textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} className={`${field} mt-1 font-normal`} /></label>
            </div>
            {err && <p className="mt-3 text-sm text-[#8a2f2f] dark:text-[#f0b8b8]" role="alert">{err}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => void save()} disabled={busy} className="rounded-lg bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
              <button onClick={() => setDraft(null)} className="rounded-lg border border-[#1a2b4a]/25 px-4 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
