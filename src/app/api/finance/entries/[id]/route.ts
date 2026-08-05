import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// Delete a finance entry (scoped to the client's master plan).
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const { error } = await supabase
    .from("finance_entries")
    .delete()
    .eq("id", params.id)
    .eq("master_plan_id", masterPlanId);
  if (error) {
    console.error("DELETE /api/finance/entries/[id]:", error.message);
    return NextResponse.json({ error: "Couldn't delete the entry." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
