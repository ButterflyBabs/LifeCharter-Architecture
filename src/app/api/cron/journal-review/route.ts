import { NextResponse } from "next/server";
import { aiJson, collectiveAiFor, logAiUse } from "@/lib/community/ai";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Mariposa's Sunday week-in-review (Collective Plus, and Command Suite clients
// on their own AI). For every member with journal reminders on who journaled
// this week, Mariposa reads the week and writes a short personal review; it's
// saved to their journal and sent as a notification (in-app, push, email).
// Only for members who have allowed Mariposa. Same CRON_SECRET convention as
// the other crons; never writes twice a week.
// ?user=<id> runs it for one member (testing).

function denverWeekStart(now: Date): string {
  const d = new Date(now.toLocaleString("en-US", { timeZone: "America/Denver" }));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface Entry {
  user_id: string;
  kind: string;
  headline: string | null;
  private_note: string | null;
  dimension: string | null;
  rating: number | null;
  carry_forward: string | null;
}

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && (request.headers.get("authorization") || "") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const onlyUser = url.searchParams.get("user");
  const supabase = createServerClient();
  const week = denverWeekStart(new Date());

  let q = supabase.from("cm_profiles").select("user_id, display_name").eq("status", "active").eq("journal_reminders", true).not("ai_consent_at", "is", null);
  if (onlyUser) q = q.eq("user_id", onlyUser);
  const { data: members } = await q;
  const ids = ((members as { user_id: string; display_name: string }[]) ?? []).map((m) => m.user_id);
  if (!ids.length) return NextResponse.json({ ok: true, reviewed: 0 });

  const [{ data: entries }, { data: done }, { data: focuses }] = await Promise.all([
    supabase.from("cm_journal_entries").select("user_id, kind, headline, private_note, dimension, rating, carry_forward").eq("week_start", week).in("user_id", ids),
    supabase.from("cm_journal_reviews").select("user_id").eq("week_start", week).in("user_id", ids),
    supabase.from("cm_journal_focus").select("user_id, title, ends_on").eq("status", "active").in("user_id", ids),
  ]);
  const already = new Set(((done as { user_id: string }[]) ?? []).map((d) => d.user_id));
  const byUser = new Map<string, Entry[]>();
  for (const e of (entries as Entry[]) ?? []) {
    if (already.has(e.user_id)) continue;
    if (!byUser.has(e.user_id)) byUser.set(e.user_id, []);
    byUser.get(e.user_id)!.push(e);
  }
  const focusBy = new Map(((focuses as { user_id: string; title: string; ends_on: string }[]) ?? []).map((f) => [f.user_id, f]));
  const names = new Map(((members as { user_id: string; display_name: string }[]) ?? []).map((m) => [m.user_id, m.display_name]));

  const results = { reviewed: 0, noAccess: 0, failed: 0 };
  const queue = Array.from(byUser.entries());

  async function reviewOne([userId, list]: [string, Entry[]]) {
    const { data: au } = await supabase.auth.admin.getUserById(userId);
    const ai = await collectiveAiFor({ id: userId, email: au?.user?.email ?? null });
    if (!ai.key || !ai.source) {
      results.noAccess++;
      return;
    }
    const first = (names.get(userId) ?? "").split(" ")[0] || "friend";
    const focus = focusBy.get(userId);
    const sys =
      `You are ${ai.name}, a warm, grounded LifeCharter coach. Write ${first}'s private Sunday week-in-review from their Alignment Journal. ` +
      "Speak to them directly and kindly, plainly, no hype, no emojis. Only use what they wrote — never invent events. " +
      "opening: 1–2 sentences acknowledging their week (use their name once). highlights: 2–4 short bullets of what actually moved. " +
      "noticing: one honest observation (a pattern, a tension, or something they might be overlooking). " +
      "next_focus: one concrete, gentle focus for the week ahead (<= 140 chars)" +
      (focus ? `, connected to their 90-day focus when it fits` : "") +
      '. Return STRICT JSON: {"opening":"...","highlights":["..."],"noticing":"...","next_focus":"..."}';
    const text =
      (focus ? `90-day focus (until ${focus.ends_on}): ${focus.title}\n` : "") +
      list
        .map((e) =>
          [e.kind.toUpperCase(), e.headline, e.rating ? `alignment ${e.rating}/5` : "", e.dimension ? `area: ${e.dimension}` : "", e.private_note?.slice(0, 600) ?? "", e.carry_forward ? `carry forward: ${e.carry_forward}` : ""]
            .filter(Boolean)
            .join(" | ")
        )
        .join("\n");
    try {
      const p = await aiJson(ai.key, sys, text, 600);
      const body = {
        opening: str(p.opening, 400),
        highlights: Array.isArray(p.highlights) ? p.highlights.map((h) => str(h, 220)).filter(Boolean).slice(0, 4) : [],
        noticing: str(p.noticing, 400),
        next_focus: str(p.next_focus, 200),
      };
      if (!body.opening && !body.highlights.length) throw new Error("empty");
      const { error } = await supabase.from("cm_journal_reviews").insert({ user_id: userId, week_start: week, body });
      if (error) throw new Error(error.message);
      await logAiUse(userId, "week_review", ai.source);
      await supabase.from("cm_notifications").insert({
        user_id: userId,
        kind: "journal_review",
        title: `${ai.name}'s review of your week`,
        body: body.next_focus ? `For the week ahead: ${body.next_focus}` : body.opening,
        href: "/community/journal",
      });
      results.reviewed++;
    } catch (e) {
      console.error(`journal-review ${userId}:`, e);
      results.failed++;
    }
  }

  // A few at a time so a big Sunday stays well inside the time limit.
  const workers = Array.from({ length: 4 }, async () => {
    for (let item = queue.shift(); item; item = queue.shift()) await reviewOne(item);
  });
  await Promise.all(workers);
  return NextResponse.json({ ok: true, week, ...results });
}

export const GET = run;
export const POST = run;
