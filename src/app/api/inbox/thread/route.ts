import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";

export const dynamic = "force-dynamic";

// All messages in a conversation (Gmail thread / Microsoft conversation), oldest first.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const provider = url.searchParams.get("provider") === "microsoft" ? "microsoft" : "google";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const lib = provider === "microsoft" ? microsoft : google;
  try {
    const token = await lib.getValidAccessToken();
    if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
    const messages = await lib.fetchThread(token, id);
    return NextResponse.json({ messages });
  } catch (e) {
    console.error("GET /api/inbox/thread:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
