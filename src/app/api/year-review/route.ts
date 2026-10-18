import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { cleanYear, newShareToken, shareFor, yearReview } from "@/lib/yearReview";

export const dynamic = "force-dynamic";

// Year in review (task 1155).
//   GET ?year=2026                         -> the review (with money) and its share link, if any
//   POST { year, showMoney }               -> make or update the share link
//   DELETE ?year=2026                      -> turn the share link off
export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const year = cleanYear(new URL(request.url).searchParams.get("year"));
  const [review, share] = await Promise.all([yearReview(db, a.planId, year, { money: true }), shareFor(db, a.planId, year)]);
  return NextResponse.json({ review, share }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = await request.json().catch(() => ({}));
  const year = cleanYear(b.year);
  const have = await shareFor(db, a.planId, year);
  const row = { master_plan_id: a.planId, year, token: have?.token || newShareToken(), show_money: Boolean(b.showMoney) };
  const { error } = await db.from("year_review_links").upsert(row, { onConflict: "master_plan_id,year" });
  if (error) return NextResponse.json({ error: "Couldn't make the link. Please try again." }, { status: 500 });
  return NextResponse.json({ share: { token: row.token, show_money: row.show_money } });
}

export async function DELETE(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const year = cleanYear(new URL(request.url).searchParams.get("year"));
  await createServerClient().from("year_review_links").delete().eq("master_plan_id", a.planId).eq("year", year);
  return NextResponse.json({ ok: true });
}
