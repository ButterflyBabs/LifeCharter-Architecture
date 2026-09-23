import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Gentle journal nudges, on by default (members turn them off in Profile):
//   Monday  — "Set this week's intention" (only if they haven't yet)
//   Friday  — "What did you move forward this week?"
// Sent in-app and as push only — marked emailed so the digest skips them.
// Same CRON_SECRET convention as the other crons. Won't double-send a day.

function denverWeekStart(now: Date): string {
  const d = new Date(now.toLocaleString("en-US", { timeZone: "America/Denver" }));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && (request.headers.get("authorization") || "") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const now = new Date();
  const day = new Date(now.toLocaleString("en-US", { timeZone: "America/Denver" })).getDay();
  const which = url.searchParams.get("which") ?? (day === 1 ? "monday" : day === 5 ? "friday" : null);
  if (which !== "monday" && which !== "friday") return NextResponse.json({ ok: true, skipped: "not a reminder day" });

  const supabase = createServerClient();
  const { data: members } = await supabase.from("cm_profiles").select("user_id").eq("status", "active").eq("journal_reminders", true);
  let targets = ((members as { user_id: string }[]) ?? []).map((m) => m.user_id);
  if (!targets.length) return NextResponse.json({ ok: true, sent: 0 });

  const week = denverWeekStart(now);
  if (which === "monday") {
    const { data: done } = await supabase.from("cm_journal_entries").select("user_id").eq("kind", "intention").eq("week_start", week).in("user_id", targets);
    const set = new Set(((done as { user_id: string }[]) ?? []).map((d) => d.user_id));
    targets = targets.filter((t) => !set.has(t));
  }

  // Don't send the same reminder twice in a day.
  const since = new Date(now.getTime() - 20 * 3600_000).toISOString();
  const { data: already } = await supabase.from("cm_notifications").select("user_id").eq("kind", "journal").gte("created_at", since).in("user_id", targets);
  const sent = new Set(((already as { user_id: string }[]) ?? []).map((r) => r.user_id));
  targets = targets.filter((t) => !sent.has(t));
  if (!targets.length) return NextResponse.json({ ok: true, sent: 0 });

  const note =
    which === "monday"
      ? { title: "Set this week's intention", body: "What are you aligning with this week? Take a minute in your Alignment Journal.", href: "/community/journal?new=intention" }
      : { title: "What did you move forward this week?", body: "Capture a win in your Alignment Journal — big or small, it counts.", href: "/community/journal?new=win" };
  const stamp = new Date().toISOString();
  const { error } = await supabase
    .from("cm_notifications")
    .insert(targets.map((user_id) => ({ user_id, kind: "journal", ...note, emailed_at: stamp })));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, which, sent: targets.length });
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
