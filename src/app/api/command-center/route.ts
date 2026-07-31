import { NextResponse } from "next/server";
import { createCommandClient, isCommandConfigured } from "@/lib/command-db";

export const dynamic = "force-dynamic";

// Surfaces real data from the Command Dashboard backend: the 12 business command
// domains + latest audit findings, and the RBAC roles/permissions catalog.
export async function GET() {
  if (!isCommandConfigured()) {
    return NextResponse.json({ configured: false });
  }
  const db = createCommandClient();
  if (!db) return NextResponse.json({ configured: false });

  const [domainsRes, findingsRes, rolesRes, permsRes] = await Promise.all([
    db.from("business_command_domains").select("id, code, name, description, display_order").order("display_order", { ascending: true }),
    db.from("audit_findings").select("id, severity, finding, domain_id, created_at").is("archived_at", null).order("created_at", { ascending: false }).limit(24),
    db.from("roles").select("id, name, description, is_system").order("name", { ascending: true }),
    db.from("permissions").select("id, code, resource, action, description").order("code", { ascending: true }),
  ]);

  const anyErr = domainsRes.error || findingsRes.error || rolesRes.error || permsRes.error;
  if (anyErr) {
    console.error("GET /api/command-center:", anyErr.message);
    return NextResponse.json({ configured: true, error: anyErr.message, domains: [], findings: [], roles: [], permissions: [] });
  }

  const domains = (domainsRes.data ?? []) as Array<Record<string, unknown>>;
  const nameById = new Map(domains.map((d) => [d.id as string, d.name as string]));
  const findings = ((findingsRes.data ?? []) as Array<Record<string, unknown>>).map((f) => ({
    ...f,
    domain: nameById.get(f.domain_id as string) ?? null,
  }));

  return NextResponse.json({
    configured: true,
    domains,
    findings,
    roles: rolesRes.data ?? [],
    permissions: permsRes.data ?? [],
  });
}
