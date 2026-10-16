"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Pick a day on a month calendar, then a time, shown in the visitor's own time zone. Colors come from the CSS
// variables --bk-accent, --bk-accent-ink, --bk-tint and --bk-line set by the page that holds it (neutral teal by
// default), so a house brand or a client's own page can wear its own colors.
const dayKey = (d: Date, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export default function SlotPicker({ slug, tz, onPick, onMeta }: { slug: string; tz: string; onPick: (iso: string) => void; onMeta?: (m: Record<string, unknown>) => void }) {
  const todayKey = dayKey(new Date(), tz);
  const [month, setMonth] = useState(() => todayKey.slice(0, 7)); // YYYY-MM being shown
  const [slots, setSlots] = useState<string[] | null>(null);
  const [err, setErr] = useState("");
  const [day, setDay] = useState("");
  const [maxAhead, setMaxAhead] = useState(60);

  useEffect(() => {
    setSlots(null);
    setErr("");
    const [y, m] = month.split("-").map(Number);
    // The whole visible month, never earlier than now (the server allows up to 45 days at a time).
    const first = new Date(Date.UTC(y, m - 1, 1) - 14 * 3600_000);
    const from = new Date(Math.max(Date.now(), first.getTime()));
    const to = new Date(Date.UTC(y, m, 1) + 14 * 3600_000);
    fetch(`/api/book/${slug}?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr(d.error);
        setSlots(d.slots ?? []);
        if (typeof d.calendar?.maxDaysAhead === "number") setMaxAhead(d.calendar.maxDaysAhead);
        if (d.calendar && onMeta) onMeta(d.calendar);
      })
      .catch(() => setErr("Couldn't load times. Please refresh."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, month]);

  const byDay = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of slots ?? []) {
      const k = dayKey(new Date(s), tz);
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [slots, tz]);

  // When a month opens, select its first open day.
  useEffect(() => {
    if (slots === null) return;
    if (!day || !byDay.has(day)) setDay(Array.from(byDay.keys()).sort()[0] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byDay]);

  const [y, m] = month.split("-").map(Number);
  const monthLabel = new Date(Date.UTC(y, m - 1, 1, 12)).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" });
  const firstDow = new Date(Date.UTC(y, m - 1, 1, 12)).getUTCDay();
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysIn }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];
  const thisMonth = todayKey.slice(0, 7);
  const lastMonth = dayKey(new Date(Date.now() + maxAhead * 86_400_000), tz).slice(0, 7);
  const shift = (n: number) => {
    const d = new Date(Date.UTC(y, m - 1 + n, 1, 12));
    setDay("");
    setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  };
  const time = (s: string) => new Date(s).toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" });
  const longDay = (k: string) => new Date(`${k}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
      <div>
        <div className="flex items-center justify-between border-y py-3" style={{ borderColor: "var(--bk-line, #e3dccd)" }}>
          <button type="button" onClick={() => { setDay(""); setMonth(thisMonth); }} className="rounded-full border px-4 py-1.5 text-sm font-semibold" style={{ borderColor: "var(--bk-line, #e3dccd)" }}>Today</button>
          <h2 className="text-base font-semibold">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Previous month" disabled={month <= thisMonth} onClick={() => shift(-1)} className="rounded-full p-1.5 disabled:opacity-25"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" aria-label="Next month" disabled={month >= lastMonth} onClick={() => shift(1)} className="rounded-full p-1.5 disabled:opacity-25"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 text-center text-xs font-medium opacity-60">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {cells.map((k, i) => {
            if (!k) return <div key={`b${i}`} />;
            const open = byDay.has(k);
            const sel = k === day;
            const today = k === todayKey;
            return (
              <div key={k} className="flex justify-center">
                <button
                  type="button"
                  disabled={!open}
                  onClick={() => setDay(k)}
                  aria-label={longDay(k) + (open ? "" : ", no times")}
                  aria-pressed={sel}
                  className={`relative h-11 w-11 rounded-full text-[15px] transition ${open ? "font-semibold" : "opacity-35"} ${sel ? "" : open ? "hover:brightness-95" : ""}`}
                  style={sel ? { background: "var(--bk-accent, #2E7C83)", color: "var(--bk-accent-ink, #fff)" } : open ? { background: "var(--bk-tint, #e6f1f1)", color: "var(--bk-accent, #2E7C83)" } : undefined}
                >
                  {Number(k.slice(8))}
                  {today && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full" style={{ background: sel ? "var(--bk-accent-ink, #fff)" : "var(--bk-dot, #C76F56)" }} />}
                </button>
              </div>
            );
          })}
        </div>
        {err && <p className="mt-3 text-sm text-[#8a2f2f]">{err}</p>}
        {slots === null && !err && <p className="mt-3 text-sm opacity-60">Finding open times…</p>}
        {slots && !slots.length && !err && <p className="mt-3 text-sm opacity-70">No open times this month. Try the next month.</p>}
      </div>

      <div>
        <h3 className="text-sm font-semibold">{day ? longDay(day) : "Choose a day"}</h3>
        <div className="mt-3 flex max-h-[26rem] flex-col gap-2 overflow-y-auto pr-1">
          {(byDay.get(day) ?? []).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="rounded-full border-2 px-4 py-2.5 text-center text-[15px] font-semibold transition hover:text-white"
              style={{ borderColor: "var(--bk-accent, #2E7C83)", color: "var(--bk-accent, #2E7C83)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bk-accent, #2E7C83)"; e.currentTarget.style.color = "var(--bk-accent-ink, #fff)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--bk-accent, #2E7C83)"; }}
            >
              {time(s)}
            </button>
          ))}
          {day && !(byDay.get(day) ?? []).length && <p className="text-sm opacity-60">No times on this day.</p>}
        </div>
      </div>
    </div>
  );
}
