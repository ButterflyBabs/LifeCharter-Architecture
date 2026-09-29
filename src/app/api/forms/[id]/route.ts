import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { submitForm } from "@/lib/crm";
import { browserContext, metaEventId, sendMetaEvent } from "@/lib/metaCapi";
import { isHousePlan } from "@/lib/housePlan";

export const dynamic = "force-dynamic";

// Public endpoint for Suite forms (the Suite's own CRM). Any of the account's
// sites can post here; the form id is the only key. GET returns the form's
// fields so a site or the hosted /f/<id> page can render it.
//
// Babs's forms: only her sites (below) may post, and leads go to her Meta pixel.
// A client's forms: the hosted /f/<id> page, or a plain HTML <form method="post">
// on their own site (any origin; answered with a simple thank-you page). JS
// embeds from a client's own domain aren't CORS-enabled yet. Client leads never
// go to Babs's Meta pixel.
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
  const { data } = await createServerClient().from("crm_forms").select("id, name, description, fields, success_message, submit_label").eq("id", params.id).eq("active", true).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404, headers: cors(request) });
  return NextResponse.json({ form: data }, { headers: cors(request) });
}

const escHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
function page(title: string, text: string, status = 200) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(title)}</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FBF8F1;font-family:Arial,sans-serif;padding:16px"><div style="max-width:460px;background:#fff;border:1px solid #EADFCF;border-radius:18px;padding:32px;text-align:center"><h1 style="font-size:22px;color:#1F3A3D;margin:0 0 10px">${escHtml(title)}</h1><p style="color:#555;line-height:1.6;margin:0">${escHtml(text)}</p></div></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const headers = cors(request);
  const origin = request.headers.get("origin");
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: "Not found." }, { status: 404, headers });
  const { data: owner } = await createServerClient().from("crm_forms").select("master_plan_id").eq("id", params.id).maybeSingle();
  const house = await isHousePlan(owner?.master_plan_id as string | undefined);
  // Babs's forms: browsers always send Origin on a cross-site POST; refuse sites she doesn't own.
  if (house && origin && !headers["Access-Control-Allow-Origin"]) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const ct = request.headers.get("content-type") || "";
  const plainPost = !house && !ct.includes("application/json"); // a client's plain HTML form
  const body: Record<string, unknown> = ct.includes("application/json")
    ? await request.json().catch(() => ({}))
    : Object.fromEntries((await request.formData().catch(() => new FormData())).entries());
  // Honeypot: people never fill this hidden field; bots do. Pretend it worked.
  if (typeof body._hp === "string" && body._hp.trim()) return plainPost ? page("Thank you", "Thank you!") : NextResponse.json({ ok: true, message: "Thank you!" }, { headers });
  const pageUrl = typeof body._page === "string" ? body._page : request.headers.get("referer");
  const r = await submitForm(params.id, body, pageUrl);
  if (plainPost) return r.ok ? page("Thank you", r.message) : page("Please check the form", `${r.error} Please go back and try again.`, r.status);
  if (r.ok && r.lead && (await isHousePlan(r.lead.masterPlanId))) {
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
