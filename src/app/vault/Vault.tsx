"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, ChevronsUpDown, Copy, Dices, ExternalLink, Eye, EyeOff, KeyRound, Lock, Pencil, Plus, Search, ShieldCheck, Trash2, X } from "lucide-react";

type Item = {
  id: string; label: string; url: string | null; username: string | null; category: string; twofa: boolean; twofaMethod: string | null;
  recoveryContact: string | null; passwordChangedAt: string | null; lastRevealedAt: string | null; createdAt: string; updatedAt: string;
};
type Revealed = { id: string; password: string; secret: string; notes: string; recoveryCodes: string };
type Draft = {
  id?: string; label: string; category: string; url: string; username: string; password: string; secret: string; notes: string;
  twofa: boolean; twofaMethod: string; recoveryContact: string; recoveryCodes: string;
};
type Evt = { id: string; item_label: string | null; action: string; at: string };
type SortKey = "label" | "category" | "username" | "url" | "twofa" | "recoveryContact" | "passwordChangedAt" | "createdAt" | "lastRevealedAt";

const CATEGORIES = ["Website", "Email", "Banking", "Social media", "Software", "Hosting & domains", "Other"];
const TWOFA = ["Authenticator app", "Text message", "Email code", "Security key", "Other"];
const COLUMNS: { key: SortKey; label: string; hide?: string }[] = [
  { key: "label", label: "Name" },
  { key: "category", label: "Type" },
  { key: "username", label: "Login" },
  { key: "url", label: "Web address", hide: "hidden lg:table-cell" },
  { key: "twofa", label: "2FA" },
  { key: "recoveryContact", label: "Recovery", hide: "hidden xl:table-cell" },
  { key: "passwordChangedAt", label: "Password changed", hide: "hidden md:table-cell" },
  { key: "createdAt", label: "Added", hide: "hidden xl:table-cell" },
  { key: "lastRevealedAt", label: "Last shown", hide: "hidden xl:table-cell" },
];
const blank = (): Draft => ({ label: "", category: "Website", url: "", username: "", password: "", secret: "", notes: "", twofa: false, twofaMethod: "", recoveryContact: "", recoveryCodes: "" });
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]";
const lab = "block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]";

// A strong random password from the browser's own secure random numbers.
function generate(len = 18) {
  const sets = ["abcdefghijkmnopqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%^&*-_=+?"];
  const all = sets.join("");
  const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const chars = sets.map((s) => s[rnd(s.length)]);
  while (chars.length < len) chars.push(all[rnd(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
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
  const [typeFilter, setTypeFilter] = useState("All");
  const [twofaFilter, setTwofaFilter] = useState<"all" | "yes" | "no">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "label", dir: 1 });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmPw, setConfirmPw] = useState("");
  const [showDraftPw, setShowDraftPw] = useState(false);
  const [shown, setShown] = useState<Revealed | null>(null);
  const [copied, setCopied] = useState("");
  const [del, setDel] = useState<{ id: string; label: string } | null>(null);
  const [events, setEvents] = useState<Evt[] | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (): Promise<boolean> => {
    const r = await fetch("/api/vault", { cache: "no-store" }).catch(() => null);
    if (!r || r.status === 401) { setState("signedout"); return false; }
    const d = await r.json().catch(() => ({}));
    if (d.unlocked) {
      setItems(d.items ?? []);
      setState("open");
      if (lockTimer.current) clearTimeout(lockTimer.current);
      lockTimer.current = setTimeout(() => { setState("locked"); setShown(null); setItems([]); setDraft(null); setDel(null); }, 15 * 60_000);
      return true;
    }
    setState("locked");
    return false;
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
    setPw("");
    if (!r || !r.ok) { setBusy(false); setErr(d.error || "That didn't work. Please try again."); return; }
    const ok = await load();
    setBusy(false);
    if (!ok) setErr("Your password was right, but your browser did not keep the vault open. Please allow cookies for this site, then try again.");
  }
  async function lock() {
    await fetch("/api/vault/lock", { method: "POST" }).catch(() => {});
    setShown(null);
    setItems([]);
    setEvents(null);
    setDraft(null);
    setState("locked");
  }

  async function reveal(id: string): Promise<Revealed | null> {
    const r = await fetch("/api/vault/reveal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok) {
      if (d.locked) setState("locked");
      setErr(d.error || "Couldn't open that.");
      return null;
    }
    return { id, password: d.password ?? "", secret: d.secret ?? "", notes: d.notes ?? "", recoveryCodes: d.recoveryCodes ?? "" };
  }
  async function show(id: string) {
    setErr("");
    if (shown?.id === id) { setShown(null); return; }
    const v = await reveal(id);
    if (!v) return;
    setShown(v);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShown(null), 20_000);
  }
  async function copyText(key: string, text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 2000); } catch { setErr("Couldn't copy. Select it and copy it by hand."); }
  }
  async function copyPassword(id: string) {
    setErr("");
    const v = await reveal(id);
    if (v) await copyText(id, v.password);
  }

  async function startEdit(it: Item) {
    const v = await reveal(it.id);
    if (!v) return;
    setShowDraftPw(false);
    setConfirmPw("");
    setErr("");
    setDraft({ id: it.id, label: it.label, category: it.category, url: it.url ?? "", username: it.username ?? "", password: "", secret: v.secret, notes: v.notes, twofa: it.twofa, twofaMethod: it.twofaMethod ?? "", recoveryContact: it.recoveryContact ?? "", recoveryCodes: v.recoveryCodes });
  }
  async function save() {
    if (!draft) return;
    if (!draft.label.trim()) { setErr("Give it a name, for example the website or app."); return; }
    if (!confirmPw) { setErr("Enter your Suite password at the bottom to save."); return; }
    setBusy(true);
    setErr("");
    const body = { ...draft, password: draft.password || undefined, confirmPassword: confirmPw };
    const r = await fetch("/api/vault", { method: draft.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    setConfirmPw("");
    if (!r || !r.ok) { if (r?.status === 403 && /unlock/i.test(d.error || "")) setState("locked"); setErr(d.error || "Couldn't save that."); return; }
    setDraft(null);
    setShown(null);
    await load();
  }
  async function remove() {
    if (!del) return;
    if (!confirmPw) { setErr("Enter your Suite password to delete."); return; }
    setBusy(true);
    setErr("");
    const r = await fetch("/api/vault", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: del.id, confirmPassword: confirmPw }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    setConfirmPw("");
    if (!r || !r.ok) { setErr(d.error || "Couldn't delete that."); return; }
    setDel(null);
    setShown(null);
    await load();
  }
  async function loadEvents() {
    if (events) { setEvents(null); return; }
    const r = await fetch("/api/vault/audit", { cache: "no-store" }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setEvents(d.events ?? []);
  }

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = items.filter((i) =>
      (typeFilter === "All" || i.category === typeFilter) &&
      (twofaFilter === "all" || (twofaFilter === "yes") === i.twofa) &&
      (!needle || `${i.label} ${i.username ?? ""} ${i.url ?? ""} ${i.category} ${i.recoveryContact ?? ""} ${i.twofaMethod ?? ""}`.toLowerCase().includes(needle))
    );
    const val = (i: Item): string | number => {
      const v = i[sort.key];
      if (typeof v === "boolean") return v ? 1 : 0;
      return v === null || v === undefined ? "" : typeof v === "string" && /At$/.test(sort.key) ? v : String(v).toLowerCase();
    };
    return [...list].sort((a, b) => {
      const x = val(a), y = val(b);
      if (x === y) return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
      if (x === "") return 1; // blanks last
      if (y === "") return -1;
      return (x < y ? -1 : 1) * sort.dir;
    });
  }, [items, q, typeFilter, twofaFilter, sort]);
  const setSortKey = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "createdAt" || key === "passwordChangedAt" || key === "lastRevealedAt" || key === "twofa" ? -1 : 1 }));
  const Arrow = ({ k }: { k: SortKey }) => (sort.key !== k ? <ChevronsUpDown className="h-3 w-3 opacity-40" /> : sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2 text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]"><KeyRound className="h-7 w-7 text-[#c9a227]" /> Logins &amp; Passwords</h1>
      <p className="mt-2 max-w-3xl text-sm text-[#5a6472] dark:text-[#b8c2cf]">
        A private place for your own logins and passwords. Each person has their own, and nobody else on your team or at LifeCharter sees yours in the app. Passwords, secrets, notes and recovery codes are stored encrypted, are never shown in the list, are only decrypted for you after you re-enter your Suite password, and are never given to the AI Assistant. Changing, adding or deleting an entry asks for your Suite password every time. Please do not store bank card numbers or government ID numbers here.
      </p>

      {state === "loading" && <p className="mt-6 text-sm text-[#7a8a99]">Loading…</p>}
      {state === "signedout" && (
        <div className="mt-6 max-w-md rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 text-sm text-[#4a5568] shadow-sm dark:bg-[#1a2b4a]/30 dark:text-[#c9d1dc]">
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">We couldn&apos;t tell who is signed in.</p>
          <p className="mt-1">Your sign-in may have run out, or this browser is showing the demo. Sign in again to open your vault.</p>
          <a href="/login" className="mt-3 inline-block rounded-lg bg-[#1a2b4a] px-4 py-2 font-semibold text-white">Sign in again</a>
        </div>
      )}

      {state === "locked" && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <form onSubmit={unlock} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-sm dark:bg-[#1a2b4a]/30">
            <p className="flex items-center gap-2 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><Lock className="h-4 w-4" /> Your vault is locked</p>
            <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">Enter your Suite password to open it for 15 minutes. After that you can add, edit and sort your logins.</p>
            <label htmlFor="vault-unlock" className="sr-only">Your Suite password</label>
            <input id="vault-unlock" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required placeholder="Your Suite password" className={`${field} mt-3`} />
            {err && <p className="mt-2 text-sm text-[#8a2f2f] dark:text-[#f0b8b8]" role="alert">{err}</p>}
            <button type="submit" disabled={busy || !pw} className="mt-3 rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Checking…" : "Open my vault"}</button>
          </form>
          <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 text-sm text-[#4a5568] shadow-sm dark:bg-[#1a2b4a]/30 dark:text-[#c9d1dc]">
            <p className="flex items-center gap-2 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><ShieldCheck className="h-4 w-4" /> What each entry holds</p>
            <p className="mt-1">Name, type, web address, login, password, a secret (a security answer or PIN), notes, whether two-step sign-in (2FA) is on and which kind, a recovery email or phone, recovery codes, and when the password last changed. Sort by any visible column, and filter by type or 2FA.</p>
          </div>
        </div>
      )}

      {state === "open" && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#7a8a99]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your logins" aria-label="Search your logins" className={`${field} pl-9`} />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Show type" className={`${field} w-auto`}><option>All</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <select value={twofaFilter} onChange={(e) => setTwofaFilter(e.target.value as "all" | "yes" | "no")} aria-label="Two-step sign-in" className={`${field} w-auto`}>
              <option value="all">2FA: any</option><option value="yes">2FA on</option><option value="no">2FA off</option>
            </select>
            <select value={sort.key} onChange={(e) => setSort({ key: e.target.value as SortKey, dir: 1 })} aria-label="Sort by" className={`${field} w-auto md:hidden`}>
              {COLUMNS.map((c) => <option key={c.key} value={c.key}>Sort: {c.label}</option>)}
            </select>
            <button onClick={() => { setShowDraftPw(false); setConfirmPw(""); setErr(""); setDraft(blank()); }} className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white hover:bg-[#256b71]"><Plus className="h-4 w-4" /> Add a login</button>
            <button onClick={lock} className="inline-flex items-center gap-1.5 rounded-lg border border-[#1a2b4a]/25 px-3 py-2 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]"><Lock className="h-4 w-4" /> Lock now</button>
          </div>
          {err && !draft && !del && <p className="mt-3 text-sm text-[#8a2f2f] dark:text-[#f0b8b8]" role="alert">{err}</p>}

          {!view.length ? (
            <p className="mt-6 text-sm text-[#7a8a99]">{items.length ? "Nothing matches that." : "Nothing here yet. Press Add a login to save your first one."}</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/30">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#1a2b4a]/10 text-xs text-[#5a6472] dark:text-[#b8c2cf]">
                    {COLUMNS.map((c) => (
                      <th key={c.key} className={`p-0 ${c.hide ?? ""}`} aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                        <button onClick={() => setSortKey(c.key)} className="flex w-full items-center gap-1 px-3 py-2.5 font-semibold hover:text-[#1a2b4a] dark:hover:text-[#F8F5F0]">{c.label} <Arrow k={c.key} /></button>
                      </th>
                    ))}
                    <th className="px-3 py-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2b4a]/10 text-[#1a2b4a] dark:text-[#F8F5F0]">
                  {view.map((it) => (
                    <FragmentRow key={it.id}>
                      <tr className="align-top">
                        <td className="px-3 py-2.5 font-medium">{it.label}</td>
                        <td className="px-3 py-2.5"><span className="rounded-full bg-[#2E7C83]/12 px-2 py-0.5 text-[11px] font-semibold text-[#1f6a70] dark:text-[#7fd0d6]">{it.category}</span></td>
                        <td className="px-3 py-2.5">
                          {it.username ? <span className="inline-flex items-center gap-1.5"><span className="max-w-[16rem] truncate">{it.username}</span><button onClick={() => void copyText(`u${it.id}`, it.username!)} className="text-[#2E7C83]" aria-label="Copy login" title="Copy login">{copied === `u${it.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button></span> : ""}
                        </td>
                        <td className={`px-3 py-2.5 ${COLUMNS[3].hide}`}>{it.url && /^https?:\/\//i.test(it.url) ? <a href={it.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-[14rem] items-center gap-1 truncate text-[#2E7C83] hover:underline"><span className="truncate">{it.url.replace(/^https?:\/\//i, "")}</span><ExternalLink className="h-3 w-3 shrink-0" /></a> : it.url ?? ""}</td>
                        <td className="px-3 py-2.5">{it.twofa ? <span className="font-semibold text-[#2c6b3f]" title={it.twofaMethod ?? "Two-step sign-in is on"}>Yes{it.twofaMethod ? ` · ${it.twofaMethod}` : ""}</span> : <span className="text-[#b8a898]">No</span>}</td>
                        <td className={`px-3 py-2.5 ${COLUMNS[5].hide}`}>{it.recoveryContact ?? ""}</td>
                        <td className={`px-3 py-2.5 ${COLUMNS[6].hide}`}>{day(it.passwordChangedAt)}</td>
                        <td className={`px-3 py-2.5 ${COLUMNS[7].hide}`}>{day(it.createdAt)}</td>
                        <td className={`px-3 py-2.5 ${COLUMNS[8].hide}`}>{day(it.lastRevealedAt)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                            <button onClick={() => void show(it.id)} className="inline-flex items-center gap-1 rounded-lg border border-[#1a2b4a]/20 px-2 py-1">{shown?.id === it.id ? <><EyeOff className="h-3.5 w-3.5" /> Hide</> : <><Eye className="h-3.5 w-3.5" /> Show</>}</button>
                            <button onClick={() => void copyPassword(it.id)} className="inline-flex items-center gap-1 rounded-lg border border-[#1a2b4a]/20 px-2 py-1">{copied === it.id ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Password</>}</button>
                            <button onClick={() => void startEdit(it)} className="inline-flex items-center gap-1 px-1.5 py-1 text-[#2E7C83]"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                            <button onClick={() => { setConfirmPw(""); setErr(""); setDel({ id: it.id, label: it.label }); }} className="px-1.5 py-1 text-[#8a2f2f]" aria-label={`Delete ${it.label}`}><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                      {shown?.id === it.id && (
                        <tr className="bg-[#F8F5F0] dark:bg-[#0e1830]" aria-live="polite">
                          <td colSpan={COLUMNS.length + 1} className="px-3 py-3 text-sm">
                            <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                              <div><dt className="text-xs text-[#7a8a99]">Password</dt><dd className="break-all font-mono">{shown.password || "(none saved)"}</dd></div>
                              {shown.secret && <div><dt className="text-xs text-[#7a8a99]">Secret</dt><dd className="break-all font-mono">{shown.secret}</dd></div>}
                              {shown.recoveryCodes && <div className="sm:col-span-2"><dt className="text-xs text-[#7a8a99]">Recovery codes</dt><dd className="whitespace-pre-wrap font-mono">{shown.recoveryCodes}</dd></div>}
                              {shown.notes && <div className="sm:col-span-2"><dt className="text-xs text-[#7a8a99]">Notes</dt><dd className="whitespace-pre-wrap">{shown.notes}</dd></div>}
                            </dl>
                            <p className="mt-2 text-[11px] text-[#7a8a99]">Hides itself in 20 seconds.</p>
                          </td>
                        </tr>
                      )}
                    </FragmentRow>
                  ))}
                </tbody>
              </table>
            </div>
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
          <div className="my-6 w-full max-w-2xl rounded-2xl bg-[#FBF8F1] p-5 shadow-xl dark:bg-[#12203a]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{draft.id ? "Edit login" : "Add a login"}</h2>
              <button onClick={() => setDraft(null)} aria-label="Close" className="rounded-lg p-1.5 text-[#5a6472] hover:bg-[#1a2b4a]/10"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className={lab}>Name<input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. Instagram, QuickBooks" className={`${field} mt-1 font-normal`} autoComplete="off" /></label>
              <label className={lab}>Type
                <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={`${field} mt-1 font-normal`}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
              </label>
              <label className={`${lab} sm:col-span-2`}>Web address (URL)<input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://" className={`${field} mt-1 font-normal`} autoComplete="off" /></label>
              <label className={`${lab} sm:col-span-2`}>Login (username or email)<input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} className={`${field} mt-1 font-normal`} autoComplete="off" /></label>
              <div className="sm:col-span-2">
                <label className={lab} htmlFor="vault-pw">Password{draft.id ? " (leave blank to keep the saved one)" : ""}</label>
                <div className="mt-1 flex gap-2">
                  <input id="vault-pw" type={showDraftPw ? "text" : "password"} value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} className={`${field} font-mono`} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowDraftPw((s) => !s)} className="rounded-lg border border-[#1a2b4a]/20 px-3" aria-label={showDraftPw ? "Hide password" : "Show password"}>{showDraftPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  <button type="button" onClick={() => { setDraft({ ...draft, password: generate() }); setShowDraftPw(true); }} className="inline-flex items-center gap-1 rounded-lg border border-[#2E7C83]/50 px-3 text-xs font-semibold text-[#1f6a70] dark:text-[#7fd0d6]" title="Make a strong random password"><Dices className="h-4 w-4" /> Make one</button>
                </div>
              </div>
              <label className={`${lab} sm:col-span-2`}>Secret (a security answer, PIN or key phrase)<input value={draft.secret} onChange={(e) => setDraft({ ...draft, secret: e.target.value })} className={`${field} mt-1 font-normal font-mono`} autoComplete="off" /></label>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3 rounded-lg border border-[#1a2b4a]/10 bg-white px-3 py-2 dark:bg-[#1a2b4a]/30">
                <label className="flex items-center gap-2 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]"><input type="checkbox" checked={draft.twofa} onChange={(e) => setDraft({ ...draft, twofa: e.target.checked, twofaMethod: e.target.checked ? draft.twofaMethod : "" })} className="h-4 w-4" /> Two-step sign-in (2FA) is turned on</label>
                {draft.twofa && (
                  <select value={draft.twofaMethod} onChange={(e) => setDraft({ ...draft, twofaMethod: e.target.value })} aria-label="2FA method" className={`${field} w-auto`}>
                    <option value="">Which kind? (optional)</option>{TWOFA.map((m) => <option key={m}>{m}</option>)}
                  </select>
                )}
              </div>
              <label className={`${lab} sm:col-span-2`}>Recovery email or phone<input value={draft.recoveryContact} onChange={(e) => setDraft({ ...draft, recoveryContact: e.target.value })} className={`${field} mt-1 font-normal`} autoComplete="off" /></label>
              <label className={`${lab} sm:col-span-2`}>Recovery or backup codes (stored encrypted)<textarea value={draft.recoveryCodes} onChange={(e) => setDraft({ ...draft, recoveryCodes: e.target.value })} rows={2} className={`${field} mt-1 font-normal font-mono`} /></label>
              <label className={`${lab} sm:col-span-2`}>Notes (stored encrypted)<textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} className={`${field} mt-1 font-normal`} /></label>
            </div>
            <div className="mt-4 rounded-lg border border-[#c9a227]/40 bg-[#c9a227]/10 p-3">
              <label className={lab} htmlFor="vault-confirm">Enter your Suite password to save this</label>
              <input id="vault-confirm" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="current-password" className={`${field} mt-1`} />
            </div>
            {err && <p className="mt-3 text-sm text-[#8a2f2f] dark:text-[#f0b8b8]" role="alert">{err}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => void save()} disabled={busy} className="rounded-lg bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
              <button onClick={() => setDraft(null)} className="rounded-lg border border-[#1a2b4a]/25 px-4 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {del && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Delete login">
          <div className="my-16 w-full max-w-md rounded-2xl bg-[#FBF8F1] p-5 shadow-xl dark:bg-[#12203a]">
            <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Delete &ldquo;{del.label}&rdquo;?</h2>
            <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">This removes it and its saved password for good. Enter your Suite password to confirm.</p>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="current-password" aria-label="Your Suite password" className={`${field} mt-3`} />
            {err && <p className="mt-2 text-sm text-[#8a2f2f] dark:text-[#f0b8b8]" role="alert">{err}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={() => void remove()} disabled={busy} className="rounded-lg bg-[#8a2f2f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Deleting…" : "Delete"}</button>
              <button onClick={() => { setDel(null); setConfirmPw(""); setErr(""); }} className="rounded-lg border border-[#1a2b4a]/25 px-4 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// A table row that can be followed by a detail row.
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
