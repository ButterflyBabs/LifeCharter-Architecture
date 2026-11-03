import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect, superAdminEmails } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { DEMO_PLAN_NAME } from "@/lib/scoring/masterPlan";
import { siteKey } from "@/lib/websiteReviews";
import { reviewReadyEmail } from "@/lib/websiteReviewEmail";

export const dynamic = "force-dynamic";

// Owner-only queue of Website Alignment Reviews: every client account, its website, when the
// Review is due (14 days after enrolling), and the Review itself. Claude writes each Review;
// Publish puts it in the client's account and emails them.

export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const supabase = createServerClient();
  const admins = superAdminEmails();
  const [{ data: plans }, { data: spaces }, { data: reviews }, { data: profs }] = await Promise.all([
    supabase.from("client_master_plans").select("id, client_name, client_email, user_id, created_at").not("user_id", "is", null).order("created_at", { ascending: false }),
    supabase.from("workspaces").select("master_plan_id, website, is_default"),
    supabase.from("website_reviews").select("id, master_plan_id, website, status, content, published_at, updated_at, created_at, email_status, emailed_at, email_to, email_error").order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, assistant_name"),
  ]);
  const assistantOf = new Map(((profs ?? []) as { id: string; assistant_name: string | null }[]).map((x) => [x.id, (x.assistant_name || "").trim()]));
  const site = new Map<string, string>();
  for (const w of (spaces ?? []) as { master_plan_id: string | null; website: string | null; is_default: boolean | null }[]) {
    if (w.master_plan_id && w.website?.trim() && (w.is_default || !site.has(w.master_plan_id))) site.set(w.master_plan_id, w.website.trim());
  }
  type Rev = { id: string; master_plan_id: string; website: string; status: "draft" | "published"; content: string | null; published_at: string | null; created_at: string; email_status: "sent" | "failed" | "skipped" | null; emailed_at: string | null; email_to: string | null; email_error: string | null };
  const byPlan = new Map<string, Rev[]>();
  for (const r of (reviews ?? []) as Rev[]) byPlan.set(r.master_plan_id, [...(byPlan.get(r.master_plan_id) ?? []), r]);
  // One entry for each website: a client on a bigger plan can have several, each with its own Review.
  const clients = ((plans ?? []) as { id: string; client_name: string | null; client_email: string | null; user_id: string | null; created_at: string }[])
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
        assistantName: assistantOf.get(p.user_id ?? "") ?? "",
        siteNumber: i + 1,
        siteCount: rs.length,
        review: r.content ? { status: r.status, content: r.content, published_at: r.published_at } : null,
        emailState: r.status === "published" && r.email_status ? { status: r.email_status, at: r.emailed_at, to: r.email_to, error: r.email_error } : null,
      }));
      // A client whose website is saved but has no row yet (before they opened their page).
      if (main && !rs.some((r) => siteKey(r.website) === siteKey(main))) {
        entries.unshift({ masterPlanId: p.id, siteId: "", name: p.client_name, email: p.client_email, enrolledAt: p.created_at, due: new Date(new Date(p.created_at).getTime() + 14 * 86400_000).toISOString(), website: main, assistantName: assistantOf.get(p.user_id ?? "") ?? "", siteNumber: 1, siteCount: rs.length + 1, review: null, emailState: null });
      }
      if (!entries.length) entries.push({ masterPlanId: p.id, siteId: "", name: p.client_name, email: p.client_email, enrolledAt: p.created_at, due: new Date(new Date(p.created_at).getTime() + 14 * 86400_000).toISOString(), website: "", assistantName: assistantOf.get(p.user_id ?? "") ?? "", siteNumber: 1, siteCount: 1, review: null, emailState: null });
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

  let sent: SendResult | null = null;
  if (publish && !wasPublished) sent = await sendAndRecord(supabase, row.id, (plan.client_email as string | null) ?? null, (plan.client_name as string) || "", new URL(request.url).origin, row.website);
  return NextResponse.json({ ok: true, published: publish || wasPublished, emailed: sent?.status === "sent", emailStatus: sent?.status ?? null, emailError: sent?.error ?? null, emailTo: (plan.client_email as string | null) ?? null });
}

// POST { siteId }: send the ready email again for a Review that has been delivered (the owner presses Send the email again).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const siteId = typeof body.siteId === "string" && /^[0-9a-f-]{36}$/i.test(body.siteId) ? body.siteId : "";
  if (!siteId) return NextResponse.json({ error: "Which Review?" }, { status: 400 });
  const supabase = createServerClient();
  const { data: row } = await supabase.from("website_reviews").select("id, master_plan_id, website, status").eq("id", siteId).maybeSingle();
  if (!row || row.status !== "published") return NextResponse.json({ error: "Publish the Review first." }, { status: 400 });
  const { data: plan } = await supabase.from("client_master_plans").select("client_name, client_email").eq("id", row.master_plan_id as string).maybeSingle();
  const sent = await sendAndRecord(supabase, row.id as string, (plan?.client_email as string | null) ?? null, (plan?.client_name as string) || "", new URL(request.url).origin, row.website as string);
  return NextResponse.json({ ok: sent.status === "sent", emailStatus: sent.status, emailError: sent.error, emailTo: (plan?.client_email as string | null) ?? null });
}

type SendResult = { status: "sent" | "failed" | "skipped"; error: string | null; id: string | null };

async function sendReviewReady(to: string, name: string, origin: string, website = ""): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: "skipped", error: "the sending key is not set", id: null };
  const mail = reviewReadyEmail({ name, website, origin });
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "LifeCharter Command Suite <support@lccommandsuite.com>",
        to,
        reply_to: "support@lccommandsuite.com",
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      console.error("review ready email:", res.status, body.message);
      return { status: "failed", error: (body.message || `the sending service answered ${res.status}`).slice(0, 300), id: null };
    }
    return { status: "sent", error: null, id: body.id ?? null };
  } catch (e) {
    console.error("review ready email:", (e as Error).message);
    return { status: "failed", error: (e as Error).message.slice(0, 300), id: null };
  }
}

/** Sends the ready email and writes the outcome on the Review, so the owner's page can say what happened. */
async function sendAndRecord(supabase: ReturnType<typeof createServerClient>, reviewId: string, to: string | null, name: string, origin: string, website: string): Promise<SendResult> {
  const r: SendResult = to ? await sendReviewReady(to, name, origin, website) : { status: "skipped", error: "this client has no email address on file", id: null };
  await supabase.from("website_reviews").update({ email_status: r.status, emailed_at: new Date().toISOString(), email_to: to, email_message_id: r.id, email_error: r.error }).eq("id", reviewId);
  return r;
}
