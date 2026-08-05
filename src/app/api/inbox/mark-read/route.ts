import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Marks a message read on its own provider (google | microsoft).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const provider = body?.provider === "microsoft" ? "microsoft" : "google";

  try {
    if (provider === "microsoft") {
      const token = await microsoft.getValidAccessToken();
      if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
      await microsoft.markRead(token, String(body.id));
    } else {
      const token = await google.getValidAccessToken();
      if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
      await google.markRead(token, String(body.id));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/inbox/mark-read:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
