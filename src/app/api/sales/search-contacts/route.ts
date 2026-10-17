import { NextRequest, NextResponse } from "next/server";
import { listSalesContacts } from "@/lib/salesContacts";

/**
 * Lightweight name-or-email search for the lookup panel on /sales-reference —
 * returns a short list from Babs's Suite contacts to pick from; full detail
 * (tags, recent activity) is fetched separately via /api/sales/lookup-contact.
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "A search term is required" }, { status: 400 });
  }

  try {
    // Up to 30 matches (one extra is fetched only to know whether there are more than 30).
    const rows = await listSalesContacts({ q, limit: 31 });
    return NextResponse.json({ results: rows.slice(0, 30).map((r) => ({ name: r.name, email: r.email, phone: r.phone || undefined })), more: rows.length > 30 });
  } catch (error) {
    console.error("Contact search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
