import { NextResponse } from "next/server";
import { loadSettingsByKey, originAllowed, corsHeaders, PUBLIC_KEY_RE } from "@/lib/spark/settings";
import { runSparkTurn, siteLabel } from "@/lib/spark/engine";
import { browserContext, metaEventId, sendMetaEvent } from "@/lib/metaCapi";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Public endpoint for the LC Spark chat widget (public/spark.js) on an account's
// own websites. The account's public key picks the account; only origins listed
// (and enabled) in that account's LC Spark sites get CORS or a reply.
//   GET  ?k=<public key>                         → widget config
//   POST {k, visitorKey, text, page, _hp}         → {reply, conversationId, bookingUrl?}

const VISITOR_RE = /^[a-zA-Z0-9_-]{16,64}$/;

// Best-effort per-IP limit (per server instance) on top of the per-visitor limits in the engine.
const ipHits = new Map<string, number[]>();
function ipLimited(ip: string | null) {
  if (!ip) return false;
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < 600_000);
  hits.push(now);
  ipHits.set(ip, hits);
  if (ipHits.size > 5000) ipHits.clear();
  return hits.length > 40;
}

async function resolve(request: Request, key: string | null) {
  const origin = request.headers.get("origin");
  if (!key || !PUBLIC_KEY_RE.test(key)) return { origin, settings: null, site: null };
  const settings = await loadSettingsByKey(key);
  const site = settings ? originAllowed(settings, origin) : null;
  return { origin, settings, site };
}

export async function OPTIONS(request: Request) {
  // Preflight carries no key, so it's answered for any origin; the real request is checked.
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin, Boolean(origin)) });
}

export async function GET(request: Request) {
  const k = new URL(request.url).searchParams.get("k");
  const { origin, settings, site } = await resolve(request, k);
  const headers = corsHeaders(origin, Boolean(site));
  if (!settings || !site) return NextResponse.json({ error: "Not found." }, { status: 404, headers });
  return NextResponse.json(
    {
      enabled: Boolean(settings.enabled),
      name: settings.assistant_name || "LC Spark",
      greeting: settings.greeting || "Hi! I'm here to help — what brings you here today?",
      brandColor: site.brandColor && /^#[0-9a-f]{6}$/i.test(site.brandColor) ? site.brandColor : null,
    },
    { headers }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const k = typeof body.k === "string" ? body.k : null;
  const { origin, settings, site } = await resolve(request, k);
  const headers = corsHeaders(origin, Boolean(site));
  if (!settings || !site) return NextResponse.json({ error: "Not allowed." }, { status: 403, headers });
  if (!settings.enabled) return NextResponse.json({ error: "Chat is off right now." }, { status: 404, headers });
  // Honeypot: people never fill this hidden field; bots do. Pretend it worked.
  if (typeof body._hp === "string" && body._hp.trim()) return NextResponse.json({ reply: "Thanks!", conversationId: null }, { headers });
  const visitorKey = typeof body.visitorKey === "string" ? body.visitorKey : "";
  if (!VISITOR_RE.test(visitorKey)) return NextResponse.json({ error: "Please refresh the page and try again." }, { status: 400, headers });
  const text = typeof body.text === "string" ? body.text : "";
  const page = typeof body.page === "string" ? body.page.slice(0, 500) : null;

  const ctx = browserContext(request, page);
  if (ipLimited(ctx.clientIp)) return NextResponse.json({ error: "You're sending messages quickly — please wait a few minutes." }, { status: 429, headers });

  const r = await runSparkTurn({ settings, channel: "web", visitorKey, text, site, pageUrl: page });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status, headers });

  if (r.lead) {
    // Lead → Meta Conversions API, same as Suite forms. One event per conversation + contact.
    await sendMetaEvent({
      eventName: "Lead",
      eventId: metaEventId("spark-lead", r.conversationId, r.lead.contactId),
      email: r.lead.email,
      firstName: r.lead.firstName,
      contentName: `lc-spark:${siteLabel(site, "web")}`,
      ...ctx,
    });
  }
  return NextResponse.json({ reply: r.reply, conversationId: r.conversationId, ...(r.bookingUrl ? { bookingUrl: r.bookingUrl } : {}) }, { headers });
}
