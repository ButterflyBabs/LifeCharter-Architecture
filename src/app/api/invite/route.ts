import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Public endpoint (see middleware PUBLIC_APIS): a newly-invited member lands here
// with a single-use token to validate it (GET) and set their password (POST).
// No session is required — the token IS the proof. It's matched by hash and must
// not be expired.

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function hashOf(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Look up the member row a token points to, if the token is valid & unexpired.
async function memberForToken(token: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("id, name, email, user_id, invite_expires_at")
    .eq("invite_token_hash", hashOf(token))
    .maybeSingle();
  if (!data) return null;
  const exp = data.invite_expires_at ? Date.parse(data.invite_expires_at as string) : 0;
  if (!exp || exp < Date.now()) return { expired: true, row: data };
  return { expired: false, row: data };
}

// GET /api/invite?token=… — validate a link and return who it's for.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "auth is not configured" }, { status: 500 });
  }
  const found = await memberForToken(token);
  if (!found) return NextResponse.json({ error: "invalid" }, { status: 404 });
  if (found.expired) return NextResponse.json({ error: "expired" }, { status: 410 });
  return NextResponse.json({
    email: (found.row.email as string) || "",
    name: (found.row.name as string) || "",
  });
}

// POST /api/invite  { token, password } — set the member's password, consume the
// token, and activate them. The client then signs in with these credentials.
export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "auth is not configured" }, { status: 500 });
  }
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });
  if (password.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 });
  }

  const found = await memberForToken(token);
  if (!found) return NextResponse.json({ error: "invalid" }, { status: 404 });
  if (found.expired) return NextResponse.json({ error: "expired" }, { status: 410 });

  const row = found.row as {
    id: string;
    email: string | null;
    user_id: string | null;
  };
  if (!row.user_id) return NextResponse.json({ error: "no login on this invite" }, { status: 400 });

  const admin = adminClient();
  const { error: updErr } = await admin.auth.admin.updateUserById(row.user_id, {
    password,
    email_confirm: true,
  });
  if (updErr) {
    console.error("invite accept updateUser:", updErr.message);
    return NextResponse.json({ error: "could not set the password" }, { status: 500 });
  }

  // Consume the token and activate the member.
  const supabase = createServerClient();
  await supabase
    .from("workspace_members")
    .update({ invite_token_hash: null, invite_expires_at: null, status: "active" })
    .eq("id", row.id);

  return NextResponse.json({ email: (row.email as string) || "" });
}
