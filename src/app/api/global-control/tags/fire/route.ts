import { NextResponse } from "next/server";
import { getClientGcKey, fireTag, GcError } from "@/lib/globalControl";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Fire a tag on a contact (drops them into the matching Global Control
// workflow). The contact is identified by email.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const key = await getClientGcKey();
  if (!key) return NextResponse.json({ error: "Global Control is not connected." }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const tagId = typeof body.tagId === "string" ? body.tagId : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!tagId) return NextResponse.json({ error: "A tag is required." }, { status: 400 });
  if (!email) {
    return NextResponse.json(
      { error: "This contact has no email in Global Control, which the tag fire requires." },
      { status: 400 }
    );
  }

  try {
    await fireTag(key, tagId, {
      email,
      firstName: typeof body.firstName === "string" ? body.firstName : undefined,
      lastName: typeof body.lastName === "string" ? body.lastName : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = e instanceof GcError ? e.status : 502;
    return NextResponse.json(
      { error: e instanceof GcError ? e.message : "Couldn't fire the tag." },
      { status }
    );
  }
}
