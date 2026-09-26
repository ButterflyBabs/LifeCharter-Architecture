// Human-readable plan limits shown on pricing pages. Values come from
// plans.capabilities (-1 or missing = unlimited).
export function emailAccountsLabel(limit: number | null | undefined): string {
  if (typeof limit !== "number" || limit < 0) return "Unlimited connected email accounts";
  return `${limit} connected email ${limit === 1 ? "account" : "accounts"}`;
}
