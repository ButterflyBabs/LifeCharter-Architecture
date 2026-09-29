import { NextRequest, NextResponse } from "next/server";
import { listSalesContacts } from "@/lib/salesContacts";

// Contacts tab on /sales-reference: browse or search the OWNER's Suite contacts.
// Middleware limits /api/sales/* to the owner (super admin) and the owner's own
// team — clients and client teams can never reach it.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 120) || undefined;
  const page = Math.max(1, Math.min(500, Number(req.nextUrl.searchParams.get("page")) || 1));
  try {
    const contacts = await listSalesContacts({ q, page, limit: 25 });
    return NextResponse.json({ page, contacts });
  } catch (e) {
    console.error("sales contacts:", e);
    return NextResponse.json({ error: "Couldn't load contacts. Try again in a moment." }, { status: 500 });
  }
}
