import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Available labels (Gmail) / categories (Outlook) for one provider.
export async function GET(request: Request) {
  const provider =
    new URL(request.url).searchParams.get("provider") === "microsoft" ? "microsoft" : "google";
  const lib = provider === "microsoft" ? microsoft : google;
  try {
    const token = await lib.getValidAccessToken();
    if (!token) return NextResponse.json({ labels: [] });
    return NextResponse.json({ labels: await lib.listLabels(token) });
  } catch (e) {
    console.error("GET /api/inbox/labels:", e);
    return NextResponse.json({ labels: [], error: String(e) }, { status: 200 });
  }
}

// Create a new label (Gmail) / category (Outlook).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const name = (body?.name ? String(body.name) : "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const provider = body?.provider === "microsoft" ? "microsoft" : "google";
  const lib = provider === "microsoft" ? microsoft : google;
  try {
    const token = await lib.getValidAccessToken();
    if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
    return NextResponse.json({ label: await lib.createLabel(token, name) });
  } catch (e) {
    console.error("POST /api/inbox/labels:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
