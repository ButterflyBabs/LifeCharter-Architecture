import { createServerClient } from "@/lib/supabase/server";

// {{audit_results_link}} in a campaign email (or its button) is the person's own saved Mini Command Audit results, so the
// follow-up emails can send them straight back to their scores and the Go deeper option. Anyone with no saved results
// (added by hand, say) gets the audit's front page instead.
type Db = ReturnType<typeof createServerClient>;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const TOKEN = /\{\{\s*audit_results_link\s*\}\}/gi;

export const usesAuditLink = (...texts: (string | null | undefined)[]) => texts.some((t) => !!t && /\{\{\s*audit_results_link\s*\}\}/i.test(t));

export function fillAuditLink(text: string, link: string): string;
export function fillAuditLink(text: string | null, link: string): string | null;
export function fillAuditLink(text: string | null, link: string): string | null {
  return text == null ? text : text.replace(TOKEN, link);
}

/** The link for one contact: their newest saved run, else the front page. */
export async function auditLinkFor(db: Db, contactId: string): Promise<string> {
  const { data } = await db.from("mini_audit_runs").select("token").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data?.token ? `${APP_URL}/mini-command-audit/results/${data.token}` : `${APP_URL}/mini-command-audit`;
}
