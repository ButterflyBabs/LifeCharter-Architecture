import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { zoomSignatureOk, zoomValidationToken } from "@/lib/volantZoom";

export const dynamic = "force-dynamic";

// Zoom's event notifications for the LC Volant Zoom app (public in middleware; secured by Zoom's signature).
//  - endpoint.url_validation: Zoom checks the address belongs to us.
//  - app_deauthorized: someone removed the app in Zoom, so their connection and tokens are deleted here too.
export async function POST(request: Request) {
  const body = await request.text();
  let e: { event?: string; payload?: { plainToken?: string; user_id?: string; account_id?: string } } = {};
  try {
    e = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (e.event === "endpoint.url_validation" && e.payload?.plainToken) {
    if (!process.env.ZOOM_OAUTH_WEBHOOK_SECRET) return NextResponse.json({ error: "not configured" }, { status: 503 });
    return NextResponse.json({ plainToken: e.payload.plainToken, encryptedToken: zoomValidationToken(e.payload.plainToken) });
  }
  if (!zoomSignatureOk(body, request.headers.get("x-zm-request-timestamp"), request.headers.get("x-zm-signature"))) {
    return NextResponse.json({ error: "not allowed" }, { status: 401 });
  }
  if (e.event === "app_deauthorized" && e.payload?.user_id) {
    const db = createServerClient();
    const { data } = await db.from("zoom_connections").select("master_plan_id").eq("zoom_user_id", e.payload.user_id);
    for (const c of data ?? []) await db.rpc("set_zoom_tokens", { p_plan: c.master_plan_id, p_tokens: "" });
  }
  return NextResponse.json({ ok: true });
}
