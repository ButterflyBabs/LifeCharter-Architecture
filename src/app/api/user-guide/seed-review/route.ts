import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { GUIDE_DRAFTS } from "@/lib/userGuide/drafts";
import type { GuideEntry } from "@/lib/userGuide/types";

export const dynamic = "force-dynamic";

// Writes the current batch of User Guide drafts to a review page on Babs's account, one Edit and Approve per entry. The token is
// a one-time value put in app_settings for the run and deleted here. POST { token, slug, title, after } (after = the page it follows).
const textOf = (e: GuideEntry) =>
  [
    `What it is: ${e.what}`,
    `Where to find it: ${e.where}`,
    `How AI is part of it: ${e.ai}${e.aiNote ? `. ${e.aiNote}` : ""}`,
    `Day to day:\n${e.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
    `Business health: ${e.health}`,
    ...(e.sections ?? []).map((s) => `${s.title}: ${s.body}`),
    `Tips:\n${e.tips.map((t) => `- ${t}`).join("\n")}`,
    `Common questions:\n${e.questions.map((q) => `Q: ${q.q}\nA: ${q.a}`).join("\n")}`,
    `Who sees it: ${e.who}`,
  ].join("\n\n");

export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as { token?: string; slug?: string; title?: string; after?: string };
  const db = createServerClient();
  const { data: row } = await db.from("app_settings").select("value").eq("key", "user-guide-seed-token").maybeSingle();
  const stored = String(row?.value ?? "").replace(/"/g, "");
  if (!stored || stored.length < 24 || b.token !== stored) return NextResponse.json({ error: "not found" }, { status: 404 });
  await db.from("app_settings").delete().eq("key", "user-guide-seed-token");
  if (!/^user-guide-entries-[a-z-]+$/.test(b.slug ?? "") || !b.title || !b.after) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { data: prev } = await db.from("custom_pages").select("master_plan_id, position, nav_section, created_by").eq("slug", b.after).maybeSingle();
  if (!prev) return NextResponse.json({ error: "no page to follow" }, { status: 400 });
  const blocks = [
    { id: "intro", type: "callout", text: `Each entry has its own Edit and Approve. ${b.title}: ${GUIDE_DRAFTS.length} entries.` },
    ...GUIDE_DRAFTS.flatMap((e, i) => [
      { id: `h${i + 1}`, type: "heading", text: e.name },
      { id: `e${i + 1}`, type: "text", text: textOf(e), review: "draft" },
    ]),
  ];
  const { error } = await db.from("custom_pages").insert({ master_plan_id: prev.master_plan_id, slug: b.slug, title: `User Guide: ${b.title}`, blocks, position: Number(prev.position) + 1, nav_section: prev.nav_section, review_status: "draft", created_by: prev.created_by });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, entries: GUIDE_DRAFTS.length });
}
