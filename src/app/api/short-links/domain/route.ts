import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveActor } from "@/lib/authz";
import { crmAccount } from "@/app/api/crm/guard";
import { addDomain, dnsInstructionsFor, getDomain, removeDomain, verifyDomain, type DomainStatus } from "@/lib/vercelDomains";

export const dynamic = "force-dynamic";

// This account's own short-link domain (Short Links → "Your short-link
// domain"): go.yourbusiness.com instead of sharing lccommandsuite.com/l/.
//   GET  → current domain, status, DNS instructions
//   POST { action: "add-domain" | "check-domain" | "remove-domain", domain? }

const HOST_RE = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const APP_HOSTS = new Set(["lccommandsuite.com", "www.lccommandsuite.com", "amilynnecarroll.com", "www.amilynnecarroll.com", "lifecharter.life", "www.lifecharter.life"]);
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

async function view(planId: string) {
  const db = createServerClient();
  const { data } = await db
    .from("client_master_plans")
    .select("short_link_domain, short_link_domain_status, short_link_domain_verification, short_link_domain_checked_at")
    .eq("id", planId)
    .maybeSingle();
  const domain = (data?.short_link_domain as string) || null;
  return {
    domain,
    status: (data?.short_link_domain_status as DomainStatus) || "not_started",
    verification: data?.short_link_domain_verification ?? [],
    checkedAt: data?.short_link_domain_checked_at ?? null,
    dns: domain ? dnsInstructionsFor(domain) : null,
  };
}

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  return NextResponse.json(await view(a.planId));
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const body = await request.json().catch(() => ({}));

  // Connecting a domain is like connecting any outside account: the owner only.
  const actor = await resolveActor();
  if (actor.kind === "member") return NextResponse.json({ error: "Only the account owner can set up or remove the short-link domain." }, { status: 403 });

  if (body.action === "add-domain") {
    const current = await view(a.planId);
    if (current.domain) return NextResponse.json({ error: "Remove the current domain first." }, { status: 400 });
    const domain = str(body.domain, 253).toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
    if (!HOST_RE.test(domain)) return NextResponse.json({ error: "Enter a domain like go.yourbusiness.com." }, { status: 400 });
    if (APP_HOSTS.has(domain)) return NextResponse.json({ error: "Please use a domain your business owns." }, { status: 400 });
    const { data: taken } = await db.from("client_master_plans").select("id").ilike("short_link_domain", domain).neq("id", a.planId).limit(1);
    if (taken?.length) return NextResponse.json({ error: "That domain is already in use by another account." }, { status: 409 });

    const r = await addDomain(domain);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status >= 500 ? 502 : 400 });
    const { error } = await db
      .from("client_master_plans")
      .update({
        short_link_domain: domain,
        short_link_domain_status: r.data.verified ? "verified" : "pending",
        short_link_domain_verification: r.data.verification,
        short_link_domain_checked_at: new Date().toISOString(),
      })
      .eq("id", a.planId);
    if (error) {
      await removeDomain(domain); // don't leave an orphan at Vercel
      return NextResponse.json({ error: error.code === "23505" ? "That domain is already in use by another account." : "Couldn't save the domain." }, { status: 400 });
    }
    return NextResponse.json(await view(a.planId));
  }

  if (body.action === "check-domain") {
    const current = await view(a.planId);
    if (!current.domain) return NextResponse.json({ error: "Add your domain first." }, { status: 400 });
    await verifyDomain(current.domain); // best-effort nudge; the GET below is the real answer either way
    const g = await getDomain(current.domain);
    if (!g.ok) return NextResponse.json({ error: g.error }, { status: 400 });
    if (g.data.name.toLowerCase() !== current.domain) return NextResponse.json({ error: "That domain doesn't match. Remove it and add it again." }, { status: 400 });
    await db
      .from("client_master_plans")
      .update({
        short_link_domain_status: g.data.verified ? "verified" : "pending",
        short_link_domain_verification: g.data.verification,
        short_link_domain_checked_at: new Date().toISOString(),
      })
      .eq("id", a.planId);
    return NextResponse.json(await view(a.planId));
  }

  if (body.action === "remove-domain") {
    const current = await view(a.planId);
    if (current.domain) await removeDomain(current.domain);
    await db
      .from("client_master_plans")
      .update({ short_link_domain: null, short_link_domain_status: "not_started", short_link_domain_verification: [], short_link_domain_checked_at: null })
      .eq("id", a.planId);
    return NextResponse.json(await view(a.planId));
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
