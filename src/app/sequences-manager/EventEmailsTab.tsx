"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

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
            </section>
          );
        })
      )}
    </div>
  );
}
