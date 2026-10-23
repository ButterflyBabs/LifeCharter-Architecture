import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";

export const dynamic = "force-dynamic";

// Owner-only: which Node.js version the live server is running (checked after a Node security advisory,
// 2026-10-23). Signed in as Babs, open /api/runtime-check. Everyone else gets a plain 404.
export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ node: process.version, region: process.env.VERCEL_REGION ?? null, deployed: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null });
}
