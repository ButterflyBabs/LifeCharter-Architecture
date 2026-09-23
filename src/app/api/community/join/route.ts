import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// New-member sign-up for The LifeCharter Collective (/join/<slug>, "New here").
// The invite code is checked here, server-side, before any account exists —
// so nobody can create a Collective login without a valid code. The account
// is created pre-confirmed (production has no SMTP for confirmation mail);
// the browser then signs in with the password it just chose.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Best-effort brake on invite-code guessing from one address (per instance).
const attempts = new Map<string, { n: number; reset: number }>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || a.reset < now) {
    attempts.set(ip, { n: 1, reset: now + 15 * 60_000 });
    return false;
  }
  a.n += 1;
  return a.n > 12;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (tooMany(ip)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const slug = String(body.slug ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim().slice(0, 80);
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim().slice(0, 32);
  const password = String(body.password ?? "");
  const code = String(body.code ?? "").trim().toUpperCase();

  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Please choose a password of at least 8 characters." }, { status: 400 });
  if (!code) return NextResponse.json({ error: "Please enter your invite code." }, { status: 400 });

  const supabase = createServerClient();

  const { data: space } = await supabase
    .from("cm_spaces")
    .select("id, join_enabled, archived")
    .eq("slug", slug)
    .maybeSingle();
  if (!space || space.archived) return NextResponse.json({ error: "This community link is no longer active." }, { status: 404 });
  if (!space.join_enabled) return NextResponse.json({ error: "This community isn't accepting new members right now." }, { status: 403 });

  const { data: codeRow } = await supabase.from("cm_space_codes").select("code").eq("space_id", space.id).maybeSingle();
  if (!codeRow || String(codeRow.code).toUpperCase() !== code) {
    return NextResponse.json({ error: "That invite code doesn't match. Please check it and try again." }, { status: 403 });
  }

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, source: "lifecharter-collective" },
  });
  if (createErr || !created?.user) {
    const msg = createErr?.message || "";
    if (/already|registered|exists/i.test(msg)) {
      return NextResponse.json(
        { error: "You already have a LifeCharter account with this email. Choose “Already a member” and sign in to join.", code: "exists" },
        { status: 409 }
      );
    }
    console.error("community join createUser:", msg);
    return NextResponse.json({ error: "We couldn't create your account. Please try again." }, { status: 500 });
  }

  const uid = created.user.id;
  const { error: memberErr } = await supabase.rpc("cm_ensure_member", { p_user: uid, p_name: name });
  if (memberErr) console.error("community join ensure_member:", memberErr.message);
  await supabase.from("cm_space_members").upsert({ space_id: space.id, user_id: uid, joined_via: "code" }, { onConflict: "space_id,user_id", ignoreDuplicates: true });
  if (phone) await supabase.from("cm_private_profiles").upsert({ user_id: uid, phone });

  return NextResponse.json({ ok: true });
}
