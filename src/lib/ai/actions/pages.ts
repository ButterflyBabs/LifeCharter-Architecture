import type { ActionTool, ActionCtx } from "./types";
import { cleanBlocks, outline, slugify, newId, type Block } from "@/lib/customPages";

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

const BLOCK_SCHEMA = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["heading", "text", "checklist", "table", "link"] },
    text: { type: "string", description: "For heading and text blocks." },
    title: { type: "string", description: "For checklist and table blocks." },
    items: { type: "array", items: { type: "string" }, description: "Checklist items." },
    columns: { type: "array", items: { type: "string" }, description: "Table column names." },
    rows: { type: "array", items: { type: "array", items: { type: "string" } }, description: "Table rows, one array of cells per row, in column order." },
    label: { type: "string", description: "Link text." },
    url: { type: "string", description: "https link." },
  },
  required: ["type"],
};

// What the model sends is simple (checklist items are plain strings); turn it into stored blocks.
function toBlocks(raw: unknown): Block[] {
  const list = (Array.isArray(raw) ? raw : []).map((b) => {
    const x = (b ?? {}) as Record<string, unknown>;
    if (x.type === "checklist") return { ...x, items: (Array.isArray(x.items) ? x.items : []).map((t) => ({ text: typeof t === "string" ? t : (t as { text?: string })?.text ?? "", done: false })) };
    return x;
  });
  return cleanBlocks(list);
}

async function findPage(ctx: ActionCtx, name: string) {
  const { data } = await ctx.db.from("custom_pages").select("id, slug, title, blocks").eq("master_plan_id", ctx.planId).order("position");
  const rows = (data ?? []) as { id: string; slug: string; title: string; blocks: Block[] }[];
  const n = name.toLowerCase();
  return rows.find((r) => r.title.toLowerCase() === n || r.slug === slugify(name)) ?? rows.find((r) => r.title.toLowerCase().includes(n)) ?? null;
}

export const listPages: ActionTool = {
  name: "read_my_pages",
  kind: "read",
  apiPath: "/api/custom-pages",
  description: "List the client's custom pages, or read one page's content (use this before changing a page so you update the right part).",
  parameters: { type: "object", properties: { page: { type: "string", description: "Page title to read. Leave out to list all pages." } } },
  read: async (args, ctx) => {
    if (str(args.page, 80)) {
      const p = await findPage(ctx, str(args.page, 80));
      return p ? `Page "${p.title}":\n${outline(p.blocks) || "(empty)"}` : "No page with that name.";
    }
    const { data } = await ctx.db.from("custom_pages").select("title").eq("master_plan_id", ctx.planId).order("position");
    return (data ?? []).length ? `Their pages: ${(data ?? []).map((d) => `"${d.title}"`).join(", ")}.` : "They have no custom pages yet.";
  },
};

export const createPage: ActionTool = {
  name: "create_page",
  kind: "write",
  apiPath: "/api/custom-pages",
  description:
    "Create a new page in the client's own left menu (under MY PAGES) and fill it in. A page is made of blocks: headings, text, checklists, tables and links. Use it for trackers, plans, notes, SOP checklists, client lists and reference pages. It is a content page, not new app functionality. The client approves first.",
  parameters: { type: "object", properties: { title: { type: "string" }, blocks: { type: "array", items: BLOCK_SCHEMA } }, required: ["title"] },
  plan: async (args, ctx) => {
    const title = str(args.title, 80);
    if (!title) return { error: "What should the page be called?" };
    if (await findPage(ctx, title)) return { error: `They already have a page called "${title}". I can update it instead.` };
    const blocks = toBlocks(args.blocks);
    return { preview: { title: `Create the page "${title}" in your left menu`, lines: describe(blocks) } };
  },
  run: async (args, ctx) => {
    const title = str(args.title, 80);
    const { count } = await ctx.db.from("custom_pages").select("id", { count: "exact", head: true }).eq("master_plan_id", ctx.planId);
    if ((count ?? 0) >= 40) throw new Error("That's the most pages one account can hold.");
    const base = slugify(title);
    let slug = base;
    for (let i = 2; i < 30; i++) {
      const { data: hit } = await ctx.db.from("custom_pages").select("id").eq("master_plan_id", ctx.planId).eq("slug", slug).maybeSingle();
      if (!hit) break;
      slug = `${base}-${i}`;
    }
    const { data, error } = await ctx.db.from("custom_pages").insert({ master_plan_id: ctx.planId, slug, title, blocks: toBlocks(args.blocks), position: count ?? 0, created_by: ctx.userEmail }).select("id, slug").single();
    if (error || !data) throw new Error("The page didn't save.");
    return { summary: `Created the page "${title}". Find it in your left menu under MY PAGES.`, result: { slug: data.slug }, undo: { id: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("custom_pages").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Removed the page.";
  },
};

function describe(blocks: Block[]): string[] {
  const out = blocks.slice(0, 10).map((b) =>
    b.type === "heading" ? `Heading: ${b.text}`
    : b.type === "text" ? `Text: ${b.text.slice(0, 80)}${b.text.length > 80 ? "…" : ""}`
    : b.type === "checklist" ? `Checklist "${b.title}" (${b.items.length} items)`
    : b.type === "table" ? `Table "${b.title}": ${b.columns.join(" | ")} (${b.rows.length} rows)`
    : `Link: ${b.label}`
  );
  if (blocks.length > 10) out.push(`…and ${blocks.length - 10} more`);
  return out.length ? out : ["An empty page you can fill in"];
}

const OP_SCHEMA = {
  type: "object",
  properties: {
    op: { type: "string", enum: ["add_blocks", "add_checklist_items", "check_items", "add_table_rows", "replace_all_blocks", "rename_page"] },
    blocks: { type: "array", items: BLOCK_SCHEMA, description: "For add_blocks and replace_all_blocks." },
    block_title: { type: "string", description: "The checklist or table to change, by its title." },
    items: { type: "array", items: { type: "string" }, description: "Checklist items to add, or the items to tick off (by their text)." },
    done: { type: "boolean", description: "For check_items: true to tick, false to untick. Default true." },
    rows: { type: "array", items: { type: "array", items: { type: "string" } }, description: "Rows to add to a table." },
    title: { type: "string", description: "For rename_page." },
  },
  required: ["op"],
};

interface Applied { blocks: Block[]; title: string; notes: string[] }

function apply(page: { title: string; blocks: Block[] }, ops: Record<string, unknown>[]): Applied | { error: string } {
  let blocks: Block[] = JSON.parse(JSON.stringify(page.blocks));
  let title = page.title;
  const notes: string[] = [];
  const target = (name: string, type: "checklist" | "table") =>
    blocks.find((b) => b.type === type && (b as { title: string }).title.toLowerCase() === name.toLowerCase()) ??
    blocks.find((b) => b.type === type && (b as { title: string }).title.toLowerCase().includes(name.toLowerCase())) ??
    (!name ? blocks.find((b) => b.type === type) : undefined);
  for (const o of ops.slice(0, 12)) {
    switch (o.op) {
      case "add_blocks": {
        const nb = toBlocks(o.blocks);
        blocks = [...blocks, ...nb];
        notes.push(`Add ${nb.length} block${nb.length === 1 ? "" : "s"}: ${describe(nb).slice(0, 3).join("; ")}`);
        break;
      }
      case "add_checklist_items": {
        const b = target(str(o.block_title, 200), "checklist");
        if (!b || b.type !== "checklist") return { error: `I can't find a checklist called "${str(o.block_title, 200)}" on that page.` };
        const items = (Array.isArray(o.items) ? o.items : []).map((t) => str(t, 500)).filter(Boolean);
        b.items.push(...items.map((text) => ({ id: newId(), text, done: false })));
        notes.push(`Add to "${b.title}": ${items.join("; ")}`);
        break;
      }
      case "check_items": {
        const b = target(str(o.block_title, 200), "checklist");
        if (!b || b.type !== "checklist") return { error: `I can't find a checklist called "${str(o.block_title, 200)}" on that page.` };
        const want = (Array.isArray(o.items) ? o.items : []).map((t) => str(t, 500).toLowerCase()).filter(Boolean);
        const done = o.done !== false;
        const hit = b.items.filter((i) => want.some((w) => i.text.toLowerCase().includes(w)));
        if (!hit.length) return { error: `None of those items are on the "${b.title}" checklist.` };
        hit.forEach((i) => (i.done = done));
        notes.push(`${done ? "Tick" : "Untick"} in "${b.title}": ${hit.map((i) => i.text).join("; ")}`);
        break;
      }
      case "add_table_rows": {
        const b = target(str(o.block_title, 200), "table");
        if (!b || b.type !== "table") return { error: `I can't find a table called "${str(o.block_title, 200)}" on that page.` };
        const rows = (Array.isArray(o.rows) ? o.rows : []).map((r) => b.columns.map((_, i) => str((Array.isArray(r) ? r : [])[i], 1000)));
        b.rows.push(...rows);
        notes.push(`Add ${rows.length} row${rows.length === 1 ? "" : "s"} to "${b.title}": ${rows.slice(0, 3).map((r) => r.join(" | ")).join(" / ")}`);
        break;
      }
      case "replace_all_blocks": {
        blocks = toBlocks(o.blocks);
        notes.push(`Replace the whole page with ${blocks.length} new block${blocks.length === 1 ? "" : "s"}`);
        break;
      }
      case "rename_page": {
        if (str(o.title, 80)) {
          title = str(o.title, 80);
          notes.push(`Rename the page to "${title}"`);
        }
        break;
      }
    }
  }
  if (!notes.length) return { error: "I couldn't work out what to change." };
  return { blocks: cleanBlocks(blocks), title, notes };
}

export const updatePage: ActionTool = {
  name: "update_page",
  kind: "write",
  apiPath: "/api/custom-pages",
  description:
    "Change one of the client's custom pages: add blocks, add or tick off checklist items, add table rows, rename it, or rewrite it. Read the page first with read_my_pages so you target the right checklist or table by its title. The client approves first and can undo.",
  parameters: { type: "object", properties: { page: { type: "string", description: "The page title." }, ops: { type: "array", items: OP_SCHEMA } }, required: ["page", "ops"] },
  plan: async (args, ctx) => {
    const p = await findPage(ctx, str(args.page, 80));
    if (!p) return { error: `I can't find a page called "${str(args.page, 80)}".` };
    const r = apply(p, Array.isArray(args.ops) ? (args.ops as Record<string, unknown>[]) : []);
    if ("error" in r) return { error: r.error };
    return { preview: { title: `Update the page "${p.title}"`, lines: r.notes } };
  },
  run: async (args, ctx) => {
    const p = await findPage(ctx, str(args.page, 80));
    if (!p) throw new Error("That page is gone.");
    const r = apply(p, Array.isArray(args.ops) ? (args.ops as Record<string, unknown>[]) : []);
    if ("error" in r) throw new Error(r.error);
    const { error } = await ctx.db.from("custom_pages").update({ title: r.title, blocks: r.blocks, updated_at: new Date().toISOString() }).eq("id", p.id).eq("master_plan_id", ctx.planId);
    if (error) throw new Error("The page didn't save.");
    return { summary: `Updated the page "${r.title}".`, result: { slug: p.slug }, undo: { id: p.id, title: p.title, blocks: p.blocks } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("custom_pages").update({ title: u.title as string, blocks: u.blocks, updated_at: new Date().toISOString() }).eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Put the page back the way it was.";
  },
};

export const PAGE_TOOLS: ActionTool[] = [listPages, createPage, updatePage];
