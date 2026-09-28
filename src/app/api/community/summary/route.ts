import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sessionUser } from "@/lib/authz";
import { sessionsBetween } from "@/lib/community/events";

export const dynamic = "force-dynamic";

// For the Executive Home "The Collective" card: the signed-in person's unread Collective
// notifications and the next live session they can see (events for the whole Collective, or for
// a channel they belong to). Only their own data.
export async function GET() {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ member: false });
  const supabase = createServerClient();
  const [{ data: profile }, { count: unread }, { data: spaces }] = await Promise.all([
    supabase.from("cm_profiles").select("user_id, status").eq("user_id", user.id).maybeSingle(),
    supabase.from("cm_notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
    supabase.from("cm_space_members").select("space_id").eq("user_id", user.id),
  ]);
  if (!profile || profile.status === "suspended") return NextResponse.json({ member: false });
  const mine = new Set(((spaces ?? []) as { space_id: string }[]).map((s) => s.space_id));
  const now = new Date();
  const sessions = await sessionsBetween(supabase, now, new Date(now.getTime() + 30 * 86_400_000));
  const next = sessions.find((s) => s.start > now && (!s.event.space_ids?.length || s.event.space_ids.some((id) => mine.has(id))));
  return NextResponse.json({
    member: true,
    unread: unread ?? 0,
    next: next ? { title: next.event.title, start: next.start.toISOString() } : null,
  });
}
