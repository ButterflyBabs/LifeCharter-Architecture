import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { provisionAccountForEmail } from "@/lib/provisionAccount";
import { logEvent } from "@/lib/crm";
import { WELCOME_EMAILS } from "@/lib/email/welcomeContent";
import { renderAccountReadyEmail, sendAccountReadyEmail, ACCOUNT_EMAIL_COPY_TO } from "@/lib/email/accountReadyEmail";
import { crmAccount } from "../crm/guard";

export const dynamic = "force-dynamic";

// Creates stand-alone VIP Command Suite accounts for people in Babs's Contacts and emails each a
// choose-your-password link (Babs only). The new account starts at Set up Suite (the first-run gate) and
// Day 1 of First 30 Days is the day it is created, so create them when the email goes out.
//   POST { people: [{ email, oneToOne? }], send: false }  → preview: the exact emails, nothing created or sent
//   POST { people: [...], send: true }                    → create, email (hidden copy to AmiLynne), tag, log
// The automatic welcome series is held for these people (its Day 1 email tells them to start the Brain
// assessment today); the six welcome keys are recorded as "claimed" so none go out.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";

type Person = { email: string; oneToOne?: string };

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  if (!a.isArchitect) return NextResponse.json({ error: "This is private." }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as { people?: Person[]; send?: boolean };
  const people = (Array.isArray(b.people) ? b.people : []).slice(0, 10);
  if (!people.length) return NextResponse.json({ error: "Name the people." }, { status: 400 });
  const send = b.send === true;
  const db = createServerClient();
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  const out: Record<string, unknown>[] = [];

  for (const p of people) {
    const email = String(p.email || "").trim().toLowerCase();
    const { data: c } = await db.from("seq_contacts").select("id, first_name, last_name, tags").eq("master_plan_id", a.planId).eq("email", email).maybeSingle();
    if (!c) {
      out.push({ email, error: "Not in your Contacts." });
      continue;
    }
    const first = (c.first_name as string | null) || "";
    const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ") || null;
    const { data: plan } = await db.from("client_master_plans").select("id").eq("client_email", email).limit(1).maybeSingle();
    // Their MasterClass link: the first active product link of their affiliate record.
    const { data: aff } = await db.from("affiliates").select("id").eq("master_plan_id", a.planId).eq("contact_id", c.id as string).maybeSingle();
    const { data: link } = aff ? await db.from("affiliate_links").select("code").eq("affiliate_id", aff.id as string).eq("status", "active").order("created_at").limit(1).maybeSingle() : { data: null };
    const masterclassLink = link ? `${APP_URL}/r/${link.code}` : null;
    const input = { firstName: first, loginUrl: "https://lccommandsuite.com/…the-one-time-link-is-made-at-send…", oneToOne: p.oneToOne?.trim() || null, holdAssessments: true, masterclassLink };

    if (!send) {
      out.push({ email, name: fullName, alreadyHasAccount: Boolean(plan), copyTo: ACCOUNT_EMAIL_COPY_TO, ...renderAccountReadyEmail(input) });
      continue;
    }
    if (plan) {
      out.push({ email, error: "This email already has an account. Nothing was changed." });
      continue;
    }

    let userId: string;
    try {
      ({ userId } = await provisionAccountForEmail(email, "vip", fullName, { skipWelcome: true }));
    } catch (e) {
      console.error("[new-accounts] provision failed:", e);
      out.push({ email, error: "The account couldn't be created. Nothing was emailed." });
      continue;
    }
    // Hold the automatic welcome series for them.
    await db.from("lccs_welcome_log").upsert(WELCOME_EMAILS.map((w) => ({ user_id: userId, email_key: w.key })), { onConflict: "user_id,email_key", ignoreDuplicates: true });

    const { data: gen } = await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: `${APP_URL}/auth/callback?next=/reset-password` } });
    const loginUrl = gen?.properties?.action_link ?? null;
    const emailed = loginUrl ? await sendAccountReadyEmail(email, { ...input, loginUrl }) : false;

    const tags = Array.from(new Set([...((c.tags as string[]) ?? []), "lccs-account", "vip-account"]));
    await db.from("seq_contacts").update({ tags, tag_source: "new-accounts" }).eq("id", c.id as string);
    await logEvent(a.planId, c.id as string, "manual", `Command Suite VIP account created${emailed ? "; password email sent (copy to AmiLynne)" : "; the password email did NOT send"}`, { holdAssessments: true }, db).catch(() => {});
    out.push({ email, name: fullName, created: true, emailed, loginUrl: emailed ? undefined : loginUrl });
  }
  return NextResponse.json({ send, results: out });
}
