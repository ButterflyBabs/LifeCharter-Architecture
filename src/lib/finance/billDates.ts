// Bill types and date math, safe to use in the browser (no database access).
// Bills & cash calendar: what's due to go out. A bill has a next due date and a
// cadence; "Mark paid" records the expense and moves it to the following date.

export type BillCadence = "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual" | "annual" | "once";
export const BILL_CADENCES: BillCadence[] = ["weekly", "biweekly", "monthly", "quarterly", "semiannual", "annual", "once"];
export const CADENCE_LABEL: Record<BillCadence, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semiannual: "Every 6 months",
  annual: "Yearly",
  once: "One time",
};

export interface Bill {
  id: string;
  name: string;
  amount: number | null;
  vendor: string;
  category: string;
  cadence: BillCadence;
  nextDue: string; // YYYY-MM-DD
  autopay: boolean;
  notes: string;
  lastPaidOn: string | null;
}

export interface BillRow {
  id: string;
  name: string;
  amount: number | string | null;
  vendor?: string | null;
  category: string | null;
  cadence: string;
  next_due: string;
  autopay: boolean;
  notes: string | null;
  last_paid_on: string | null;
}

export function toBill(r: BillRow): Bill {
  return {
    id: r.id,
    name: r.name,
    amount: r.amount === null || r.amount === "" ? null : Number(r.amount),
    vendor: r.vendor || "",
    category: r.category || "",
    cadence: (BILL_CADENCES as string[]).includes(r.cadence) ? (r.cadence as BillCadence) : "monthly",
    nextDue: r.next_due,
    autopay: r.autopay,
    notes: r.notes || "",
    lastPaidOn: r.last_paid_on,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

// The next due date after `date` for a cadence (month-end safe: Jan 31 → Feb 28).
export function nextAfter(date: string, cadence: BillCadence): string | null {
  const [y, m, d] = date.split("-").map(Number);
  if (cadence === "once") return null;
  if (cadence === "weekly" || cadence === "biweekly") {
    const t = new Date(Date.UTC(y, m - 1, d + (cadence === "weekly" ? 7 : 14)));
    return t.toISOString().slice(0, 10);
  }
  const add = cadence === "monthly" ? 1 : cadence === "quarterly" ? 3 : cadence === "semiannual" ? 6 : 12;
  const total = m - 1 + add;
  const ny = y + Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return iso(ny, nm, Math.min(d, last));
}

// Every occurrence of each bill between `from` and `to` (inclusive), for the calendar.
export function occurrences(bills: Bill[], from: string, to: string): { bill: Bill; date: string }[] {
  const out: { bill: Bill; date: string }[] = [];
  for (const b of bills) {
    let date: string | null = b.nextDue;
    let guard = 0;
    while (date && date <= to && guard++ < 60) {
      if (date >= from) out.push({ bill: b, date });
      date = nextAfter(date, b.cadence);
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.bill.name.localeCompare(b.bill.name));
}

