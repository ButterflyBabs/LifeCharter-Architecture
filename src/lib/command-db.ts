import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Read-only bridge to the "LifeCharter Command Dashboard" Supabase project
// (the comprehensive 190-table backend: RBAC roles/permissions, the 12 business
// command domains, and the Command Audit engine).
//
// Env-gated: if COMMAND_SUPABASE_URL / COMMAND_SUPABASE_SERVICE_ROLE_KEY are not
// set, the bridge is simply "not configured" and callers degrade gracefully.
// This is the first, additive step toward adopting that backend as the backbone.

export function isCommandConfigured(): boolean {
  return Boolean(
    process.env.COMMAND_SUPABASE_URL && process.env.COMMAND_SUPABASE_SERVICE_ROLE_KEY
  );
}

export function createCommandClient(): SupabaseClient | null {
  if (!isCommandConfigured()) return null;
  return createClient(
    process.env.COMMAND_SUPABASE_URL as string,
    process.env.COMMAND_SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
