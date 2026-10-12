import type { ActionTool } from "./types";
import { SOP_TEMPLATES } from "@/lib/sopTemplates";

// SOP tools for the client's assistant, on top of list_sops / create_sop / update_sop (builders.ts): read one SOP in full,
// make small edits to it (replace, add or remove a step, add or rename a section header) without rewriting the whole
// list, and copy a ready-made template in (optionally already personalised). Writes sit behind Approve and have Undo.

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const isHeader = (t: string) => /^##\s*/.test(t);
const headerText = (t: string) => t.replace(/^##\s*/, "").trim();

// Same numbering the client sees: headers are not numbered, steps count 1, 2, 3...
function render(steps: string[]): string {
  let n = 0;
  return steps.map((s) => (isHeader(s) ? `## ${headerText(s)}` : `${++n}. ${s}`)).join("\n");
}

async function findSop(title: string, ctx: Parameters<NonNullable<ActionTool["plan"]>>[1]) {
  const clean = title.replace(/[%,()]/g, "");
  const { data } = await ctx.db
    .from("sops")
    .select("id, title, purpose, steps, owner, tools, status, pillar_key")
    .eq("master_plan_id", ctx.planId)
    .ilike("title", `%${clean}%`)
    .limit(5);
  const rows = (data ?? []) as { id: string; title: string; purpose: string | null; steps: string[]; owner: string | null; tools: string | null; status: string; pillar_key: string | null }[];
  if (!rows.length) return { error: "I couldn't find an SOP with that name." as string };
  if (rows.length > 1) return { error: `More than one matches: ${rows.map((r) => `"${r.title}"`).join(", ")}. Which one?` };
  return { row: rows[0] };
}

export const getSop: ActionTool = {
  name: "get_sop",
  kind: "read",
  apiPath: "/api/sops",
  description:
    "Read ONE SOP in full: its purpose, owner, tools and every step with the number the client sees (section headers are not numbered). Always call this before editing or improving an SOP so you work from what is really there. Pick it by part of its title.",
  parameters: { type: "object", properties: { find_title: { type: "string" } }, required: ["find_title"] },
  read: async (a, ctx) => {
    const r = await findSop(str(a.find_title, 160), ctx);
    if (!("row" in r) || !r.row) return (r as { error: string }).error;
    const s = r.row;
    return [`${s.title} | ${s.status}`, s.purpose ? `Purpose: ${s.purpose}` : "", s.owner ? `Owner: ${s.owner}` : "", s.tools ? `Tools: ${s.tools}` : "", "", render(s.steps ?? [])].filter((x, i) => x || i === 4).join("\n");
  },
};

export const listSopTemplates: ActionTool = {
  name: "list_sop_templates",
  kind: "read",
  apiPath: "/api/sops",
  description: "List the ready-made SOP templates (about 50, across the eight operations areas) and which ones the client already has. Use it to suggest the right starting point for a process.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const { data } = await ctx.db.from("sops").select("template_key").eq("master_plan_id", ctx.planId).not("template_key", "is", null);
    const got = new Set(((data ?? []) as { template_key: string }[]).map((r) => r.template_key));
    return SOP_TEMPLATES.map((t) => `${t.title} | ${t.pillarKey} | ${t.steps.filter((x) => !isHeader(x)).length} steps${got.has(t.key) ? " | already in their SOPs" : ""}`).join("\n");
  },
};

export const addSopFromTemplate: ActionTool = {
  name: "add_sop_from_template",
  kind: "write",
  apiPath: "/api/sops",
  description:
    "Copy a ready-made SOP template into the client's SOPs as a draft. Pick it by part of its title (see list_sop_templates). To make it THEIRS in the same step, pass personalised purpose / steps / owner / tools: fill the [bracketed placeholders] with facts you actually know about the client and leave the rest as placeholders. Keep the '## ' section headers. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      template: { type: "string", description: "Part of the template title." },
      purpose: { type: "string" },
      steps: { type: "array", items: { type: "string" }, description: "Optional personalised steps, in order, including any '## ' section header items." },
      owner: { type: "string" },
      tools: { type: "string" },
    },
    required: ["template"],
  },
  plan: async (a, ctx) => {
    const q = str(a.template, 160).toLowerCase();
    const hits = SOP_TEMPLATES.filter((t) => t.title.toLowerCase().includes(q) || t.key.includes(q));
    if (!hits.length) return { error: "I couldn't find a template with that name." };
    if (hits.length > 1) return { error: `More than one template matches: ${hits.slice(0, 5).map((t) => `"${t.title}"`).join(", ")}. Which one?` };
    const t = hits[0];
    const { data: have } = await ctx.db.from("sops").select("id").eq("master_plan_id", ctx.planId).eq("template_key", t.key).limit(1);
    if (have?.length) return { error: `"${t.title}" is already in their SOPs. I can edit it with update_sop or edit_sop_steps.` };
    const steps = Array.isArray(a.steps) && a.steps.length ? (a.steps as unknown[]).map((x) => str(x, 600)).filter(Boolean) : t.steps;
    return { preview: { title: `Add the SOP "${t.title}" as a draft${Array.isArray(a.steps) && a.steps.length ? ", personalised for them" : ""}`, lines: steps.filter((x) => isHeader(x)).map((x) => `Section: ${headerText(x)}`).concat([`${steps.filter((x) => !isHeader(x)).length} steps`]) } };
  },
  run: async (a, ctx) => {
    const q = str(a.template, 160).toLowerCase();
    const t = SOP_TEMPLATES.find((x) => x.title.toLowerCase().includes(q) || x.key.includes(q));
    if (!t) throw new Error("That template wasn't found.");
    const steps = Array.isArray(a.steps) && a.steps.length ? (a.steps as unknown[]).map((x) => str(x, 600)).filter(Boolean).slice(0, 60) : t.steps;
    const { data, error } = await ctx.db
      .from("sops")
      .insert({
        master_plan_id: ctx.planId,
        template_key: t.key,
        title: t.title,
        pillar_key: t.pillarKey,
        purpose: str(a.purpose, 1000) || t.purpose,
        steps,
        owner: str(a.owner, 120) || t.owner,
        tools: str(a.tools, 300) || t.tools,
        status: "draft",
      })
      .select("id, title")
      .single();
    if (error || !data) throw new Error("The SOP didn't save.");
    return { summary: `Added the SOP "${data.title}" as a draft.`, result: { id: data.id }, undo: { id: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("sops").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Removed the SOP.";
  },
};

// Small edits by step number (as get_sop shows them), so a long SOP is never rewritten just to change one line.
type Op = { op: string; number?: number; text?: string; find?: string };
export const editSopSteps: ActionTool = {
  name: "edit_sop_steps",
  kind: "write",
  apiPath: "/api/sops",
  description:
    "Make small edits to one SOP's steps without rewriting the list. Call get_sop first and use the step numbers it shows (all numbers refer to the list as it stands NOW, so you can send several edits at once). Edits: replace_step (number, text), insert_step_after (number, text; number 0 = at the very top), delete_step (number), add_header_before (number, text: starts a new section before that step), rename_header (find: part of the old header, text: the new header). Write each step as one short action sentence first, then any detail. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      find_title: { type: "string" },
      edits: {
        type: "array",
        items: {
          type: "object",
          properties: {
            op: { type: "string", enum: ["replace_step", "insert_step_after", "delete_step", "add_header_before", "rename_header"] },
            number: { type: "integer" },
            text: { type: "string" },
            find: { type: "string" },
          },
          required: ["op"],
        },
      },
    },
    required: ["find_title", "edits"],
  },
  plan: async (a, ctx) => {
    const r = await findSop(str(a.find_title, 160), ctx);
    if (!("row" in r) || !r.row) return { error: (r as { error: string }).error };
    const res = apply(r.row.steps ?? [], Array.isArray(a.edits) ? (a.edits as Op[]) : []);
    if ("error" in res) return { error: res.error };
    return { preview: { title: `Edit the SOP "${r.row.title}"`, lines: res.lines.slice(0, 10).concat(res.lines.length > 10 ? [`…and ${res.lines.length - 10} more edits`] : []) } };
  },
  run: async (a, ctx) => {
    const r = await findSop(str(a.find_title, 160), ctx);
    if (!("row" in r) || !r.row) throw new Error((r as { error: string }).error);
    const res = apply(r.row.steps ?? [], Array.isArray(a.edits) ? (a.edits as Op[]) : []);
    if ("error" in res) throw new Error(res.error);
    const { error } = await ctx.db.from("sops").update({ steps: res.steps, checks: [], updated_at: new Date().toISOString() }).eq("id", r.row.id).eq("master_plan_id", ctx.planId);
    if (error) throw new Error("The change didn't save.");
    return { summary: `Edited the SOP "${r.row.title}" (${res.lines.length} change${res.lines.length === 1 ? "" : "s"}).`, undo: { id: r.row.id, steps: r.row.steps } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("sops").update({ steps: u.steps as string[], checks: [], updated_at: new Date().toISOString() }).eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Put the steps back as they were.";
  },
};

function apply(steps: string[], edits: Op[]): { steps: string[]; lines: string[] } | { error: string } {
  if (!edits.length) return { error: "What should change?" };
  // Tag each existing item with the step number the client sees (headers get none).
  let n = 0;
  const items = steps.map((t) => ({ text: t, num: isHeader(t) ? 0 : ++n, del: false, before: [] as string[], after: [] as string[] }));
  const byNum = new Map(items.filter((i) => i.num).map((i) => [i.num, i]));
  const lines: string[] = [];
  const top: string[] = [];
  for (const e of edits.slice(0, 40)) {
    const text = str(e.text, 600);
    const it = typeof e.number === "number" ? byNum.get(e.number) : undefined;
    switch (e.op) {
      case "replace_step":
        if (!it || !text) return { error: `There is no step ${e.number}, or no new text was given.` };
        lines.push(`Step ${e.number}: ${text.slice(0, 90)}`);
        it.text = text;
        break;
      case "delete_step":
        if (!it) return { error: `There is no step ${e.number}.` };
        lines.push(`Remove step ${e.number}: ${it.text.slice(0, 70)}`);
        it.del = true;
        break;
      case "insert_step_after":
        if (!text) return { error: "What should the new step say?" };
        if (e.number === 0) top.push(text);
        else if (it) it.after.push(text);
        else return { error: `There is no step ${e.number}.` };
        lines.push(`New step${e.number ? ` after step ${e.number}` : " at the top"}: ${text.slice(0, 90)}`);
        break;
      case "add_header_before":
        if (!it || !text) return { error: `There is no step ${e.number}, or no header text was given.` };
        it.before.push(`## ${text.replace(/^##\s*/, "")}`);
        lines.push(`New section "${text.replace(/^##\s*/, "")}" before step ${e.number}`);
        break;
      case "rename_header": {
        const f = str(e.find, 120).toLowerCase();
        const h = items.find((i) => isHeader(i.text) && headerText(i.text).toLowerCase().includes(f));
        if (!h || !text) return { error: "I couldn't find that section header, or no new name was given." };
        lines.push(`Rename section "${headerText(h.text)}" to "${text.replace(/^##\s*/, "")}"`);
        h.text = `## ${text.replace(/^##\s*/, "")}`;
        break;
      }
      default:
        return { error: `I don't know the edit "${e.op}".` };
    }
  }
  const out: string[] = [...top];
  for (const i of items) {
    out.push(...i.before);
    if (!i.del) out.push(i.text);
    out.push(...i.after);
  }
  if (out.length > 60) return { error: "That would make the SOP longer than 60 lines." };
  return { steps: out, lines };
}

export const SOP_TOOLS: ActionTool[] = [getSop, listSopTemplates, addSopFromTemplate, editSopSteps];
