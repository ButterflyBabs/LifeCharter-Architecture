import { NextRequest, NextResponse } from "next/server";
import { lookupContactByEmail } from "@/lib/gcContactLookup";

/**
 * Called from the contact lookup panel on /sales-reference so Marcello (or
 * anyone with real access to that page) can see a prospect's actual Global
 * Control record — tags, status, custom fields — right before or during a
 * call, instead of tabbing over to Global Control mid-conversation.
 *
 * Requires a session (not in PUBLIC_APIS) — gated the same way as the rest
 * of /sales-reference, including for the restricted "sales" role, which is
 * explicitly allow-listed for this path in middleware.ts.
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  try {
    const result = await lookupContactByEmail(email);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Contact lookup error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
