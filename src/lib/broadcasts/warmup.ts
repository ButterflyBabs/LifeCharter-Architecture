// Warm-up guard: a young sending domain (lccommandsuite.com) builds its reputation best when daily volume
// ramps up slowly. When the guard is ON, the house account sends at most today's allowance of emails across
// broadcasts and campaign emails; the rest of a broadcast stays queued and goes out on the next day's runs.
//
// Switched by app_settings (all text):
//   warmup_guard_on          "true" to enforce (default off)
//   warmup_guard_start       YYYY-MM-DD, day 0 of the ramp (default: today the first time it is on)
//   warmup_guard_start_cap   emails allowed on day 0 (default 25)
//   warmup_guard_step_days   the cap doubles every this many days (default 3)
//   warmup_guard_max         the cap stops growing here (default 1000)

export interface GuardSettings {
  on: boolean;
  startDay: string; // YYYY-MM-DD
  startCap: number;
  stepDays: number;
  max: number;
}

const num = (v: string | undefined, d: number, min: number) => {
  const n = parseInt(String(v ?? "").trim(), 10);
  return Number.isFinite(n) && n >= min ? n : d;
};

export function parseGuard(raw: Record<string, string>, today: string): GuardSettings {
  const start = /^\d{4}-\d{2}-\d{2}$/.test((raw.warmup_guard_start ?? "").trim()) ? raw.warmup_guard_start.trim() : today;
  return {
    on: String(raw.warmup_guard_on ?? "").trim().toLowerCase() === "true",
    startDay: start,
    startCap: num(raw.warmup_guard_start_cap, 25, 1),
    stepDays: num(raw.warmup_guard_step_days, 3, 1),
    max: num(raw.warmup_guard_max, 1000, 1),
  };
}

/** Days from `startDay` to `today` (never negative). */
export function daysSince(startDay: string, today: string): number {
  const a = Date.parse(`${startDay}T00:00:00Z`);
  const b = Date.parse(`${today}T00:00:00Z`);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/** The most emails the house account may send on `today`. */
export function dailyCap(g: GuardSettings, today: string): number {
  const doublings = Math.floor(daysSince(g.startDay, today) / g.stepDays);
  return Math.min(g.max, g.startCap * 2 ** Math.min(doublings, 30));
}
