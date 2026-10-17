import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { validFbSignature, sendFbMessage, fetchFbProfile } from "@/lib/spark/facebook";
import { runSparkTurn } from "@/lib/spark/engine";
import type { SparkSettings } from "@/lib/spark/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Meta webhook for LC Spark Facebook Page messages (Messenger). Public (Meta calls it), secured by the verify token (GET)
// and the X-Hub-Signature-256 HMAC (POST). Always answers 200 to a signed POST so Meta doesn't disable the subscription.

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const token = process.env.SPARK_FB_VERIFY_TOKEN;
  if (!token) return NextResponse.json({ error: "Facebook isn't set up yet." }, { status: 503 });
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === token && p.get("hub.challenge")) {
    return new NextResponse(p.get("hub.challenge"), { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json({ error: "Forbidden." }, { status: 403 });
}

interface FbEvent {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: { mid?: string; text?: string; is_echo?: boolean };
}

// Meta may redeliver an event; skip ones this instance has already handled.
const seen = new Set<string>();

export async function POST(request: Request) {
  if (!process.env.SPARK_FB_APP_SECRET) return NextResponse.json({ error: "Facebook isn't set up yet." }, { status: 503 });
  const raw = await request.text();
  if (!validFbSignature(raw, request.headers.get("x-hub-signature-256"))) return NextResponse.json({ error: "Bad signature." }, { status: 401 });

  try {
    const body = JSON.parse(raw) as { object?: string; entry?: { id?: string; messaging?: FbEvent[] }[] };
    if (body.object !== "page") return NextResponse.json({ ok: true });
    const events = (body.entry ?? []).flatMap((e) => e.messaging ?? []).slice(0, 20);
    const db = createServerClient();
    for (const ev of events) {
      const text = ev.message?.text;
      const senderId = ev.sender?.id;
      const pageId = ev.recipient?.id;
      if (!text || !senderId || !pageId || ev.message?.is_echo) continue; // reads, reactions, echoes of our own replies, attachments
      const mid = ev.message?.mid;
      if (mid) {
        if (seen.has(mid)) continue;
        seen.add(mid);
        if (seen.size > 2000) seen.clear();
      }
      try {
        const { data } = await db.from("spark_settings").select("*").eq("fb_page_id", pageId).eq("fb_enabled", true).eq("enabled", true).maybeSingle();
        if (!data || senderId === pageId) continue;
        const settings = { ...(data as unknown as SparkSettings & { fb_access_token: string | null }), sites: Array.isArray(data.sites) ? data.sites : [] } as SparkSettings & { fb_access_token: string | null };
        const token = settings.fb_access_token;
        if (!token) continue;
        const r = await runSparkTurn({ settings, channel: "facebook", visitorKey: senderId.slice(0, 64), text: text.slice(0, 1900), site: null });
        // The owner has taken the conversation over (r.paused): nothing is sent, she answers from the Suite.
        const reply = r.ok ? (r.paused ? null : r.bookingUrl && !r.reply.includes(r.bookingUrl) ? `${r.reply}\n\n${r.bookingUrl}` : r.reply) : r.status === 429 ? null : r.error;
        if (reply) await sendFbMessage(token, senderId, reply);
        // Once per conversation: their name, so the list and LC Spark's greeting know who it is.
        if (r.ok) {
          const { data: cv } = await db.from("spark_conversations").select("visitor_handle, visitor_name").eq("id", r.conversationId).maybeSingle();
          if (cv && !cv.visitor_handle) {
            const prof = await fetchFbProfile(token, senderId);
            if (prof.full || prof.first) await db.from("spark_conversations").update({ visitor_handle: prof.full || prof.first, ...(cv.visitor_name ? {} : { visitor_name: prof.first }) }).eq("id", r.conversationId);
          }
        }
      } catch (e) {
        console.error("spark fb event:", e instanceof Error ? e.message : e);
      }
    }
  } catch (e) {
    console.error("spark fb webhook:", e instanceof Error ? e.message : e);
  }
  return NextResponse.json({ ok: true });
}
