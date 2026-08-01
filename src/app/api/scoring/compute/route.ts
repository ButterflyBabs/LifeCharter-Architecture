import { NextResponse } from "next/server";
import { gatherAndCompute } from "@/lib/scoring/gather";

export const dynamic = "force-dynamic";

/**
 * Runs the scoring engine over whatever assessment/operational data currently
 * exists and returns the full breakdown (per-source, freshness, partial flags).
 * Useful for inspection and as the future "recompute + persist" hook. Service
 * role — no auth gate — matching the single-user app.
 */
export async function GET() {
  try {
    const result = await gatherAndCompute();
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("GET /api/scoring/compute:", e);
    return NextResponse.json({ error: "compute failed" }, { status: 500 });
  }
}
