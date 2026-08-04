// Shared period math for finance reports/exports: week, month, quarter, year.
export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type Period = "week" | "month" | "quarter" | "year" | "custom";

export function nowParts(tz: string): { year: number; month: number; day: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    return { year: get("year"), month: get("month"), day: get("day") };
  } catch {
    const d = new Date();
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
  }
}

export const fmt = (d: Date) => d.toISOString().slice(0, 10);

export interface Range {
  start: Date;
  end: Date; // exclusive
  startStr: string;
  endStr: string;
  label: string;
  period: Period;
  year: number;
  index: number; // month 1-12, quarter 1-4; 0 for week/year
  weekStart: string | null;
}

// Compute the date range for a period. For 'week', `start` anchors it (any date
// in the week); weeks run Sunday→Saturday. For month/quarter, `index` selects
// which one; for year, `year` selects it.
export function periodRange(
  period: Period,
  opts: { tz: string; year?: number; index?: number; start?: string; end?: string }
): Range {
  const cur = nowParts(opts.tz);
  const year = opts.year || cur.year;

  let start: Date;
  let end: Date;
  let label: string;
  let index = 0;
  let weekStart: string | null = null;

  if (period === "custom") {
    const s =
      opts.start && /^\d{4}-\d{2}-\d{2}$/.test(opts.start)
        ? new Date(`${opts.start}T00:00:00Z`)
        : new Date(Date.UTC(cur.year, cur.month - 1, 1));
    const eIncl =
      opts.end && /^\d{4}-\d{2}-\d{2}$/.test(opts.end)
        ? new Date(`${opts.end}T00:00:00Z`)
        : new Date(Date.UTC(cur.year, cur.month - 1, cur.day));
    start = s;
    end = new Date(eIncl);
    end.setUTCDate(eIncl.getUTCDate() + 1); // make end exclusive
    label = `${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()} – ${MONTHS[eIncl.getUTCMonth()]} ${eIncl.getUTCDate()}, ${eIncl.getUTCFullYear()}`;
    return {
      start,
      end,
      startStr: fmt(start),
      endStr: fmt(end),
      label,
      period,
      year: s.getUTCFullYear(),
      index: 0,
      weekStart: null,
    };
  } else if (period === "week") {
    const anchor =
      opts.start && /^\d{4}-\d{2}-\d{2}$/.test(opts.start)
        ? new Date(`${opts.start}T00:00:00Z`)
        : new Date(Date.UTC(cur.year, cur.month - 1, cur.day));
    const s = new Date(anchor);
    s.setUTCDate(anchor.getUTCDate() - anchor.getUTCDay()); // back to Sunday
    end = new Date(s);
    end.setUTCDate(s.getUTCDate() + 7);
    start = s;
    weekStart = fmt(s);
    label = `Week of ${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()}, ${s.getUTCFullYear()}`;
  } else if (period === "quarter") {
    index = opts.index || Math.ceil(cur.month / 3);
    const sm = (index - 1) * 3;
    start = new Date(Date.UTC(year, sm, 1));
    end = new Date(Date.UTC(year, sm + 3, 1));
    label = `Q${index} ${year}`;
  } else if (period === "year") {
    start = new Date(Date.UTC(year, 0, 1));
    end = new Date(Date.UTC(year + 1, 0, 1));
    label = `${year}`;
  } else {
    index = opts.index || cur.month;
    start = new Date(Date.UTC(year, index - 1, 1));
    end = new Date(Date.UTC(year, index, 1));
    label = `${MONTHS[index - 1]} ${year}`;
  }

  return {
    start,
    end,
    startStr: fmt(start),
    endStr: fmt(end),
    label,
    period,
    year: period === "week" ? start.getUTCFullYear() : year,
    index,
    weekStart,
  };
}
