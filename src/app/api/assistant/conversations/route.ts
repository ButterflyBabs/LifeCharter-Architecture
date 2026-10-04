import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { continueSaved, deleteSaved, listSaved, readSaved, startNewConversation } from "@/lib/ai/conversations";

export const dynamic = "force-dynamic";

// GET            → the saved (past) conversations
// GET ?id=       → one saved conversation, to read
// POST { action: "new" }               → save the current conversation and start a fresh one
// POST { action: "continue", id }      → bring a saved conversation back as the current one
// POST { action: "delete", id }        → delete a saved conversation
export async function GET(request: Request) {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ conversations: [] });
  const id = new URL(request.url).searchParams.get("id");
  if (id) return NextResponse.json({ messages: await readSaved(planId, id) });
  return NextResponse.json({ conversations: await listSaved(planId) });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const b = await request.json().catch(() => ({}));
  const id = typeof b.id === "string" ? b.id : "";
  if (b.action === "new") return NextResponse.json({ saved: await startNewConversation(planId) });
  if (b.action === "continue" && id) return NextResponse.json({ ok: await continueSaved(planId, id) });
  if (b.action === "delete" && id) {
    await deleteSaved(planId, id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Bad request." }, { status: 400 });
}
