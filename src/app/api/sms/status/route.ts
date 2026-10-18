import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { validTwilioSignature } from "@/lib/smsServer";

export const dynamic = "force-dynamic";

// Twilio's delivery updates for each text the Suite sent (task 1151): queued, sent, delivered, undelivered, failed.
const APP = () => (process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com").replace(/\/$/, "");

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return new NextResponse("Bad request", { status: 400 });
  const params: Record<string, string> = {};
  form.forEach((v, k) => (params[k] = String(v)));
  if (!validTwilioSignature(`${APP()}/api/sms/status`, params, request.headers.get("x-twilio-signature"))) return new NextResponse("Forbidden", { status: 403 });
  const sid = params.MessageSid;
  if (sid) {
    const err = params.ErrorCode ? `Error ${params.ErrorCode}${params.ErrorMessage ? `: ${params.ErrorMessage}` : ""}` : null;
    await createServerClient().from("sms_messages").update({ status: String(params.MessageStatus || "unknown").slice(0, 30), ...(err ? { error: err.slice(0, 300) } : {}) }).eq("twilio_sid", sid);
  }
  return new NextResponse(null, { status: 204 });
}
