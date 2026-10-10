// Browser-safe tax rules shared by the Finance Center, Tax Preparation and the overview API.

// Taxes you pay (estimated payments, income tax) are not deductions, so they are kept out of the tax estimate's expense side.
export const TAX_PAID_RE = /^(estimated\s+)?((federal|state|income|quarterly|self[- ]employment)\s+)?tax(es)?(\s+payments?)?$|\bestimated\s+tax|\birs\b/i;
export const isTaxPayment = (category: string | null | undefined) => TAX_PAID_RE.test((category || "").trim());
