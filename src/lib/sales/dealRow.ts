// Validates a client-sent deal into database columns (create and edit).
export function dealRow(b: Record<string, unknown>, opts: { partial: boolean }): { error: string } | { row: Record<string, unknown> } {
  const row: Record<string, unknown> = {};
  const has = (k: string) => Object.prototype.hasOwnProperty.call(b, k);
  const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

  if (!opts.partial || has("contactName")) {
    const name = str(b.contactName, 160);
    if (!name) return { error: "Add who the deal is with." };
    row.contact_name = name;
  }
  if (has("company")) row.company = str(b.company, 160) || null;
  if (has("email")) {
    const e = str(b.email, 200).toLowerCase();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { error: "That email doesn't look right." };
    row.email = e || null;
  }
  if (has("value")) {
    if (b.value === null || b.value === "") row.value = null;
    else {
      const n = Number(b.value);
      if (!Number.isFinite(n) || n < 0 || n > 100_000_000) return { error: "Deal value must be a number." };
      row.value = Math.round(n * 100) / 100;
    }
  }
  if (has("probability")) {
    if (b.probability === null || b.probability === "") row.probability = null;
    else {
      const n = Number(b.probability);
      if (!Number.isInteger(n) || n < 0 || n > 100) return { error: "Probability must be a whole number from 0 to 100." };
      row.probability = n;
    }
  }
  if (has("expectedClose")) row.expected_close = date(b.expectedClose);
  if (has("nextStep")) row.next_step = str(b.nextStep, 300) || null;
  if (has("nextStepDue")) row.next_step_due = date(b.nextStepDue);
  if (has("source")) row.source = str(b.source, 120) || null;
  if (has("notes")) row.notes = str(b.notes, 5000) || null;
  row.updated_at = new Date().toISOString();
  return { row };
}
