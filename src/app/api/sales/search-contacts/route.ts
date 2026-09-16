import { NextRequest, NextResponse } from "next/server";
import { searchContacts } from "@/lib/gcContactLookup";

/**
 * Lightweight name-or-email search for the lookup panel on /sales-reference —
 * returns a short list to pick from; full detail (tags, custom fields) is
 * fetched separately via /api/sales/lookup-contact once a specific contact
 * is selected, so a broad name search with several matches stays fast.
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "A search term is required" }, { status: 400 });
  }

  try {
    const results = await searchContacts(q);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Contact search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
