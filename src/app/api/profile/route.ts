import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Returns the owner's display name for the greeting (single-user: first profile
// row). Set your name on the Settings/profile page and it flows here.
export async function GET() {
  const supabase = createServerClient();
  const { data } = await supabase.from("profiles").select("full_name").limit(1).maybeSingle();
  const fullName = ((data?.full_name as string) || "").trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : "";
  return NextResponse.json({ fullName, firstName });
}
