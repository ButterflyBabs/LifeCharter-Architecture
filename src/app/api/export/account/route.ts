import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sessionUser } from "@/lib/authz";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { toCurrency } from "@/lib/currency";
import { withoutSecrets } from "@/lib/backupRows";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Whole-account backup: everything this account has put into the Suite, as one
// JSON file. Only the account's owner can download it (not team members).
// Secrets (API keys, tokens) are never included: connection tables are left out of the list, and withoutSecrets strips any
// private-link or key column from the rows that are. Uploaded files stay in the Suite; the rows that point to them come along.

const BY_PLAN = [
  "plan_sections",
  "client_plans",
  "business_reviews",
  "planning_reviews",
  "planning_insights",
  "tasks",
  "recurring_tasks",
  "finance_entries",
  "finance_budgets",
  "finance_goals",
  "finance_bills",
  "finance_settings",
  "forecast_assumptions",
  "sales_offers",
  "pipeline_stages",
  "pipeline_deals",
  "sales_goals",
  "sales_activities",
  "scripts_templates",
  "operations_pillars",
  "sops",
  "legal_checklist",
  "testimonials",
  "quick_wins",
  "qa_entries",
  "unified_client_responses",
  "quick_pulse_checkins",
  "client_score_snapshots",
  "assistant_messages",
  "notifications",
  "account_activity", "assessment_completions", "assistant_reports", "reminders", "custom_pages", "time_entries", "time_settings",
  "projects", "project_milestones", "project_guests", "team_huddles",
  "seq_contacts", "contact_records", "contact_emails", "contact_activity_log", "crm_custom_fields", "crm_tag_history", "crm_tag_notes",
  "crm_forms", "crm_broadcasts", "crm_events", "crm_invite_lists", "crm_invites", "sequences", "landing_pages", "review_requests",
  "booking_calendars", "booking_hosts", "bookings", "events", "event_registrations",
  "pipeline_boards", "dm_stages", "dm_cards", "dm_sends", "cold_email_settings", "cold_email_sends", "cold_email_replies",
  "icp_profiles", "icp_audiences", "icp_qualifications", "sign_documents", "sign_templates", "offer_payment_links", "suite_invoices", "suite_payments",
  "client_packages", "client_portals", "portal_items", "portal_messages", "programs", "program_members", "volant_reports",
  "affiliates", "affiliate_links", "affiliate_offer_rates", "affiliate_referrals", "affiliate_sales", "affiliate_programs", "affiliate_program_earnings",
  "finance_month_goals", "finance_payees", "sales_tax_settings", "plan_proposals", "plan_reviews",
];

export async function GET() {
  const user = await sessionUser();
  const masterPlanId = await resolveMasterPlanId();
  if (!user || !masterPlanId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const db = createServerClient();
  const { data: plan } = await db.from("client_master_plans").select("id, client_name, user_id, created_at, default_currency").eq("id", masterPlanId).maybeSingle();
  if (!plan || plan.user_id !== user.id) return NextResponse.json({ error: "Only the account owner can download a full backup." }, { status: 403 });

  const out: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    // Money rows (entries, bills, offers, deals) each carry their own `currency` column; `currency` here is the home one.
    account: { id: plan.id, name: plan.client_name, createdAt: plan.created_at, email: user.email, currency: toCurrency(plan.default_currency) },
    note: "Your records from your LifeCharter Command Suite account. Keep it somewhere safe. API keys, passwords and private links are never included. Uploaded files stay in the Suite.",
  };
  for (let i = 0; i < BY_PLAN.length; i += 12) {
    await Promise.all(
      BY_PLAN.slice(i, i + 12).map(async (t) => {
        const { data, error } = await db.from(t).select("*").eq("master_plan_id", masterPlanId).limit(20000);
        if (!error) out[t] = withoutSecrets(data ?? []);
      })
    );
  }
  const planIds = ((out.client_plans as { id: string }[]) ?? []).map((p) => p.id);
  if (planIds.length) {
    const { data } = await db.from("client_plan_goals").select("*").in("plan_id", planIds);
    out.client_plan_goals = data ?? [];
  }
  const { data: biz } = await db.from("businesses").select("*").eq("master_plan_id", masterPlanId);
  if (biz) {
    out.businesses = biz;
    const ids = (biz as { id: number }[]).map((b) => b.id);
    if (ids.length) out.segments = (await db.from("segments").select("*").in("business_id", ids)).data ?? [];
  }

  const day = new Date().toISOString().slice(0, 10);
  // Streamed, so a large account is not stopped by the size limit on a single response.
  const text = JSON.stringify(out, null, 2);
  const encoder = new TextEncoder();
  let at = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (at >= text.length) return controller.close();
      controller.enqueue(encoder.encode(text.slice(at, at + 1_000_000)));
      at += 1_000_000;
    },
  });
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lifecharter-backup-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
