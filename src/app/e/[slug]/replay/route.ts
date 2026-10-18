import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { replayOpen, type EventRow } from "@/lib/events";

export const dynamic = "force-dynamic";

// A registrant's replay link: goes to the replay while it is open, otherwise says it has closed.
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const token = new URL(request.url).searchParams.get("r") || "";
  const db = createServerClient();
  const { data: e } = await db.from("events").select("*").eq("slug", params.slug).maybeSingle();
  const ev = e as EventRow | null;
  const { data: reg } = ev && /^[A-Za-z0-9_-]{20,40}$/.test(token) ? await db.from("event_registrations").select("id").eq("token", token).eq("event_id", ev.id).maybeSingle() : { data: null };
  if (ev && reg && replayOpen(ev)) return NextResponse.redirect(ev.replay_url!);
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Replay</title></head><body style="margin:0;background:#FBF8F1;font-family:system-ui,sans-serif;color:#1F2B3A"><div style="max-width:480px;margin:80px auto;padding:24px;background:#fff;border:1px solid #E5DDCF;border-radius:16px;text-align:center"><h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 8px">${ev ? "This replay has closed" : "Replay not found"}</h1><p style="color:#56616E">${ev ? "Thank you for your interest. Reply to the email you received if you would like to hear about the next one." : "Please check the link in your email."}</p></div></body></html>`;
  return new Response(html, { status: ev ? 200 : 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
