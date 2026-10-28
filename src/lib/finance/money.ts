import { otherCurrency, toCurrency, type Currency } from "@/lib/currency";

// Finance totals with more than one currency (task 1520). Every aggregate the Finance Center shows (month-to-date,
// year-to-date, budgets vs actual, health, charts, the assistant's summaries) counts ONLY rows in the account's home
// currency. Money in the other currency is totalled on its own and returned beside it as `other`, never added in and
// never converted.

export type Flow = { income: number; expense: number; net: number };

export const zeroFlow = (): Flow => ({ income: 0, expense: 0, net: 0 });

/** Adds one row to a flow (keeps net current). */
export function addFlow(f: Flow, type: string, amount: number): void {
  if (type === "income") f.income += amount;
  else f.expense += amount;
  f.net = f.income - f.expense;
}

export const hasFlow = (f: Flow) => f.income !== 0 || f.expense !== 0;

/** True when a row is in the home currency (rows without one are the home currency's legacy "usd"). */
export const inHome = (row: { currency?: unknown }, home: Currency) => toCurrency(row.currency) === home;

/** The other currency's totals, or null when nothing in it has money. */
export function otherBlock<T extends Record<string, Flow>>(home: Currency, flows: T): ({ currency: Currency } & T) | null {
  return Object.values(flows).some(hasFlow) ? { currency: otherCurrency(home), ...flows } : null;
}
