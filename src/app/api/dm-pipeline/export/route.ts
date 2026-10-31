import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import { ensureBoards } from "@/lib/dmPipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Spreadsheets for the cold-email tool.
//   ?kind=list&board=<id>         → people on one pipeline with their email and personal link (merge fields)
//   ?kind=suppression             → every address that must not be emailed: unsubscribed or Do Not Contact in Contacts, plus
//                                   anyone on a pipeline in a closed "asked to stop" stage
const q = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (head: string[], rows: unknown[][]) => [head, ...rows].map((r) => r.map(q).join(",")).join("\r\n") + "\r\n";

export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const u = new URL(request.url);
  const boards = await ensureBoards(db, a.planId, "outreach");
  const send = (body: string, name: string) => new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" } });

  if (u.searchParams.get("kind") === "suppression") {
    const set = new Map<string, string>();
    for (let from = 0; ; from += 1000) {
      const { data } = await db.from("seq_contacts").select("email, tags, unsubscribed_at").eq("master_plan_id", a.planId).order("id").range(from, from + 999);
      const rows = (data ?? []) as { email: string; tags: string[] | null; unsubscribed_at: string | null }[];
      for (const c of rows) if (c.email && (c.unsubscribed_at || (c.tags ?? []).includes("do-not-contact"))) set.set(c.email.toLowerCase(), "unsubscribed or do not contact");
      if (rows.length < 1000) break;
    }
    const ids = boards.map((b) => b.id);
    const { data: closed } = await db.from("dm_stages").select("id").eq("master_plan_id", a.planId).in("board_id", ids).eq("key", "not_now");
    const closedIds = ((closed ?? []) as { id: string }[]).map((s) => s.id);
    if (closedIds.length) {
      for (let from = 0; ; from += 1000) {
        const { data } = await db.from("dm_cards").select("email").eq("master_plan_id", a.planId).in("stage_id", closedIds).not("email", "is", null).order("id").range(from, from + 999);
        const rows = (data ?? []) as { email: string | null }[];
        for (const c of rows) if (c.email) set.set(c.email.toLowerCase(), set.get(c.email.toLowerCase()) ?? "stopped or bounced on a pipeline");
        if (rows.length < 1000) break;
      }
    }
    return send(csv(["email", "why"], Array.from(set.entries()).sort()), "do-not-email-suppression-list.csv");
  }

  const board = boards.find((b) => b.id === u.searchParams.get("board")) ?? boards[0];
  if (!board) return NextResponse.json({ error: "No pipeline." }, { status: 404 });
  const { data: own } = await db.from("pipeline_boards").select("personal_link_url").eq("id", board.id).maybeSingle();
  const linksReady = a.house || Boolean(own?.personal_link_url);
  const rows: unknown[][] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from("dm_cards").select("name, email, notes, link_code, stage_id").eq("master_plan_id", a.planId).eq("board_id", board.id).not("email", "is", null).order("created_at").order("id").range(from, from + 999);
    const part = (data ?? []) as { name: string; email: string; notes: string | null; link_code: string | null }[];
    for (const c of part) {
      const [first, ...rest] = c.name.split(/\s+/);
      rows.push([first, rest.join(" "), c.email, c.notes ?? "", linksReady && c.link_code ? `https://lccommandsuite.com/m/${c.link_code}` : ""]);
    }
    if (part.length < 1000) break;
  }
  return send(csv(["first_name", "last_name", "email", "company_title_location", "personal_link"], rows), `${board.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-with-personal-links.csv`);
}
