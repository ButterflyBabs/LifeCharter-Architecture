import { createServerClient } from "@/lib/supabase/server";
import { icsFor, type EventRow } from "@/lib/events";

export const dynamic = "force-dynamic";

// Add a live event to Apple Calendar or Outlook.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const { data } = await createServerClient().from("events").select("*").eq("slug", params.slug).maybeSingle();
  const e = data as EventRow | null;
  if (!e || e.status === "draft" || e.kind !== "live" || !e.starts_at) return new Response("Not found", { status: 404 });
  return new Response(icsFor(e), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${e.slug}.ics"` } });
}
