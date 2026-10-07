"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Mail, Pencil, UserPlus } from "lucide-react";

interface Person {
  id: string;
  email: string;
  name: string | null;
  subject: string;
  body: string;
  status: "draft" | "approved" | "sent";
  sent_result: string | null;
  sent_at: string | null;
  masterclassLink: string | null;
  hasAccount: boolean;
}

const box = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]";
const btn = "rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50";

async function api(body: Record<string, unknown>) {
  const r = await fetch("/api/new-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, d };
}

function Card({ p, copyTo, onChange }: { p: Person; copyTo: string; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(p.subject);
  const [body, setBody] = useState(p.body);
  const [html, setHtml] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const locked = p.status === "sent";

  const preview = useCallback(async () => {
    const { ok, d } = await api({ action: "preview", id: p.id });
    if (ok) setHtml(d.html);
  }, [p.id]);
  useEffect(() => {
    void preview();
  }, [preview, p.subject, p.body]);

  const run = async (fn: () => Promise<{ ok: boolean; d: Record<string, unknown> }>, done: string) => {
    setBusy(true);
    setMsg("");
    const { ok, d } = await fn();
    setBusy(false);
    setConfirm(false);
    setMsg(ok ? done : String(d.error || "That didn't work."));
    if (ok) onChange();
    return ok;
  };
  const first = (p.name || p.email).split(/\s+/)[0];
  const pill = { draft: "bg-[#c9a227]/20 text-[#6b5410]", approved: "bg-[#2c6b3f]/15 text-[#2c6b3f]", sent: "bg-[#2E7C83]/15 text-[#1d5a60]" }[p.status];

  return (
    <section className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 dark:bg-[#1a2b4a]/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{p.name || p.email}</h2>
          <p className="text-sm text-[#7a8a99]">{p.email} · stand-alone VIP account{p.masterclassLink ? <> · MasterClass link <span className="select-all">{p.masterclassLink}</span></> : ""}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pill}`}>{p.status === "draft" ? "Draft: needs your approval" : p.status === "approved" ? "Approved" : "Sent"}</span>
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">Subject<input className={`${box} mt-1`} value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">The email
            <textarea className={`${box} mt-1 font-mono leading-relaxed`} rows={Math.min(40, body.split("\n").length + 3)} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <p className="text-xs text-[#7a8a99]">Fill-ins: <code>{"{{greeting}}"}</code> becomes &ldquo;Hi {first},&rdquo; · <code>{"{{password_link}}"}</code> on a line of its own becomes their one-time password button · <code>{"{{masterclass_link}}"}</code> becomes their MasterClass link. **bold** makes bold text.</p>
          <div className="flex gap-2">
            <button disabled={busy} className={`${btn} bg-[#1a2b4a] text-[#F8F5F0] dark:bg-[#c9a227] dark:text-[#1a2b4a]`} onClick={async () => { if (await run(() => api({ action: "save", id: p.id, subject, body }), "Saved. Approve it when it reads right.")) setEditing(false); }}>Save changes</button>
            <button className={`${btn} border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]`} onClick={() => { setEditing(false); setSubject(p.subject); setBody(p.body); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">Subject</p>
          <p className="mb-3 text-[15px] font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{p.subject}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">What {first} will receive (the password button is a stand-in here)</p>
          <div className="mt-1 rounded-xl border border-[#1a2b4a]/10 bg-[#faf8f3] p-5 text-[#2E3A46]" dangerouslySetInnerHTML={{ __html: html }} />
          <p className="mt-2 text-xs text-[#7a8a99]">A copy always goes to {copyTo} as a hidden copy.</p>
        </div>
      )}

      {!editing && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!locked && <button disabled={busy} className={`${btn} border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]`} onClick={() => setEditing(true)}><Pencil className="mr-1 inline h-4 w-4" />Edit</button>}
          {p.status === "draft" && <button disabled={busy} className={`${btn} bg-[#2c6b3f] text-white`} onClick={() => run(() => api({ action: "approve", id: p.id }), "Approved.")}><CheckCircle2 className="mr-1 inline h-4 w-4" />Approve</button>}
          {p.status === "approved" && <button disabled={busy} className={`${btn} border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]`} onClick={() => run(() => api({ action: "unapprove", id: p.id }), "Back to draft.")}>Take back my approval</button>}
          {!locked && <button disabled={busy} className={`${btn} border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]`} onClick={() => run(() => api({ action: "test", id: p.id }), `A test was emailed to you only. ${p.name || p.email} received nothing.`)}><Mail className="mr-1 inline h-4 w-4" />Email me a test</button>}
          {p.status === "approved" && !confirm && <button disabled={busy} className={`${btn} bg-[#1a2b4a] text-[#F8F5F0] dark:bg-[#c9a227] dark:text-[#1a2b4a]`} onClick={() => setConfirm(true)}>Create account and email {first}</button>}
          {p.status === "approved" && confirm && (
            <>
              <button disabled={busy} className={`${btn} bg-[#8a2f2f] text-white`} onClick={() => run(() => api({ action: "send", id: p.id }), `Done. ${p.name || p.email}'s account is created and the email is on its way.`)}>{busy ? "Working…" : `Yes: create ${first}'s account and send now`}</button>
              <button className={`${btn} border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]`} onClick={() => setConfirm(false)}>Not yet</button>
            </>
          )}
          {p.status === "draft" && <button disabled={busy} className="ml-auto text-sm text-[#8a2f2f] underline" onClick={() => { if (window.confirm(`Remove ${p.name || p.email} from this page?`)) void run(() => api({ action: "remove", id: p.id }), "Removed."); }}>Remove</button>}
        </div>
      )}
      {p.status === "sent" && <p className="mt-3 text-sm text-[#2c6b3f]">Sent{p.sent_at ? ` ${new Date(p.sent_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` : ""}. Their account exists, and Day 1 of First 30 Days started when it was created.</p>}
      {p.status === "approved" && p.sent_result?.includes("did NOT") && <p className="mt-3 text-sm text-[#8a2f2f]">The account was created but the email did not send. Press the button again to resend it.</p>}
      {msg && <p role="status" className="mt-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{msg}</p>}
    </section>
  );
}

export default function NewClients() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [copyTo, setCopyTo] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    const d = await fetch("/api/new-accounts", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setPeople(d.people ?? []);
    setCopyTo(d.copyTo ?? "");
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="w-full px-4 py-8 sm:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">New Client Accounts</h1>
        <p className="mt-1 max-w-4xl text-[#7a8a99]">Each person&apos;s &ldquo;your account is ready&rdquo; email, to read, edit and approve. Nothing is created or sent until you approve it and press the send button. Creating the account starts Day 1 of their First 30 Days, so press it when they should begin.</p>
      </div>
      <div className="space-y-5">
        {people === null && <p className="text-sm text-[#7a8a99]">Loading…</p>}
        {people?.map((p) => <Card key={p.id + p.subject + p.body + p.status} p={p} copyTo={copyTo} onChange={load} />)}
        {people && !people.length && <p className="text-sm text-[#7a8a99]">No one yet. Add someone from your Contacts below.</p>}
      </div>
      <form
        className="mt-6 flex max-w-xl flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!email.trim()) return;
          const { ok, d } = await api({ action: "add", email });
          setMsg(ok ? "Added." : String(d.error || "That didn't work."));
          if (ok) {
            setEmail("");
            void load();
          }
        }}
      >
        <input className={`${box} flex-1`} type="email" placeholder="Add someone from Contacts by email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email of a contact" />
        <button className={`${btn} border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]`}><UserPlus className="mr-1 inline h-4 w-4" />Add</button>
        {msg && <p className="w-full text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{msg}</p>}
      </form>
    </div>
  );
}
