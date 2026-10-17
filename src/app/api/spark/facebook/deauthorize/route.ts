import { NextResponse } from "next/server";
import { parseFbSignedRequest, forgetFacebookUser } from "@/lib/spark/facebook";

export const dynamic = "force-dynamic";

// Meta calls this when a Facebook user removes the LC Spark app. Verified by Meta's signed_request; we drop that person's
// Facebook Page connection.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const data = parseFbSignedRequest((form?.get("signed_request") as string | null) ?? null);
  if (!data?.user_id) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  await forgetFacebookUser(String(data.user_id));
  return NextResponse.json({ ok: true });
}
