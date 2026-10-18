import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { confirmToClient, notifyNewRequest } from "@/lib/support/email";

export const dynamic = "force-dynamic";

// LC Fledge's door into the one support route (task 1145): a Fledge user's request lands in the Suite's Support Desk
// (tagged LC Fledge), is emailed to support@lccommandsuite.com and confirmed to them, exactly like a Suite request.
// Fledge shares the Suite's login, so its server forwards the person's own sign-in token; that token is checked with
// Supabase here, and the name and email always come from the account, never from the request body.
//   POST  Authorization: Bearer <the user's Supabase access token>
//         { subject, message, category?, priority?, page? }  -> { success, id }
export async function POST(request: Request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const { data: auth, error: authError } = await db.auth.getUser(token);
  const user = auth?.user;
  if (authError || !user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const subject = str(body.subject, 200);
  const page = str(body.page, 300);
  const message = str(body.message, 5000) + (page ? `\n\n(Sent from LC Fledge: ${page})` : "");
  if (!subject || !str(body.message, 10)) return NextResponse.json({ error: "Please add a subject and a message." }, { status: 400 });
  const category = ["technical", "billing", "feature", "account", "question", "other"].includes(str(body.category, 30)) ? str(body.category, 30) : "question";
  const priority = ["low", "normal", "high", "urgent"].includes(str(body.priority, 10)) ? str(body.priority, 10) : "normal";

  const { count } = await db.from("support_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
  if ((count ?? 0) >= 10) return NextResponse.json({ error: "That's a lot of requests in one hour. Please wait a little, or email support@lccommandsuite.com." }, { status: 429 });
  const [{ data: prof }, { data: plan }] = await Promise.all([
    db.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    db.from("client_master_plans").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle(),
  ]);
  const email = (prof?.email as string) || user.email;
  const name = (prof?.full_name as string) || (user.user_metadata?.full_name as string) || email.split("@")[0];
  const { data, error } = await db
    .from("support_requests")
    .insert({ user_id: user.id, master_plan_id: (plan?.id as string) ?? null, name, email, category, priority, subject, message, status: "open", source: "form", product: "fledge" })
    .select("id")
    .single();
  if (error || !data) {
    console.error("support intake insert failed:", error?.message);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
  const r = { id: data.id as string, name, email, subject, message, category, priority, source: "form", product: "fledge" };
  await Promise.allSettled([notifyNewRequest(r), confirmToClient(r)]);
  return NextResponse.json({ success: true, id: data.id });
}
