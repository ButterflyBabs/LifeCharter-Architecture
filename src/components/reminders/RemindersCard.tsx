"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, ChevronRight, Check, Plus } from "lucide-react";
import { isDue, whenWords } from "@/lib/reminders";
import { quickTimes, useReminders } from "./useReminders";

// Executive Home and Daily Compass: what is due now and what is coming up, with a one-line add.
export default function RemindersCard() {
  const { items, error, add, setDone, snooze } = useReminders();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const now = Date.now();
  const open = (items ?? []).filter((r) => r.status === "open");
  const due = open.filter((r) => isDue(r, now));
  const soon = open.filter((r) => !isDue(r, now)).slice(0, due.length ? 3 : 5);

  async function quickAdd(iso: string) {
    if (!title.trim() || busy) return;
    setBusy(true);
    const ok = await add(title.trim(), iso);
    setBusy(false);
    if (ok) setTitle("");
  }

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-gray-200/60 bg-[#FFFFFF] shadow-sm">
      <div className="flex items-center justify-between gap-2 px-6 pb-3 pt-5">
        <h3 className="flex items-center gap-2 font-serif text-base text-indigo-900">
          <BellRing className="h-4 w-4 text-[#c9a227]" aria-hidden /> Reminders
          {due.length > 0 && <span className="rounded-full bg-[#A4523C] px-2 py-0.5 text-[11px] font-semibold text-white">{due.length} due</span>}
        </h3>
        <Link href="/reminders" className="inline-flex items-center gap-0.5 text-xs font-medium text-[#2E7C83] hover:underline">
          All reminders <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="space-y-3 px-6 pb-5">
        {items === null ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <>
            {due.length === 0 && soon.length === 0 && <p className="text-sm text-gray-500">Nothing is waiting. Add the one-off things you must not forget, such as a trial that renews or a deadline.</p>}
            <ul className="space-y-2">
              {due.map((r) => (
                <li key={r.id} className="flex items-start gap-2 rounded-lg border border-[#A4523C]/30 bg-[#A4523C]/5 px-2.5 py-2">
                  <button onClick={() => void setDone(r.id, true)} className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#A4523C] text-[#A4523C] hover:bg-[#A4523C] hover:text-white" aria-label={`Mark done: ${r.title}`}><Check className="h-3.5 w-3.5" /></button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-indigo-900">{r.title}</p>
                    <p className="text-xs text-[#8a2f2f]">{whenWords(r.remind_at, now)}</p>
                    <div className="mt-1 flex gap-3 text-[11px] font-medium text-[#2E7C83]">
                      <button className="hover:underline" onClick={() => void snooze(r.id, 60)}>1 hour</button>
                      <button className="hover:underline" onClick={() => void snooze(r.id, 60 * 24)}>Tomorrow</button>
                    </div>
                  </div>
                </li>
              ))}
              {soon.map((r) => (
                <li key={r.id} className="flex items-start gap-2 px-1">
                  <button onClick={() => void setDone(r.id, true)} className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-300 text-transparent hover:border-[#2c6b3f] hover:text-[#2c6b3f]" aria-label={`Mark done: ${r.title}`}><Check className="h-3.5 w-3.5" /></button>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-indigo-900">{r.title}</p>
                    <p className="text-xs text-gray-500">{whenWords(r.remind_at, now)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-100 pt-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Remind me to…"
                maxLength={200}
                aria-label="What should the reminder say?"
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm"
              />
              {title.trim() && (
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="When">
                  {quickTimes().slice(0, 4).map((q) => (
                    <button key={q.label} disabled={busy} onClick={() => void quickAdd(q.iso)} className="inline-flex items-center gap-1 rounded-full border border-[#2E7C83]/40 px-2.5 py-1 text-xs font-medium text-[#2E7C83] hover:bg-[#2E7C83]/5 disabled:opacity-50">
                      <Plus className="h-3 w-3" aria-hidden />{q.label}
                    </button>
                  ))}
                  <Link href={`/reminders?new=${encodeURIComponent(title.trim())}`} className="rounded-full px-2.5 py-1 text-xs font-medium text-gray-500 hover:underline">Pick a date and time</Link>
                </div>
              )}
              {error && <p className="mt-1 text-xs text-[#8a2f2f]">{error}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
