import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SUBJECT, defaultClientBody } from "@/lib/email/accountReadyEmail";

// The ONE standard "your account is ready" email for every new paying client (unless Babs says otherwise for
// someone). It is a row of new_client_emails with this placeholder address; she edits and approves it on
// /new-clients. Until it is approved the Sales Reference New Client button behaves as it always did.
export const STANDARD_CLIENT = "standard:client";

export async function ensureClientTemplate(db: SupabaseClient, planId: string) {
  await db
    .from("new_client_emails")
    .upsert({ master_plan_id: planId, email: STANDARD_CLIENT, name: "Standard email · new paying clients", subject: DEFAULT_SUBJECT, body: defaultClientBody(null), kind: "client" }, { onConflict: "master_plan_id,email", ignoreDuplicates: true });
}

export async function approvedClientTemplate(db: SupabaseClient, planId: string): Promise<{ subject: string; body: string } | null> {
  const { data } = await db.from("new_client_emails").select("subject, body, status").eq("master_plan_id", planId).eq("email", STANDARD_CLIENT).maybeSingle();
  return data && data.status === "approved" ? { subject: data.subject as string, body: data.body as string } : null;
}
