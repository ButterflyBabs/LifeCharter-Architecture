"use client";

import { useEffect, useState } from "react";
import { ReviewText } from "@/components/website/ReviewText";
import ReviewDelivered from "@/components/website/ReviewDelivered";
import { reviewReadyEmail } from "@/lib/websiteReviewEmail";
import { SEO_SECTION_OUTLINE, assistantSectionOutline, hasAssistantSection, hasSeoSection } from "@/lib/websiteReviewText";

type Client = {
  masterPlanId: string;
  siteId: string;
  siteNumber: number;
  siteCount: number;
  name: string | null;
  email: string | null;
  enrolledAt: string;
  due: string;
  website: string;
  assistantName: string;
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
  const [preview, setPreview] = useState<{ c: Client; text: string; tab: "page" | "email" } | null>(null);
  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPreview(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  const load = async () => {
    const res = await fetch("/api/website-reviews");
    if (!res.ok) return setDenied(true);
    const d = await res.json();
    setClients(d.clients);
  };
  useEffect(() => {
    load();
  }, []);

  const keyOf = (c: Client) => c.siteId || `${c.masterPlanId}:${c.website}`;
  async function save(c: Client, publish: boolean) {
    const body = draft[keyOf(c)] ?? c.review?.content ?? "";
    const missing = publish ? [!hasSeoSection(body) && "Keywords and SEO: getting found", !hasAssistantSection(body) && "Putting this into action with their AI Assistant"].filter(Boolean) : [];
    const noSections = missing.length ? `\n\nThis Review is missing: ${missing.join("; ")}. Every Review should include both.` : "";
    if (publish && !confirm(`Publish this Review to ${c.name || c.email} and email them that it's ready?${noSections}`)) return;
    setBusy(keyOf(c));
    try {
      const res = await fetch("/api/website-reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterPlanId: c.masterPlanId, siteId: c.siteId || undefined, content: draft[keyOf(c)] ?? c.review?.content ?? "", publish }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Couldn't save.");
      setMsg((m) => ({ ...m, [keyOf(c)]: publish ? (d.emailed ? "Published and emailed." : "Published. The email didn't send; let them know yourself.") : "Saved." }));
      await load();
    } catch (e) {
      setMsg((m) => ({ ...m, [keyOf(c)]: (e as Error).message }));
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
          Each client&rsquo;s Review is due 14 days after they enroll (14 days after they add it, for a second or later website). A client can have several: Starter 1, Growth 2, VIP 5. Claude writes it; paste it in, check the preview, and Publish. Publishing puts it in their account and emails them.
        </p>
      </header>

      {!clients ? (
        <p className="text-sm text-[#7b6b8d]">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-[#5b5f73] dark:text-[#b8a898]">No clients yet.</p>
      ) : (
        list.map((c) => {
          const s = state(c);
          const k = keyOf(c);
          const text = draft[k] ?? c.review?.content ?? "";
          const late = s !== "Delivered" && new Date(c.due) < new Date();
          return (
            <section key={k} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{c.name || c.email}{c.siteCount > 1 && <span className="ml-2 text-sm font-normal text-[#7b6b8d]">website {c.siteNumber} of {c.siteCount}</span>}</h2>
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
                  {text.trim() && (
                    <button onClick={() => setPreview({ c, text, tab: "page" })} className="rounded-lg border border-[#2E7C83]/40 px-3 py-1 text-sm font-medium text-[#2E7C83] hover:bg-[#2E7C83]/10">
                      Preview
                    </button>
                  )}
                  <button onClick={() => setOpen(open === k ? null : k)} className="text-sm font-medium text-[#2E7C83] hover:underline">
                    {open === k ? "Close" : c.review ? "Open" : "Write"}
                  </button>
                </div>
              </div>

              {open === k && (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <textarea
                      value={text}
                      onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                      rows={22}
                      placeholder={"## What's working\n\n...\n\n## The five changes that matter most\n\n1. ...\n\n## Keywords and SEO: getting found\n\n...\n\n## Putting this into action with (their assistant's name)\n\n...\n\nUse ## for headings, - for bullets, **bold**."}
                      className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white p-3 font-mono text-[13px] text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button disabled={busy === k || !text.trim()} onClick={() => save(c, false)} className="rounded-lg border border-[#1a2b4a]/20 px-4 py-2 text-sm font-medium text-[#1a2b4a] hover:bg-[#1a2b4a]/5 disabled:opacity-50 dark:text-[#F8F5F0]">
                        {s === "Delivered" ? "Save changes" : "Save draft"}
                      </button>
                      {s !== "Delivered" && (
                        <button disabled={busy === k || !text.trim()} onClick={() => save(c, true)} className="rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                          Publish &amp; email client
                        </button>
                      )}
                      {!hasSeoSection(text) && (
                        <button type="button" onClick={() => setDraft((d) => ({ ...d, [k]: `${text.trim()}${text.trim() ? "\n\n" : ""}${SEO_SECTION_OUTLINE}` }))} className="rounded-lg border border-[#c9a227]/50 px-4 py-2 text-sm font-medium text-[#8a6a15] hover:bg-[#c9a227]/10">
                          Add the Keywords and SEO section
                        </button>
                      )}
                      {!hasAssistantSection(text) && (
                        <button type="button" onClick={() => setDraft((d) => ({ ...d, [k]: `${text.trim()}${text.trim() ? "\n\n" : ""}${assistantSectionOutline(c.assistantName)}` }))} className="rounded-lg border border-[#c9a227]/50 px-4 py-2 text-sm font-medium text-[#8a6a15] hover:bg-[#c9a227]/10">
                          Add the AI Assistant section
                        </button>
                      )}
                      {msg[k] && <span className="text-xs text-[#7b6b8d]">{msg[k]}</span>}
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
      {preview && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Preview of the Review as the client gets it" onClick={() => setPreview(null)}>
          <div className="my-6 w-full max-w-3xl rounded-2xl bg-[#FAF8F3] p-5 shadow-xl dark:bg-[#14213a]" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Preview · nothing has been sent</p>
              <div className="ml-auto flex gap-1" role="tablist">
                {([["page", "On their Website Review page"], ["email", "The email they receive"]] as const).map(([t, label]) => (
                  <button key={t} role="tab" aria-selected={preview.tab === t} onClick={() => setPreview({ ...preview, tab: t })} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${preview.tab === t ? "bg-[#1a2b4a] text-white" : "border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                    {label}
                  </button>
                ))}
                <button onClick={() => setPreview(null)} className="ml-2 rounded-lg border border-[#1a2b4a]/20 px-3 py-1.5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Close</button>
              </div>
            </div>
            <p className="mt-2 text-sm text-[#5b5f73] dark:text-[#b8a898]">For {preview.c.name || preview.c.email} · {preview.c.website || "no website yet"}. This is the Review as it is written right now, including any changes you have not saved.</p>
            <div className="mt-4">
              {preview.tab === "page" ? (
                <div className="space-y-4">
                  <header>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Included with Command Suite · written by our team, delivered within 14 days</p>
                    <h1 className="mt-2 text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Website Alignment Review</h1>
                  </header>
                  <ReviewDelivered website={preview.c.website} publishedAt={preview.c.review?.published_at ?? new Date().toISOString()} content={preview.text} />
                </div>
              ) : (
                (() => {
                  const mail = reviewReadyEmail({ name: preview.c.name || "", website: preview.c.website, origin: typeof window === "undefined" ? "" : window.location.origin });
                  return (
                    <div>
                      <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                        <dt className="text-[#7b6b8d]">From</dt><dd>LifeCharter Command Suite &lt;support@lccommandsuite.com&gt;</dd>
                        <dt className="text-[#7b6b8d]">To</dt><dd>{preview.c.email || "(no email on file)"}</dd>
                        <dt className="text-[#7b6b8d]">Subject</dt><dd className="font-medium">{mail.subject}</dd>
                      </dl>
                      <iframe title="The email the client receives" sandbox="" srcDoc={mail.html} className="h-[520px] w-full rounded-xl border border-[#1a2b4a]/10 bg-white" />
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
