"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Tags, Search } from "lucide-react";

interface Row {
  tag: string;
  people: number;
  usedBy: string[];
  auto: string | null;
  note: string;
}

// A tag's family is its first word (lcmc, masterclass, sneak ...) when at least two tags share it.
const firstWord = (t: string) => t.split("-")[0];
const title = (w: string) => (w.length <= 4 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1));

export default function TagLibrary() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name" | "people">("name");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [renaming, setRenaming] = useState<{ tag: string; to: string } | null>(null);
  const [retiring, setRetiring] = useState("");

  useEffect(() => {
    fetch("/api/crm/tags", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRows(d?.tags ?? []))
      .catch(() => setRows([]));
  }, []);

  async function post(body: Record<string, unknown>) {
    const r = await fetch("/api/crm/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) {
      setMsg(d.error || "Something went wrong.");
      return null;
    }
    return d;
  }
  const saveNote = async (tag: string, note: string) => {
    const cur = rows?.find((r) => r.tag === tag);
    if (!cur || cur.note === note.trim()) return;
    if (await post({ action: "note", tag, note })) {
      setRows((rs) => (rs ?? []).map((r) => (r.tag === tag ? { ...r, note: note.trim() } : r)));
      setMsg(`Note saved for ${tag}.`);
    }
  };
  const change = async (body: { action: "rename" | "retire"; tag: string; to?: string }) => {
    setBusy(body.tag);
    const d = await post(body);
    setBusy("");
    setRenaming(null);
    setRetiring("");
    if (!d) return;
    setRows(d.tags ?? []);
    setMsg(body.action === "rename" ? `Renamed ${body.tag} to ${body.to} on ${d.changed} ${d.changed === 1 ? "person" : "people"}.` : `Retired ${body.tag}: taken off ${d.changed} ${d.changed === 1 ? "person" : "people"}. Nobody was removed from Contacts.`);
  };

  const groups = useMemo(() => {
    const list = (rows ?? []).filter((r) => !q.trim() || `${r.tag} ${r.note} ${r.usedBy.join(" ")} ${r.auto ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()));
    const size = new Map<string, number>();
    for (const r of rows ?? []) size.set(firstWord(r.tag), (size.get(firstWord(r.tag)) ?? 0) + 1);
    const by = new Map<string, Row[]>();
    for (const r of list) {
      const w = firstWord(r.tag);
      const g = (size.get(w) ?? 0) >= 2 ? title(w) : "General";
      by.set(g, [...(by.get(g) ?? []), r]);
    }
    return Array.from(by.entries())
      .map(([name, items]) => [name, [...items].sort((a, b) => (sort === "people" ? b.people - a.people || a.tag.localeCompare(b.tag) : a.tag.localeCompare(b.tag)))] as const)
      .sort((a, b) => (a[0] === "General" ? 1 : b[0] === "General" ? -1 : a[0].localeCompare(b[0])));
  }, [rows, q, sort]);

  const btn = "rounded-lg border border-[#1a2b4a]/20 px-3 py-1.5 text-xs font-medium text-[#1a2b4a] hover:border-[#2E7C83] dark:text-[#F8F5F0] disabled:opacity-50";

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#c9a227] to-[#2E7C83]"><Tags className="h-6 w-6 text-white" /></div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Tag Library</h1>
          <p className="text-[#7a8a99]">Every tag in your account: how many people carry it, what adds it, and your own note on what it means.</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">Search tags</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8a99]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tags, notes or where they come from" className="h-10 w-full rounded-lg border border-[#1a2b4a]/20 bg-white pl-9 pr-3 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]" />
        </label>
        <div className="flex gap-2 text-sm" role="group" aria-label="Sort">
          {([["name", "A to Z"], ["people", "Most people first"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setSort(k)} aria-pressed={sort === k} className={`rounded-full px-3 py-1.5 ${sort === k ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/8 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>{l}</button>
          ))}
        </div>
        {rows && <span className="text-sm text-[#7a8a99]">{rows.length} tags</span>}
      </div>

      {msg && <button onClick={() => setMsg("")} className="mb-4 block w-full rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-left text-sm" role="status">{msg}</button>}

      {!rows ? (
        <p className="text-sm text-[#7a8a99]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#1a2b4a]/20 p-8 text-center text-sm text-[#7a8a99]">No tags yet. Tags appear here as soon as a contact, form, calendar or pipeline uses one.</p>
      ) : (
        <div className="space-y-8">
          {groups.map(([name, items]) => (
            <section key={name}>
              <h2 className="mb-2 flex items-baseline gap-2 border-b border-[#c9a227]/40 pb-1 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{name}<span className="text-xs font-normal text-[#7a8a99]">{items.length}</span></h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-[#7a8a99]">
                    <tr><th className="w-[22%] py-2 pr-4">Tag</th><th className="w-[8%] pr-4">People</th><th className="w-[30%] pr-4">What adds it</th><th className="w-[26%] pr-4">Your note</th><th className="w-[14%]">Actions</th></tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r.tag} className="border-t border-[#1a2b4a]/10 align-top">
                        <td className="py-2 pr-4 font-mono text-[13px] text-[#1a2b4a] dark:text-[#F8F5F0]">{r.tag}</td>
                        <td className="py-2 pr-4 tabular-nums">
                          {r.people ? <Link href={`/contacts?tag=${encodeURIComponent(r.tag)}`} className="font-semibold text-[#2E7C83] underline">{r.people}</Link> : <span className="text-[#7a8a99]">0</span>}
                        </td>
                        <td className="py-2 pr-4 text-[13px] text-[#5a6472] dark:text-[#b8c2cf]">
                          {r.auto && <p>{r.auto}</p>}
                          {r.usedBy.map((u) => <p key={u}>{u}</p>)}
                          {!r.auto && !r.usedBy.length && <span className="text-[#7a8a99]">Added by hand</span>}
                        </td>
                        <td className="py-2 pr-4">
                          <input defaultValue={r.note} key={`${r.tag}:${r.note}`} aria-label={`Note for ${r.tag}`} placeholder="What this tag means" onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} onBlur={(e) => saveNote(r.tag, e.target.value)} className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-[13px] text-[#1a2b4a] hover:border-[#1a2b4a]/15 focus:border-[#2E7C83] focus:bg-white dark:text-[#F8F5F0] dark:focus:bg-[#1a2b4a]/40" />
                        </td>
                        <td className="py-2">
                          {renaming?.tag === r.tag ? (
                            <form className="flex flex-wrap gap-1.5" onSubmit={(e) => { e.preventDefault(); change({ action: "rename", tag: r.tag, to: renaming.to }); }}>
                              <input autoFocus value={renaming.to} onChange={(e) => setRenaming({ tag: r.tag, to: e.target.value })} aria-label="New tag name" className="w-36 rounded-md border border-[#1a2b4a]/20 bg-white px-2 py-1 text-xs text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]" />
                              <button type="submit" disabled={busy === r.tag} className={btn}>Save</button>
                              <button type="button" onClick={() => setRenaming(null)} className={btn}>Cancel</button>
                            </form>
                          ) : retiring === r.tag ? (
                            <div className="space-y-1.5">
                              <p className="text-xs text-[#1a2b4a] dark:text-[#F8F5F0]">Take it off {r.people} {r.people === 1 ? "person" : "people"}? They stay in Contacts.{r.usedBy.length || r.auto ? " Something still adds this tag, so it can come back." : ""}</p>
                              <div className="flex gap-1.5">
                                <button onClick={() => change({ action: "retire", tag: r.tag })} disabled={busy === r.tag} className="rounded-lg bg-[#8a2f2f] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{busy === r.tag ? "Working…" : "Yes, retire it"}</button>
                                <button onClick={() => setRetiring("")} className={btn}>Keep it</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              <button onClick={() => { setRenaming({ tag: r.tag, to: r.tag }); setRetiring(""); }} className={btn}>Rename</button>
                              <button onClick={() => { setRetiring(r.tag); setRenaming(null); }} className={btn}>Retire</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
