import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { withinStandingLimit, integrationUsage, INTEGRATION_LIMIT_BODY } from "@/lib/capabilities";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { syncStripe, validateStripeKey } from "@/lib/stripeSync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The client's own Stripe account → their ledger. The key is stored server-side
// only and never returned to the browser.
//   GET → status    POST { apiKey } → connect (validates, then first sync)
//   POST { action: "sync" } → sync now    DELETE → disconnect (synced entries stay)
const PROVIDER = "stripe";

export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  const { data } = await createServerClient().from("client_integrations").select("status, external_id, connected_at, api_key, metadata").eq("master_plan_id", masterPlanId).eq("provider", PROVIDER).maybeSingle();
  const meta = (data?.metadata as Record<string, unknown>) ?? {};
  const hasKey = Boolean(((data?.api_key as string) || "").trim());
  return NextResponse.json({
    connected: hasKey && data?.status === "connected",
    account: (data?.external_id as string) || "",
    lastSyncAt: (meta.last_sync_at as string) || null,
    lastAdded: (meta.last_added as number) ?? null,
    lastError: (meta.last_error as string) || null,
  });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));

  if (body.action === "sync") {
    const r = await syncStripe(masterPlanId);
    return r.error ? NextResponse.json({ error: r.error }, { status: 400 }) : NextResponse.json(r);
  }

  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!apiKey) return NextResponse.json({ error: "Paste your Stripe restricted key." }, { status: 400 });
  const check = await validateStripeKey(apiKey);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  const db = createServerClient();
  const { data: existing } = await db.from("client_integrations").select("id").eq("master_plan_id", masterPlanId).eq("provider", PROVIDER).maybeSingle();
  if (!existing?.id) {
    const { allowed } = await withinStandingLimit("integrations", masterPlanId, (await integrationUsage(masterPlanId)).count);
    if (!allowed) return NextResponse.json(INTEGRATION_LIMIT_BODY, { status: 403 });
  }
  const row = { master_plan_id: masterPlanId, provider: PROVIDER, api_key: apiKey, external_id: check.account || null, status: "connected", updated_at: new Date().toISOString() };
  const { error } = existing?.id
    ? await db.from("client_integrations").update(row).eq("id", existing.id)
    : await db.from("client_integrations").insert({ ...row, connected_at: new Date().toISOString(), metadata: {} });
  if (error) return NextResponse.json({ error: "Could not save the connection." }, { status: 500 });
  const first = await syncStripe(masterPlanId);
  return NextResponse.json({ connected: true, account: check.account, added: first.added, syncError: first.error ?? null });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  await createServerClient().from("client_integrations").delete().eq("master_plan_id", masterPlanId).eq("provider", PROVIDER);
  return NextResponse.json({ ok: true });
}
