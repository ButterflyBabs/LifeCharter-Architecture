import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sparkAccount } from "@/lib/spark/guard";
import { ensureSettings, siteHost, type SparkSite } from "@/lib/spark/settings";
import { igConfigured, sendIgDm } from "@/lib/spark/instagram";
import { connectFbPage, fbConfigured, sendFbMessage, type FbPage } from "@/lib/spark/facebook";
import { REPLY_WINDOW_MS, withinReplyWindow } from "@/lib/spark/messaging";
import { sparkAccountAi, sparkReply } from "@/lib/spark/ai";

export const dynamic = "force-dynamic";

// LC Spark owner screen (/lc-spark). Every query is scoped to the caller's own account.
//   GET                    → settings, sites, calendars, Instagram status, conversations, usage
//   GET ?conversation=<id> → one transcript
//   POST { action, ... }   → save-settings | save-sites | save-billing | ig-toggle | ig-disconnect

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const intOrNull = (v: unknown, hi: number) => {
  if (v === null || v === "" || v === undefined) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= hi ? n : undefined;
};

interface ConvRow {
  id: string;
  channel: string;
  site_origin: string | null;
  contact_id: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  started_at: string;
  last_message_at: string;
  message_count: number;
  booked: boolean;
  billable: boolean;
  summary: string | null;
  ai_paused: boolean;
  needs_reply: boolean;
  visitor_handle: string | null;
  last_visitor_at: string | null;
}

const monthStart = (offset = 0) => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1));
};

export async function GET(request: Request) {
  const a = await sparkAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();

  const convId = new URL(request.url).searchParams.get("conversation");
  if (convId) {
    if (!/^[0-9a-f-]{36}$/i.test(convId)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const { data: conv } = await db.from("spark_conversations").select("*").eq("id", convId).eq("master_plan_id", a.planId).maybeSingle();
    if (!conv) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const { data: messages } = await db.from("spark_messages").select("id, role, content, created_at").eq("conversation_id", conv.id).in("role", ["visitor", "assistant", "owner"]).order("created_at").limit(200);
    const canReply = (conv.channel === "instagram" || conv.channel === "facebook") && withinReplyWindow(conv.last_visitor_at as string | null);
    return NextResponse.json({ conversation: conv, messages: messages ?? [], canReply, replyWindowHours: REPLY_WINDOW_MS / 3_600_000 });
  }

  const settings = await ensureSettings(a.planId);
  if (!settings) return NextResponse.json({ error: "Couldn't load LC Spark settings." }, { status: 500 });
  const lastMonth = monthStart(-1).toISOString();

  const [{ data: list }, { data: recent }, { data: calendars }] = await Promise.all([
    db.from("spark_conversations").select("id, channel, site_origin, contact_id, visitor_name, visitor_email, started_at, last_message_at, message_count, booked, billable, summary, ai_paused, needs_reply, visitor_handle").eq("master_plan_id", a.planId).order("last_message_at", { ascending: false }).limit(200),
    db.from("spark_conversations").select("id, contact_id, started_at, message_count, booked, billable, visitor_email").eq("master_plan_id", a.planId).gte("started_at", lastMonth).limit(10000),
    db.from("booking_calendars").select("slug, name, active").eq("master_plan_id", a.planId).order("name"),
  ]);

  // "Booked": the captured contact booked any calendar after the conversation began.
  const open = ((list ?? []) as ConvRow[]).filter((c) => c.contact_id && !c.booked);
  if (open.length) {
    const ids = Array.from(new Set(open.map((c) => c.contact_id as string)));
    const earliest = open.reduce((m, c) => (c.started_at < m ? c.started_at : m), open[0].started_at);
    const { data: bks } = await db.from("bookings").select("contact_id, created_at").eq("master_plan_id", a.planId).in("contact_id", ids).gte("created_at", earliest);
    const newlyBooked = open.filter((c) => (bks ?? []).some((b) => b.contact_id === c.contact_id && Date.parse(b.created_at as string) >= Date.parse(c.started_at)));
    if (newlyBooked.length) {
      await db.from("spark_conversations").update({ booked: true }).eq("master_plan_id", a.planId).in("id", newlyBooked.map((c) => c.id));
      for (const c of newlyBooked) c.booked = true;
      const bookedIds = new Set(newlyBooked.map((c) => c.id));
      for (const r of recent ?? []) if (bookedIds.has(r.id as string)) r.booked = true;
    }
  }

  const thisStart = monthStart(0).getTime();
  const sum = (from: number, to: number) => {
    const rows = (recent ?? []).filter((r) => {
      const t = Date.parse(r.started_at as string);
      return t >= from && t < to;
    });
    return {
      conversations: rows.length,
      billable: rows.filter((r) => r.billable).length,
      messages: rows.reduce((n, r) => n + ((r.message_count as number) || 0), 0),
      emails: rows.filter((r) => r.visitor_email).length,
      booked: rows.filter((r) => r.booked).length,
    };
  };
  const days: Record<string, { conversations: number; messages: number; emails: number; booked: number }> = {};
  for (const r of recent ?? []) {
    const t = Date.parse(r.started_at as string);
    if (t < thisStart) continue;
    const day = new Date(t).toISOString().slice(0, 10);
    const d = (days[day] ??= { conversations: 0, messages: 0, emails: 0, booked: 0 });
    d.conversations++;
    d.messages += (r.message_count as number) || 0;
    if (r.visitor_email) d.emails++;
    if (r.booked) d.booked++;
  }

  const { ig_access_token, fb_access_token, ...safe } = settings;
  const { data: pending } = await db.from("spark_fb_pending").select("pages, expires_at").eq("master_plan_id", a.planId).maybeSingle();
  const fbPending = pending && Date.parse(pending.expires_at as string) > Date.now() ? ((pending.pages as FbPage[]) ?? []).map((p) => ({ id: p.id, name: p.name })) : [];
  return NextResponse.json({
    settings: { ...safe, ig_connected: Boolean(ig_access_token && settings.ig_user_id), fb_connected: Boolean(fb_access_token && settings.fb_page_id) },
    igConfigured: igConfigured(),
    fbConfigured: fbConfigured(),
    fbPending,
    calendars: (calendars ?? []).filter((c) => c.active),
    conversations: list ?? [],
    usage: {
      thisMonth: sum(thisStart, Infinity),
      lastMonth: sum(Date.parse(lastMonth), thisStart),
      days: Object.entries(days)
        .sort(([x], [y]) => (x < y ? 1 : -1))
        .map(([day, v]) => ({ day, ...v })),
    },
  });
}

function cleanSites(v: unknown): SparkSite[] | null {
  if (!Array.isArray(v) || v.length > 20) return null;
  const out: SparkSite[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") return null;
    const s = raw as Record<string, unknown>;
    const host = siteHost(str(s.origin, 200));
    if (!host || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return null;
    const color = str(s.brandColor, 7);
    const slug = str(s.bookingSlug, 80);
    out.push({
      origin: `https://${host}`,
      label: str(s.label, 60) || host,
      enabled: s.enabled !== false,
      bookingSlug: /^[a-z0-9-]+$/i.test(slug) ? slug : null,
      brandColor: /^#[0-9a-f]{6}$/i.test(color) ? color : null,
      knowledgeNote: str(s.knowledgeNote, 2000) || null,
    });
  }
  return out;
}

export async function POST(request: Request) {
  const a = await sparkAccount(request);
  if ("denied" in a) return a.denied;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const db = createServerClient();
  await ensureSettings(a.planId);
  const save = async (patch: Record<string, unknown>, ok: string) => {
    const { error } = await db.from("spark_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("master_plan_id", a.planId);
    return error ? NextResponse.json({ error: "Couldn't save. Please try again." }, { status: 500 }) : NextResponse.json({ ok: true, message: ok });
  };

  switch (b.action) {
    case "save-settings":
      return save(
        {
          enabled: b.enabled === true,
          assistant_name: str(b.assistant_name, 60) || "LC Spark",
          greeting: str(b.greeting, 500) || null,
          instructions: str(b.instructions, 3000) || null,
          knowledge: str(b.knowledge, 12000) || null,
        },
        "Saved."
      );
    case "save-sites": {
      const sites = cleanSites(b.sites);
      if (!sites) return NextResponse.json({ error: "Please check each website address (like amilynnecarroll.com)." }, { status: 400 });
      return save({ sites }, "Websites saved.");
    }
    case "save-billing": {
      const price = intOrNull(b.price_per_conversation_cents, 100_000);
      const cap = intOrNull(b.monthly_conversation_cap, 1_000_000);
      if (price === undefined || cap === undefined) return NextResponse.json({ error: "Please enter whole numbers." }, { status: 400 });
      return save({ price_per_conversation_cents: price, monthly_conversation_cap: cap }, "Billing saved.");
    }
    case "ig-toggle":
      return save({ ig_enabled: b.enabled === true }, b.enabled === true ? "Instagram replies are on." : "Instagram replies are off.");
    case "reply": {
      const id = str(b.id, 40);
      const text = str(b.text, 1900);
      if (!/^[0-9a-f-]{36}$/i.test(id) || !text) return NextResponse.json({ error: "Write your reply first." }, { status: 400 });
      const { data: conv } = await db.from("spark_conversations").select("id, channel, visitor_key, last_visitor_at, message_count").eq("id", id).eq("master_plan_id", a.planId).maybeSingle();
      if (!conv) return NextResponse.json({ error: "Not found." }, { status: 404 });
      if (conv.channel !== "instagram" && conv.channel !== "facebook") return NextResponse.json({ error: "Replies from here work for Instagram and Facebook. Website chats are answered by email." }, { status: 400 });
      if (!withinReplyWindow(conv.last_visitor_at as string | null)) {
        return NextResponse.json({ error: `${conv.channel === "instagram" ? "Instagram" : "Facebook"} only allows a reply within 24 hours of their last message. Answer them inside ${conv.channel === "instagram" ? "Instagram" : "Facebook"} instead.` }, { status: 409 });
      }
      const { data: cfg } = await db.from("spark_settings").select("ig_access_token, fb_access_token").eq("master_plan_id", a.planId).maybeSingle();
      const token = (conv.channel === "instagram" ? cfg?.ig_access_token : cfg?.fb_access_token) as string | null;
      if (!token) return NextResponse.json({ error: "That account isn't connected any more. Reconnect it first." }, { status: 409 });
      const sent = conv.channel === "instagram" ? await sendIgDm(token, conv.visitor_key as string, text) : await sendFbMessage(token, conv.visitor_key as string, text);
      if (!sent.ok) return NextResponse.json({ error: `${conv.channel === "instagram" ? "Instagram" : "Facebook"} didn't accept the message (it may be outside their 24-hour window or the connection may need renewing). Nothing was sent.` }, { status: 502 });
      await db.from("spark_messages").insert({ conversation_id: id, role: "owner", content: text });
      // Once a person answers, LC Spark steps back so the two of you never talk over each other.
      await db.from("spark_conversations").update({ ai_paused: true, needs_reply: false, last_message_at: new Date().toISOString(), message_count: (conv.message_count as number) + 1 }).eq("id", id);
      return NextResponse.json({ ok: true, message: "Sent. LC Spark is paused on this conversation; hand it back any time." });
    }
    case "ai-pause":
    case "ai-resume":
    case "handled": {
      const id = str(b.id, 40);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const patch = b.action === "ai-pause" ? { ai_paused: true } : b.action === "ai-resume" ? { ai_paused: false, needs_reply: false } : { needs_reply: false };
      // Website chats can't be answered from here, so there is nothing to take over.
      let q = db.from("spark_conversations").update(patch).eq("id", id).eq("master_plan_id", a.planId);
      if (b.action === "ai-pause") q = q.neq("channel", "web");
      const { data, error } = await q.select("id");
      if (error || !data?.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json({ ok: true, message: b.action === "ai-pause" ? "You have this conversation. LC Spark will stay quiet." : b.action === "ai-resume" ? "LC Spark has this conversation again." : "Marked as handled." });
    }
    case "fb-toggle":
      return save({ fb_enabled: b.enabled === true }, b.enabled === true ? "Facebook replies are on." : "Facebook replies are off.");
    case "fb-disconnect":
      await db.from("spark_fb_pending").delete().eq("master_plan_id", a.planId);
      return save({ fb_enabled: false, fb_page_id: null, fb_page_name: null, fb_user_id: null, fb_access_token: null }, "Facebook disconnected.");
    case "fb-select": {
      const pageId = str(b.pageId, 40);
      const { data: pend } = await db.from("spark_fb_pending").select("fb_user_id, pages, expires_at").eq("master_plan_id", a.planId).maybeSingle();
      const page = ((pend?.pages as FbPage[]) ?? []).find((p) => p.id === pageId);
      if (!pend || !page || Date.parse(pend.expires_at as string) < Date.now()) return NextResponse.json({ error: "That choice expired. Press Connect Facebook again." }, { status: 410 });
      const r = await connectFbPage(a.planId, pend.fb_user_id as string, page);
      await db.from("spark_fb_pending").delete().eq("master_plan_id", a.planId);
      if (!r.ok) return NextResponse.json({ error: "Couldn't save the Page. Please try again." }, { status: 500 });
      return NextResponse.json({ ok: true, message: r.webhook ? `Connected ${page.name}. LC Spark will answer its messages while it's switched on.` : `Connected ${page.name}, but message notifications couldn't be switched on. Try connecting again.` });
    }
    case "linkedin-draft": {
      // LinkedIn does not let apps read or answer messages, so this only writes a draft for the owner to read, edit and send herself.
      const text = str(b.text, 1500);
      if (!text) return NextResponse.json({ error: "Paste the message you received first." }, { status: 400 });
      const settings = await ensureSettings(a.planId);
      const ai = await sparkAccountAi(a.planId);
      if (!settings || !ai.key) return NextResponse.json({ error: "Add your OpenAI key in Settings first so LC Spark can write drafts." }, { status: 409 });
      const name = str(b.name, 60) || null;
      const draft = await sparkReply({ apiKey: ai.key, settings, channel: "linkedin", site: null, booking: null, history: [{ role: "visitor", content: text }], known: { name, email: null } });
      if (!draft) return NextResponse.json({ error: "LC Spark couldn't write a draft just now. Please try again." }, { status: 502 });
      return NextResponse.json({ ok: true, message: "Draft ready.", draft: draft.reply, wantsBooking: draft.wantsBooking, handoff: draft.handoff });
    }
    case "ig-disconnect":
      return save({ ig_enabled: false, ig_user_id: null, ig_username: null, ig_access_token: null, ig_token_expires_at: null }, "Instagram disconnected.");
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
