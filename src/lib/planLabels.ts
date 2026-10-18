// Human-readable plan limits shown on pricing pages. Values come from
// plans.capabilities (-1 or missing = unlimited).
import { SMS_CAP_BY_TIER } from "@/lib/sms";
import { SMS_OPEN_TO_ALL } from "@/lib/smsFlag";

/** The plan's monthly text allowance (task 1151): "500 text message reminders a month". Says "(coming soon)" until
 *  texting is open to every account, so the pricing pages update themselves when it is. */
export function smsTextsLabel(tierOrCap: string | number | null | undefined): string {
  const n = typeof tierOrCap === "number" ? tierOrCap : SMS_CAP_BY_TIER[String(tierOrCap || "").toLowerCase()] ?? SMS_CAP_BY_TIER.starter;
  return `${n.toLocaleString("en-US")} text message reminders a month${SMS_OPEN_TO_ALL ? "" : " (coming soon)"}`;
}

export function emailAccountsLabel(limit: number | null | undefined): string {
  if (typeof limit !== "number" || limit < 0) return "Unlimited connected email accounts";
  return `${limit} connected email ${limit === 1 ? "account" : "accounts"}`;
}
