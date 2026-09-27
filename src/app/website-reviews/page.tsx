"use client";

import { useEffect, useState } from "react";
import { ReviewText } from "@/components/website/ReviewText";

type Client = {
  masterPlanId: string;
  name: string | null;
  email: string | null;
  enrolledAt: string;
  due: string;
  website: string;
  review: { status: "draft" | "published"; content: string; published_at: string | null } | null;
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

// Owner-only queue (the API returns 404 to anyone else): each client's website, when their
// Review is due, and a place to paste Claude's Review, preview it, save it and publish it.
export default function WebsiteReviewsPage() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/website-reviews");
    if (!res.ok) return setDenied(true);
    const d = await res.json();
    setClients(d.clients);
  };
  useEffect(() => {
    load();
  }, []);

  async function save(c: Client, publish: boolean) {
    if (publish && !confirm(`Publish this Review to ${c.name || c.email} and email them that it's ready?`)) return;
    setBusy(c.masterPlanId);
    try {
      const res = await fetch("/api/website-reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterPlanId: c.masterPlanId, content: draft[c.masterPlanId] ?? c.review?.content ?? "", publish }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Couldn't save.");
      setMsg((m) => ({ ...m, [c.masterPlanId]: publish ? (d.emailed ? "Published and emailed." : "Published. The email didn't send; let them know yourself.") : "Saved." }));
      await load();
    } catch (e) {
      setMsg((m) => ({ ...m, [c.masterPlanId]: (e as Error).message }));
    } finally {
      setBusy(null);
    }
  }

  if (denied) return <p className="p-8 text-[#5b5f73]">Not found.</p>;

  const state = (c: Client) => (c.review?.status === "published" ? "Delivered" : !c.website ? "Waiting for website" : c.review ? "Draft saved" : "To write");
  const order = { "To write": 0, "Draft saved": 1, "Waiting for website": 2, Delivered: 3 } as Record<string, number>;
  const list = (clients ?? []).slice().sort((a, b) => order[state(a)] - order[state(b)] || a.due.localeCompare(b.due));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Private · only you can see this</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Website Alignment Reviews</h1>
        <p className="mt-2 text-[15px] text-[#5b5f73] dark:text-[#b8a898]">
          Each client&rsquo;s Review is due 14 days after they enroll. Claude writes it; paste it in, check the preview, and Publish. Publishing puts it in their account and emails them.
        </p>
      </header>

      {!clients ? (
        <p className="text-sm text-[#7b6b8d]">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-[#5b5f73] dark:text-[#b8a898]">No clients yet.</p>
      ) : (
        list.map((c) => {
          const s = state(c);
          const text = draft[c.masterPlanId] ?? c.review?.content ?? "";
          const late = s !== "Delivered" && new Date(c.due) < new Date();
          return (
            <section key={c.masterPlanId} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{c.name || c.email}</h2>
                  <p className="text-sm text-[#5b5f73] dark:text-[#b8a898]">
                    {c.website ? (
                      <a className="text-[#2E7C83] underline" href={/^https?:\/\//.test(c.website) ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer">{c.website}</a>
                    ) : (
                      "No website yet"
                    )}
                    {" · "}enrolled {fmt(c.enrolledAt)} · due <span className={late ? "font-semibold text-[#b03a2e]" : ""}>{fmt(c.due)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s === "Delivered" ? "bg-green-500/10 text-[#2f7d55]" : s === "To write" ? "bg-[#c9a227]/15 text-[#8a6a15]" : "bg-[#7b6b8d]/10 text-[#7b6b8d]"}`}>
                    {s}{s === "Delivered" && c.review?.published_at ? ` ${fmt(c.review.published_at)}` : ""}
                  </span>
                  <button onClick={() => setOpen(open === c.masterPlanId ? null : c.masterPlanId)} className="text-sm font-medium text-[#2E7C83] hover:underline">
                    {open === c.masterPlanId ? "Close" : c.review ? "Open" : "Write"}
                  </button>
                </div>
              </div>

              {open === c.masterPlanId && (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <textarea
                      value={text}
                      onChange={(e) => setDraft((d) => ({ ...d, [c.masterPlanId]: e.target.value }))}
                      rows={22}
                      placeholder={"## What's working\n\n...\n\n## The five changes that matter most\n\n1. ...\n\nUse ## for headings, - for bullets, **bold**."}
                      className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white p-3 font-mono text-[13px] text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button disabled={busy === c.masterPlanId || !text.trim()} onClick={() => save(c, false)} className="rounded-lg border border-[#1a2b4a]/20 px-4 py-2 text-sm font-medium text-[#1a2b4a] hover:bg-[#1a2b4a]/5 disabled:opacity-50 dark:text-[#F8F5F0]">
                        {s === "Delivered" ? "Save changes" : "Save draft"}
                      </button>
                      {s !== "Delivered" && (
                        <button disabled={busy === c.masterPlanId || !text.trim()} onClick={() => save(c, true)} className="rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                          Publish &amp; email client
                        </button>
                      )}
                      {msg[c.masterPlanId] && <span className="text-xs text-[#7b6b8d]">{msg[c.masterPlanId]}</span>}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#1a2b4a]/10 p-4 dark:border-white/10">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d]">Preview: what the client sees</p>
                    {text.trim() ? <ReviewText text={text} /> : <p className="text-sm text-[#7b6b8d]">Nothing written yet.</p>}
                  </div>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
