import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Which version of the Suite is live right now, so a page that has been open a while can say "a newer version is ready".
export async function GET() {
  return NextResponse.json({ v: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || "dev" }, { headers: { "Cache-Control": "no-store" } });
}
