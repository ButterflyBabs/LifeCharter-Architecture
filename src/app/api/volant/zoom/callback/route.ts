import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { volantAccount } from "@/lib/volantServer";
import { connectZoom, readState } from "@/lib/volantZoom";

export const dynamic = "force-dynamic";

// Zoom sends the person back here after "Connect Zoom". Only the signed-in account that started it can finish it.
export async function GET(request: Request) {
  const u = new URL(request.url);
  const back = (q: string) => NextResponse.redirect(new URL(`/volant?zoom=${q}`, u.origin));
  const a = await volantAccount();
  if ("denied" in a) return back("signin");
  const planId = readState(u.searchParams.get("state") || "");
  const code = u.searchParams.get("code") || "";
  if (!planId || planId !== a.planId || !code) return back("failed");
  try {
    await connectZoom(createServerClient(), a.planId, code);
    return back("connected");
  } catch (e) {
    console.error("zoom callback:", e instanceof Error ? e.message : e);
    return back("failed");
  }
}
