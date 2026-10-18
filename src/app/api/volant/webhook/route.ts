import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { settleRecording, webhookSecretOk } from "@/lib/volantRecordingServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// AssemblyAI calls this when an LC Volant recording's transcript is done (or failed). Public in middleware: it is
// secured by the per-recording secret header we gave AssemblyAI, not a session. It never trusts the body: it fetches
// the result from AssemblyAI itself, saves the turns and deletes the recording everywhere.
export async function POST(request: Request) {
  const id = new URL(request.url).searchParams.get("rec") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !webhookSecretOk(id, request.headers.get("x-volant-secret"))) {
    return NextResponse.json({ error: "not allowed" }, { status: 401 });
  }
  await settleRecording(createServerClient(), id).catch((e) => console.error("volant webhook:", e instanceof Error ? e.message : e));
  return NextResponse.json({ ok: true });
}
