import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { parseFbSignedRequest, forgetFacebookUser } from "@/lib/spark/facebook";

export const dynamic = "force-dynamic";

// Meta's data deletion callback. Verified by signed_request; deletes what LC Spark holds for that Facebook user right away
// and returns a status link + code.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const data = parseFbSignedRequest((form?.get("signed_request") as string | null) ?? null);
  if (!data?.user_id) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  await forgetFacebookUser(String(data.user_id));
  const code = createHash("sha256").update(`spark-fb-del:${data.user_id}`).digest("hex").slice(0, 16);
  return NextResponse.json({ url: `https://lccommandsuite.com/api/spark/facebook/data-deletion?code=${code}`, confirmation_code: code });
}

// The status link Meta shows the person: deletion runs immediately, so it's always complete.
export async function GET(request: Request) {
  const code = (new URL(request.url).searchParams.get("code") || "").replace(/[^a-f0-9]/g, "").slice(0, 16);
  return new NextResponse(
    `LC Spark data deletion${code ? ` (confirmation ${code})` : ""}: complete. Your Facebook connection and LC Spark Facebook conversations have been deleted. Questions: support@lccommandsuite.com`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}
