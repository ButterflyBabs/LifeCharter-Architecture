"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, ChevronDown, CircleAlert, Pencil } from "lucide-react";

interface Bcast { id: string; name: string; subject: string; preview: string | null; body: string; status: string; scheduled_at: string | null; recipient_count: number; sent: number; failed: number }
interface Step { id: string; sequence_id: string; position: number; subject: string; preview: string | null; body: string }
interface Seq { id: string; key: string; name: string; active: boolean; description: string | null; steps: Step[] }
interface Data { broadcasts: Bcast[]; sequences: Seq[]; registrants: { count: number; recent: { first_name: string | null; last_name: string | null; email: string; tags: string[]; created_at: string }[] }; audienceTag: string }

const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/30 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-[#1a2b4a]/20 px-3.5 py-1.5 text-xs font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5 disabled:opacity-50";
const btnPrimary = "inline-flex items-center gap-1.5 rounded-full bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-[#F8F5F0] hover:opacity-90 disabled:opacity-50";
const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40";
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Denver" });
const placeholder = (t: string) => /\[UPDATE BEFORE SENDING|\[[A-Z][A-Z0-9 :,'.-]{3,}\]/.test(t);

async function post(body: Record<string, unknown>): Promise<{ ok?: boolean; error?: string }> {
  const r = await fetch("/api/lbd-summit-emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({ error: "Something went wrong." }));
}

// Life by Design Summit: the Summit's emails in one place (like LCCS New Client Welcome): what each says, when it
// goes out, what is held and why, and who has registered. Babs's account only.
export default function LbdSummitTab() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    fetch("/api/lbd-summit-emails", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then(setD)
      .catch(() => setErr("Couldn't load. Refresh to try again."));
  }, []);
  useEffect(load, [load]);

  if (err) return <p className="text-sm text-[#b3422f]">{err}</p>;
  if (!d) return <p className="text-sm text-[#7a8a99]">Loading…</p>;
  const scheduled = d.broadcasts.filter((b) => b.status === "scheduled").length;
  const held = d.broadcasts.filter((b) => b.status === "draft").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`${card} p-4`}>
          <p className="text-xs uppercase tracking-wide text-[#7a8a99]">Registered</p>
          <p className="mt-1 text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{d.registrants.count}</p>
          <p className="text-xs text-[#7a8a99]">tagged {d.audienceTag}</p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-xs uppercase tracking-wide text-[#7a8a99]">Nurture emails</p>
          <p className="mt-1 text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{scheduled} <span className="text-base font-medium text-[#7a8a99]">scheduled</span></p>
          <p className="text-xs text-[#7a8a99]">{held} held as drafts</p>
        </div>
        <div className={`${card} p-4`}>
          <p className="text-xs uppercase tracking-wide text-[#7a8a99]">The event</p>
          <p className="mt-1 text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">April 15, 16 &amp; 17, 2027</p>
          <p className="text-xs text-[#7a8a99]">9am to 2pm Mountain · free · online</p>
        </div>
      </div>
      {msg && <button onClick={() => setMsg("")} className="block w-full rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-left text-sm">{msg}</button>}

      <section>
        <h2 className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Pre-Summit nurture emails</h2>
        <p className="text-sm text-[#7a8a99]">Ten emails to everyone registered, every 3 days, 9am Mountain. Open one to read it, edit it, or change its date.</p>
        <div className="mt-3 space-y-2">
          {d.broadcasts.map((b) => (
            <BroadcastRow key={b.id} b={b} open={open === b.id} toggle={() => setOpen(open === b.id ? "" : b.id)} done={(m) => { setMsg(m); load(); }} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Registration confirmations</h2>
        <p className="text-sm text-[#7a8a99]">Sent right after someone registers. Off until the links are added and they are attached to the registration form.</p>
        <div className="mt-3 space-y-2">
          {d.sequences.flatMap((s) => s.steps.map((st) => <StepRow key={st.id} seq={s} st={st} open={open === st.id} toggle={() => setOpen(open === st.id ? "" : st.id)} done={(m) => { setMsg(m); load(); }} />))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Who has registered</h2>
        {d.registrants.recent.length === 0 ? (
          <p className="mt-2 text-sm text-[#7a8a99]">Nobody yet. Registrations from amilynnecarroll.com/life-by-design-summit land here.</p>
        ) : (
          <ul className={`${card} mt-2 divide-y divide-[#1a2b4a]/10`}>
            {d.registrants.recent.map((r) => (
              <li key={r.email} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
                <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{[r.first_name, r.last_name].filter(Boolean).join(" ") || r.email}</span>
                <span className="text-[#7a8a99]">{r.email}</span>
                <span className="ml-auto text-xs text-[#7a8a99]">{new Date(r.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Status({ b }: { b: Bcast }) {
  if (b.status === "scheduled") return <span className="inline-flex items-center gap-1 rounded-full bg-[#2c6b3f]/15 px-2.5 py-1 text-xs font-semibold text-[#1f5a33] dark:text-[#8fd3a0]"><CheckCircle2 className="h-3.5 w-3.5" /> Scheduled</span>;
  if (b.status === "draft") return <span className="inline-flex items-center gap-1 rounded-full bg-[#c9a227]/25 px-2.5 py-1 text-xs font-semibold text-[#7a5a0e] dark:text-[#e0c35a]"><CircleAlert className="h-3.5 w-3.5" /> Held (draft)</span>;
  return <span className="rounded-full bg-[#1a2b4a]/10 px-2.5 py-1 text-xs font-semibold capitalize text-[#1a2b4a] dark:text-[#F8F5F0]">{b.status}</span>;
}

function Editor({ subject, preview, body, onSave, busy, lock }: { subject: string; preview: string; body: string; onSave: (v: { subject: string; preview: string; body: string }) => void; busy: boolean; lock?: boolean }) {
  const [f, setF] = useState({ subject, preview, body });
  useEffect(() => setF({ subject, preview, body }), [subject, preview, body]);
  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-[#7a8a99]">Subject<input className={`${field} mt-1`} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} disabled={lock} /></label>
      <label className="block text-xs font-medium text-[#7a8a99]">Preview text (optional)<input className={`${field} mt-1`} value={f.preview} onChange={(e) => setF({ ...f, preview: e.target.value })} disabled={lock} /></label>
      <label className="block text-xs font-medium text-[#7a8a99]">Email<textarea className={`${field} mt-1 min-h-[22rem] font-sans leading-relaxed`} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} disabled={lock} /></label>
      {placeholder(f.subject + f.body) && <p className="rounded-lg bg-[#c9a227]/15 px-3 py-2 text-xs text-[#7a5a0e] dark:text-[#e0c35a]">There is a [PLACEHOLDER] or an UPDATE BEFORE SENDING note in this email. It can&rsquo;t go out until that is fixed.</p>}
      {!lock && <button className={btnPrimary} disabled={busy} onClick={() => onSave(f)}><Pencil className="h-4 w-4" /> {busy ? "Saving…" : "Save changes"}</button>}
    </div>
  );
}

function BroadcastRow({ b, open, toggle, done }: { b: Bcast; open: boolean; toggle: () => void; done: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const gone = b.status !== "draft" && b.status !== "scheduled";
  const run = async (body: Record<string, unknown>, ok: string) => {
    setBusy(true);
    const r = await post({ id: b.id, ...body });
    setBusy(false);
    done(r.error ? r.error : ok);
  };
  return (
    <section className={`${card} overflow-hidden`}>
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left">
        <span className="min-w-0 flex-1 basis-64">
          <span className="block font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{b.subject}</span>
          <span className="block text-xs text-[#7a8a99]">{b.name.replace(/^LBD APR 15 - /, "").replace(/^DRAFT · LBD APR 15 - /, "")}</span>
        </span>
        <Status b={b} />
        <span className="inline-flex items-center gap-1 text-xs text-[#7a8a99]"><CalendarClock className="h-3.5 w-3.5" /> {b.scheduled_at ? when(b.scheduled_at) : "No date yet"}</span>
        {gone && <span className="text-xs text-[#7a8a99]">{b.sent} sent{b.failed ? `, ${b.failed} failed` : ""}</span>}
        <ChevronDown className={`h-4 w-4 text-[#7a8a99] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="space-y-4 border-t border-[#1a2b4a]/10 px-4 py-4">
          <Editor subject={b.subject} preview={b.preview ?? ""} body={b.body} lock={gone} busy={busy} onSave={(v) => run({ action: "save", ...v }, "Saved.")} />
          {!gone && (
            <div className="flex flex-wrap items-end gap-3 border-t border-[#1a2b4a]/10 pt-4">
              <label className="text-xs font-medium text-[#7a8a99]">Send on<input type="date" className={`${field} mt-1 w-44`} value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <label className="text-xs font-medium text-[#7a8a99]">At (Mountain)<input type="time" className={`${field} mt-1 w-32`} value={time} onChange={(e) => setTime(e.target.value)} /></label>
              <button className={btn} disabled={busy || !date} onClick={() => run({ action: "schedule", date, time }, "Scheduled.")}>{b.status === "scheduled" ? "Change date" : "Schedule it"}</button>
              {b.status === "scheduled" && <button className={btn} disabled={busy} onClick={() => run({ action: "unschedule" }, "Held as a draft. It will not go out.")}>Hold it (back to draft)</button>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function StepRow({ seq, st, open, toggle, done }: { seq: Seq; st: Step; open: boolean; toggle: () => void; done: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <section className={`${card} overflow-hidden`}>
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left">
        <span className="min-w-0 flex-1 basis-64">
          <span className="block font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{st.subject}</span>
          <span className="block text-xs text-[#7a8a99]">{seq.name.replace(/^DRAFT · /, "")}</span>
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${seq.active ? "bg-[#2c6b3f]/15 text-[#1f5a33] dark:text-[#8fd3a0]" : "bg-[#c9a227]/25 text-[#7a5a0e] dark:text-[#e0c35a]"}`}>{seq.active ? "On" : "Off"}</span>
        <ChevronDown className={`h-4 w-4 text-[#7a8a99] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="border-t border-[#1a2b4a]/10 px-4 py-4">
          <Editor
            subject={st.subject}
            preview={st.preview ?? ""}
            body={st.body}
            busy={busy}
            onSave={async (v) => {
              setBusy(true);
              const r = await post({ action: "save_step", id: st.id, ...v });
              setBusy(false);
              done(r.error ? r.error : "Saved.");
            }}
          />
          <p className="mt-3 text-xs text-[#7a8a99]">Turn it on, or attach it to the registration form, from the Campaigns tab once the links are in.</p>
        </div>
      )}
    </section>
  );
}
