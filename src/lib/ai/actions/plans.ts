import type { ActionTool, ActionCtx } from "./types";
import { getBlueprint, PLAN_KINDS, type PlanKind } from "@/lib/plans/blueprints";
import { resolveAiConfig } from "@/lib/ai/config";

const MAX_CONTENT = 8000;
const STATUSES = ["drafted", "edited", "done"];
const kindEnum = PLAN_KINDS as string[];
// The plan builder shows plain text, so drop markdown the model sometimes adds.
const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "").replace(/^\s*[*]\s+/gm, "- ").trim();
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

// Match what the assistant says ("Ideal client", "ideal_client") to a real section of the plan.
function findSection(kind: PlanKind, ref: string) {
  const bp = getBlueprint(kind);
  if (!bp) return null;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const r = norm(ref);
  if (!r) return null;
  return (
    bp.sections.find((s) => s.key === ref || norm(s.key) === r) ||
    bp.sections.find((s) => norm(s.title) === r) ||
    bp.sections.find((s) => norm(s.title).includes(r) || r.includes(norm(s.title))) ||
    null
  );
}

async function loadSection(ctx: ActionCtx, kind: string, key: string) {
  const { data } = await ctx.db
    .from("plan_sections")
    .select("id, content, status, source, ai_by")
    .eq("master_plan_id", ctx.planId)
    .eq("plan_type", kind)
    .eq("section_key", key)
    .maybeSingle();
  return data as { id: string; content: string | null; status: string | null; source: string | null; ai_by: string | null } | null;
}

export const readPlan: ActionTool = {
  name: "read_plan",
  kind: "read",
  apiPath: "/api/plans",
  description:
    "Look at one of the client's plans (business, marketing, sales or forecasting): every section with its exact key, whether it is empty or filled and who wrote it. Pass 'section' (a key or title) to get that section's full text. Always call this BEFORE writing a plan section, so you know what is already there and use the real section keys.",
  parameters: {
    type: "object",
    properties: {
      plan_type: { type: "string", enum: kindEnum },
      section: { type: "string", description: "Optional section key or title to read in full." },
    },
    required: ["plan_type"],
  },
  read: async (args, ctx) => {
    const kind = String(args.plan_type || "");
    const bp = getBlueprint(kind);
    if (!bp) return `I only know these plans: ${PLAN_KINDS.join(", ")}.`;
    const { data } = await ctx.db
      .from("plan_sections")
      .select("section_key, content, status, source, ai_by")
      .eq("master_plan_id", ctx.planId)
      .eq("plan_type", kind);
    const saved = new Map((data || []).map((r: { section_key: string }) => [r.section_key, r as unknown as { content: string | null; status: string | null; source: string | null; ai_by: string | null }]));
    const ref = typeof args.section === "string" ? args.section.trim() : "";
    if (ref) {
      const sec = findSection(kind as PlanKind, ref);
      if (!sec) return `There is no section "${ref}" in the ${bp.label}. Sections: ${bp.sections.map((s) => `${s.key} (${s.title})`).join("; ")}.`;
      const row = saved.get(sec.key);
      const text = (row?.content || "").trim();
      return [
        `${bp.label} → ${sec.title} (key: ${sec.key})`,
        `What it should capture: ${sec.description}`,
        text ? `Written by: ${row?.source === "ai" ? `the AI assistant (${row.ai_by || "assistant"})` : "the client"}. Status: ${row?.status || "edited"}.\n\n${text}` : "It is empty.",
      ].join("\n");
    }
    const lines = bp.sections.map((s) => {
      const row = saved.get(s.key);
      const text = (row?.content || "").trim();
      const state = text ? `filled (${row?.source === "ai" ? "AI-written" : "client-written"}, ${text.length} chars): ${clip(text.replace(/\s+/g, " "), 120)}` : "EMPTY";
      return `- ${s.key} | ${s.title}${s.baseline ? " | baseline" : ""} | ${state}`;
    });
    return `${bp.label}: ${bp.tagline}\n${lines.join("\n")}`;
  },
};

export const updatePlanSection: ActionTool = {
  name: "update_plan_section",
  kind: "write",
  apiPath: "/api/plans",
  description:
    "Write or revise ONE section of the client's business, marketing, sales or forecasting plan, using what you know from their Brain, Soul, Profit and Command Shift assessments and what they've told you. Call read_plan first for the real section key and to see what is already there. Write the full, finished section text in the client's own voice (plain paragraphs and short lists, no markdown headings). mode 'replace' (default) swaps the section's text; mode 'append' adds to the end and keeps what is there. Never invent facts: if the assessments don't say, leave it out or ask. The client sees the new text and approves it first, and can undo it afterwards. One section per call.",
  parameters: {
    type: "object",
    properties: {
      plan_type: { type: "string", enum: kindEnum },
      section: { type: "string", description: "The section key from read_plan (or its title)." },
      content: { type: "string", description: "The full text for the section." },
      mode: { type: "string", enum: ["replace", "append"] },
      status: { type: "string", enum: STATUSES, description: "drafted (default) when it is a first draft for them to review." },
    },
    required: ["plan_type", "section", "content"],
  },
  plan: async (args, ctx) => {
    const kind = String(args.plan_type || "");
    const bp = getBlueprint(kind);
    if (!bp) return { error: `I only know these plans: ${PLAN_KINDS.join(", ")}.` };
    const sec = findSection(kind as PlanKind, String(args.section || ""));
    if (!sec) return { error: `I couldn't find that section in the ${bp.label}. Sections: ${bp.sections.map((s) => `${s.key} (${s.title})`).join("; ")}.` };
    const content = typeof args.content === "string" ? plain(args.content) : "";
    if (content.length < 20) return { error: "The section text is missing. Write the full text first." };
    if (content.length > MAX_CONTENT) return { error: `That is too long for one section (limit ${MAX_CONTENT} characters). Tighten it.` };
    const mode = args.mode === "append" ? "append" : "replace";
    const cur = await loadSection(ctx, kind, sec.key);
    const before = (cur?.content || "").trim();
    const lines: string[] = [];
    if (!before) lines.push("This section is empty now, so nothing is overwritten.");
    else if (mode === "append") lines.push("Added to the end of what you already have. Your existing text stays.");
    else lines.push(`⚠ This REPLACES what is there now (${cur?.source === "ai" ? "written by the assistant" : "written by you"}). Undo brings it back.`);
    if (before && mode === "replace") lines.push(`Now: ${clip(before.replace(/\s+/g, " "), 240)}`);
    lines.push("New text:");
    for (const p of content.split(/\n{1,}/).map((s) => s.trim()).filter(Boolean).slice(0, 14)) lines.push(clip(p, 600));
    return { preview: { title: `${mode === "append" ? "Add to" : "Write"} the ${bp.label} → ${sec.title}`, lines } };
  },
  run: async (args, ctx) => {
    const kind = String(args.plan_type || "");
    const bp = getBlueprint(kind);
    const sec = bp && findSection(kind as PlanKind, String(args.section || ""));
    if (!bp || !sec) throw new Error("That section no longer exists.");
    const content = typeof args.content === "string" ? plain(args.content).slice(0, MAX_CONTENT) : "";
    if (!content) throw new Error("There was no text to save.");
    const cur = await loadSection(ctx, kind, sec.key);
    const before = (cur?.content || "").trim();
    const next = args.mode === "append" && before ? `${before}\n\n${content}`.slice(0, MAX_CONTENT) : content;
    const status = STATUSES.includes(String(args.status)) ? String(args.status) : "drafted";
    const row = { content: next, status, source: "ai", ai_by: (await resolveAiConfig()).name, updated_at: new Date().toISOString() };
    if (cur?.id) {
      const { error } = await ctx.db.from("plan_sections").update(row).eq("id", cur.id);
      if (error) throw new Error("It didn't save.");
    } else {
      const { error } = await ctx.db.from("plan_sections").insert({ master_plan_id: ctx.planId, plan_type: kind, section_key: sec.key, ...row });
      if (error) throw new Error("It didn't save.");
    }
    return {
      summary: `Saved to your ${bp.label} → ${sec.title}. You can open it in the plan builder to edit.`,
      result: { plan_type: kind, section: sec.key },
      undo: { plan_type: kind, section: sec.key, existed: !!cur?.id, content: cur?.content ?? null, status: cur?.status ?? "empty", source: cur?.source ?? "client", ai_by: cur?.ai_by ?? null },
    };
  },
  undo: async (u, ctx) => {
    const kind = u.plan_type as string;
    const key = u.section as string;
    const cur = await loadSection(ctx, kind, key);
    if (!cur?.id) return "That section is already gone.";
    if (!u.existed) await ctx.db.from("plan_sections").delete().eq("id", cur.id);
    else
      await ctx.db
        .from("plan_sections")
        .update({ content: u.content, status: u.status, source: u.source, ai_by: u.ai_by, updated_at: new Date().toISOString() })
        .eq("id", cur.id);
    return "Put the section back the way it was.";
  },
};

export const PLAN_TOOLS: ActionTool[] = [readPlan, updatePlanSection];
