import { NextResponse } from "next/server";
import { parseSignedRequest, forgetInstagramUser } from "@/lib/spark/instagram";

export const dynamic = "force-dynamic";

// Meta calls this when an Instagram account removes the LC Spark app. Verified by
// Meta's signed_request; we drop that account's Instagram connection.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const data = parseSignedRequest((form?.get("signed_request") as string | null) ?? null);
  if (!data?.user_id) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  await forgetInstagramUser(String(data.user_id));
  return NextResponse.json({ ok: true });
}
