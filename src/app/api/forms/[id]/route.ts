import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { submitForm } from "@/lib/crm";
import { browserContext, metaEventId, sendMetaEvent } from "@/lib/metaCapi";

export const dynamic = "force-dynamic";

// Public endpoint for Suite forms (the Suite's own CRM). Any of the account's
// sites can post here; the form id is the only key. GET returns the form's
// fields so a site or the hosted /f/<id> page can render it.
const ALLOWED = [
  /^https:\/\/(www\.)?amilynnecarroll\.com$/,
  /^https:\/\/amilynnecarroll-site(-[a-z0-9-]+)?\.vercel\.app$/,
  /^https:\/\/(www\.)?lccommandsuite\.com$/,
  /^https:\/\/(www\.)?lifecharter\.life$/,
  /^http:\/\/localhost:\d+$/,
];

function cors(request: Request) {
  const origin = request.headers.get("origin") || "";
  return ALLOWED.some((r) => r.test(origin))
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : ({} as Record<string, string>);
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: cors(request) });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: "Not found." }, { status: 404, headers: cors(request) });
  const { data } = await createServerClient().from("crm_forms").select("id, name, description, fields, success_message").eq("id", params.id).eq("active", true).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404, headers: cors(request) });
  return NextResponse.json({ form: data }, { headers: cors(request) });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const headers = cors(request);
  const origin = request.headers.get("origin");
  // Browsers always send Origin on a cross-site POST; refuse sites we don't own.
  if (origin && !headers["Access-Control-Allow-Origin"]) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: "Not found." }, { status: 404, headers });
  const ct = request.headers.get("content-type") || "";
  const body: Record<string, unknown> = ct.includes("application/json")
    ? await request.json().catch(() => ({}))
    : Object.fromEntries((await request.formData().catch(() => new FormData())).entries());
  // Honeypot: people never fill this hidden field; bots do. Pretend it worked.
  if (typeof body._hp === "string" && body._hp.trim()) return NextResponse.json({ ok: true, message: "Thank you!" }, { headers });
  const pageUrl = typeof body._page === "string" ? body._page : request.headers.get("referer");
  const r = await submitForm(params.id, body, pageUrl);
  if (r.ok && r.lead) {
    // Lead → Meta Conversions API. A site that also fires the pixel's Lead can post the same
    // `_event_id` (and its `_fbp`/`_fbc` cookies, which a cross-site request doesn't carry).
    const ctx = browserContext(request, pageUrl);
    const opt = (k: string) => (typeof body[k] === "string" && body[k] ? String(body[k]).slice(0, 200) : null);
    await sendMetaEvent({
      eventName: "Lead",
      eventId: opt("_event_id") || metaEventId("lead", params.id, r.lead.contactId, Math.floor(Date.now() / 600_000)),
      email: r.lead.email,
      phone: r.lead.phone,
      firstName: r.lead.firstName,
      lastName: r.lead.lastName,
      contentName: `form:${r.lead.formKey}`,
      ...ctx,
      fbp: ctx.fbp || opt("_fbp"),
      fbc: ctx.fbc || opt("_fbc"),
    });
  }
  return r.ok ? NextResponse.json({ ok: true, message: r.message }, { headers }) : NextResponse.json({ error: r.error }, { status: r.status, headers });
}
