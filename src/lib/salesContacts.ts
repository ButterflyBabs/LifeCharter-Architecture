import { createServerClient } from "@/lib/supabase/server";
import { ownerMasterPlanId } from "@/lib/housePlan";

// Babs's own Suite CRM contacts (seq_contacts on her account) for the internal
// /sales-reference page — the lookup panel and the Contacts tab. Middleware keeps
// /api/sales/* to the owner and her own team (including sales-only members);
// clients never reach it.

type ContactRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  tags: string[] | null;
  source: string | null;
  last_activity_at: string | null;
  created_at: string;
};

const COLS = "id, email, first_name, last_name, phone, tags, source, last_activity_at, created_at";

const nameOf = (c: ContactRow) => `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email;
// Strip characters that would break PostgREST's or() filter syntax.
const clean = (q: string) => q.trim().slice(0, 120).replace(/[%,()*]/g, "");

export interface SalesContactRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  lastActiveAt: string | null;
}

export interface SalesContactDetail {
  found: boolean;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  source?: string | null;
  addedAt?: string;
  lastActiveAt?: string | null;
  tags?: string[];
  activity?: { title: string; kind: string; at: string }[];
}

export class NoOwnerAccountError extends Error {}

async function ownerPlan(): Promise<string> {
  const id = await ownerMasterPlanId();
  if (!id) throw new NoOwnerAccountError("Owner account not found");
  return id;
}

// Name-or-email search (or everyone, newest activity first), paged.
export async function listSalesContacts(opts: { q?: string; page?: number; limit?: number }): Promise<SalesContactRow[]> {
  const planId = await ownerPlan();
  const limit = Math.max(1, Math.min(100, opts.limit ?? 25));
  const page = Math.max(1, opts.page ?? 1);
  const q = clean(opts.q || "");
  let query = createServerClient()
    .from("seq_contacts")
    .select(COLS)
    .eq("master_plan_id", planId)
    .order("last_activity_at", { ascending: false, nullsFirst: false })
    .range((page - 1) * limit, page * limit - 1);
  if (q) query = query.or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as ContactRow[]).map((c) => ({
    id: c.id,
    name: nameOf(c),
    email: c.email,
    phone: c.phone || "",
    tags: c.tags ?? [],
    lastActiveAt: c.last_activity_at,
  }));
}

// One contact by email, with tags and their most recent timeline entries.
export async function lookupSalesContact(email: string): Promise<SalesContactDetail> {
  const planId = await ownerPlan();
  const db = createServerClient();
  const { data } = await db
    .from("seq_contacts")
    .select(COLS)
    .eq("master_plan_id", planId)
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (!data) return { found: false };
  const c = data as ContactRow;
  const { data: events } = await db
    .from("crm_events")
    .select("title, kind, created_at")
    .eq("master_plan_id", planId)
    .eq("contact_id", c.id)
    .order("created_at", { ascending: false })
    .limit(8);
  return {
    found: true,
    id: c.id,
    name: nameOf(c),
    email: c.email,
    phone: c.phone || undefined,
    source: c.source,
    addedAt: c.created_at,
    lastActiveAt: c.last_activity_at,
    tags: c.tags ?? [],
    activity: ((events ?? []) as { title: string; kind: string; created_at: string }[]).map((e) => ({ title: e.title, kind: e.kind, at: e.created_at })),
  };
}
