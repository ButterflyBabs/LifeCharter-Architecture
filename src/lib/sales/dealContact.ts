import { EMAIL_RE, upsertContact } from "@/lib/crm";
import type { createServerClient } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServerClient>;

export function splitDealName(name: string | null | undefined): { firstName: string | null; lastName: string | null } {
  const [first, ...rest] = (name ?? "").trim().split(/\s+/);
  return { firstName: first || null, lastName: rest.join(" ") || null };
}

// Someone added to the Pipeline with an email also lands in Contacts, so nobody is entered twice. Merges into an existing contact.
export async function saveDealContact(db: Db, planId: string, deal: { email?: unknown; contact_name?: unknown; company?: unknown }): Promise<void> {
  const email = typeof deal.email === "string" ? deal.email.trim() : "";
  if (!EMAIL_RE.test(email)) return;
  await upsertContact(
    {
      masterPlanId: planId,
      email,
      ...splitDealName(typeof deal.contact_name === "string" ? deal.contact_name : ""),
      company: typeof deal.company === "string" ? deal.company : null,
      source: "pipeline",
    },
    db,
  );
}
