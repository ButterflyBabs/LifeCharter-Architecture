import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect, superAdminEmails } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { DEMO_PLAN_NAME } from "@/lib/scoring/masterPlan";
import { siteKey } from "@/lib/websiteReviews";

export const dynamic = "force-dynamic";

// Owner-only queue of Website Alignment Reviews: every client account, its website, when the
// Review is due (14 days after enrolling), and the Review itself. Claude writes each Review;
// Publish puts it in the client's account and emails them.

export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const supabase = createServerClient();
  const admins = superAdminEmails();
  const [{ data: plans }, { data: spaces }, { data: reviews }] = await Promise.all([
    supabase.from("client_master_plans").select("id, client_name, client_email, user_id, created_at").not("user_id", "is", null).order("created_at", { ascending: false }),
    supabase.from("workspaces").select("master_plan_id, website, is_default"),
    supabase.from("website_reviews").select("id, master_plan_id, website, status, content, published_at, updated_at, created_at").order("created_at", { ascending: true }),
  ]);
  const site = new Map<string, string>();
  for (const w of (spaces ?? []) as { master_plan_id: string | null; website: string | null; is_default: boolean | null }[]) {
    if (w.master_plan_id && w.website?.trim() && (w.is_default || !site.has(w.master_plan_id))) site.set(w.master_plan_id, w.website.trim());
  }
  type Rev = { id: string; master_plan_id: string; website: string; status: "draft" | "published"; content: string | null; published_at: string | null; created_at: string };
  const byPlan = new Map<string, Rev[]>();
  for (const r of (reviews ?? []) as Rev[]) byPlan.set(r.master_plan_id, [...(byPlan.get(r.master_plan_id) ?? []), r]);
  // One entry for each website: a client on a bigger plan can have several, each with its own Review.
  const clients = ((plans ?? []) as { id: string; client_name: string | null; client_email: string | null; created_at: string }[])
    .filter((p) => p.client_name !== DEMO_PLAN_NAME && !admins.includes((p.client_email || "").toLowerCase()))
    .flatMap((p) => {
      const rs = byPlan.get(p.id) ?? [];
      const main = site.get(p.id) ?? "";
      const entries = rs.map((r, i) => ({
        masterPlanId: p.id,
        siteId: r.id,
        name: p.client_name,
        email: p.client_email,
        enrolledAt: p.created_at,
        due: new Date(new Date(i === 0 ? p.created_at : r.created_at).getTime() + 14 * 86400_000).toISOString(),
        website: r.website,
        siteNumber: i + 1,
        siteCount: rs.length,
        review: r.content ? { status: r.status, content: r.content, published_at: r.published_at } : null,
      }));
      // A client whose website is saved but has no row yet (before they opened their page).
      if (main && !rs.some((r) => siteKey(r.website) === siteKey(main))) {
        entries.unshift({ masterPlanId: p.id, siteId: "", name: p.client_name, email: p.client_email, enrolledAt: p.created_at, due: new Date(new Date(p.created_at).getTime() + 14 * 86400_000).toISOString(), website: main, siteNumber: 1, siteCount: rs.length + 1, review: null });
      }
      if (!entries.length) entries.push({ masterPlanId: p.id, siteId: "", name: p.client_name, email: p.client_email, enrolledAt: p.created_at, due: new Date(new Date(p.created_at).getTime() + 14 * 86400_000).toISOString(), website: "", siteNumber: 1, siteCount: 1, review: null });
      return entries;
    });
  return NextResponse.json({ clients });
}

// PUT { masterPlanId, siteId?, website?, content, publish }: save a draft for one website, or publish it and email the client.
export async function PUT(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const masterPlanId = typeof body.masterPlanId === "string" ? body.masterPlanId : "";
  const siteId = typeof body.siteId === "string" && /^[0-9a-f-]{36}$/i.test(body.siteId) ? body.siteId : "";
  const content = typeof body.content === "string" ? body.content.trim().slice(0, 40000) : "";
  const publish = body.publish === true;
  if (!masterPlanId || !content) return NextResponse.json({ error: "Write the Review first." }, { status: 400 });

  const supabase = createServerClient();
  const { data: plan } = await supabase.from("client_master_plans").select("client_name, client_email").eq("id", masterPlanId).maybeSingle();
  if (!plan) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  // Which website: the one named, else the client's main website.
  let row: { id: string; website: string; status: string } | null = null;
  if (siteId) {
    const { data } = await supabase.from("website_reviews").select("id, website, status").eq("id", siteId).eq("master_plan_id", masterPlanId).maybeSingle();
    row = (data as typeof row) ?? null;
  } else {
    const { data: ws } = await supabase.from("workspaces").select("website").eq("master_plan_id", masterPlanId).order("is_default", { ascending: false }).limit(1).maybeSingle();
    const main = ((ws?.website as string) || "").trim();
    if (main) {
      const { data: all } = await supabase.from("website_reviews").select("id, website, status").eq("master_plan_id", masterPlanId);
      row = ((all ?? []) as { id: string; website: string; status: string }[]).find((r) => siteKey(r.website) === siteKey(main)) ?? null;
      if (!row) {
        const { data: made } = await supabase.from("website_reviews").insert({ master_plan_id: masterPlanId, website: main }).select("id, website, status").maybeSingle();
        row = (made as typeof row) ?? null;
      }
    }
  }
  if (!row) return NextResponse.json({ error: "That client has no website to review yet." }, { status: 400 });
  const now = new Date().toISOString();
  const wasPublished = row.status === "published";

  const { error } = await supabase.from("website_reviews").update({
    content,
    status: publish || wasPublished ? "published" : "draft",
    ...(publish && !wasPublished ? { published_at: now } : {}),
    updated_at: now,
  }).eq("id", row.id);
  if (error) return NextResponse.json({ error: "Couldn't save the Review." }, { status: 500 });

  let emailed = false;
  if (publish && !wasPublished && plan.client_email) {
    emailed = await sendReviewReady(plan.client_email as string, (plan.client_name as string) || "", new URL(request.url).origin, row.website);
  }
  return NextResponse.json({ ok: true, published: publish || wasPublished, emailed });
}

async function sendReviewReady(to: string, name: string, origin: string, website = "") {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const first = name.split(" ")[0];
  const link = `${origin}/website-review`;
  const site = website.replace(/[<>&]/g, "");
  const html = `<!doctype html><html><body style="margin:0;background:#FAF8F3;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:28px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#fff;border-radius:18px;padding:30px;border:1px solid #E6DDCB">
    <tr><td style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B8923F;font-weight:bold">LifeCharter Command Suite</td></tr>
    <tr><td style="font-size:26px;color:#1a2b4a;padding:8px 0 12px">Your Website Alignment Review is ready${site ? `<br><span style="font-size:15px;font-family:Arial,sans-serif;color:#7F8894">for ${site}</span>` : ""}</td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46">${first ? `Hi ${first.replace(/[<>&]/g, "")},<br><br>` : ""}We've looked at your website against the positioning, voice and offer you're building in Command Suite. Your Review is waiting in your account, with the five changes that matter most.</td></tr>
    <tr><td style="padding:24px 0 8px"><a href="${link}" style="display:inline-block;background:#1a2b4a;color:#F8F5F0;font-family:Arial,sans-serif;font-weight:700;padding:14px 26px;border-radius:10px;text-decoration:none">Read your Review</a></td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:12.5px;line-height:1.6;color:#7F8894;padding-top:14px">Questions, or want to talk it through? Just reply, or write to support@lccommandsuite.com.</td></tr>
    <tr><td style="font-size:17px;font-style:italic;color:#1a2b4a;padding-top:22px">Head up - Wings out<br>Babs 🦋</td></tr>
  </table></td></tr></table></body></html>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "LifeCharter Command Suite <support@lccommandsuite.com>",
        to,
        reply_to: "support@lccommandsuite.com",
        subject: site ? `Your Website Alignment Review for ${site} is ready` : "Your Website Alignment Review is ready",
        html,
        text: `${first ? `Hi ${first},\n\n` : ""}Your Website Alignment Review${site ? ` for ${site}` : ""} is ready in your Command Suite account, with the five changes that matter most.\n\nRead it here: ${link}\n\nQuestions? Reply, or write to support@lccommandsuite.com.\n\nHead up - Wings out\nBabs 🦋`,
      }),
    });
    if (!res.ok) console.error("review ready email:", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (e) {
    console.error("review ready email:", (e as Error).message);
    return false;
  }
}
