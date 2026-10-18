import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleBridge, signatureOk, type Connection } from "@/lib/bridgeServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The bridge's receiving address (task 1152 part 2): lccommandsuite.com/api/bridge/<private token>, pasted into
// Payhip, Kajabi, Teachable, Thinkific, Zapier or Make. The token is the key; Payhip messages are also signed.
export async function POST(request: Request, { params }: { params: { token: string } }) {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(params.token)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const db = createServerClient();
  const { data } = await db.from("bridge_connections").select("id, master_plan_id, platform, signing_key, active").eq("token", params.token).maybeSingle();
  const c = data as Connection | null;
  if (!c || !c.active) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const ct = request.headers.get("content-type") || "";
  const body = (ct.includes("application/json") ? await request.json().catch(() => null) : Object.fromEntries((await request.formData().catch(() => new FormData())).entries())) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Bad request." }, { status: 400 });
  if (!signatureOk(c, body)) return NextResponse.json({ error: "Bad signature." }, { status: 401 });
  try {
    const result = await handleBridge(db, c, body);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("bridge:", e);
    return NextResponse.json({ error: "Couldn't record it. Please try again." }, { status: 500 });
  }
}

// Some platforms test the address with a GET first.
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const { data } = await createServerClient().from("bridge_connections").select("id").eq("token", params.token).eq("active", true).maybeSingle();
  return data ? NextResponse.json({ ok: true, message: "LifeCharter Command Suite bridge is ready." }) : NextResponse.json({ error: "Not found." }, { status: 404 });
}
