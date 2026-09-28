import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hostAuthUrl, signHostState, type Provider } from "@/lib/booking/connections";

export const dynamic = "force-dynamic";

// A host's private calendar-connection link (no Suite login needed).
//   GET ?host=&k=               → the host's name and connected calendars
//   GET ?host=&k=&provider=...  → starts Google / Microsoft sign-in
//   POST { host, k, action: "remove", id } → disconnects one calendar
async function hostFor(hostId: string | null, key: string | null) {
  if (!hostId || !key || !/^[0-9a-f-]{36}$/i.test(hostId)) return null;
  const { data } = await createServerClient().from("booking_hosts").select("id, name, connect_key").eq("id", hostId).maybeSingle();
  return data && data.connect_key === key ? data : null;
}

export async function GET(request: Request) {
  const u = new URL(request.url);
  const host = await hostFor(u.searchParams.get("host"), u.searchParams.get("k"));
  if (!host) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 });
  const provider = u.searchParams.get("provider") as Provider | null;
  if (provider === "google" || provider === "microsoft") {
    const back = `/book/connect/${host.id}?k=${u.searchParams.get("k")}`;
    return NextResponse.redirect(hostAuthUrl(provider, u.origin, signHostState(host.id, provider, back)));
  }
  const { data: conns } = await createServerClient().from("booking_connections").select("id, provider, email, check_busy, add_events").eq("host_id", host.id).order("created_at");
  return NextResponse.json({ name: host.name, connections: conns ?? [] });
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const host = await hostFor(b.host ?? null, b.k ?? null);
  if (!host) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 });
  if (b.action === "remove" && typeof b.id === "string") {
    await createServerClient().from("booking_connections").delete().eq("id", b.id).eq("host_id", host.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
