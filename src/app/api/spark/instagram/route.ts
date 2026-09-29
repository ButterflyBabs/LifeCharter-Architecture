import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { validIgSignature, sendIgMessage } from "@/lib/spark/instagram";
import { runSparkTurn } from "@/lib/spark/engine";
import type { SparkSettings } from "@/lib/spark/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Meta webhook for LC Spark Instagram DMs. Public (Meta calls it), secured by the
// verify token (GET) and the X-Hub-Signature-256 HMAC (POST). Always answers 200
// to a signed POST so Meta doesn't disable the subscription; errors are logged.

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const token = process.env.SPARK_IG_VERIFY_TOKEN;
  if (!token) return NextResponse.json({ error: "Instagram isn't set up yet." }, { status: 503 });
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === token && p.get("hub.challenge")) {
    return new NextResponse(p.get("hub.challenge"), { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json({ error: "Forbidden." }, { status: 403 });
}

interface IgEvent {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: { mid?: string; text?: string; is_echo?: boolean; is_deleted?: boolean };
}

// Meta may redeliver an event; skip ones this instance has already handled.
const seen = new Set<string>();

export async function POST(request: Request) {
  if (!process.env.SPARK_IG_APP_SECRET) return NextResponse.json({ error: "Instagram isn't set up yet." }, { status: 503 });
  const raw = await request.text();
  if (!validIgSignature(raw, request.headers.get("x-hub-signature-256"))) return NextResponse.json({ error: "Bad signature." }, { status: 401 });

  try {
    const body = JSON.parse(raw) as { object?: string; entry?: { id?: string; messaging?: IgEvent[] }[] };
    const events = (body.entry ?? []).flatMap((e) => e.messaging ?? []).slice(0, 20);
    const db = createServerClient();
    for (const ev of events) {
      const text = ev.message?.text;
      const senderId = ev.sender?.id;
      const recipientId = ev.recipient?.id;
      if (!text || !senderId || !recipientId || ev.message?.is_echo || ev.message?.is_deleted) continue; // reads, reactions, echoes, attachments
      const mid = ev.message?.mid;
      if (mid) {
        if (seen.has(mid)) continue;
        seen.add(mid);
        if (seen.size > 2000) seen.clear();
      }
      try {
        const { data } = await db.from("spark_settings").select("*").eq("ig_user_id", recipientId).eq("ig_enabled", true).eq("enabled", true).maybeSingle();
        if (!data || senderId === recipientId) continue;
        const settings = { ...(data as unknown as SparkSettings), sites: Array.isArray(data.sites) ? data.sites : [] } as SparkSettings;
        if (!settings.ig_access_token) continue;
        const r = await runSparkTurn({ settings, channel: "instagram", visitorKey: senderId.slice(0, 64), text: text.slice(0, 1000), site: null });
        const reply = r.ok ? (r.bookingUrl && !r.reply.includes(r.bookingUrl) ? `${r.reply}\n\n${r.bookingUrl}` : r.reply) : r.status === 429 ? null : r.error;
        if (reply) await sendIgMessage(settings.ig_access_token, senderId, reply);
      } catch (e) {
        console.error("spark ig event:", e instanceof Error ? e.message : e);
      }
    }
  } catch (e) {
    console.error("spark ig webhook:", e instanceof Error ? e.message : e);
  }
  return NextResponse.json({ ok: true });
}
