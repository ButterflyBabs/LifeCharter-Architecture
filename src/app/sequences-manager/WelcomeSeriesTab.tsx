"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Clock, MinusCircle } from "lucide-react";

type Cell = { state: "sent" | "due" | "skipped" | "waiting" | "missed"; at?: string; note?: string };
interface Data {
  enabled: boolean;
  emails: { key: string; day: number; subject: string; sent: number; rule: string }[];
  clients: { id: string; name: string; email: string; joined: string; day: number; setup: { ai: boolean; assessments: boolean; tools: boolean; website: boolean } | null; cells: Record<string, Cell> }[];
  recent: { userId: string; key: string; at: string; name: string | null; email: string | null }[];
}

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40 p-5";

function CellView({ c }: { c: Cell }) {
  if (c.state === "sent") return <span className="inline-flex items-center gap-1 text-[#2c6b3f]"><CheckCircle2 className="h-3.5 w-3.5" /> {c.at ? day(c.at) : "Sent"}</span>;
  if (c.state === "due") return <span title={c.note} className="inline-flex items-center gap-1 font-semibold text-[#2E7C83]"><Clock className="h-3.5 w-3.5" /> Due</span>;
  if (c.state === "skipped") return <span title={c.note} className="inline-flex items-center gap-1 text-[#6b5410]"><MinusCircle className="h-3.5 w-3.5" /> Skipped</span>;
  if (c.state === "missed") return <span title={c.note} className="inline-flex items-center gap-1 text-[#b3422f]"><CircleAlert className="h-3.5 w-3.5" /> Missed</span>;
  return <span className="text-[#7a8a99]" title={c.note}>{c.note || "Waiting"}</span>;
}

// Monitoring for the new-client welcome series: is it on, what has gone out, what is waiting,
// and what was skipped (and why). Read-only. Babs's account only.
export default function WelcomeSeriesTab() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/crm/welcome-series", { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "Couldn't load the welcome series.");
        setD(j as Data);
      })
      .catch((e) => setErr((e as Error).message));
  }, []);

  if (err) return <p className="rounded-xl bg-[#b06a5a]/10 p-4 text-sm text-[#8a2f2f]">{err}</p>;
  if (!d) return <p className="text-sm text-[#7a8a99]">Loading…</p>;

  return (
    <div className="space-y-5">
      <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <p className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">New-client welcome series</p>
          <p className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">Six emails to every new Command Suite client: the day they join, then Day 1, 3, 5, 10 and 14. It goes out from the 9 am Mountain run each morning, and no email ever goes out twice.</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${d.enabled ? "bg-[#2c6b3f]/15 text-[#2c6b3f]" : "bg-[#c9a227]/20 text-[#6b5410]"}`}>{d.enabled ? "Sending is on" : "Sending is off"}</span>
      </div>
      {!d.enabled && <p className="rounded-xl bg-[#c9a227]/15 px-4 py-3 text-sm text-[#6b5410]">Nothing is being sent yet. The series stays off until you approve the copy and it is switched on, so the &ldquo;Due&rdquo; marks below are what would go out.</p>}

      <div className={card}>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#7a8a99]">The emails</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-[#7a8a99]"><th className="py-2 pr-3 font-medium">When</th><th className="py-2 pr-3 font-medium">Subject</th><th className="py-2 pr-3 font-medium">Rule</th><th className="py-2 text-right font-medium">Sent</th></tr></thead>
            <tbody>
              {d.emails.map((e) => (
                <tr key={e.key} className="border-t border-[#1a2b4a]/10 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{e.day === 0 ? "Day of joining" : `Day ${e.day}`}</td>
                  <td className="py-2 pr-3">{e.subject}</td>
                  <td className="py-2 pr-3 text-[#5a6472] dark:text-[#b8c2cf]">{e.rule}</td>
                  <td className="py-2 text-right tabular-nums">{e.sent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={card}>
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-[#7a8a99]">Clients who joined in the last 30 days</p>
        <p className="mb-3 text-xs text-[#7a8a99]">Skipped means they had already done what the email asks for, so the nudge was not sent. Hover a mark for the reason.</p>
        {d.clients.length === 0 ? (
          <p className="text-sm text-[#7a8a99]">No new clients in the last 30 days.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#7a8a99]">
                  <th className="py-2 pr-3 font-medium">Client</th><th className="py-2 pr-3 font-medium">Joined</th><th className="py-2 pr-3 font-medium">Setup</th>
                  {d.emails.map((e) => <th key={e.key} className="py-2 pr-3 font-medium whitespace-nowrap">{e.day === 0 ? "Welcome" : `Day ${e.day}`}</th>)}
                </tr>
              </thead>
              <tbody>
                {d.clients.map((c) => (
                  <tr key={c.id} className="border-t border-[#1a2b4a]/10 align-top">
                    <td className="py-2 pr-3"><span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{c.name}</span><br /><span className="text-xs text-[#7a8a99]">{c.email}</span></td>
                    <td className="py-2 pr-3 whitespace-nowrap">{day(c.joined)}<br /><span className="text-xs text-[#7a8a99]">day {c.day}</span></td>
                    <td className="py-2 pr-3 text-xs">
                      {c.setup ? (
                        <>
                          <span className={c.setup.ai ? "text-[#2c6b3f]" : "text-[#7a8a99]"}>AI {c.setup.ai ? "✓" : "–"}</span>{" "}
                          <span className={c.setup.assessments ? "text-[#2c6b3f]" : "text-[#7a8a99]"}>Assessments {c.setup.assessments ? "✓" : "–"}</span>{" "}
                          <span className={c.setup.tools ? "text-[#2c6b3f]" : "text-[#7a8a99]"}>Tool {c.setup.tools ? "✓" : "–"}</span>{" "}
                          <span className={c.setup.website ? "text-[#2c6b3f]" : "text-[#7a8a99]"}>Website {c.setup.website ? "✓" : "–"}</span>
                        </>
                      ) : "n/a"}
                    </td>
                    {d.emails.map((e) => <td key={e.key} className="py-2 pr-3 whitespace-nowrap"><CellView c={c.cells[e.key]} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={card}>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#7a8a99]">Latest sends</p>
        {d.recent.length === 0 ? (
          <p className="text-sm text-[#7a8a99]">Nothing has been sent yet.</p>
        ) : (
          <ul className="divide-y divide-[#1a2b4a]/10 text-sm">
            {d.recent.map((r, i) => (
              <li key={`${r.userId}-${r.key}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <span><b className="text-[#1a2b4a] dark:text-[#F8F5F0]">{r.name || r.email || "A client"}</b> got <i>{d.emails.find((e) => e.key === r.key)?.subject || r.key}</i></span>
                <span className="text-xs text-[#7a8a99]">{when(r.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
