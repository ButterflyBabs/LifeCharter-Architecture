import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ASSESSMENT_CADENCES, CADENCE_LABEL, statusFor } from "@/lib/scoring/cadence";

export const dynamic = "force-dynamic";

// Returns each assessment's cadence, when it was last taken, and whether it's
// due — the data behind the recurring check-in loop.
export async function GET() {
  const supabase = createServerClient();
  const now = Date.now();

  // Latest answered_at per assessment type from the response log.
  const { data: resp } = await supabase
    .from("unified_client_responses")
    .select("assessment_type, answered_at");
  const lastByType = new Map<string, number>();
  for (const r of (resp ?? []) as Array<{ assessment_type: string; answered_at: string | null }>) {
    if (!r.answered_at) continue;
    const t = new Date(r.answered_at).getTime();
    if (Number.isNaN(t)) continue;
    const prev = lastByType.get(r.assessment_type) ?? 0;
    if (t > prev) lastByType.set(r.assessment_type, t);
  }

  // Quick Pulse also lands in its own table.
  const { data: pulse } = await supabase
    .from("quick_pulse_checkins")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pulse?.created_at) {
    const t = new Date(pulse.created_at as string).getTime();
    if (!Number.isNaN(t)) {
      const prev = lastByType.get("quick_pulse") ?? 0;
      if (t > prev) lastByType.set("quick_pulse", t);
    }
  }

  const checkins = ASSESSMENT_CADENCES.map((a) => {
    const lastMs = lastByType.get(a.type) ?? null;
    const lastTaken = lastMs ? new Date(lastMs).toISOString() : null;
    const s = statusFor(lastTaken, a.cadence, now);
    return {
      type: a.type,
      label: a.label,
      href: a.href,
      blurb: a.blurb,
      cadence: a.cadence,
      cadenceLabel: CADENCE_LABEL[a.cadence],
      lastTaken,
      nextDue: s.nextDue,
      daysUntilDue: s.daysUntilDue,
      status: s.status,
    };
  });

  return NextResponse.json({ checkins }, { headers: { "Cache-Control": "no-store" } });
}
