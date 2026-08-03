import { NextResponse } from "next/server";
import { getClientGcKey, getContact, updateContact, GcError } from "@/lib/globalControl";

export const dynamic = "force-dynamic";

// Get a single Global Control contact.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const key = await getClientGcKey();
  if (!key) return NextResponse.json({ error: "Global Control is not connected." }, { status: 400 });
  try {
    const contact = await getContact(key, params.id);
    return NextResponse.json({ contact });
  } catch (e) {
    const status = e instanceof GcError ? e.status : 502;
    return NextResponse.json(
      { error: e instanceof GcError ? e.message : "Couldn't load the contact." },
      { status }
    );
  }
}

// Update a contact's editable fields (name, email, phone) and push back to
// Global Control.
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const key = await getClientGcKey();
  if (!key) return NextResponse.json({ error: "Global Control is not connected." }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const patch: { firstName?: string; lastName?: string; email?: string; phone?: string } = {};
  if (typeof body.firstName === "string") patch.firstName = body.firstName.trim();
  if (typeof body.lastName === "string") patch.lastName = body.lastName.trim();
  if (typeof body.email === "string") patch.email = body.email.trim();
  if (typeof body.phone === "string") patch.phone = body.phone.trim();

  try {
    const contact = await updateContact(key, params.id, patch);
    return NextResponse.json({ contact });
  } catch (e) {
    const status = e instanceof GcError ? e.status : 502;
    return NextResponse.json(
      { error: e instanceof GcError ? e.message : "Couldn't save the contact." },
      { status }
    );
  }
}
