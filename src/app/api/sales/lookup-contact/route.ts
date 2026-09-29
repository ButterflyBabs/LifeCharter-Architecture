import { NextRequest, NextResponse } from "next/server";
import { lookupSalesContact } from "@/lib/salesContacts";

/**
 * Called from the contact lookup panel on /sales-reference so Marcello (or
 * anyone with real access to that page) can see a prospect's record in Babs's
 * Suite contacts — tags, last activity and recent timeline — right before or
 * during a call.
 *
 * Requires a session (not in PUBLIC_APIS) — gated the same way as the rest
 * of /sales-reference, including for the restricted "sales" role, which is
 * explicitly allow-listed for this path (src/lib/teamRoles.ts).
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  try {
    const result = await lookupSalesContact(email);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Contact lookup error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
