import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Multi-business hierarchy for the Segments view:
// businesses -> segments -> 12 dimension health scores.
export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, color, icon, sort_order, active, " +
        "segments ( id, name, slug, color, icon, health, sort_order, " +
        "segment_dimensions ( dimension_key, score, health ) )"
    )
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("GET /api/segments:", error.message);
    return NextResponse.json({ businesses: [], error: error.message }, { status: 200 });
  }

  // Sort nested collections deterministically (PostgREST doesn't order embeds).
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const businesses = rows
    .filter((b) => b.active !== false)
    .map((b) => {
      const segments = ((b.segments as Array<Record<string, unknown>>) ?? [])
        .slice()
        .sort((a, c) => Number(a.sort_order ?? 0) - Number(c.sort_order ?? 0));
      return { ...b, segments };
    });

  return NextResponse.json({ businesses });
}
