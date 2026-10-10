import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { zoomDiagnostics } from "@/lib/zoom";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Owner-only, read-only: for every Zoom meeting used by the Collective calendar (plus the MasterClass and Incubator),
// shows whether the Suite's Zoom app can read the meeting, its past instances and its participant report.
// Used to decide how attendance syncing can work for coaching calls and events (cs268, cs245).
export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { data } = await createServerClient().from("cm_events").select("join_url").not("join_url", "is", null).limit(300);
  const ids = new Set<string>();
  for (const r of (data ?? []) as { join_url: string }[]) {
    const m = r.join_url.match(/zoom\.us\/j\/(\d{9,11})/);
    if (m) ids.add(m[1]);
  }
  return NextResponse.json(await zoomDiagnostics(Array.from(ids)));
}
