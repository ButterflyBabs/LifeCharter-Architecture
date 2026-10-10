import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/housePlan";
import { DEMO_PLAN_NAME } from "@/lib/scoring/masterPlan";
import { emailOwner } from "@/lib/ai/redFlags";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Disengagement check (Babs, 2026-10-10: "no logins for two weeks ... flag for outreach"). Once a day it finds paying
// clients whose account is at least two weeks old and who have not signed in for two weeks, records one flag per
// client per fortnight, and sends ONE short digest to the account owner. Nothing goes to the clients.
// Same CRON_SECRET convention as the other jobs; the path is listed in PUBLIC_APIS in the middleware.

const DAYS = 14;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const house = await housePlanId(db);
  const cutoff = new Date(Date.now() - DAYS * 86_400_000);
  const { data: plans } = await db
    .from("client_master_plans")
    .select("id, user_id, client_name, client_email, created_at, status")
    .not("user_id", "is", null)
    .eq("status", "active")
    .lte("created_at", cutoff.toISOString())
    .limit(500);
  const candidates = ((plans ?? []) as { id: string; user_id: string; client_name: string | null; client_email: string | null; created_at: string }[]).filter(
    (p) => p.id !== house && p.client_name !== DEMO_PLAN_NAME && p.client_name !== "Primary" && p.client_email
  );
  if (!candidates.length) return NextResponse.json({ ok: true, checked: 0, flagged: 0 });

  const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
  const { data: recent } = await db.from("assistant_red_flags").select("master_plan_id").eq("kind", "disengaged").gte("created_at", since);
  const already = new Set(((recent ?? []) as { master_plan_id: string }[]).map((r) => r.master_plan_id));

  const quiet: { id: string; name: string; email: string; days: number }[] = [];
  for (const c of candidates) {
    if (already.has(c.id)) continue;
    const { data } = await db.auth.admin.getUserById(c.user_id);
    const last = data?.user?.last_sign_in_at ? new Date(data.user.last_sign_in_at) : null;
    if (last && last >= cutoff) continue;
    const ref = last ?? new Date(c.created_at);
    quiet.push({ id: c.id, name: c.client_name || c.client_email!, email: c.client_email!, days: Math.floor((Date.now() - ref.getTime()) / 86_400_000) });
  }
  if (!quiet.length) return NextResponse.json({ ok: true, checked: candidates.length, flagged: 0 });

  await db.from("assistant_red_flags").insert(quiet.map((q) => ({ master_plan_id: q.id, kind: "disengaged", note: `${q.days} days` })));
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const ok = await emailOwner(
    `${quiet.length} client${quiet.length === 1 ? "" : "s"} to reach out to`,
    `<p>These clients haven't signed in for two weeks or more. A short personal note usually helps.</p><ul>${quiet
      .map((q) => `<li><strong>${esc(q.name)}</strong> (${esc(q.email)}): ${q.days} days since they last signed in</li>`)
      .join("")}</ul>`
  );
  if (ok) await db.from("assistant_red_flags").update({ notified_at: new Date().toISOString() }).eq("kind", "disengaged").in("master_plan_id", quiet.map((q) => q.id)).gte("created_at", since);
  return NextResponse.json({ ok: true, checked: candidates.length, flagged: quiet.length, emailed: ok });
}
export const GET = run;
export const POST = run;
