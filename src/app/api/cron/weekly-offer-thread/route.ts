import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Every Monday morning: open this week's "Share Your Offer" thread in The
// Community → Connect & Collaborate, pin it, and unpin last week's. This is the
// one place the Community Guidelines allow promotion. Posted as the super
// admin. Safe to run more than once — it won't post twice in the same week.
// Same CRON_SECRET convention as the other crons.

const TITLE_PREFIX = "Share Your Offer";

const BODY = `This is the week's home for what you're building.

Reply to this post with a launch, an offer, an event, a free resource or a link to your work. One reply per person each week, please.

• What it is, in a sentence or two
• Who it's for
• The link, or how to reach you

Browse, cheer each other on, and reply with questions. Everywhere else in the Collective stays for connection and conversation.`;

// "September 21" — the Monday of the current week, in Mountain time.
function weekOf(now: Date): string {
  const denver = new Date(now.toLocaleString("en-US", { timeZone: "America/Denver" }));
  denver.setDate(denver.getDate() - ((denver.getDay() + 6) % 7));
  return denver.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && (request.headers.get("authorization") || "") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  const { data: space } = await supabase.from("cm_spaces").select("id").eq("slug", "commons").maybeSingle();
  if (!space) return NextResponse.json({ error: "Community channel not found" }, { status: 404 });
  const { data: channel } = await supabase
    .from("cm_channels")
    .select("id")
    .eq("space_id", space.id)
    .eq("slug", "connect-collaborate")
    .maybeSingle();
  if (!channel) return NextResponse.json({ error: "Connect & Collaborate channel not found" }, { status: 404 });

  const { data: admin } = await supabase.from("cm_admins").select("user_id").order("created_at").limit(1).maybeSingle();
  if (!admin) return NextResponse.json({ error: "No super admin to post as" }, { status: 500 });

  // Already posted this week? Matched on the week's exact title, so a
  // retried, manual or mid-week run never doubles up.
  const title = `${TITLE_PREFIX} — Week of ${weekOf(new Date())}`;
  const { data: existing } = await supabase
    .from("cm_posts")
    .select("id")
    .eq("channel_id", channel.id)
    .eq("title", title)
    .is("deleted_at", null)
    .limit(1);
  if (existing?.length) return NextResponse.json({ ok: true, skipped: "already posted this week", id: existing[0].id });

  // Unpin earlier weeks' threads so only the current one sits on top.
  await supabase.from("cm_posts").update({ pinned: false }).eq("channel_id", channel.id).like("title", `${TITLE_PREFIX}%`).eq("pinned", true);

  const { data: post, error } = await supabase
    .from("cm_posts")
    .insert({
      channel_id: channel.id,
      space_id: space.id,
      author_id: admin.user_id,
      title,
      body: BODY,
      pinned: true,
    })
    .select("id, title")
    .single();
  if (error) {
    console.error("weekly offer thread:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, post });
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
