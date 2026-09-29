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
    const rows = await listSalesContacts({ q, limit: 8 });
    return NextResponse.json({ results: rows.map((r) => ({ name: r.name, email: r.email, phone: r.phone || undefined })) });
  } catch (error) {
    console.error("Contact search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
