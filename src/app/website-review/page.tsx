"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { ReviewText } from "@/components/website/ReviewText";
import WebsiteQuestion from "@/components/website/WebsiteQuestion";

type Site = { id: string; website: string; status: "published" | "in_progress"; content: string | null; publishedAt: string | null; due: string | null };
type Data = { sites: Site[]; limit: number; used: number; upgrade: string };

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "");

// The client's Website Alignment Reviews: one for each website their plan includes (Starter 1, Growth 2, VIP 5), each
// written for them within 14 days of adding it and emailed to them when it's ready.
export default function WebsiteReviewPage() {
  const [d, setD] = useState<Data | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const load = () => fetch("/api/website-review", { cache: "no-store" }).then((x) => x.json()).then(setD).catch(() => setD(null));
  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/website-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ website: value }) }).catch(() => null);
    const j = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok) return setMsg(j.error || "Couldn't save. Please try again.");
    setValue("");
    await load();
  };
  const remove = async (s: Site) => {
    if (!window.confirm(`Take ${s.website} off your list? Its Review hasn't been delivered yet, and removing it frees up a place.`)) return;
    setMsg("");
    const res = await fetch(`/api/website-review?id=${s.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) setMsg((await res?.json().catch(() => ({})))?.error || "Couldn't remove it.");
    await load();
  };

  const sites = d?.sites ?? [];
  const left = d ? Math.max(0, d.limit - sites.length) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Included with Command Suite · written by our team, delivered within 14 days</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Website Alignment Review</h1>
        <p className="mt-2 text-[15px] text-[#5b5f73] dark:text-[#b8a898]">
          Your website, read against the positioning, voice and offer you&rsquo;re building here, with the five changes that matter most.
          {d ? ` Your plan includes ${d.limit} website review${d.limit === 1 ? "" : "s"}.` : ""}
        </p>
      </header>

      {!d ? (
        <p className="text-sm text-[#7b6b8d]">Loading…</p>
      ) : sites.length === 0 ? (
        <WebsiteQuestion onSaved={load} />
      ) : (
        <>
          {sites.map((s, i) => (
            <section key={s.id}>
              {sites.length > 1 && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7b6b8d]">Website {i + 1} of {sites.length}</p>}
              {s.status === "published" && s.content ? (
                <article className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
                  <p className="mb-4 text-xs text-[#7b6b8d]">{[s.website, s.publishedAt ? `Delivered ${fmt(s.publishedAt)}` : ""].filter(Boolean).join(" · ")}</p>
                  <ReviewText text={s.content} />
                  <p className="mt-6 border-t border-[#1a2b4a]/10 pt-4 text-sm text-[#5b5f73] dark:border-white/10 dark:text-[#b8a898]">
                    Questions, or want to talk it through? Write to <a className="text-[#2E7C83] underline" href="mailto:support@lccommandsuite.com">support@lccommandsuite.com</a>.
                  </p>
                </article>
              ) : (
                <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
                  <p className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{sites.length > 1 ? `Your Review of ${s.website} is being written` : "Your Review is being written"}</p>
                  <p className="mt-1 text-[15px] text-[#5b5f73] dark:text-[#b8a898]">
                    We&rsquo;re reviewing <strong>{s.website}</strong>.{s.due ? ` Expect it by ${fmt(s.due)}.` : ""} We&rsquo;ll email you the moment it&rsquo;s ready, and it will appear right here.
                  </p>
                  <button onClick={() => remove(s)} className="mt-3 text-xs text-[#8a2f2f] hover:underline">Take this website off my list</button>
                </div>
              )}
            </section>
          ))}

          <section className="rounded-2xl border border-[#1a2b4a]/12 bg-white p-4 dark:bg-[#1a2b4a]/20">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#2E7C83]" />
              <h2 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Add another website</h2>
              <span className="ml-auto text-xs text-[#7a8a99]">{sites.length} of {d.limit} used</span>
            </div>
            {left > 0 ? (
              <form onSubmit={add} className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input type="text" inputMode="url" value={value} onChange={(e) => setValue(e.target.value)} placeholder="anotherbusiness.com" aria-label="Website address" className="min-w-0 flex-1 rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]" />
                <button type="submit" disabled={busy || !value.trim()} className="rounded-lg bg-[#2E7C83] px-4 py-2 text-sm font-medium text-white hover:bg-[#256b71] disabled:opacity-50">{busy ? "Adding…" : "Add website"}</button>
              </form>
            ) : (
              <p className="mt-2 text-sm text-[#5b5f73] dark:text-[#b8a898]">You&rsquo;re using every website review your plan includes.{d.upgrade ? ` ${d.upgrade}` : ""}</p>
            )}
            {msg && <p role="alert" className="mt-2 text-sm text-[#8a2f2f]">{msg}</p>}
          </section>
        </>
      )}
    </div>
  );
}
