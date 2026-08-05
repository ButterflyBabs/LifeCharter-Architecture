import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

// Lightweight identity/role probe for the client UI (e.g. whether to show the
// coach-override control). The authoritative gate is server-side on the
// privileged routes themselves.
export async function GET() {
  return NextResponse.json(
    { superAdmin: await isSuperAdmin() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
