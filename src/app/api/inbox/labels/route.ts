import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";

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
