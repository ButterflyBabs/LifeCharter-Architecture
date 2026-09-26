import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// The PUBLIC side of a review request — opened by the client's own client from a
// personal link, with no account. The token is the only key: it maps to exactly
// one request, and a request takes exactly one review. Nothing about the owner's
// account is returned beyond the name on the request.
const TOKEN = /^[a-f0-9]{36}$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get("t") || "";
  if (!TOKEN.test(t)) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 });
  const db = createServerClient();
  const { data: r } = await db.from("review_requests").select("id, client_name, program, from_name, message, status").eq("token", t).maybeSingle();
  if (!r) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 });
  if (r.status === "sent") await db.from("review_requests").update({ status: "opened", opened_at: new Date().toISOString() }).eq("id", r.id);
  return NextResponse.json({ clientName: r.client_name, program: r.program, fromName: r.from_name, message: r.message, completed: r.status === "completed" });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const b = await request.json().catch(() => ({}));
  const t = str(b.t, 60);
  if (!TOKEN.test(t)) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 });
  const content = str(b.content, 5000);
  const rating = Math.round(Number(b.rating));
  if (!content) return NextResponse.json({ error: "Please write a few words." }, { status: 400 });
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "Please choose a star rating." }, { status: 400 });
  if (b.consent !== true) return NextResponse.json({ error: "Please confirm you're happy for this to be shared." }, { status: 400 });

  const db = createServerClient();
  const { data: r } = await db.from("review_requests").select("id, master_plan_id, client_name, client_email, program, status").eq("token", t).maybeSingle();
  if (!r) return NextResponse.json({ error: "This link isn't valid." }, { status: 404 });
  if (r.status === "completed") return NextResponse.json({ error: "Thank you — this review has already been received." }, { status: 409 });

  // Claim the request first — only one submission can ever win, so a double-click
  // or a reused link can't create a second review.
  const { data: claimed } = await db
    .from("review_requests")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", r.id)
    .neq("status", "completed")
    .select("id");
  if (!claimed?.length) return NextResponse.json({ error: "Thank you — this review has already been received." }, { status: 409 });

  const media = str(b.mediaUrl, 500);
  const { error } = await db.from("testimonials").insert({
    master_plan_id: r.master_plan_id, request_id: r.id,
    client_name: str(b.name, 120) || r.client_name, client_email: r.client_email, program: str(b.program, 120) || r.program,
    rating, headline: str(b.headline, 200), content, media_url: /^https?:\/\//i.test(media) ? media : "",
    type: /^https?:\/\//i.test(media) ? (["video", "audio"].includes(b.mediaType) ? b.mediaType : "video") : "text",
    status: "pending", consent: true, source: "collected",
  });
  if (error) {
    // Give the link back so they can try again.
    await db.from("review_requests").update({ status: "opened", completed_at: null }).eq("id", r.id);
    return NextResponse.json({ error: "Couldn't save your review — please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
