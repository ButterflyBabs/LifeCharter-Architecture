import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { WELCOME_EMAILS } from "@/lib/email/welcomeContent";
import { effectiveWelcomeEmail, renderWelcomeEmail, sendWelcomeTest } from "@/lib/email/welcomeSequence";
import { crmAccount } from "../../guard";

export const dynamic = "force-dynamic";

// The LCCS New Client Welcome emails, for viewing and editing (owner's account only).
//   GET                       → every email as it will go out, and whether it has been edited
//   PUT  { key, subject, preview, body }  → save an edit (when each email goes out is not editable)
//   DELETE ?key=              → back to the original copy
//   POST { key, subject, preview, body, action: "preview" | "test" } → render it, or send it to you
// Edits apply to emails not yet sent; an email already sent stays as it was.
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

async function gate(request?: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return { denied: a.denied };
  if (!a.house) return { denied: NextResponse.json({ error: "This is on the owner's account only." }, { status: 403 }) };
  return { a };
}

export async function GET() {
  const g = await gate();
  if (g.denied) return g.denied;
  const db = createServerClient();
  const emails = [];
  for (const base of WELCOME_EMAILS) {
    const e = await effectiveWelcomeEmail(db, base.key);
    emails.push({ key: base.key, day: base.day, subject: e!.subject, preview: e!.preview, body: e!.body, edited: e!.edited, original: { subject: base.subject, preview: base.preview, body: base.body } });
  }
  return NextResponse.json({ emails });
}

export async function PUT(request: Request) {
  const g = await gate(request);
  if (g.denied) return g.denied;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const key = str(b.key, 40);
  if (!WELCOME_EMAILS.some((e) => e.key === key)) return NextResponse.json({ error: "Unknown email." }, { status: 404 });
  const subject = str(b.subject, 200);
  const body = typeof b.body === "string" ? b.body.trim().slice(0, 12000) : "";
  if (!subject || !body) return NextResponse.json({ error: "An email needs a subject and a body." }, { status: 400 });
  const db = createServerClient();
  const { error } = await db.from("lccs_welcome_email_overrides").upsert({ email_key: key, subject, preview: str(b.preview, 300), body, updated_by: g.a!.userEmail, updated_at: new Date().toISOString() }, { onConflict: "email_key" });
  if (error) return NextResponse.json({ error: "Couldn't save that. Try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const g = await gate(request);
  if (g.denied) return g.denied;
  const key = str(new URL(request.url).searchParams.get("key"), 40);
  await createServerClient().from("lccs_welcome_email_overrides").delete().eq("email_key", key);
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const g = await gate(request);
  if (g.denied) return g.denied;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const base = WELCOME_EMAILS.find((e) => e.key === str(b.key, 40));
  if (!base) return NextResponse.json({ error: "Unknown email." }, { status: 404 });
  const e = { ...base, subject: str(b.subject, 200) || base.subject, preview: str(b.preview, 300), body: (typeof b.body === "string" && b.body.trim()) || base.body };
  if (b.action === "test") {
    const to = g.a!.userEmail;
    if (!to) return NextResponse.json({ error: "No email address to send the test to." }, { status: 400 });
    const ok = await sendWelcomeTest(e, to);
    return ok ? NextResponse.json({ ok: true, to }) : NextResponse.json({ error: "The test didn't send. Check that email sending is set up." }, { status: 502 });
  }
  const { subject, html } = renderWelcomeEmail(e, { userId: "preview", email: "eloise@example.com", name: "Eloise", planId: "starter", enrolledAt: new Date().toISOString() });
  return NextResponse.json({ subject, html });
}
