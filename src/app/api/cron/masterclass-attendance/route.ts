import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isZoomConfigured, listMasterclassPastInstances, listPastParticipants } from "@/lib/zoom";

export const dynamic = "force-dynamic";

/**
 * Daily (vercel.json): for every MasterClass occurrence in the last 14 days, pull Zoom's list of
 * who attended and store one row per person per session in masterclass_attendance (their joins
 * summed). Re-running is safe: rows are upserted. People who joined without an email (phone
 * dial-in, guests) are counted under their name so the show rate stays honest.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isZoomConfigured()) return NextResponse.json({ error: "Zoom not configured" }, { status: 500 });

  const supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let instances;
  try {
    instances = await listMasterclassPastInstances();
  } catch (err) {
    // Most likely cause: the Zoom app is missing the past-meeting scopes.
    console.error("[masterclass-attendance] instances:", err);
    return NextResponse.json({ error: "Zoom past-meeting lookup failed", detail: String(err) }, { status: 502 });
  }

  const cutoff = Date.now() - 14 * 86400_000;
  const recent = instances.filter((i) => new Date(i.startTime).getTime() >= cutoff);
  const summary: { session: string; attendees: number }[] = [];

  for (const inst of recent) {
    const sessionDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(new Date(inst.startTime));
    let participants;
    try {
      participants = await listPastParticipants(inst.uuid);
    } catch (err) {
      console.error("[masterclass-attendance] participants", inst.uuid, err);
      continue;
    }
    const byPerson = new Map<string, { name: string; seconds: number; first: string }>();
    for (const p of participants) {
      const key = p.email || `name:${p.name.trim().toLowerCase()}`;
      if (key === "name:") continue;
      const cur = byPerson.get(key) ?? { name: p.name, seconds: 0, first: p.joinTime };
      cur.seconds += p.durationSeconds;
      if (p.joinTime && (!cur.first || p.joinTime < cur.first)) cur.first = p.joinTime;
      byPerson.set(key, cur);
    }
    const rows = Array.from(byPerson.entries()).map(([email, v]) => ({
      session_date: sessionDate,
      email,
      name: v.name || null,
      minutes: Math.round(v.seconds / 60),
      first_joined_at: v.first || null,
      zoom_meeting_uuid: inst.uuid,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length) {
      const { error } = await supabase.from("masterclass_attendance").upsert(rows, { onConflict: "session_date,email" });
      if (error) console.error("[masterclass-attendance] upsert:", error.message);
    }
    summary.push({ session: sessionDate, attendees: rows.length });
  }

  return NextResponse.json({ checked: recent.length, summary });
}
