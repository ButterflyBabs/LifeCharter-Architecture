"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, Circle, Mail, Search } from "lucide-react";

type Stage = "not_started" | "in_progress" | "assessments_done" | "invited" | "booked" | "held";
interface Row {
  planId: string;
  name: string;
  email: string;
  joinedAt: string;
  brain: boolean;
  soul: boolean;
  profit: boolean;
  allDone: boolean;
  lastAnswered: string | null;
  inviteSentAt: string | null;
  booking: { startAt: string; status: string } | null;
  review: "open" | "done" | null;
  stage: Stage;
}

const STAGES: { id: Stage; label: string; tone: string }[] = [
  { id: "not_started", label: "Not started", tone: "bg-[#1a2b4a]/10 text-[#1a2b4a] dark:text-[#F8F5F0]" },
  { id: "in_progress", label: "Assessments in progress", tone: "bg-[#c9a227]/20 text-[#7a5a12] dark:text-[#e8c766]" },
  { id: "assessments_done", label: "Assessments done, invite pending", tone: "bg-[#2E7C83]/15 text-[#1f5a60] dark:text-[#7fd0d6]" },
  { id: "invited", label: "Invited, not booked", tone: "bg-[#c0632f]/15 text-[#8a3f14] dark:text-[#f0a878]" },
  { id: "booked", label: "Call booked", tone: "bg-[#2c6b3f]/15 text-[#1f4d2d] dark:text-[#8fd6a5]" },
  { id: "held", label: "Call held", tone: "bg-[#2c6b3f]/25 text-[#1f4d2d] dark:text-[#8fd6a5]" },
];
const stageOf = (s: Stage) => STAGES.find((x) => x.id === s)!;
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function Tick({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${on ? "text-[#2c6b3f] dark:text-[#8fd6a5]" : "text-[#b8a898]"}`}>
      {on ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Circle className="h-4 w-4" aria-hidden />}
      {label}
    </span>
  );
}

export default function ClientJourney() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<Stage | "">("");

  useEffect(() => {
    fetch("/api/client-journey", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Couldn't load."))))
      .then((d) => setRows(d.clients ?? []))
      .catch(() => setError("Couldn't load the client list. Refresh to try again."));
  }, []);

  const counts = useMemo(() => {
    const r = rows ?? [];
    return {
      total: r.length,
      done: r.filter((x) => x.allDone).length,
      invited: r.filter((x) => x.inviteSentAt).length,
      booked: r.filter((x) => x.stage === "booked" || x.stage === "held").length,
    };
  }, [rows]);

  const shown = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => (!stage || r.stage === stage) && (!ql || `${r.name} ${r.email}`.toLowerCase().includes(ql)));
  }, [rows, q, stage]);

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-serif text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">New Client Journey</h1>
      <p className="mt-1 max-w-3xl text-sm text-[#7a8a99] dark:text-[#b8c2cf]">
        Where each client is between joining and their Next Chapter Call with you: the three assessments, the invitation email, the booking, and your results review.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Clients", n: counts.total },
          { label: "All three assessments done", n: counts.done },
          { label: "Invitation sent", n: counts.invited },
          { label: "Call booked or held", n: counts.booked },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/40">
            <p className="text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{rows ? t.n : "…"}</p>
            <p className="text-xs text-[#7a8a99] dark:text-[#b8c2cf]">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="relative">
          <span className="sr-only">Search clients</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b8a898]" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email"
            className="w-64 rounded-full border border-[#1a2b4a]/15 bg-white py-2 pl-9 pr-3 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/40 dark:text-[#F8F5F0]"
          />
        </label>
        <label className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
          <span className="sr-only">Stage</span>
          <select value={stage} onChange={(e) => setStage(e.target.value as Stage | "")} className="rounded-lg border border-[#1a2b4a]/15 bg-white px-3 py-2 text-sm dark:bg-[#1a2b4a]/40">
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-[#c0632f]">{error}</p>}
      {!rows && !error && <p className="mt-6 text-sm text-[#7a8a99]">Loading…</p>}
      {rows && shown.length === 0 && <p className="mt-6 text-sm text-[#7a8a99]">No clients match.</p>}

      {rows && shown.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#1a2b4a]/10 text-xs uppercase tracking-wide text-[#7a8a99]">
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Assessments</th>
                <th className="px-4 py-3 font-semibold">Invitation</th>
                <th className="px-4 py-3 font-semibold">Next Chapter Call</th>
                <th className="px-4 py-3 font-semibold">Your review</th>
                <th className="px-4 py-3 font-semibold">Stage</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.planId} className="border-b border-[#1a2b4a]/5 align-top last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{r.name}</p>
                    <p className="text-xs text-[#7a8a99] dark:text-[#b8c2cf]">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{day(r.joinedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <Tick on={r.brain} label="Brain" />
                      <Tick on={r.soul} label="Soul" />
                      <Tick on={r.profit} label="Profit" />
                    </div>
                    {r.lastAnswered && <p className="mt-1 text-xs text-[#7a8a99]">Last answered {day(r.lastAnswered)}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {r.inviteSentAt ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#1a2b4a] dark:text-[#F8F5F0]">
                        <Mail className="h-4 w-4" aria-hidden /> Sent {day(r.inviteSentAt)}
                      </span>
                    ) : (
                      <span className="text-xs text-[#b8a898]">{r.allDone ? "Goes out within the hour" : "Not yet"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.booking ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#1a2b4a] dark:text-[#F8F5F0]">
                        <CalendarCheck className="h-4 w-4" aria-hidden />
                        {when(r.booking.startAt)}
                        {(r.booking.status === "canceled" || r.booking.status === "cancelled") && <span className="text-[#c0632f]"> (canceled)</span>}
                      </span>
                    ) : (
                      <span className="text-xs text-[#b8a898]">Not booked</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#1a2b4a] dark:text-[#F8F5F0]">{r.review === "done" ? "Done" : r.review === "open" ? "On your task list" : <span className="text-[#b8a898]">Not yet</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${stageOf(r.stage).tone}`}>{stageOf(r.stage).label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
