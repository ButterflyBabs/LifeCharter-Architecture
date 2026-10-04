import { createServerClient } from "@/lib/supabase/server";
import { authEnabled, resolveActor, sessionUser } from "@/lib/authz";
import { memberApiAccess, featureApiAccess, cleanFeatureMap } from "@/lib/teamRoles";
import { toolByName } from "./registry";
import type { ActionCtx, Preview } from "./types";

export interface ActionCard {
  id: string;
  tool: string;
  status: "proposed" | "executed" | "cancelled" | "failed" | "undone";
  title: string;
  lines: string[];
  summary?: string;
  error?: string;
  canUndo?: boolean;
}

const MAX_ARGS_BYTES = 20000;

// The assistant asked for a tool. Reads run now; writes are only PLANNED: a preview is saved and shown
// to the client, and nothing changes until they press Approve. Returns the text handed back to the model.
export async function handleToolCall(
  name: string,
  rawArgs: string,
  ctx: ActionCtx,
  cards: ActionCard[]
): Promise<string> {
  const tool = toolByName(name);
  if (!tool) return "That is not something I can do.";
  if (rawArgs.length > MAX_ARGS_BYTES) return "That request was too large.";
  let args: Record<string, unknown> = {};
  try {
    args = rawArgs ? JSON.parse(rawArgs) : {};
  } catch {
    return "I couldn't read that request. Ask for it again in different words.";
  }
  try {
    if (tool.kind === "read") return await tool.read!(args, ctx);
    const planned = await tool.plan!(args, ctx);
    if ("error" in planned) return `Cannot do that yet: ${planned.error}`;
    const { data, error } = await ctx.db
      .from("assistant_actions")
      .insert({ master_plan_id: ctx.planId, requested_by: ctx.userEmail, tool: tool.name, args, preview: planned.preview, status: "proposed" })
      .select("id")
      .single();
    if (error || !data) return "I couldn't prepare that just now.";
    cards.push({ id: data.id as string, tool: tool.name, status: "proposed", title: planned.preview.title, lines: planned.preview.lines });
    return `Prepared for the client's approval: "${planned.preview.title}". NOTHING has changed yet. Tell them to review it and press Approve.`;
  } catch (e) {
    console.error("assistant tool", name, e);
    return "Something went wrong preparing that.";
  }
}

const toCard = (r: Record<string, unknown>): ActionCard => {
  const p = (r.preview ?? {}) as Preview;
  const res = (r.result ?? {}) as { summary?: string };
  return {
    id: r.id as string,
    tool: r.tool as string,
    status: r.status as ActionCard["status"],
    title: p.title ?? "",
    lines: p.lines ?? [],
    summary: res.summary,
    error: (r.error as string) ?? undefined,
    canUndo: r.status === "executed" && !!r.undo && !!toolByName(r.tool as string)?.undo,
  };
};

export async function listRecentActions(planId: string): Promise<ActionCard[]> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data } = await createServerClient()
    .from("assistant_actions")
    .select("id, tool, status, preview, result, undo, error")
    .eq("master_plan_id", planId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20);
  return ((data ?? []) as Record<string, unknown>[]).map(toCard);
}

// Approve, cancel or undo one prepared action. The account, and any team-member limits, are checked here.
export async function decideAction(
  id: string,
  decision: "approve" | "cancel" | "undo",
  planId: string
): Promise<{ ok: true; card: ActionCard } | { ok: false; error: string; status: number }> {
  const db = createServerClient();
  const { data: row } = await db.from("assistant_actions").select("*").eq("id", id).eq("master_plan_id", planId).maybeSingle();
  if (!row) return { ok: false, error: "I can't find that action.", status: 404 };
  const tool = toolByName(row.tool as string);
  if (!tool) return { ok: false, error: "That action is no longer available.", status: 400 };

  // Account owners and clients are signed in people with their own account; invited team members
  // are limited by their role and feature access.
  const actor = await resolveActor();
  const user = await sessionUser();
  if (authEnabled() && !user) return { ok: false, error: "Please sign in.", status: 401 };
  if (actor.kind === "member") {
    const features = cleanFeatureMap((actor.permissions as { features?: unknown } | null)?.features);
    const v = memberApiAccess(actor.role, tool.apiPath, "POST", features);
    if (!v.allow) return { ok: false, error: v.reason, status: 403 };
    const f = featureApiAccess(features, tool.apiPath, "POST");
    if (!f.allow) return { ok: false, error: f.reason, status: 403 };
  }
  const ctx: ActionCtx = { planId, userEmail: user?.email ?? actor.email, db };
  const now = new Date().toISOString();

  if (decision === "cancel") {
    if (row.status !== "proposed") return { ok: false, error: "That one has already been handled.", status: 409 };
    await db.from("assistant_actions").update({ status: "cancelled", decided_at: now }).eq("id", id);
    return { ok: true, card: toCard({ ...row, status: "cancelled" }) };
  }

  if (decision === "approve") {
    if (row.status !== "proposed") return { ok: false, error: "That one has already been handled.", status: 409 };
    // Claim it first so a double-click can never run it twice.
    const { data: claimed } = await db.from("assistant_actions").update({ status: "executed", decided_at: now }).eq("id", id).eq("status", "proposed").select("id").maybeSingle();
    if (!claimed) return { ok: false, error: "That one has already been handled.", status: 409 };
    try {
      const out = await tool.run!((row.args ?? {}) as Record<string, unknown>, ctx);
      const result = { ...(out.result ?? {}), summary: out.summary };
      await db.from("assistant_actions").update({ result, undo: out.undo ?? null }).eq("id", id);
      // So the assistant remembers it in the conversation.
      await db.from("assistant_messages").insert({ master_plan_id: planId, source: "action", role: "assistant", content: `Done: ${out.summary}`, created_at: new Date().toISOString() });
      return { ok: true, card: toCard({ ...row, status: "executed", result, undo: out.undo ?? null }) };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "It didn't work.";
      await db.from("assistant_actions").update({ status: "failed", error: msg }).eq("id", id);
      return { ok: true, card: toCard({ ...row, status: "failed", error: msg }) };
    }
  }

  // undo
  if (row.status !== "executed" || !row.undo || !tool.undo) return { ok: false, error: "That can't be undone.", status: 409 };
  try {
    const summary = await tool.undo(row.undo as Record<string, unknown>, ctx);
    await db.from("assistant_actions").update({ status: "undone", decided_at: now }).eq("id", id);
    return { ok: true, card: { ...toCard({ ...row, status: "undone" }), summary } };
  } catch {
    return { ok: false, error: "I couldn't undo that.", status: 500 };
  }
}
