"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { HeartHandshake, Loader2 } from "lucide-react";

type Piece = { on: boolean; formId: string | null; sequenceId: string | null };
type Data = {
  house: boolean;
  ready: boolean;
  sender?: { ok: boolean; reason: string | null; setupPath: string };
  pieces?: Record<"thirty" | "pulse" | "exit" | "quiet", Piece>;
  booking?: string | null;
  calendars?: { slug: string; name: string; active: boolean }[];
  counts?: { clients: number; former: number };
};

const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-[0_8px_24px_rgba(26,43,74,0.08)] dark:border-white/10 dark:bg-[#1a2b4a]/40";
const label = "block text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898] mb-1";
const input = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";

const PIECES: { key: "thirty" | "pulse" | "exit" | "quiet"; title: string; when: string; what: string }[] = [
  { key: "thirty", title: "30-day check-in", when: "30 days after someone becomes a client", what: "One email with a short check-in form: what's working, what's hard, whether a call would help, and a testimonial ask." },
  { key: "pulse", title: "Quarterly pulse", when: "Every 90 days while they're a client", what: "One email with three quick questions: how much it's helping, what they're proud of, one thing to change." },
  { key: "exit", title: "Exit survey", when: "When you tag someone former-client", what: "A warm thank-you with a short survey on what worked, what didn't, and whether you may check in later." },
  { key: "quiet", title: "Quiet clients", when: "No bookings, payments, emails or notes for 2 weeks", what: "A task for you to reach out personally. Nothing is emailed automatically: you can start the 3 quiet-client notes for them yourself." },
];

function Switch({ on, busy, onChange, label: l }: { on: boolean; busy: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={l}
      disabled={busy}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? "bg-[#2E7C83]" : "bg-[#1a2b4a]/20"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function ClientCare() {
  const [d, setD] = useState<Data | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const post = useCallback(async (body: Record<string, unknown>) => {
    const r = await fetch("/api/client-care", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "That didn't work.");
  }, []);
  const load = useCallback(async () => {
    const r = await fetch("/api/client-care", { cache: "no-store" });
    const j = (await r.json().catch(() => null)) as Data | null;
    if (j && !j.house && !j.ready) {
      await post({ action: "setup" }).catch(() => null); // first visit: load the templates, all switched off
      const again = await fetch("/api/client-care", { cache: "no-store" }).then((x) => x.json()).catch(() => j);
      return setD(again);
    }
    setD(j);
  }, [post]);
  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(key: string, on: boolean) {
    setBusy(key);
    setMsg("");
    try {
      await post({ action: "toggle", key, on });
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    }
    setBusy("");
  }
  async function booking(slug: string) {
    setBusy("booking");
    try {
      await post({ action: "booking", slug });
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    }
    setBusy("");
  }

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6">
      <header className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1a2b4a] to-[#c9a227]"><HeartHandshake className="h-6 w-6 text-white" /></div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Clients &amp; Sales</p>
          <h1 className="text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Client Care</h1>
          <p className="mt-1 max-w-3xl text-[15px] text-[#5b5f73] dark:text-[#b8a898]">
            Stay close to your clients without having to remember to: a check-in at 30 days, a short pulse every quarter, a kind exit survey, and a nudge to you when someone goes quiet. Everything is written and ready; switch on what you want. Emails come from your own address and end with your own sign-off.
          </p>
        </div>
      </header>

      {!d && <p className="flex items-center gap-2 text-sm text-[#7b6b8d]"><Loader2 className="h-4 w-4 animate-spin" />Getting Client Care ready…</p>}
      {d?.house && (
        <div className={card}>
          <p className="text-sm text-[#5b5f73] dark:text-[#b8a898]">Your own Client Care already runs from your CLIENT CARE campaigns and the daily check-in job. This page is for each client&apos;s account.</p>
        </div>
      )}

      {d && !d.house && d.pieces && (
        <>
          {d.sender && !d.sender.ok && (
            <div className="rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 px-4 py-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              Emails can&apos;t go out until your email sending is set up. <Link href={d.sender.setupPath} className="font-semibold text-[#2E7C83] underline">Set up email sending</Link>. You can still switch pieces on now.
            </div>
          )}

          <div className={card}>
            <p className="text-sm text-[#5b5f73] dark:text-[#b8a898]">
              <strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Who counts as a client:</strong> anyone in Contacts with the tag <code className="rounded bg-[#1a2b4a]/5 px-1">client</code> or <code className="rounded bg-[#1a2b4a]/5 px-1">customer</code> (payments through the Suite add <code className="rounded bg-[#1a2b4a]/5 px-1">customer</code> by themselves). When someone stops working with you, add <code className="rounded bg-[#1a2b4a]/5 px-1">former-client</code>.
              {d.counts && <> You have <strong>{d.counts.clients}</strong> client{d.counts.clients === 1 ? "" : "s"} and <strong>{d.counts.former}</strong> former client{d.counts.former === 1 ? "" : "s"}.</>}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {PIECES.map((p) => {
              const piece = d.pieces![p.key];
              return (
                <section key={p.key} className={card}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{p.title}</h2>
                      <p className="text-xs font-semibold text-[#2E7C83]">{p.when}</p>
                    </div>
                    <Switch on={piece.on} busy={busy === p.key} onChange={(v) => void toggle(p.key, v)} label={`${p.title} ${piece.on ? "on" : "off"}`} />
                  </div>
                  <p className="mt-2 text-sm text-[#5b5f73] dark:text-[#b8a898]">{p.what}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs">
                    {piece.sequenceId && <Link href={`/sequences-manager?seq=${piece.sequenceId}`} className="font-semibold text-[#2E7C83] hover:underline">Read or edit the email{p.key === "quiet" ? "s" : ""}</Link>}
                    {piece.formId && <Link href="/contacts?tab=forms" className="font-semibold text-[#2E7C83] hover:underline">Read or edit the form</Link>}
                    {piece.formId && <a href={`/f/${piece.formId}`} target="_blank" rel="noreferrer" className="font-semibold text-[#2E7C83] hover:underline">Preview the form</a>}
                  </div>
                  {p.key === "quiet" && (
                    <div className="mt-4">
                      <label className={label} htmlFor="cc-booking">Booking link in the third quiet-client note</label>
                      <select id="cc-booking" className={input} value={d.booking ?? ""} disabled={busy === "booking"} onChange={(e) => void booking(e.target.value)}>
                        <option value="">No booking button (they reply instead)</option>
                        {(d.calendars ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.name}{c.active ? "" : " (off)"}</option>)}
                      </select>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
          {msg && <p className="text-sm text-[#8a2f2f]">{msg}</p>}
          <p className="text-xs text-[#7b6b8d]">Checks run once a day. Someone gets each email once (the quarterly pulse once a quarter), unsubscribed contacts are always skipped, and former clients never get the check-ins.</p>
        </>
      )}
    </div>
  );
}
