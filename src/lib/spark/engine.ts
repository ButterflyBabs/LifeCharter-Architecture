import { createServerClient } from "@/lib/supabase/server";
import { upsertContact, logEvent, EMAIL_RE } from "@/lib/crm";
import { sparkAccountAi, sparkReply, type SparkHistoryItem } from "./ai";
import { bookingUrl, type SparkSettings, type SparkSite } from "./settings";

// One visitor message in, one reply out — shared by the website widget and
// Instagram DMs. A "conversation" is one visitor's thread; it starts fresh after
// 24 quiet hours. A conversation becomes billable on its first visitor message
// (the unit for per-conversation billing on client accounts).

type Db = ReturnType<typeof createServerClient>;
export type SparkChannel = "web" | "instagram";

export const MAX_TEXT = 1000;
const MAX_MESSAGES = 40; // per conversation (visitor + assistant)
const PER_MINUTE = 6; // visitor messages per conversation per minute
const PER_TEN_MIN = 20; // visitor messages per visitor per 10 minutes
const NEW_AFTER_MS = 24 * 3600_000;

export interface SparkTurnInput {
  settings: SparkSettings;
  channel: SparkChannel;
  visitorKey: string;
  text: string;
  site: SparkSite | null;
  pageUrl?: string | null;
}

export type SparkTurnResult =
  | { ok: true; reply: string; conversationId: string; bookingUrl: string | null; lead: { email: string; firstName: string | null; contactId: string } | null }
  | { ok: false; error: string; status: number };

interface Conversation {
  id: string;
  master_plan_id: string;
  channel: SparkChannel;
  site_origin: string | null;
  visitor_key: string;
  contact_id: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  started_at: string;
  last_message_at: string;
  message_count: number;
  billable: boolean;
  summary: string | null;
}

const monthStart = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
};

const firstEmailIn = (s: string) => {
  const m = s.match(/[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[a-z]{2,}/i);
  const e = m ? m[0].replace(/[.)]+$/, "").toLowerCase() : "";
  return EMAIL_RE.test(e) ? e : null;
};

const cleanName = (s: string | null) => {
  const n = (s || "").replace(/[^A-Za-z\u00C0-\u024F' -]/g, "").trim().split(/\s+/)[0] || "";
  return n.length >= 1 && n.length <= 40 ? n.charAt(0).toUpperCase() + n.slice(1) : null;
};

export function siteLabel(site: SparkSite | null, channel: SparkChannel) {
  return channel === "instagram" ? "Instagram" : site?.label || site?.origin || "Website";
}

// Instagram has no page, so it uses the first website's booking calendar.
export function bookingFor(settings: SparkSettings, site: SparkSite | null) {
  return bookingUrl(site?.bookingSlug) || bookingUrl(settings.sites.find((s) => s.enabled && s.bookingSlug)?.bookingSlug);
}

async function findOrStartConversation(db: Db, i: SparkTurnInput): Promise<Conversation | null> {
  const { data: last } = await db
    .from("spark_conversations")
    .select("*")
    .eq("master_plan_id", i.settings.master_plan_id)
    .eq("channel", i.channel)
    .eq("visitor_key", i.visitorKey)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last && Date.now() - Date.parse(last.last_message_at as string) < NEW_AFTER_MS) return last as Conversation;
  const { data: created, error } = await db
    .from("spark_conversations")
    .insert({
      master_plan_id: i.settings.master_plan_id,
      channel: i.channel,
      site_origin: i.channel === "web" ? i.site?.origin ?? null : null,
      visitor_key: i.visitorKey,
      // A returning visitor keeps who they told us they are.
      contact_id: (last?.contact_id as string) ?? null,
      visitor_name: (last?.visitor_name as string) ?? null,
      visitor_email: (last?.visitor_email as string) ?? null,
      message_count: 0,
      billable: false,
    })
    .select("*")
    .single();
  if (error) console.error("spark conversation:", error.message);
  return (created as Conversation) ?? null;
}

async function countVisitorMessages(db: Db, conversationId: string, sinceMs: number) {
  const { count } = await db
    .from("spark_messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("role", "visitor")
    .gte("created_at", new Date(Date.now() - sinceMs).toISOString());
  return count ?? 0;
}

async function overMonthlyCap(db: Db, settings: SparkSettings) {
  const cap = settings.monthly_conversation_cap;
  if (!cap || cap <= 0) return false;
  const { count } = await db
    .from("spark_conversations")
    .select("id", { count: "exact", head: true })
    .eq("master_plan_id", settings.master_plan_id)
    .eq("billable", true)
    .gte("started_at", monthStart());
  return (count ?? 0) >= cap;
}

export async function runSparkTurn(i: SparkTurnInput): Promise<SparkTurnResult> {
  const text = (i.text || "").replace(/\u0000/g, "").trim();
  if (!text) return { ok: false, error: "Please type a message.", status: 400 };
  if (text.length > MAX_TEXT) return { ok: false, error: `Please keep messages under ${MAX_TEXT.toLocaleString()} characters.`, status: 400 };

  const db = createServerClient();
  const conv = await findOrStartConversation(db, i);
  if (!conv) return { ok: false, error: "Something went wrong. Please try again.", status: 500 };

  if ((await countVisitorMessages(db, conv.id, 60_000)) >= PER_MINUTE || (await countVisitorMessages(db, conv.id, 600_000)) >= PER_TEN_MIN) {
    return { ok: false, error: "You're sending messages quickly — please wait a minute and try again.", status: 429 };
  }

  const booking = bookingFor(i.settings, i.site);
  const now = new Date().toISOString();

  // Canned replies (no AI call): the chat is long, or the account's monthly cap is reached.
  let canned: string | null = null;
  if (conv.message_count >= MAX_MESSAGES) {
    canned = `This chat has gotten long, so I'll hand it to the team. ${conv.visitor_email ? "They'll follow up by email." : "Leave your first name and email and they'll get back to you."}${booking ? ` You can also book a time here: ${booking}` : ""}`;
  } else if (!conv.billable && (await overMonthlyCap(db, i.settings))) {
    canned = `Thanks for reaching out! I can't chat right now — leave your first name and email and the team will get back to you personally.${booking ? ` Or book a time here: ${booking}` : ""}`;
  }

  await db.from("spark_messages").insert({ conversation_id: conv.id, role: "visitor", content: text });
  const billable = conv.billable || !canned;
  await db
    .from("spark_conversations")
    .update({ message_count: conv.message_count + 1, last_message_at: now, billable, ...(conv.summary ? {} : { summary: text.slice(0, 200) }) })
    .eq("id", conv.id);

  const { data: msgs } = await db.from("spark_messages").select("role, content").eq("conversation_id", conv.id).in("role", ["visitor", "assistant"]).order("created_at", { ascending: false }).limit(16);
  const history = ((msgs ?? []) as SparkHistoryItem[]).reverse();
  const visitorText = history.filter((m) => m.role === "visitor").map((m) => m.content).join("\n");

  let reply = canned;
  let wantsBooking = false;
  let handoff = false;
  let aiName: string | null = null;
  let aiEmail: string | null = null;
  const account = await sparkAccountAi(i.settings.master_plan_id);
  if (!reply) {
    const ai = account.key ? await sparkReply({ apiKey: account.key, settings: i.settings, channel: i.channel, site: i.site, history, known: { name: conv.visitor_name, email: conv.visitor_email } }) : null;
    if (ai) {
      reply = ai.reply;
      wantsBooking = ai.wantsBooking;
      handoff = ai.handoff;
      aiName = ai.capturedName;
      aiEmail = ai.capturedEmail;
    } else {
      reply = conv.visitor_email
        ? `Thanks! I've passed your message to the team and they'll follow up by email.${booking ? ` You can also book a time here: ${booking}` : ""}`
        : `Thanks for reaching out! I can't answer that right now — leave your first name and email and the team will get back to you personally.`;
    }
  }

  // Contact details: only what the visitor actually typed (never a guessed email).
  const typedEmail = firstEmailIn(text);
  const email = typedEmail || (aiEmail && EMAIL_RE.test(aiEmail) && visitorText.toLowerCase().includes(aiEmail) ? aiEmail : null);
  const name = cleanName(aiName);

  await db.from("spark_messages").insert({ conversation_id: conv.id, role: "assistant", content: reply });
  await db.from("spark_conversations").update({ message_count: conv.message_count + 2, last_message_at: new Date().toISOString() }).eq("id", conv.id);

  let lead: { email: string; firstName: string | null; contactId: string } | null = null;
  const updates: Record<string, unknown> = {};
  if (name && !conv.visitor_name) updates.visitor_name = name;
  const firstName = (updates.visitor_name as string) || conv.visitor_name;
  if (email && email !== conv.visitor_email) {
    const label = siteLabel(i.site, i.channel);
    const contact = await upsertContact(
      { masterPlanId: i.settings.master_plan_id, email, firstName, source: `LC Spark (${label})`, tags: ["lc-spark", i.channel === "instagram" ? "lc-spark-instagram" : "lc-spark-web"] },
      db
    );
    if (contact) {
      updates.visitor_email = email;
      updates.contact_id = contact.id;
      if (conv.contact_id !== contact.id) {
        await logEvent(i.settings.master_plan_id, contact.id, "note", "LC Spark conversation", { conversationId: conv.id, channel: i.channel, site: label, page: i.pageUrl ?? null }, db);
      }
      lead = { email, firstName, contactId: contact.id };
    }
  } else if (name && conv.visitor_email && !conv.visitor_name) {
    await upsertContact({ masterPlanId: i.settings.master_plan_id, email: conv.visitor_email, firstName: name }, db);
  }
  if (Object.keys(updates).length) await db.from("spark_conversations").update(updates).eq("id", conv.id);

  if (lead) await notifyOnce(db, conv.id, "lead", i, account.ownerEmail).catch((e) => console.error("spark notify:", e));
  if (handoff) await notifyOnce(db, conv.id, "handoff", i, account.ownerEmail).catch((e) => console.error("spark notify:", e));

  return { ok: true, reply, conversationId: conv.id, bookingUrl: wantsBooking ? booking : null, lead };
}

// ── Owner notification: one email per conversation per trigger ───────────────
// The marker is a 'system' message on the conversation (never shown to the AI).

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function notifyOnce(db: Db, conversationId: string, kind: "lead" | "handoff", i: SparkTurnInput, ownerEmail: string | null) {
  const marker = `notified:${kind}`;
  const { data: already } = await db.from("spark_messages").select("id").eq("conversation_id", conversationId).eq("role", "system").eq("content", marker).limit(1);
  if (already?.length) return;
  await db.from("spark_messages").insert({ conversation_id: conversationId, role: "system", content: marker });

  const key = process.env.RESEND_API_KEY;
  if (!key || !ownerEmail) return;
  const [{ data: conv }, { data: msgs }] = await Promise.all([
    db.from("spark_conversations").select("visitor_name, visitor_email").eq("id", conversationId).maybeSingle(),
    db.from("spark_messages").select("role, content").eq("conversation_id", conversationId).in("role", ["visitor", "assistant"]).order("created_at").limit(60),
  ]);
  const who = (conv?.visitor_name as string) || (conv?.visitor_email as string) || "A visitor";
  const where = siteLabel(i.site, i.channel);
  const name = i.settings.assistant_name || "LC Spark";
  const transcript = (msgs ?? [])
    .map((m) => `<p style="margin:0 0 8px"><strong style="color:${m.role === "visitor" ? "#1a2b4a" : "#c9a227"}">${m.role === "visitor" ? esc(who) : esc(name)}:</strong> ${esc(m.content as string).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const subject = kind === "lead" ? `LC Spark: new lead from ${where} — ${who}` : `LC Spark: ${who} asked for the team (${where})`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "LifeCharter Command Suite <reminders@lccommandsuite.com>",
      to: ownerEmail,
      ...(conv?.visitor_email ? { reply_to: conv.visitor_email } : {}),
      subject: subject.slice(0, 200),
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;max-width:560px">
<p style="font-size:16px;color:#1a2b4a"><strong>${kind === "lead" ? "LC Spark captured a new lead" : "Someone asked LC Spark for a person"}</strong></p>
<p style="color:#7a8a99">${esc(who)}${conv?.visitor_email ? ` · ${esc(conv.visitor_email as string)}` : ""} · ${esc(where)}</p>
<div style="border-left:3px solid #c9a227;padding-left:12px">${transcript}</div>
<p><a href="https://lccommandsuite.com/lc-spark" style="color:#2E7C83">Open LC Spark in the Suite</a>${conv?.visitor_email ? " · Reply to this email to answer them directly." : ""}</p></div>`,
    }),
  });
  if (!res.ok) console.error("spark notify resend:", res.status);
}
