import type { ActionTool, ActionCtx } from "./types";
import { createBoard, boardStages, createCard, moveCard, retagContact, slugTag, type Board, type DmStage } from "@/lib/dmPipeline";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { ensureStages } from "@/lib/sales/pipeline";
import { dealRow } from "@/lib/sales/dealRow";

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const MAX_CARDS = 200;

async function boards(ctx: ActionCtx): Promise<Board[]> {
  const { data } = await ctx.db.from("pipeline_boards").select("id, name, tag, sort_order").eq("master_plan_id", ctx.planId).eq("purpose", "outreach").order("sort_order");
  return (data ?? []).map((b) => ({ id: b.id as string, name: b.name as string, tag: (b.tag as string) ?? null, sortOrder: b.sort_order as number }));
}
const findBoard = (list: Board[], name: string) => {
  const n = name.toLowerCase();
  return list.find((b) => b.name.toLowerCase() === n) ?? list.find((b) => b.name.toLowerCase().includes(n)) ?? null;
};
const findStage = (stages: DmStage[], name: string) => {
  const n = name.toLowerCase();
  return stages.find((s) => s.name.toLowerCase() === n) ?? stages.find((s) => s.name.toLowerCase().includes(n)) ?? null;
};

export const listPipelines: ActionTool = {
  name: "list_pipelines",
  kind: "read",
  apiPath: "/api/dm-pipeline",
  description: "List the client's outreach pipelines with their stages and how many people are in each, plus their Sales Pipeline stages and open deals.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const list = await boards(ctx);
    const out: string[] = [];
    for (const b of list) {
      const stages = await boardStages(ctx.db, ctx.planId, b.id);
      const { data: cards } = await ctx.db.from("dm_cards").select("stage_id").eq("board_id", b.id).eq("master_plan_id", ctx.planId);
      const n = new Map<string, number>();
      for (const c of cards ?? []) n.set(c.stage_id as string, (n.get(c.stage_id as string) ?? 0) + 1);
      out.push(`Outreach pipeline "${b.name}": ${stages.map((s) => `${s.name} (${n.get(s.id) ?? 0})`).join(" → ")}`);
    }
    const sales = await ensureStages(ctx.db, ctx.planId);
    const { count } = await ctx.db.from("pipeline_deals").select("id", { count: "exact", head: true }).eq("master_plan_id", ctx.planId).is("closed_at", null);
    out.push(`Sales Pipeline stages: ${sales.map((s) => s.name).join(" → ")}; ${count ?? 0} open deals.`);
    return out.join("\n");
  },
};

export const createPipeline: ActionTool = {
  name: "create_pipeline",
  kind: "write",
  apiPath: "/api/dm-pipeline",
  description: "Create a new outreach pipeline with its own stages (for example 'Podcast guests' with stages Idea, Invited, Booked, Recorded). The client approves first.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string" },
      stages: { type: "array", items: { type: "string" }, description: "Stage names in order, 2 to 10. Leave out to use a simple New, In progress, Done pipeline." },
    },
    required: ["name"],
  },
  plan: async (args, ctx) => {
    const name = str(args.name, 80);
    if (!name) return { error: "What should the pipeline be called?" };
    if ((await boards(ctx)).some((b) => b.name.toLowerCase() === name.toLowerCase())) return { error: `You already have a pipeline called "${name}".` };
    const stages = (Array.isArray(args.stages) ? args.stages : []).map((s) => str(s, 60)).filter(Boolean).slice(0, 10);
    return { preview: { title: `Create the pipeline "${name}"`, lines: [stages.length ? `Stages: ${stages.join(" → ")}` : "Stages: New → In progress → Done"] } };
  },
  run: async (args, ctx) => {
    const name = str(args.name, 80);
    const stages = (Array.isArray(args.stages) ? args.stages : []).map((s) => str(s, 60)).filter(Boolean).slice(0, 10);
    const tag = slugTag(name, 30) || null;
    const board = await createBoard(ctx.db, ctx.planId, name, tag, "simple", "outreach");
    if (!board) throw new Error("The pipeline didn't save.");
    if (stages.length >= 2) {
      await ctx.db.from("dm_stages").delete().eq("board_id", board.id).eq("master_plan_id", ctx.planId);
      await ctx.db.from("dm_stages").insert(
        stages.map((s, i) => ({
          master_plan_id: ctx.planId,
          board_id: board.id,
          key: null,
          name: s,
          tag: tag ? `${tag}-${slugTag(s, 25)}` : null,
          follow_up_days: null,
          kind: i === stages.length - 1 ? "closed" : "open",
          sort_order: i,
        }))
      );
    }
    return { summary: `Created the pipeline "${name}".`, result: { boardId: board.id }, undo: { boardId: board.id } };
  },
  undo: async (u, ctx) => {
    const { count } = await ctx.db.from("dm_cards").select("id", { count: "exact", head: true }).eq("board_id", u.boardId as string).eq("master_plan_id", ctx.planId);
    if (count) return `Kept it: ${count} ${count === 1 ? "person is" : "people are"} in that pipeline now. Remove them first if you want it gone.`;
    await ctx.db.from("dm_stages").delete().eq("board_id", u.boardId as string).eq("master_plan_id", ctx.planId);
    await ctx.db.from("pipeline_boards").delete().eq("id", u.boardId as string).eq("master_plan_id", ctx.planId);
    return "Removed the pipeline.";
  },
};

type CardTarget = { error: string } | { board: Board; stage: DmStage; stages: DmStage[] };
type MoveTarget = { error: string } | { board: Board; to: DmStage; cards: { id: string; name: string; stage_id: string }[] };

async function cardTargets(args: Record<string, unknown>, ctx: ActionCtx): Promise<CardTarget> {
  const list = await boards(ctx);
  const board = findBoard(list, str(args.pipeline, 80));
  if (!board) return { error: `I can't find a pipeline called "${str(args.pipeline, 80)}". Yours: ${list.map((b) => b.name).join(", ") || "none yet"}.` };
  const stages = await boardStages(ctx.db, ctx.planId, board.id);
  const stage = str(args.stage, 60) ? findStage(stages, str(args.stage, 60)) : stages[0];
  if (!stage) return { error: `That pipeline has no stage like "${str(args.stage, 60)}". Its stages: ${stages.map((s) => s.name).join(", ")}.` };
  return { board, stage, stages };
}

export const addToPipeline: ActionTool = {
  name: "add_people_to_pipeline",
  kind: "write",
  apiPath: "/api/dm-pipeline",
  description: "Put people into an outreach pipeline stage. People are chosen from the client's contacts by tag or search (people already in the pipeline are skipped), or you can add new people by name. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      pipeline: { type: "string", description: "Pipeline name." },
      stage: { type: "string", description: "Stage name. Defaults to the first stage." },
      with_any_tag: { type: "array", items: { type: "string" }, description: "Add contacts that have any of these tags." },
      search: { type: "string", description: "Add contacts whose name, email or company contains this." },
      new_people: { type: "array", items: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, notes: { type: "string" } }, required: ["name"] }, description: "People who are not contacts yet." },
    },
    required: ["pipeline"],
  },
  plan: async (args, ctx) => {
    const t = await cardTargets(args, ctx);
    if ("error" in t) return { error: t.error };
    const picked = await pickPeople(args, ctx, t.board.id);
    if (!picked.length) return { error: "Nobody new to add (they may already be in that pipeline). Tell me a tag, a name to search, or who to add." };
    return {
      preview: {
        title: `Add ${picked.length} ${picked.length === 1 ? "person" : "people"} to "${t.board.name}" at "${t.stage.name}"`,
        lines: [...picked.slice(0, 8).map((p) => p.name), ...(picked.length > 8 ? [`…and ${picked.length - 8} more`] : [])],
      },
    };
  },
  run: async (args, ctx) => {
    const t = await cardTargets(args, ctx);
    if ("error" in t) throw new Error(t.error);
    const tz = await resolveUserTimeZone(null);
    const picked = await pickPeople(args, ctx, t.board.id);
    const cardIds: { id: string; contactId: string | null }[] = [];
    for (const p of picked) {
      const r = await createCard(ctx.db, ctx.planId, t.board, t.stage, tz, { name: p.name, email: p.email, platform: p.email ? "Email" : null, contactId: p.contactId, notes: p.notes });
      if (!("error" in r) && r.card) cardIds.push({ id: (r.card as { id: string }).id, contactId: p.contactId });
    }
    return {
      summary: `Added ${cardIds.length} ${cardIds.length === 1 ? "person" : "people"} to "${t.board.name}" at "${t.stage.name}".`,
      result: { count: cardIds.length },
      undo: { cards: cardIds, boardTag: t.board.tag, stageTag: t.stage.tag },
    };
  },
  undo: async (u, ctx) => {
    const cards = (u.cards as { id: string; contactId: string | null }[]) ?? [];
    let n = 0;
    for (const c of cards) {
      const { data: card } = await ctx.db.from("dm_cards").select("follow_up_task_id").eq("id", c.id).eq("master_plan_id", ctx.planId).maybeSingle();
      if (!card) continue;
      if (card.follow_up_task_id) await ctx.db.from("tasks").delete().eq("id", card.follow_up_task_id).eq("master_plan_id", ctx.planId).neq("status", "done");
      await ctx.db.from("dm_cards").delete().eq("id", c.id).eq("master_plan_id", ctx.planId);
      await retagContact(ctx.db, ctx.planId, c.contactId, [], [(u.boardTag as string) ?? null, (u.stageTag as string) ?? null]);
      n++;
    }
    return `Removed ${n} ${n === 1 ? "person" : "people"} from the pipeline.`;
  },
};

async function pickPeople(args: Record<string, unknown>, ctx: ActionCtx, boardId: string) {
  const out: { name: string; email: string | null; contactId: string | null; notes: string | null }[] = [];
  const { data: already } = await ctx.db.from("dm_cards").select("contact_id").eq("board_id", boardId).eq("master_plan_id", ctx.planId).not("contact_id", "is", null);
  const inBoard = new Set((already ?? []).map((c) => c.contact_id as string));
  const tags = (Array.isArray(args.with_any_tag) ? args.with_any_tag : []).map((t) => str(t, 60).toLowerCase()).filter(Boolean);
  const search = str(args.search, 100).replace(/[%,()]/g, "");
  if (tags.length || search) {
    let q = ctx.db.from("seq_contacts").select("id, email, first_name, last_name").eq("master_plan_id", ctx.planId).limit(MAX_CARDS + 1);
    if (tags.length) q = q.overlaps("tags", tags);
    if (search) q = q.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`);
    const { data } = await q;
    for (const c of data ?? []) {
      if (inBoard.has(c.id as string)) continue;
      out.push({ name: [c.first_name, c.last_name].filter(Boolean).join(" ") || (c.email as string), email: c.email as string, contactId: c.id as string, notes: null });
    }
  }
  for (const p of Array.isArray(args.new_people) ? (args.new_people as Record<string, unknown>[]) : []) {
    const name = str(p.name, 120);
    if (!name) continue;
    out.push({ name, email: str(p.email, 200).toLowerCase() || null, contactId: null, notes: str(p.notes, 2000) || null });
  }
  return out.slice(0, MAX_CARDS);
}

export const moveInPipeline: ActionTool = {
  name: "move_people_in_pipeline",
  kind: "write",
  apiPath: "/api/dm-pipeline",
  description: "Move people already in an outreach pipeline from one stage to another. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      pipeline: { type: "string" },
      from_stage: { type: "string", description: "Move people currently in this stage. Leave out to use names." },
      names: { type: "array", items: { type: "string" }, description: "Specific people (names) to move." },
      to_stage: { type: "string" },
    },
    required: ["pipeline", "to_stage"],
  },
  plan: async (args, ctx) => {
    const t = await moveTargets(args, ctx);
    if ("error" in t) return { error: t.error };
    return {
      preview: {
        title: `Move ${t.cards.length} ${t.cards.length === 1 ? "person" : "people"} to "${t.to.name}" in "${t.board.name}"`,
        lines: [...t.cards.slice(0, 8).map((c) => c.name), ...(t.cards.length > 8 ? [`…and ${t.cards.length - 8} more`] : [])],
      },
    };
  },
  run: async (args, ctx) => {
    const t = await moveTargets(args, ctx);
    if ("error" in t) throw new Error(t.error);
    const tz = await resolveUserTimeZone(null);
    const moved: { id: string; stageId: string }[] = [];
    for (const c of t.cards) {
      const saved = await moveCard(ctx.db, ctx.planId, c.id, t.to, t.board.name, tz);
      if (saved) moved.push({ id: c.id, stageId: c.stage_id });
    }
    return { summary: `Moved ${moved.length} ${moved.length === 1 ? "person" : "people"} to "${t.to.name}".`, result: { count: moved.length }, undo: { moved, boardId: t.board.id } };
  },
  undo: async (u, ctx) => {
    const tz = await resolveUserTimeZone(null);
    const stages = await boardStages(ctx.db, ctx.planId, u.boardId as string);
    const { data: b } = await ctx.db.from("pipeline_boards").select("name").eq("id", u.boardId as string).maybeSingle();
    let n = 0;
    for (const m of (u.moved as { id: string; stageId: string }[]) ?? []) {
      const stage = stages.find((s) => s.id === m.stageId);
      if (stage && (await moveCard(ctx.db, ctx.planId, m.id, stage, (b?.name as string) ?? "Pipeline", tz))) n++;
    }
    return `Moved ${n} back.`;
  },
};

async function moveTargets(args: Record<string, unknown>, ctx: ActionCtx): Promise<MoveTarget> {
  const list = await boards(ctx);
  const board = findBoard(list, str(args.pipeline, 80));
  if (!board) return { error: `I can't find a pipeline called "${str(args.pipeline, 80)}".` };
  const stages = await boardStages(ctx.db, ctx.planId, board.id);
  const to = findStage(stages, str(args.to_stage, 60));
  if (!to) return { error: `No stage like "${str(args.to_stage, 60)}". Stages: ${stages.map((s) => s.name).join(", ")}.` };
  let q = ctx.db.from("dm_cards").select("id, name, stage_id").eq("board_id", board.id).eq("master_plan_id", ctx.planId).limit(MAX_CARDS);
  const from = str(args.from_stage, 60) ? findStage(stages, str(args.from_stage, 60)) : null;
  if (str(args.from_stage, 60) && !from) return { error: `No stage like "${str(args.from_stage, 60)}".` };
  if (from) q = q.eq("stage_id", from.id);
  const names = (Array.isArray(args.names) ? args.names : []).map((n) => str(n, 120).toLowerCase()).filter(Boolean);
  if (!from && !names.length) return { error: "Which people? Name them, or tell me which stage they are in now." };
  const { data } = await q;
  const cards = ((data ?? []) as { id: string; name: string; stage_id: string }[]).filter((c) => (names.length ? names.some((n) => c.name.toLowerCase().includes(n)) : true) && c.stage_id !== to.id);
  if (!cards.length) return { error: "Nobody matches (or they are already in that stage)." };
  return { board, to, cards };
}

export const addDeal: ActionTool = {
  name: "add_deal",
  kind: "write",
  apiPath: "/api/pipeline",
  description: "Add a deal to the client's Sales Pipeline (money in progress with a person or company). The client approves first.",
  parameters: {
    type: "object",
    properties: {
      contact_name: { type: "string" },
      company: { type: "string" },
      email: { type: "string" },
      value: { type: "number", description: "Dollar value." },
      stage: { type: "string", description: "Sales Pipeline stage name. Defaults to the first open stage." },
      next_step: { type: "string" },
      next_step_due: { type: "string", description: "YYYY-MM-DD" },
    },
    required: ["contact_name"],
  },
  plan: async (args) => {
    const v = dealRow(dealBody(args), { partial: false });
    if ("error" in v) return { error: v.error };
    return {
      preview: {
        title: `Add a deal with ${str(args.contact_name, 160)}${str(args.company, 160) ? ` (${str(args.company, 160)})` : ""}`,
        lines: [...(args.value ? [`Value: $${Number(args.value).toLocaleString("en-US")}`] : []), ...(str(args.stage, 60) ? [`Stage: ${str(args.stage, 60)}`] : []), ...(str(args.next_step, 300) ? [`Next step: ${str(args.next_step, 300)}`] : [])],
      },
    };
  },
  run: async (args, ctx) => {
    const v = dealRow(dealBody(args), { partial: false });
    if ("error" in v) throw new Error(v.error);
    const stages = await ensureStages(ctx.db, ctx.planId);
    const name = str(args.stage, 60).toLowerCase();
    const stage = (name && stages.find((s) => s.name.toLowerCase().includes(name))) || stages.find((s) => s.kind === "open") || stages[0];
    if (!stage) throw new Error("No pipeline stages.");
    const row: Record<string, unknown> = { ...v.row, master_plan_id: ctx.planId, stage_id: stage.id };
    if (stage.kind !== "open") row.closed_at = new Date().toISOString();
    const { data, error } = await ctx.db.from("pipeline_deals").insert(row).select("id").single();
    if (error || !data) throw new Error("The deal didn't save.");
    return { summary: `Added a deal with ${str(args.contact_name, 160)} in "${stage.name}".`, result: { id: data.id }, undo: { id: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("pipeline_deals").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Removed the deal.";
  },
};

const dealBody = (a: Record<string, unknown>) => ({
  contactName: a.contact_name,
  company: a.company,
  email: a.email,
  value: a.value ?? undefined,
  nextStep: a.next_step,
  nextStepDue: a.next_step_due,
});

export const PIPELINE_TOOLS: ActionTool[] = [listPipelines, createPipeline, addToPipeline, moveInPipeline, addDeal];
