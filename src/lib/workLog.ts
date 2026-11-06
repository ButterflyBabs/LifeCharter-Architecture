// Work Log: pure helpers shared by the Work Log page and its API.

export type ShiftStatus = "open" | "submitted" | "approved" | "returned";

export interface ShiftLike { clock_in: string; clock_out: string | null; hourly_rate?: number | string | null }
export interface ItemLike { what: string; minutes: number | null; challenge?: string | null; help_asked_of?: string | null; help_received_from?: string | null }

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/** Minutes between clock-in and clock-out (a shift still clocked in counts up to now). */
export const shiftMinutes = (s: Pick<ShiftLike, "clock_in" | "clock_out">, now = Date.now()) =>
  Math.max(0, Math.round(((s.clock_out ? Date.parse(s.clock_out) : now) - Date.parse(s.clock_in)) / 60_000));

/** Minutes the person has accounted for on their activity lines. */
export const loggedMinutes = (items: Pick<ItemLike, "minutes">[]) => items.reduce((n, i) => n + (i.minutes ?? 0), 0);

/** Pay for a stretch of minutes at an hourly rate, to the cent. Null when there is no rate. */
export function payFor(minutes: number, rate: number | string | null | undefined): number | null {
  if (rate === null || rate === undefined || rate === "") return null;
  const r = Number(rate);
  return Number.isFinite(r) && r >= 0 ? Math.round((minutes / 60) * r * 100) / 100 : null;
}

/** Progress toward a weekly hours goal. Null when there is no goal. */
export function goalProgress(minutes: number, goalHours: number | string | null | undefined): { goalMin: number; pct: number; shortMin: number } | null {
  if (goalHours === null || goalHours === undefined || goalHours === "") return null;
  const g = Number(goalHours);
  if (!Number.isFinite(g) || g <= 0) return null;
  const goalMin = Math.round(g * 60);
  return { goalMin, pct: Math.min(100, Math.round((minutes / goalMin) * 100)), shortMin: Math.max(0, goalMin - minutes) };
}

/** Where a request for help stands: nothing asked, asked and waiting, or someone helped. */
export function helpState(i: Pick<ItemLike, "help_asked_of" | "help_received_from">): "none" | "waiting" | "received" {
  if (i.help_received_from?.trim()) return "received";
  return i.help_asked_of?.trim() ? "waiting" : "none";
}

export interface CleanItem {
  what: string;
  quantity: number | null;
  unit: string | null;
  minutes: number | null;
  challenge: string | null;
  help_asked_of: string | null;
  help_received_from: string | null;
  help_note: string | null;
}

/** Reads an activity line from a request body. Returns an error message for the person when it cannot be used. */
export function cleanItem(b: Record<string, unknown>): { item: CleanItem } | { error: string } {
  const what = str(b.what, 400);
  if (!what) return { error: "Say what you did." };
  let quantity: number | null = null;
  if (b.quantity !== undefined && b.quantity !== null && b.quantity !== "") {
    quantity = Number(b.quantity);
    if (!Number.isFinite(quantity) || quantity < 0 || quantity > 1_000_000) return { error: "How many needs to be a number, zero or more." };
    quantity = Math.round(quantity * 100) / 100;
  }
  let minutes: number | null = null;
  if (b.minutes !== undefined && b.minutes !== null && b.minutes !== "") {
    minutes = Math.floor(Number(b.minutes));
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 24 * 60) return { error: "How long needs to be between 0 minutes and 24 hours." };
  }
  const unit = str(b.unit, 40);
  return {
    item: {
      what,
      quantity,
      unit: unit || null,
      minutes,
      challenge: str(b.challenge, 1000) || null,
      help_asked_of: str(b.helpAskedOf, 120) || null,
      help_received_from: str(b.helpReceivedFrom, 120) || null,
      help_note: str(b.helpNote, 1000) || null,
    },
  };
}

/** Can the person still change this shift's lines? Their own shift until it is submitted, and again if it is returned. The reviewer always can. */
export const canEditLines = (status: ShiftStatus, reviewer: boolean) => reviewer || status === "open" || status === "returned";

/** The words for a status, as shown on a card. */
export const STATUS_LABEL: Record<ShiftStatus, string> = {
  open: "In progress",
  submitted: "Waiting for review",
  approved: "Approved",
  returned: "Sent back",
};

/** Why a shift cannot be submitted yet, or null when it can. */
export function submitBlocker(s: Pick<ShiftLike, "clock_out">, items: Pick<ItemLike, "what">[]): string | null {
  if (!s.clock_out) return "Clock out before you submit.";
  if (!items.length) return "List at least one thing you did before you submit.";
  return null;
}

/** Quotes a CSV cell. */
export const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
