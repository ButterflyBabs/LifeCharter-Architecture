import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sessionUser } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { searchKb } from "@/lib/knowledgeBase";
import { confirmToClient, notifyNewRequest } from "@/lib/support/email";

// A signed-in client opens a support request (from Contact Support, or from
// Travel Partner when it can't answer). It's saved to the Support Desk, emailed
// to the support inbox, confirmed to the client, and answered right away with
// any Help articles that look relevant.
export async function POST(req: NextRequest) {
  if (crossOriginBlocked(req)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  try {
    const user = await sessionUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
    const db = createServerClient();
    const { data: prof } = await db.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle();
    const name = str(body.name, 120) || (prof?.full_name as string) || (user.email ?? "").split("@")[0];
    const email = str(body.email, 200) || (prof?.email as string) || user.email || "";
    const category = str(body.category, 60) || "question";
    const priority = ["low", "normal", "high", "urgent"].includes(body.priority) ? body.priority : "normal";
    const subject = str(body.subject, 200);
    const message = str(body.message, 5000);
    const source = body.source === "travel_partner" ? "travel_partner" : "form";
    if (!name || !email || !subject || !message) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const masterPlanId = await resolveMasterPlanId();
    const { data, error } = await db
      .from("support_requests")
      .insert({ user_id: user.id, master_plan_id: masterPlanId, name, email, category, priority, subject, message, status: "open", source })
      .select("id")
      .single();
    if (error || !data) {
      console.error("support_requests insert failed:", error?.message);
      return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
    }

    const r = { id: data.id as string, name, email, subject, message, category, priority, source };
    await Promise.allSettled([notifyNewRequest(r), confirmToClient(r)]);
    const suggestions = searchKb(`${subject} ${message}`, 3).map((k) => ({ question: k.question, answer: k.answer }));
    return NextResponse.json({ success: true, id: data.id, suggestions });
  } catch (error) {
    console.error("Support contact error:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
