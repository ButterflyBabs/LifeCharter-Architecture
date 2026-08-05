import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";

export const dynamic = "force-dynamic";

// Auto-send worker: finds follow-up emails scheduled to send automatically
// (followup.aiMode === "auto") whose time has arrived, sends them from the
// connected mailbox, marks the follow-up done, and logs the activity.
//
// Runs on a Vercel Cron schedule (production only). Can also be triggered
// manually for testing. If CRON_SECRET is set, the request must carry it as a
// Bearer token; if it isn't set, the endpoint runs (only ever sending items the
// user already scheduled and that are due).
type TaskRow = {
  id: number;
  title: string;
  status: string;
  due_at: string | null;
  followup: Record<string, unknown> | null;
};

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServerClient();
  const nowISO = new Date().toISOString();

  // Candidates: auto-send follow-ups that are due and not yet done.
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, status, due_at, followup")
    .neq("status", "done")
    .not("due_at", "is", null)
    .lte("due_at", nowISO)
    .filter("followup->>aiMode", "eq", "auto")
    .limit(25);

  if (error) {
    console.error("cron followups query:", error.message);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  const rows = (data || []) as TaskRow[];
  let sent = 0;
  const skipped: { id: number; reason: string }[] = [];

  // Resolve tokens once.
  const msToken = await microsoft.getValidAccessToken().catch(() => null);
  const gToken = msToken ? null : await google.getValidAccessToken().catch(() => null);
  const masterPlanId = await resolveMasterPlanId().catch(() => null);

  for (const t of rows) {
    const fu = (t.followup || {}) as Record<string, unknown>;
    if (fu.sentAt) {
      skipped.push({ id: t.id, reason: "already sent" });
      continue;
    }
    const to = String(fu.contactEmail || "");
    const subject = String(fu.aiSubject || "Following up");
    const bodyText = String(fu.aiBody || "");
    if (!to || !bodyText) {
      skipped.push({ id: t.id, reason: "missing recipient or draft" });
      continue;
    }

    try {
      if (msToken) {
        await microsoft.sendEmail(msToken, { to, subject, body: bodyText, attachments: [] });
      } else if (gToken) {
        await google.sendEmail(gToken, { to, subject, body: bodyText, attachments: [] });
      } else {
        skipped.push({ id: t.id, reason: "no mailbox connected" });
        continue;
      }
    } catch (e) {
      console.error("cron send failed for task", t.id, e);
      skipped.push({ id: t.id, reason: "send error" });
      continue;
    }

    // Mark done + record sentAt, and log the activity.
    await supabase
      .from("tasks")
      .update({
        status: "done",
        completed_at: nowISO,
        followup: { ...fu, sentAt: nowISO },
      })
      .eq("id", t.id);

    await supabase.from("contact_activity_log").insert({
      master_plan_id: masterPlanId,
      contact_id: (fu.contactId as string) || null,
      contact_name: (fu.contactName as string) || null,
      type: "followup",
      note: "Auto-sent follow-up email",
    });

    sent += 1;
  }

  return NextResponse.json({ processed: rows.length, sent, skipped });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
