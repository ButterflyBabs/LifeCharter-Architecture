import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureBoards, boardStages, createCard } from "@/lib/dmPipeline";

// LinkedIn connection requests, read from the account's own connected Microsoft 365 inbox. LinkedIn emails every
// request ("<Name> wants to connect"); each one found becomes a card on the first outreach pipeline, in "To reach out",
// with their profile link, ready for the owner to accept on LinkedIn and send a first message. Nothing is sent, and
// nothing on LinkedIn is touched. Only mail from LinkedIn's invitation address is read, and only while the account has
// switched this on (client_master_plans.metadata.linkedinRequestsOn).
const GRAPH = "https://graph.microsoft.com/v1.0";
const SENDER = "invitations@linkedin.com";
type Db = SupabaseClient;

interface GraphMsg {
  id: string;
  subject?: string;
  receivedDateTime?: string;
  bodyPreview?: string;
  from?: { emailAddress?: { name?: string; address?: string } };
  body?: { content?: string };
}

export function parseInvite(m: GraphMsg): { name: string; profileUrl: string | null; handle: string | null; preview: string } | null {
  const subject = m.subject || "";
  if (!/connect|network|invit/i.test(subject)) return null;
  let name = (m.from?.emailAddress?.name || "").replace(/\s+via LinkedIn$/i, "").trim();
  if (!name || /linkedin/i.test(name)) {
    const s = subject.match(/^(.+?)\s+(?:wants to connect|would like to connect|invited you|sent you an invitation)/i) || subject.match(/(?:invitation from|from)\s+(.+)$/i);
    name = (s?.[1] || "").trim();
  }
  if (!name || name.length > 80) return null;
  const html = m.body?.content || "";
  const slug = html.match(/linkedin\.com\/(?:comm\/)?in\/([A-Za-z0-9%_-]{2,100})/i)?.[1] ?? null;
  return {
    name,
    profileUrl: slug ? `https://www.linkedin.com/in/${slug}` : null,
    handle: slug ? `in/${decodeURIComponent(slug)}` : null,
    preview: (m.bodyPreview || "").replace(/\s+/g, " ").trim().slice(0, 200),
  };
}

export async function syncLinkedInRequests(db: Db, planId: string, token: string, tz = "America/Denver", sinceDays = 14): Promise<{ added: number; seen: number }> {
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
  const url =
    `${GRAPH}/me/messages?$filter=${encodeURIComponent(`receivedDateTime ge ${since} and from/emailAddress/address eq '${SENDER}'`)}` +
    `&$orderby=${encodeURIComponent("receivedDateTime desc")}&$top=40&$select=${encodeURIComponent("id,subject,from,receivedDateTime,bodyPreview,body")}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`graph linkedin ${r.status}`);
  const msgs = (((await r.json()) as { value?: GraphMsg[] }).value ?? []) as GraphMsg[];
  if (!msgs.length) return { added: 0, seen: 0 };

  const boards = await ensureBoards(db as never, planId, "outreach");
  const board = boards[0];
  if (!board) return { added: 0, seen: msgs.length };
  const stages = await boardStages(db as never, planId, board.id);
  const stage = stages.find((s) => s.key === "to_reach") ?? stages[0];
  if (!stage) return { added: 0, seen: msgs.length };

  const { data: logged } = await db.from("dm_inbound_log").select("external_id").eq("master_plan_id", planId).eq("source", "linkedin").in("external_id", msgs.map((m) => m.id));
  const done = new Set(((logged ?? []) as { external_id: string }[]).map((x) => x.external_id));
  let added = 0;
  for (const m of msgs.reverse()) {
    if (done.has(m.id)) continue;
    const p = parseInvite(m);
    if (!p) {
      await db.from("dm_inbound_log").upsert({ master_plan_id: planId, source: "linkedin", external_id: m.id }, { onConflict: "master_plan_id,source,external_id", ignoreDuplicates: true });
      continue;
    }
    // Already on a pipeline (same profile link): record the email and move on.
    let existing: string | null = null;
    if (p.profileUrl) {
      const { data: have } = await db.from("dm_cards").select("id").eq("master_plan_id", planId).ilike("profile_url", `%${p.profileUrl.split("/in/")[1]}%`).limit(1);
      existing = (have?.[0]?.id as string | undefined) ?? null;
    }
    let cardId = existing;
    if (!existing) {
      const res = await createCard(db as never, planId, board, stage, tz, {
        name: p.name,
        handle: p.handle,
        profileUrl: p.profileUrl,
        platform: "LI",
        notes: `Connection request received on LinkedIn (${(m.receivedDateTime || "").slice(0, 10)}). Accept it on LinkedIn, then send your first message from this card.${p.preview ? `\n${p.preview}` : ""}`,
      });
      if ("card" in res && res.card) {
        cardId = (res.card as { id: string }).id;
        added++;
        const today = new Date().toLocaleDateString("en-CA", { timeZone: tz });
        await db.from("dm_cards").update({ follow_up_on: today }).eq("id", cardId);
      }
    }
    await db.from("dm_inbound_log").upsert({ master_plan_id: planId, source: "linkedin", external_id: m.id, card_id: cardId, person_name: p.name }, { onConflict: "master_plan_id,source,external_id", ignoreDuplicates: true });
  }
  return { added, seen: msgs.length };
}
