"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Row = { id: string; name: string; email: string; phone: string; tags: string[]; lastActiveAt: string | null };

// Contacts tab: browse or search the owner's Suite contacts. "Pull up" loads the
// contact into the lookup panel above (?email=), which shows tags and recent activity.
export function ContactsTab() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (query: string, p: number) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/sales/contacts?page=${p}${query ? `&q=${encodeURIComponent(query)}` : ""}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load contacts.");
      setRows(data.contacts || []);
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load("", 1);
  }, [load]);

  const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

  return (
    <section className="mb-12 rounded-2xl border border-[#F3EEE4]/12 bg-[#1C2236] p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[#F8F5F0]">Contacts</h2>
          <p className="text-sm text-[#b8a898]">Your Suite contacts. Only you and your own team can see this.{" "}
            <Link href="/contacts" className="text-[#E3C27C] hover:underline">Open Contacts</Link></p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            void load(q, 1);
          }}
        >
          <input
            id="contacts-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email"
            className="w-56 rounded-lg border border-[#F3EEE4]/20 bg-[#141826] px-3 py-2 text-sm text-[#F3EEE4] placeholder:text-[#b8a898]/70"
          />
          <button className="rounded-lg bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#141826] hover:brightness-110" disabled={busy}>
            {busy ? "Searching…" : "Search"}
          </button>
        </form>
      </div>

      {error && <p className="mt-4 text-sm text-[#E8A598]">{error}</p>}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-[#b8a898]">
            <tr>
              <th className="py-2 pr-4">Name</th>
              <th className="pr-4">Email</th>
              <th className="pr-4">Phone</th>
              <th className="pr-4">Tags</th>
              <th className="pr-4">Last active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#F3EEE4]/10">
                <td className="py-2 pr-4 text-[#F8F5F0]">{c.name || "—"}</td>
                <td className="pr-4">{c.email || "—"}</td>
                <td className="pr-4">{c.phone || "—"}</td>
                <td className="pr-4">
                  {c.tags.length ? (
                    <span className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full bg-[#F3EEE4]/10 px-2 py-0.5 text-[10px] text-[#F3EEE4]/80">{t}</span>
                      ))}
                      {c.tags.length > 3 && <span className="text-[10px] text-[#b8a898]">+{c.tags.length - 3}</span>}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="pr-4">{when(c.lastActiveAt)}</td>
                <td>
                  {c.email && (
                    <a href={`/sales-reference?email=${encodeURIComponent(c.email)}`} className="text-[#E3C27C] hover:underline">
                      Pull up
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {!busy && !error && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-[#b8a898]">No contacts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <button
          type="button"
          disabled={busy || page === 1}
          onClick={() => { const p = page - 1; setPage(p); void load(q, p); }}
          className="rounded-lg border border-[#F3EEE4]/20 px-3 py-1.5 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-[#b8a898]">Page {page}</span>
        <button
          type="button"
          disabled={busy || rows.length < 25}
          onClick={() => { const p = page + 1; setPage(p); void load(q, p); }}
          className="rounded-lg border border-[#F3EEE4]/20 px-3 py-1.5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
