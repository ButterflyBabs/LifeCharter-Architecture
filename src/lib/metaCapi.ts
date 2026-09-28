// Meta Conversions API: the server half of the shared Meta Pixel (see lib/tracking.ts). Sends
// conversions straight from our server to Meta, so ad blockers and Safari tracking protection can't
// drop them. Built directly on the Graph API, no third-party vendor.
//
// Env: META_CAPI_TOKEN (secret; no token = does nothing), META_PIXEL_ID (defaults to the shared
// pixel), META_TEST_EVENT_CODE (optional; routes events to Events Manager → Test events).
//
// Never throws and gives up after a short timeout. Callers await it (a serverless function can be
// frozen once the response is sent, so a truly detached request might never leave), which costs at
// most TIMEOUT_MS.
//
// Deduplication: when the browser pixel sends the same event, both sides must use the same
// event_id (e.g. Purchase uses the Stripe checkout session id on both sides).

import { createHash } from "crypto";
import { SHARED_META_PIXEL_ID } from "@/lib/tracking";

const GRAPH_VERSION = "v21.0";
const TIMEOUT_MS = 2500;

export interface MetaEventInput {
  eventName: string;
  eventId: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  value?: number | null;
  currency?: string | null;
  contentName?: string | null;
  sourceUrl?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  /** Seconds since epoch; defaults to now. */
  eventTime?: number;
}

/** What a browser request tells us about the visitor: IP, user agent, the pixel's cookies, the page. */
export interface BrowserContext {
  clientIp: string | null;
  userAgent: string | null;
  fbp: string | null;
  fbc: string | null;
  sourceUrl: string | null;
}

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

function normEmail(v?: string | null) {
  const s = (v || "").trim().toLowerCase();
  return s.includes("@") ? s : "";
}

// Digits only, with country code. Ten digits is taken as a US/Canada number.
function normPhone(v?: string | null) {
  const d = (v || "").replace(/\D/g, "").replace(/^0+/, "");
  if (d.length < 7) return "";
  return d.length === 10 ? `1${d}` : d;
}

function normName(v?: string | null) {
  return (v || "").trim().toLowerCase().replace(/[\s.,'"!?()\-]+/g, "");
}

function cookie(header: string | null, name: string) {
  const m = (header || "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Reads IP, user agent, _fbp/_fbc cookies and the page URL from an incoming browser request. */
export function browserContext(request: Request, pageUrl?: string | null): BrowserContext {
  const h = request.headers;
  const clientIp = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || null;
  const cookies = h.get("cookie");
  return {
    clientIp,
    userAgent: h.get("user-agent"),
    fbp: cookie(cookies, "_fbp"),
    fbc: cookie(cookies, "_fbc"),
    sourceUrl: pageUrl || h.get("referer") || null,
  };
}

// No _fbc cookie but the visitor arrived from an ad (?fbclid=…): build the click id Meta expects.
function fbcFromUrl(url?: string | null) {
  if (!url) return null;
  try {
    const id = new URL(url).searchParams.get("fbclid");
    return id ? `fb.1.${Date.now()}.${id}` : null;
  } catch {
    return null;
  }
}

export async function sendMetaEvent(e: MetaEventInput): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return;
  const pixelId = process.env.META_PIXEL_ID || SHARED_META_PIXEL_ID;
  try {
    const user_data: Record<string, unknown> = {};
    const em = normEmail(e.email);
    const ph = normPhone(e.phone);
    const fn = normName(e.firstName);
    const ln = normName(e.lastName);
    if (em) user_data.em = [sha256(em)];
    if (ph) user_data.ph = [sha256(ph)];
    if (fn) user_data.fn = [sha256(fn)];
    if (ln) user_data.ln = [sha256(ln)];
    if (e.clientIp) user_data.client_ip_address = e.clientIp;
    if (e.userAgent) user_data.client_user_agent = e.userAgent;
    if (e.fbp) user_data.fbp = e.fbp;
    const fbc = e.fbc || fbcFromUrl(e.sourceUrl);
    if (fbc) user_data.fbc = fbc;
    // Meta rejects an event it can't match to anyone.
    if (!Object.keys(user_data).length) return;

    const custom_data: Record<string, unknown> = {};
    if (typeof e.value === "number" && Number.isFinite(e.value)) custom_data.value = Math.round(e.value * 100) / 100;
    if (e.currency) custom_data.currency = e.currency.toUpperCase();
    if (e.contentName) custom_data.content_name = e.contentName;

    const body: Record<string, unknown> = {
      data: [
        {
          event_name: e.eventName,
          event_time: e.eventTime ?? Math.floor(Date.now() / 1000),
          event_id: e.eventId,
          action_source: "website",
          ...(e.sourceUrl ? { event_source_url: e.sourceUrl.slice(0, 1000) } : {}),
          user_data,
          ...(Object.keys(custom_data).length ? { custom_data } : {}),
        },
      ],
      ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
    };

    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.error(`meta capi ${e.eventName} ${res.status}:`, (await res.text().catch(() => "")).slice(0, 500));
  } catch (err) {
    console.error(`meta capi ${e.eventName}:`, err instanceof Error ? err.message : err);
  }
}

/** A stable id for an event with no browser-side twin, so retries/double submits collapse into one. */
export function metaEventId(...parts: (string | number | null | undefined)[]) {
  return sha256(parts.map((p) => String(p ?? "")).join("|")).slice(0, 32);
}
