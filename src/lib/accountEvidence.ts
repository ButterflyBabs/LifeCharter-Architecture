import { createServerClient } from "@/lib/supabase/server";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { clientHasSigned } from "@/lib/starterSignup";

// Babs's rule (2026-10-17): no Command Suite account is ever created without a payment AND the client's signature on the
// Year-1 Operating Agreement. This is the one place that answers "may this person's account be created yet?".
//   paid:   the Stripe webhook put "Bought LifeCharter Command Suite ..." on their contact (self-serve and sales checkouts)
//   signed: the Suite's e-signature says the CLIENT has signed the agreement the Suite sent them (AmiLynne's countersignature does not hold
//           anyone up: it follows the client's)
// A person who already has a Command Suite account is only being updated, so nothing is held back for them.

export interface AccountEvidence {
  hasAccount: boolean;
  paid: boolean;
  signed: boolean;
  contactId: string | null;
  /** The newest agreement sent to them that is still unsigned (for a reminder). */
  unsignedDocumentId: string | null;
}

export const evidenceReady = (e: Pick<AccountEvidence, "hasAccount" | "paid" | "signed">): boolean => e.hasAccount || (e.paid && e.signed);

/** What is still missing, in words for the screen: ["the payment", "the signed agreement"]. */
export function missingPieces(e: Pick<AccountEvidence, "hasAccount" | "paid" | "signed">): string[] {
  if (e.hasAccount) return [];
  return [...(e.paid ? [] : ["the payment"]), ...(e.signed ? [] : ["the signed agreement"])];
}

export const missingText = (e: Pick<AccountEvidence, "hasAccount" | "paid" | "signed">): string => missingPieces(e).join(" and ");

export async function accountEvidence(emailRaw: string): Promise<AccountEvidence> {
  const email = emailRaw.trim().toLowerCase();
  const db = createServerClient();
  const out: AccountEvidence = { hasAccount: false, paid: false, signed: false, contactId: null, unsignedDocumentId: null };
  const { data: plan } = await db.from("client_master_plans").select("id").ilike("client_email", email).limit(1).maybeSingle();
  out.hasAccount = Boolean(plan);
  const house = await ownerMasterPlanId().catch(() => null);
  if (!house) return out;
  const { data: c } = await db.from("seq_contacts").select("id").eq("master_plan_id", house).eq("email", email).maybeSingle();
  if (!c) return out;
  out.contactId = c.id as string;
  const { data: bought } = await db.from("crm_events").select("id").eq("contact_id", out.contactId).eq("kind", "purchase").like("title", "Bought LifeCharter Command Suite%").limit(1);
  out.paid = Boolean(bought?.length);
  const { data: sent } = await db.from("crm_events").select("detail, created_at").eq("contact_id", out.contactId).eq("title", "Year-1 Operating Agreement sent for signature").order("created_at", { ascending: false }).limit(5);
  for (const ev of sent ?? []) {
    const id = (ev.detail as { documentId?: string } | null)?.documentId;
    if (!id) continue;
    if (await clientHasSigned(id, email)) {
      out.signed = true;
      out.unsignedDocumentId = null;
      break;
    }
    if (!out.unsignedDocumentId) out.unsignedDocumentId = id;
  }
  return out;
}
