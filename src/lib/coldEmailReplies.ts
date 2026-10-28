import { createServerClient } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServerClient>;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const FROM = process.env.TASK_REMINDER_FROM || "LifeCharter Command Suite <reminders@lccommandsuite.com>";
const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Who is told when a prospect answers a cold email, unless the account's metadata.coldReplyNotify says otherwise.
export const DEFAULT_REPLY_NOTIFY = ["sumbal@amilynnecarroll.com", "amilynne@amilynnecarroll.com"];

export type NewReply = { cardId: string; name: string; email: string; subject: string; text: string; board: string };

// The words the person wrote, without the quoted copy of our own email, tags or the signature block's long tail.
export function replyText(raw: string | null | undefined, html = false): string {
  let t = raw ?? "";
  if (html) {
    t = t
      .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
      .replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }
  t = t.replace(/\r/g, "").split(/\n\s*(?:On .{5,80} wrote:|-{2,}\s*Original Message|From:\s.+\nSent:)/)[0];
  return t.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 4000);
}

// Keeps a reply (or a stop request) with the person's card: a row for reading and answering it, and a dated line in their notes.
// True only the first time the message is seen, so the alert goes out once.
export async function recordReply(
  db: Db,
  planId: string,
  card: { id: string; notes: string | null },
  m: { id: string; threadId: string; fromEmail: string; subject: string; preview: string; ts: number },
  kind: "reply" | "stop",
  tz: string,
): Promise<boolean> {
  const text = replyText(m.preview);
  const { data } = await db
    .from("cold_email_replies")
    .upsert(
      { master_plan_id: planId, card_id: card.id, message_id: m.id, conversation_id: m.threadId || null, from_email: m.fromEmail.toLowerCase(), subject: m.subject, preview: text, kind, received_at: new Date(m.ts || Date.now()).toISOString() },
      { onConflict: "master_plan_id,message_id", ignoreDuplicates: true },
    )
    .select("id");
  if (!data?.length) return false;
  const day = new Date(m.ts || Date.now()).toLocaleDateString("en-US", { timeZone: tz, month: "short", day: "numeric" });
  const line = `${kind === "stop" ? "Asked to stop" : "Replied"} (${day}): ${text.replace(/\s+/g, " ").slice(0, 300)}`;
  await db.from("dm_cards").update({ notes: [card.notes?.trim(), line].filter(Boolean).join("\n") }).eq("id", card.id).eq("master_plan_id", planId);
  return true;
}

// One email to the people listed for the account, with what each prospect wrote.
export async function notifyReplies(to: string[], replies: NewReply[]) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to.length || !replies.length) return;
  const n = replies.length;
  const rows = replies
    .map(
      (r) => `<div style="margin:14px 0;padding:12px 14px;border-left:3px solid #C9A227;background:#faf7ef">
      <p style="margin:0 0 4px"><strong>${esc(r.name)}</strong> <span style="color:#8A8BA3">${esc(r.email)} · ${esc(r.board)}</span></p>
      <p style="margin:0;white-space:pre-wrap">${esc(r.text) || "(no text)"}</p></div>`,
    )
    .join("");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#23255C;max-width:560px">
    <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#C9A227;font-weight:700;margin:0 0 8px">LifeCharter Command Suite</p>
    <p style="font-size:20px;font-family:Georgia,serif;margin:0 0 8px">${n === 1 ? "Someone replied to your cold email" : `${n} people replied to your cold email`}</p>
    ${rows}
    <p>${n === 1 ? "Their card has" : "Their cards have"} moved to Replied. Open the card to read the whole message and answer it from there. <a href="${APP_URL}/dm-pipeline" style="color:#2E7C83">Open the pipeline</a></p>
  </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject: n === 1 ? `${replies[0].name} replied to your cold email` : `${n} people replied to your cold email`, html }),
  });
  if (!res.ok) console.error("cold reply email:", res.status, await res.text().catch(() => ""));
}
