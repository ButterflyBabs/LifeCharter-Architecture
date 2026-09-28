"use client";

import { useEffect, useMemo, useState } from "react";

// Pick a day, then a time, shown in the visitor's own time zone.
export default function SlotPicker({ slug, tz, onPick, onMeta }: { slug: string; tz: string; onPick: (iso: string) => void; onMeta?: (m: Record<string, unknown>) => void }) {
  const [week, setWeek] = useState(0);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [err, setErr] = useState("");
  const [day, setDay] = useState("");

  useEffect(() => {
    setSlots(null);
    setErr("");
    const from = new Date(Date.now() + week * 14 * 86_400_000);
    const to = new Date(from.getTime() + 14 * 86_400_000);
    fetch(`/api/book/${slug}?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr(d.error);
        setSlots(d.slots ?? []);
        if (d.calendar && onMeta) onMeta(d.calendar);
      })
      .catch(() => setErr("Couldn't load times. Please refresh."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, week]);

  const byDay = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of slots ?? []) {
      const k = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(s));
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [slots, tz]);
  useEffect(() => {
    if (!day || !byDay.has(day)) setDay(Array.from(byDay.keys())[0] ?? "");
  }, [byDay, day]);

  const dayLabel = (k: string) => new Date(`${k}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
  const time = (s: string) => new Date(s).toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button disabled={week === 0} onClick={() => setWeek((w) => w - 1)} className="text-sm text-[#2E7C83] disabled:text-[#c3c8ce]">← Earlier</button>
        <span className="text-xs text-[#7a8a99]">Times in {tz.replace(/_/g, " ")}</span>
        <button disabled={week >= 3} onClick={() => setWeek((w) => w + 1)} className="text-sm text-[#2E7C83] disabled:text-[#c3c8ce]">Later →</button>
      </div>
      {err && <p className="text-sm text-[#8a2f2f]">{err}</p>}
      {slots === null && !err && <p className="text-sm text-[#7a8a99]">Finding open times…</p>}
      {slots && !slots.length && !err && <p className="text-sm text-[#56616E]">No open times in these two weeks. Try later dates.</p>}
      {byDay.size > 0 && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from(byDay.keys()).map((k) => (
              <button key={k} onClick={() => setDay(k)} className={`shrink-0 rounded-xl border px-3 py-2 text-sm ${k === day ? "border-[#2E7C83] bg-[#2E7C83] text-white" : "border-[#EADFCF] bg-white text-[#1F2B3A] hover:border-[#2E7C83]"}`}>
                {dayLabel(k)}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {(byDay.get(day) ?? []).map((s) => (
              <button key={s} onClick={() => onPick(s)} className="rounded-lg border border-[#2E7C83]/40 bg-white px-2 py-2 text-sm font-medium text-[#1F5E63] hover:bg-[#2E7C83] hover:text-white">
                {time(s)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
