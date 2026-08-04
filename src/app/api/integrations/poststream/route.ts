import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// PostStream connection, per client (social post creation + scheduling). The API
// key is exclusive to each client, stored server-side only via the service role
// and NEVER returned to the browser. Live validation + posting are wired once
// the PostStream API details are confirmed.
const PROVIDER = "poststream";

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

// POST — save/replace this client's PostStream API key (+ optional account id).
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
    console.error("POST poststream:", error.message);
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
    console.error("DELETE poststream:", error.message);
    return NextResponse.json({ error: "Could not disconnect." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
