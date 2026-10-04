import type { ActionTool, ActionCtx } from "./types";
import OpenAI from "openai";
import { getBlueprint, PLAN_KINDS, sectionQuestions, type PlanKind, type BlueprintSection } from "@/lib/plans/blueprints";
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

// ---- Fill a section's question fields from the section text the client already has ----

type Answers = Record<string, string>;
const MAX_ANSWER = 900;

async function loadAnswers(ctx: ActionCtx, kind: string) {
  const { data } = await ctx.db
    .from("plan_sections")
    .select("id, section_key, content, answers")
    .eq("master_plan_id", ctx.planId)
    .eq("plan_type", kind);
  return (data || []) as { id: string; section_key: string; content: string | null; answers: Answers | null }[];
}

// Reads one section's text and answers ONLY the questions that are still empty, using nothing but what the text says.
async function extractAnswers(openai: OpenAI, sec: BlueprintSection, content: string, empty: ReturnType<typeof sectionQuestions>): Promise<Answers> {
  const qs = empty
    .map((q) => `- id "${q.id}" (${q.type}${q.type === "choice" ? `, choose exactly one of: ${(q.options || []).join(" | ")}` : q.type === "list" ? ", one item per line" : ""}): ${q.question}`)
    .join("\n");
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'You move facts from a business-plan section into its question fields. Answer each question as fully as the section text supports, restating what the text says in the client\'s voice (a sentence or a few short lines, plain text, no markdown); the questions are prompts, so a good answer often draws on several parts of the text. Never add facts that are not in the text. Return an empty string only when the text has nothing relevant to that question. For a choice question return one of the listed options exactly, or "". Return STRICT JSON: {"answers":{"<id>":"<answer>"}}.',
      },
      { role: "user", content: `Section: ${sec.title}\n\nSection text:\n${content}\n\nQuestions to fill:\n${qs}` },
    ],
  });
  let parsed: { answers?: Record<string, unknown> } = {};
  try {
    parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
  } catch {
    /* none */
  }
  const out: Answers = {};
  for (const q of empty) {
    let v = typeof parsed.answers?.[q.id] === "string" ? plain(parsed.answers[q.id] as string) : "";
    if (q.type === "choice" && !(q.options || []).includes(v)) v = "";
    if (v) out[q.id] = v.slice(0, MAX_ANSWER);
  }
  return out;
}

export const fillPlanAnswers: ActionTool = {
  name: "fill_plan_answers",
  kind: "write",
  apiPath: "/api/plans",
  description:
    "Fill in the question fields at the top of plan sections from the section text that is already written (for example after you wrote sections with update_plan_section, or when the client says the fields are still empty). Call it ONCE per plan: pass plan_type and leave 'section' out, which covers every section that has text but empty fields in a single approval. Only pass 'section' when the client names exactly one section. It only fills fields that are EMPTY, never overwrites an answer, and uses only what the section text already says. The client sees every answer first and approves.",
  parameters: {
    type: "object",
    properties: {
      plan_type: { type: "string", enum: kindEnum },
      section: { type: "string", description: "Optional: one section key or title. Leave out to do every section that needs it." },
    },
    required: ["plan_type"],
  },
  plan: async (args, ctx) => {
    const kind = String(args.plan_type || "");
    const bp = getBlueprint(kind);
    if (!bp) return { error: `I only know these plans: ${PLAN_KINDS.join(", ")}.` };
    const ref = typeof args.section === "string" ? args.section.trim() : "";
    const only = ref ? findSection(kind as PlanKind, ref) : null;
    if (ref && !only) return { error: `I couldn't find that section in the ${bp.label}. Sections: ${bp.sections.map((s) => `${s.key} (${s.title})`).join("; ")}.` };
    const key = (await resolveAiConfig()).key;
    if (!key) return { error: "I need your OpenAI key connected (Settings → AI Assistant) to read your sections into the fields." };
    const rows = await loadAnswers(ctx, kind);
    const jobs = bp.sections
      .filter((sec) => !only || sec.key === only.key)
      .map((sec) => {
        const row = rows.find((r) => r.section_key === sec.key);
        const content = (row?.content || "").trim();
        const have = row?.answers || {};
        const empty = sectionQuestions(sec).filter((q) => !String(have[q.id] ?? "").trim());
        return content && empty.length ? { sec, content, empty } : null;
      })
      .filter((j): j is NonNullable<typeof j> => !!j);
    if (!jobs.length) return { error: only ? "That section has no text yet, or its fields are all filled in already." : "Nothing to do: every section with text already has its fields filled in." };
    const openai = new OpenAI({ apiKey: key });
    const results = await Promise.all(jobs.map(async (j) => ({ key: j.sec.key, title: j.sec.title, answers: await extractAnswers(openai, j.sec, j.content, j.empty).catch(() => ({} as Answers)), qs: j.empty })));
    const filled = results.filter((r) => Object.keys(r.answers).length);
    if (!filled.length) return { error: "The text in those sections doesn't answer the fields clearly enough for me to fill them without guessing." };
    // Kept on the proposal so exactly what you see is what gets saved.
    args.computed = filled.map((r) => ({ section: r.key, answers: r.answers }));
    const lines: string[] = ["Only empty fields are filled, using what your section text already says. Nothing you typed is changed."];
    let count = 0;
    for (const r of filled) {
      lines.push(`${r.title}:`);
      for (const q of r.qs) {
        const a = r.answers[q.id];
        if (!a) continue;
        count++;
        lines.push(`• ${clip(q.question, 80)} → ${clip(a.replace(/\s+/g, " "), 160)}`);
      }
    }
    return { preview: { title: `Fill ${count} field${count === 1 ? "" : "s"} across ${filled.length} section${filled.length === 1 ? "" : "s"} of the ${bp.label}`, lines } };
  },
  run: async (args, ctx) => {
    const kind = String(args.plan_type || "");
    const bp = getBlueprint(kind);
    const computed = Array.isArray(args.computed) ? (args.computed as { section: string; answers: Answers }[]) : [];
    if (!bp || !computed.length) throw new Error("There was nothing prepared to save.");
    const rows = await loadAnswers(ctx, kind);
    const undo: { id: string; before: Answers }[] = [];
    let fields = 0;
    for (const c of computed) {
      const row = rows.find((r) => r.section_key === c.section);
      const sec = bp.sections.find((x) => x.key === c.section);
      if (!row || !sec) continue;
      const have = row.answers || {};
      const add: Answers = {};
      for (const q of sectionQuestions(sec)) if (c.answers[q.id] && !String(have[q.id] ?? "").trim()) add[q.id] = c.answers[q.id];
      if (!Object.keys(add).length) continue;
      const { error } = await ctx.db.from("plan_sections").update({ answers: { ...have, ...add }, updated_at: new Date().toISOString() }).eq("id", row.id);
      if (error) throw new Error("It didn't save.");
      undo.push({ id: row.id, before: have });
      fields += Object.keys(add).length;
    }
    if (!fields) throw new Error("Those fields were filled in already.");
    return { summary: `Filled ${fields} field${fields === 1 ? "" : "s"} in your ${bp.label}. Open the plan builder to read or edit them.`, undo: { sections: undo } };
  },
  undo: async (u, ctx) => {
    for (const x of (u.sections as { id: string; before: Answers }[]) || []) await ctx.db.from("plan_sections").update({ answers: x.before, updated_at: new Date().toISOString() }).eq("id", x.id);
    return "Cleared those fields again.";
  },
};

export const PLAN_TOOLS: ActionTool[] = [readPlan, updatePlanSection, fillPlanAnswers];
