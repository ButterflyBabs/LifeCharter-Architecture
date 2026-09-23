import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The Collective's automatic content filter (App Store Guideline 1.2).
// Every few minutes, new or edited posts and replies go through OpenAI's
// moderation check (free, not used for training). Anything flagged is sent to
// Admin → Reports; only clearly harmful content is also hidden until an admin
// reviews it. Private messages are never scanned — members report those.
// Same CRON_SECRET convention as the other crons.

// Hidden right away (above this score) — everything else flagged only goes to review.
const HIDE: Record<string, number> = {
  "sexual/minors": 0.2,
  "harassment/threatening": 0.6,
  "hate/threatening": 0.6,
  "violence/graphic": 0.7,
  "self-harm/instructions": 0.6,
  "illicit/violent": 0.7,
  sexual: 0.85,
};

const LABEL: Record<string, string> = {
  harassment: "Harassment or bullying",
  "harassment/threatening": "Violence or threats",
  hate: "Hate or discrimination",
  "hate/threatening": "Hate or discrimination",
  sexual: "Sexual or explicit content",
  "sexual/minors": "Sexual or explicit content",
  violence: "Violence or threats",
  "violence/graphic": "Violence or threats",
  "self-harm": "Someone may be at risk of self-harm",
  "self-harm/intent": "Someone may be at risk of self-harm",
  "self-harm/instructions": "Someone may be at risk of self-harm",
  illicit: "Something else",
  "illicit/violent": "Violence or threats",
};

interface Item {
  table: "cm_posts" | "cm_comments";
  type: "post" | "comment";
  id: string;
  text: string;
}

interface ModResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && (request.headers.get("authorization") || "") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const key = process.env.OPENAI_API_KEY || process.env.PLUS_OPENAI_API_KEY || "";
  if (!key) return NextResponse.json({ ok: true, skipped: "no OpenAI key" });

  const supabase = createServerClient();
  const [{ data: posts }, { data: comments }] = await Promise.all([
    supabase.from("cm_posts").select("id, title, body").is("moderated_at", null).is("deleted_at", null).order("created_at").limit(60),
    supabase.from("cm_comments").select("id, body").is("moderated_at", null).is("deleted_at", null).order("created_at").limit(60),
  ]);
  const items: Item[] = [
    ...((posts as { id: string; title: string | null; body: string }[]) ?? []).map((p) => ({
      table: "cm_posts" as const,
      type: "post" as const,
      id: p.id,
      text: `${p.title ? `${p.title}\n` : ""}${p.body ?? ""}`,
    })),
    ...((comments as { id: string; body: string }[]) ?? []).map((c) => ({ table: "cm_comments" as const, type: "comment" as const, id: c.id, text: c.body ?? "" })),
  ].map((i) => ({ ...i, text: i.text.replace(/@\[([^\]]+)\]\([0-9a-f-]{36}\)/g, "@$1").slice(0, 4000) }));
  if (!items.length) return NextResponse.json({ ok: true, checked: 0 });

  const toCheck = items.filter((i) => i.text.trim());
  let results: ModResult[] = [];
  if (toCheck.length) {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "omni-moderation-latest", input: toCheck.map((i) => i.text) }),
    });
    if (!res.ok) {
      console.error("moderate:", res.status, await res.text().catch(() => ""));
      return NextResponse.json({ error: "moderation unavailable" }, { status: 502 });
    }
    results = ((await res.json()) as { results: ModResult[] }).results ?? [];
  }

  let flagged = 0;
  let hidden = 0;
  for (let n = 0; n < toCheck.length; n++) {
    const item = toCheck[n];
    const r = results[n];
    if (!r?.flagged) continue;
    const hits = Object.entries(r.categories).filter(([, on]) => on).map(([c]) => c);
    const top = hits.sort((a, b) => (r.category_scores[b] ?? 0) - (r.category_scores[a] ?? 0))[0];
    const hide = Object.entries(HIDE).some(([c, t]) => (r.category_scores[c] ?? 0) >= t);
    if (hide) {
      await supabase.from(item.table).update({ deleted_at: new Date().toISOString() }).eq("id", item.id);
      hidden++;
    }
    const { error } = await supabase.from("cm_reports").insert({
      reporter_id: null,
      target_type: item.type,
      target_id: item.id,
      reason: LABEL[top] ?? "Flagged by the automatic filter",
      details: `Automatic filter: ${hits.join(", ")}`,
      auto_hidden: hide,
    });
    if (error) console.error("moderate report:", error.message);
    flagged++;
  }

  const stamp = new Date().toISOString();
  const byTable = (t: Item["table"]) => items.filter((i) => i.table === t).map((i) => i.id);
  for (const t of ["cm_posts", "cm_comments"] as const) {
    const ids = byTable(t);
    if (ids.length) await supabase.from(t).update({ moderated_at: stamp }).in("id", ids);
  }
  return NextResponse.json({ ok: true, checked: items.length, flagged, hidden });
}

export const GET = run;
export const POST = run;
