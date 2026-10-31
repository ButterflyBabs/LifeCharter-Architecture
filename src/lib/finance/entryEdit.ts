// Editing a saved income or expense: which fields changed, cleaned. Money that came from Stripe keeps the amount and date Stripe
// recorded, so the ledger always matches Stripe; its category, name and note are still the owner's to tidy.
export type EntryEdit = { amount?: number; category?: string | null; occurred_on?: string; description?: string | null; vendor?: string | null };

export const hasEntryEdit = (body: Record<string, unknown>) => ["amount", "category", "occurredOn", "description", "vendor"].some((k) => k in body);

const text = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) || null : null);

export function parseEntryEdit(body: Record<string, unknown>, opts: { synced: boolean }): EntryEdit | { error: string } {
  const out: EntryEdit = {};
  if ("amount" in body) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount above zero." };
    out.amount = Math.round(amount * 100) / 100;
  }
  if ("occurredOn" in body) {
    if (typeof body.occurredOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.occurredOn)) return { error: "Choose a date." };
    out.occurred_on = body.occurredOn;
  }
  if (opts.synced && ("amount" in out || "occurred_on" in out)) return { error: "This came from Stripe, so its amount and date stay as Stripe recorded them." };
  if ("category" in body) out.category = text(body.category, 120);
  if ("description" in body) out.description = text(body.description, 500);
  if ("vendor" in body) out.vendor = text(body.vendor, 120);
  return out;
}
