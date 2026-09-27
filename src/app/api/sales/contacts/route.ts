import { NextRequest, NextResponse } from "next/server";
import { listContacts, GcError } from "@/lib/globalControl";

// Contacts tab on /sales-reference: browse or search the OWNER's Global Control contacts
// with the house key. Middleware limits /api/sales/* to the owner (super admin) and the
// owner's own team — clients and client teams can never reach it.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const key = process.env.GLOBAL_CONTROL_API_KEY;
  if (!key) return NextResponse.json({ error: "Global Control isn't connected." }, { status: 503 });

  const search = req.nextUrl.searchParams.get("q")?.trim().slice(0, 120) || undefined;
  const page = Math.max(1, Math.min(500, Number(req.nextUrl.searchParams.get("page")) || 1));
  try {
    const { contacts } = await listContacts(key, { page, limit: 25, search });
    return NextResponse.json({
      page,
      contacts: contacts.map((c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, tags: c.tags.length, lastActiveAt: c.lastActiveAt })),
    });
  } catch (e) {
    console.error("sales contacts:", e instanceof GcError ? e.message : e);
    return NextResponse.json({ error: "Global Control didn't answer. Try again in a moment." }, { status: 502 });
  }
}
