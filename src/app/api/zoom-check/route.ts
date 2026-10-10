import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { zoomDiagnostics } from "@/lib/zoom";

export const dynamic = "force-dynamic";

// Owner-only, read-only: shows which Zoom account the Suite's Zoom app is on and what it can see
// (users, upcoming meetings, participant reports). Used to decide how attendance syncing can work.
export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(await zoomDiagnostics());
}
