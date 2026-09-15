import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sessionUser } from "@/lib/authz";

// This page's form used to fake success (a 1.5s delay + console.log) — a
// signed-in customer's real support request was never actually stored
// anywhere. Uses the service-role client for the insert (bypasses RLS, since
// the RLS policy already enforces user_id = auth.uid() at the app layer
// here) rather than the browser client, so this keeps working even before
// production SMTP exists to notify anyone of a new request by email.
export async function POST(req: NextRequest) {
  try {
    const user = await sessionUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { name, email, category, priority, subject, message } = await req.json();
    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabase.from("support_requests").insert({
      user_id: user.id,
      name,
      email,
      category,
      priority: priority || "normal",
      subject,
      message,
    });

    if (error) {
      console.error("support_requests insert failed:", error.message);
      return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Support contact error:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
