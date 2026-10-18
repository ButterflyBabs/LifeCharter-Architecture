import { createServerClient } from "@/lib/supabase/server";

// Out-of-office mode (task 1155). While an account is away:
//   - its own nudge emails pause (alert digest, task reminders, the owner's daily tasks email)
//   - its booking pages offer no times on the away dates and show the away note
//   - client portals show the away note, and a client's message gets one automatic reply per away stretch
// Client-facing automations (sequences, event emails, booking reminders, Client Care) keep running.

type Db = ReturnType<typeof createServerClient>;

export interface Away {
  master_plan_id: string;
  starts_on: string;
  ends_on: string;
  message: string | null;
  block_bookings: boolean;
  auto_reply: boolean;
  pause_nudges: boolean;
}

export const AWAY_COLUMNS = "master_plan_id, starts_on, ends_on, message, block_bookings, auto_reply, pause_nudges";

/** Today's date (YYYY-MM-DD) in a time zone; Mountain time when none is given. */
export function dayIn(tz = "America/Denver", at: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
  } catch {
    return at.toISOString().slice(0, 10);
  }
}

export const isAwayOn = (a: Pick<Away, "starts_on" | "ends_on"> | null | undefined, day: string) => Boolean(a && a.starts_on <= day && day <= a.ends_on);

/** The account's away setting when it is away today (or null). */
export async function awayNow(db: Db, planId: string): Promise<Away | null> {
  const { data } = await db.from("away_mode").select(AWAY_COLUMNS).eq("master_plan_id", planId).maybeSingle();
  const a = data as Away | null;
  return a && isAwayOn(a, dayIn()) ? a : null;
}

/** The account's away setting if it is away now or later (for booking pages, which look ahead). */
export async function awayAhead(db: Db, planId: string): Promise<Away | null> {
  const { data } = await db.from("away_mode").select(AWAY_COLUMNS).eq("master_plan_id", planId).gte("ends_on", dayIn()).maybeSingle();
  return (data as Away | null) ?? null;
}

/** Accounts whose nudge emails are paused today. */
export async function nudgesPaused(db: Db): Promise<Set<string>> {
  const today = dayIn();
  const { data } = await db.from("away_mode").select("master_plan_id").eq("pause_nudges", true).lte("starts_on", today).gte("ends_on", today);
  return new Set(((data ?? []) as { master_plan_id: string }[]).map((r) => r.master_plan_id));
}

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });

/** The note clients see (the owner's own words, or a plain default). */
export function awayNote(a: Pick<Away, "ends_on" | "message">): string {
  const own = (a.message || "").trim();
  if (own) return own;
  const back = new Date(Date.parse(`${a.ends_on}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  return `I'm away right now and back on ${fmt(back)}. I'll reply when I'm back.`;
}

export const awayDates = (a: Pick<Away, "starts_on" | "ends_on">) => (a.starts_on === a.ends_on ? fmt(a.starts_on) : `${fmt(a.starts_on)} to ${fmt(a.ends_on)}`);

/** One automatic portal reply per client per away stretch. */
export async function portalAutoReply(db: Db, planId: string, contactId: string): Promise<boolean> {
  const a = await awayNow(db, planId);
  if (!a?.auto_reply) return false;
  const body = awayNote(a);
  const since = `${a.starts_on}T00:00:00Z`;
  const { count } = await db.from("portal_messages").select("id", { count: "exact", head: true }).eq("contact_id", contactId).eq("author", "owner").eq("body", body).gte("created_at", since);
  if ((count ?? 0) > 0) return false;
  await db.from("portal_messages").insert({ master_plan_id: planId, contact_id: contactId, author: "owner", body });
  return true;
}
