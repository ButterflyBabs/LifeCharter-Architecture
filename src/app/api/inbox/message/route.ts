import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";

export const dynamic = "force-dynamic";

// Returns the full body of one message, from its own provider (google | microsoft).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const provider = url.searchParams.get("provider") === "microsoft" ? "microsoft" : "google";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    if (provider === "microsoft") {
      const token = await microsoft.getValidAccessToken();
      if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
      return NextResponse.json(await microsoft.fetchMessage(token, id));
    }
    const token = await google.getValidAccessToken();
    if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
    return NextResponse.json(await google.fetchMessage(token, id));
  } catch (e) {
    console.error("GET /api/inbox/message:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
