"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import ContactLookupInput, { lookupName } from "@/components/crm/ContactLookupInput";

type Tpl = { event_key: string; kind: string; subject: string; active: boolean };
type Ev = { event_key: string; templates: Tpl[]; live?: boolean };

const EVENT_NAME: Record<string, string> = { masterclass: "Command Shift MasterClass", incubator: "LifeCharter Incubator", "founders-half-hour": "Founder's Half Hour" };
const KIND_NAME: Record<string, string> = { confirm: "Confirmation (right after they register)", day_before: "Reminder (the day before)", hour_before: "Reminder (one hour before)" };
const KINDS = ["confirm", "day_before", "hour_before"];

// The confirmation and reminder emails for the Zoom events (MasterClass, Incubator). They live here with
// the other emails, but they are sent by their own engine: each goes out on the event's clock (right
// after registering, the day before, one hour before) and carries the person's own Zoom join link.
export default function EventEmailsTab() {
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  // Resend one email to one registrant: which email, and the person lookup, per event.
  const [rsKind, setRsKind] = useState<Record<string, string>>({});
  const [rsQ, setRsQ] = useState<Record<string, string>>({});
  const [rsMsg, setRsMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/event-emails", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setEvents(Array.isArray(d?.events) ? d.events : []))
      .catch(() => setEvents([]));
  }, []);

  async function test(event: string, kind: string) {
    const key = `${event}:${kind}`;
    setBusy(key);
    try {
      const r = await fetch("/api/event-emails/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event_key: event, kind }) });
      const d = await r.json().catch(() => ({}));
      setMsg((m) => ({ ...m, [key]: r.ok ? `Sent to ${d.to}` : d.error || "Couldn't send." }));
    } finally {
      setBusy(null);
    }
  }

  async function resend(event: string, email: string, label: string) {
    const kind = rsKind[event] || "confirm";
    setBusy(`rs:${event}`);
    setRsMsg((m) => ({ ...m, [event]: "" }));
    try {
      const r = await fetch("/api/event-emails/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event_key: event, kind, email }) });
      const d = await r.json().catch(() => ({}));
      setRsMsg((m) => ({ ...m, [event]: r.ok ? `Sent "${d.subject}" to ${label}.` : d.error || "Couldn't send." }));
      if (r.ok) setRsQ((q) => ({ ...q, [event]: "" }));
    } finally {
      setBusy(null);
    }
  }

  async function testAll(event: string) {
    for (const k of KINDS) await test(event, k);
  }

  return (
    <div>
      <p className="text-[#7a8a99] mb-6">Send yourself a test of any email; each arrives with &quot;[Test]&quot; in the subject, a sample join link and the next session&apos;s real date and time.</p>
      {!events ? (
        <p className="text-sm text-[#7a8a99]">Loading…</p>
      ) : (
        ["masterclass", "incubator", "founders-half-hour"].map((ev) => {
          const e = events.find((x) => x.event_key === ev);
          const live = Boolean(e?.live);
          return (
            <section key={ev} className="mb-8 rounded-xl border border-[#1a2b4a]/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{EVENT_NAME[ev]}</h2>
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${live ? "bg-[#2E7C83]/10 text-[#1F5E63]" : "bg-[#c9a227]/15 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>{live ? "Sending to new registrants" : "Not switched on yet"}</span>
              </div>
              <ul className="space-y-3">
                {KINDS.map((k) => {
                  const t = e?.templates?.find((x) => x.kind === k);
                  const key = `${ev}:${k}`;
                  return (
                    <li key={k} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1a2b4a]/10 pt-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{KIND_NAME[k]}</p>
                        <p className="text-sm text-[#5a6472] truncate">{t?.subject || "No email yet"}</p>
                        {msg[key] && <p className="text-xs text-[#2E7C83] mt-0.5" aria-live="polite">{msg[key]}</p>}
                      </div>
                      <Button variant="outline" size="sm" disabled={!t || busy !== null} onClick={() => test(ev, k)}>{busy === key ? "Sending…" : "Send me a test"}</Button>
                    </li>
                  );
                })}
              </ul>
              <Button className="mt-4" disabled={busy !== null} onClick={() => testAll(ev)}>Send me all three</Button>
              <div className="mt-6 border-t border-[#1a2b4a]/10 pt-4 space-y-2">
                <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Resend one of these to one person</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <select
                    aria-label="Which email"
                    value={rsKind[ev] || "confirm"}
                    onChange={(x) => setRsKind((k) => ({ ...k, [ev]: x.target.value }))}
                    className="rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm dark:bg-[#1a2b4a]/20 sm:max-w-xs"
                  >
                    {KINDS.map((k) => <option key={k} value={k}>{KIND_NAME[k]}</option>)}
                  </select>
                  <div className="min-w-0 flex-1">
                    <ContactLookupInput
                      value={rsQ[ev] || ""}
                      onChange={(v) => setRsQ((q) => ({ ...q, [ev]: v }))}
                      onPick={(c) => void resend(ev, c.email, `${lookupName(c)} (${c.email})`)}
                      placeholder="Type a name or email…"
                      pickLabel="Send"
                      className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm dark:bg-[#1a2b4a]/20"
                    />
                  </div>
                </div>
                <p className="text-xs text-[#7a8a99]">It goes now, with their own Zoom join link and their session&apos;s date and time. The automatic schedule is not changed. They must have registered for this event.</p>
                {rsMsg[ev] && <p className="text-sm text-[#1F5E63]" role="status" aria-live="polite">{rsMsg[ev]}</p>}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
