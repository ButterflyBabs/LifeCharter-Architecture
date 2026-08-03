import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { validateKey, GcError } from "@/lib/globalControl";

export const dynamic = "force-dynamic";

// Global Control (Titanium Suite) connection, per client. The API key is
// exclusive to each client, stored server-side only via the service role, and
// NEVER returned to the browser. Scoped by the client's master plan.
const PROVIDER = "global_control";

// GET — connection status only (no secret ever leaves the server).
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const { data } = await supabase
    .from("client_integrations")
    .select("status, external_id, connected_at, api_key")
    .eq("master_plan_id", masterPlanId)
    .eq("provider", PROVIDER)
    .maybeSingle();

  const hasKey = Boolean(((data?.api_key as string) || "").trim());
  return NextResponse.json({
    connected: hasKey && (data?.status ?? "connected") === "connected",
    hasKey,
    accountId: (data?.external_id as string) || "",
    connectedAt: data?.connected_at ?? null,
  });
}

// POST — save/replace this client's Global Control API key (and optional
// account/location id). Stores server-side; returns status only.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));

  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const accountId = typeof body.accountId === "string" ? body.accountId.trim() : "";
  if (!apiKey) {
    return NextResponse.json({ error: "An API key is required." }, { status: 400 });
  }

  // Validate the key against Global Control before saving, so the client gets
  // immediate feedback instead of a silent bad connection.
  try {
    await validateKey(apiKey);
  } catch (e) {
    const msg =
      e instanceof GcError && e.status === 401
        ? "Global Control rejected that key — please double-check it."
        : "Couldn't verify the key with Global Control. Check the key and try again.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Upsert on (master_plan_id, provider). We look up the existing row first so
  // we can update in place (the unique index guarantees at most one).
  const { data: existing } = await supabase
    .from("client_integrations")
    .select("id")
    .eq("master_plan_id", masterPlanId)
    .eq("provider", PROVIDER)
    .maybeSingle();

  const row = {
    master_plan_id: masterPlanId,
    provider: PROVIDER,
    api_key: apiKey,
    external_id: accountId || null,
    status: "connected",
    updated_at: new Date().toISOString(),
  };

  let error;
  if (existing?.id) {
    ({ error } = await supabase.from("client_integrations").update(row).eq("id", existing.id));
  } else {
    ({ error } = await supabase
      .from("client_integrations")
      .insert({ ...row, connected_at: new Date().toISOString() }));
  }

  if (error) {
    console.error("POST global-control:", error.message);
    return NextResponse.json({ error: "Could not save the connection." }, { status: 500 });
  }
  return NextResponse.json({ connected: true, accountId });
}

// DELETE — disconnect (removes the stored key for this client).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const { error } = await supabase
    .from("client_integrations")
    .delete()
    .eq("master_plan_id", masterPlanId)
    .eq("provider", PROVIDER);
  if (error) {
    console.error("DELETE global-control:", error.message);
    return NextResponse.json({ error: "Could not disconnect." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
