import type { ActionTool } from "./types";
import { cleanFields } from "@/app/api/crm/forms/clean";
import { OPERATIONS_PILLARS } from "@/lib/operations";

// Assistant tools that set things up in the client's own account: forms, booking links, custom contact
// fields and SOPs, plus a read-only look at businesses and segments. Writes sit behind Approve and have Undo.

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const slug = (s: string, n = 60) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, n);
const APP = () => (process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com").replace(/\/$/, "");
const FIELD_TYPES = ["text", "long_text", "number", "date", "url", "select"];
const PILLARS = OPERATIONS_PILLARS.map((p) => p.key);

// ---------------------------------------------------------------- forms
export const listForms: ActionTool = {
  name: "list_forms",
  kind: "read",
  apiPath: "/api/crm/forms",
  description: "List the client's contact forms with how many people have submitted each.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const { data } = await ctx.db.from("crm_forms").select("id, name, key").eq("master_plan_id", ctx.planId).order("created_at").limit(60);
    const rows = (data ?? []) as { id: string; name: string; key: string }[];
    if (!rows.length) return "The client has no forms yet.";
    const { data: subs } = await ctx.db.from("crm_submissions").select("form_id").in("form_id", rows.map((r) => r.id));
    const n = new Map<string, number>();
    for (const s of (subs ?? []) as { form_id: string }[]) n.set(s.form_id, (n.get(s.form_id) ?? 0) + 1);
    return rows.map((r) => `${r.name} | ${n.get(r.id) ?? 0} submissions | tag: ${r.key}`).join("\n");
  },
};

export const createForm: ActionTool = {
  name: "create_form",
  kind: "write",
  apiPath: "/api/crm/forms",
  description:
    "Create a contact form (a sign-up or inquiry form). Give a name and the fields to collect; an Email field is always included. Field types: text, email, tel, date, textarea, select (with options). People who submit it become contacts tagged with the form's tag. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string" },
      fields: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            type: { type: "string", enum: ["text", "email", "tel", "date", "textarea", "select"] },
            required: { type: "boolean" },
            options: { type: "array", items: { type: "string" } },
          },
          required: ["label"],
        },
      },
    },
    required: ["name"],
  },
  plan: async (args) => {
    const name = str(args.name, 120);
    if (!name) return { error: "What should the form be called?" };
    const fields = cleanFields(args.fields) ?? [];
    return {
      preview: {
        title: `Create the form "${name}"`,
        lines: [...(fields.length ? fields : [{ label: "Name" }, { label: "Email" }]).map((f) => `Field: ${f.label}`), `Contacts who submit are tagged "${slug(name)}"`],
      },
    };
  },
  run: async (args, ctx) => {
    const name = str(args.name, 120);
    const key = slug(name);
    const fields = cleanFields(args.fields) ?? [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
    ];
    const { data, error } = await ctx.db.from("crm_forms").insert({ master_plan_id: ctx.planId, key, name, fields, tags: [key] }).select("id").single();
    if (error || !data) throw new Error(error?.code === "23505" ? "A form with that name already exists." : "The form didn't save.");
    return { summary: `Created the form "${name}".`, result: { id: data.id }, undo: { id: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("crm_forms").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Removed the form.";
  },
};

// ---------------------------------------------------------------- booking links
export const listBookingLinks: ActionTool = {
  name: "list_booking_links",
  kind: "read",
  apiPath: "/api/calendars",
  description: "List the client's booking links (calendars people can book on) with length and public address.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const { data } = await ctx.db.from("booking_calendars").select("name, slug, duration_min, active").eq("master_plan_id", ctx.planId).order("created_at").limit(40);
    const rows = (data ?? []) as { name: string; slug: string; duration_min: number | null; active: boolean | null }[];
    if (!rows.length) return "The client has no booking links yet.";
    return rows.map((r) => `${r.name} | ${r.duration_min ?? "?"} min | ${APP()}/book/${r.slug}${r.active === false ? " | OFF" : ""}`).join("\n");
  },
};

export const createBookingLink: ActionTool = {
  name: "create_booking_link",
  kind: "write",
  apiPath: "/api/calendars",
  description:
    "Create a booking link (a calendar people can book a call on). Give a name, optionally a length in minutes and a description. It starts with the default hours; the client sets availability and connects a calendar on the Calendars page. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string" },
      duration_minutes: { type: "number", description: "Length of each booking, 5 to 480." },
      description: { type: "string" },
    },
    required: ["name"],
  },
  plan: async (args) => {
    const name = str(args.name, 120);
    if (!name) return { error: "What should the booking link be called?" };
    const d = Number(args.duration_minutes);
    return {
      preview: {
        title: `Create the booking link "${name}"`,
        lines: [`Address: ${APP()}/book/${slug(name)}`, ...(Number.isFinite(d) && d >= 5 && d <= 480 ? [`Length: ${Math.round(d)} minutes`] : []), "You set your available hours and connect your calendar on the Calendars page."],
      },
    };
  },
  run: async (args, ctx) => {
    const name = str(args.name, 120);
    const s = slug(name);
    const row: Record<string, unknown> = { master_plan_id: ctx.planId, name, slug: s, tags: [s], location: "custom" };
    const d = Number(args.duration_minutes);
    if (Number.isFinite(d) && d >= 5 && d <= 480) row.duration_min = Math.round(d);
    if (str(args.description, 2000)) row.description = str(args.description, 2000);
    const { data, error } = await ctx.db.from("booking_calendars").insert(row).select("id").single();
    if (error || !data) throw new Error(error?.code === "23505" ? "That link address is taken. Try another name." : "The booking link didn't save.");
    return { summary: `Created the booking link "${name}" (${APP()}/book/${s}).`, result: { id: data.id }, undo: { id: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("booking_calendars").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Removed the booking link.";
  },
};

// ---------------------------------------------------------------- custom contact fields
export const listCustomFields: ActionTool = {
  name: "list_custom_fields",
  kind: "read",
  apiPath: "/api/crm/custom-fields",
  description: "List the client's extra contact fields.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const { data } = await ctx.db.from("crm_custom_fields").select("label, type, options").eq("master_plan_id", ctx.planId).order("position").limit(60);
    const rows = (data ?? []) as { label: string; type: string; options: string[] | null }[];
    if (!rows.length) return "The client has no extra contact fields yet.";
    return rows.map((r) => `${r.label} | ${r.type}${r.options?.length ? ` | ${r.options.join(", ")}` : ""}`).join("\n");
  },
};

export const createCustomField: ActionTool = {
  name: "create_custom_field",
  kind: "write",
  apiPath: "/api/crm/custom-fields",
  description: "Add an extra field to every contact record (text, long_text, number, date, url, or select with choices). The client approves first.",
  parameters: {
    type: "object",
    properties: {
      label: { type: "string" },
      type: { type: "string", enum: FIELD_TYPES },
      options: { type: "array", items: { type: "string" }, description: "The choices, for a select field." },
    },
    required: ["label"],
  },
  plan: async (args) => {
    const label = str(args.label, 60);
    if (!label) return { error: "What should the field be called?" };
    const type = FIELD_TYPES.includes(String(args.type)) ? String(args.type) : "text";
    const options = Array.isArray(args.options) ? args.options.map((o) => str(o, 60)).filter(Boolean).slice(0, 30) : [];
    if (type === "select" && !options.length) return { error: "A choice field needs at least one choice. What are they?" };
    return { preview: { title: `Add the contact field "${label}"`, lines: [`Type: ${type}`, ...(options.length ? [`Choices: ${options.join(", ")}`] : [])] } };
  },
  run: async (args, ctx) => {
    const label = str(args.label, 60);
    const type = FIELD_TYPES.includes(String(args.type)) ? String(args.type) : "text";
    const options = type === "select" && Array.isArray(args.options) ? args.options.map((o) => str(o, 60)).filter(Boolean).slice(0, 30) : [];
    const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "field";
    const { data: existing } = await ctx.db.from("crm_custom_fields").select("key, position").eq("master_plan_id", ctx.planId);
    const keys = new Set(((existing ?? []) as { key: string }[]).map((f) => f.key));
    let key = base;
    for (let i = 2; keys.has(key); i++) key = `${base}_${i}`;
    const position = Math.max(0, ...((existing ?? []) as { position: number | null }[]).map((f) => f.position ?? 0)) + 1;
    const { data, error } = await ctx.db.from("crm_custom_fields").insert({ master_plan_id: ctx.planId, key, label, type, options, position }).select("id").single();
    if (error || !data) throw new Error("The field didn't save.");
    return { summary: `Added the contact field "${label}".`, result: { id: data.id }, undo: { id: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("crm_custom_fields").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Removed the field.";
  },
};

// ---------------------------------------------------------------- SOPs
export const listSops: ActionTool = {
  name: "list_sops",
  kind: "read",
  apiPath: "/api/sops",
  description: "List the client's SOPs (standard operating procedures) with status and area.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const { data } = await ctx.db.from("sops").select("title, status, pillar_key, owner").eq("master_plan_id", ctx.planId).order("updated_at", { ascending: false }).limit(60);
    const rows = (data ?? []) as { title: string; status: string | null; pillar_key: string | null; owner: string | null }[];
    if (!rows.length) return "The client has no SOPs yet.";
    return rows.map((r) => `${r.title} | ${r.status ?? "draft"}${r.pillar_key ? ` | ${r.pillar_key}` : ""}${r.owner ? ` | owner ${r.owner}` : ""}`).join("\n");
  },
};

export const createSop: ActionTool = {
  name: "create_sop",
  kind: "write",
  apiPath: "/api/sops",
  description:
    "Write a standard operating procedure (SOP) into the client's Playbook: a title, why it exists, the steps in order, an owner and tools. It saves as a draft the client can edit. Use placeholders in [brackets] for details you do not know. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string" },
      purpose: { type: "string" },
      steps: { type: "array", items: { type: "string" }, description: "5 to 12 clear steps in order." },
      owner: { type: "string" },
      tools: { type: "string" },
      pillar_key: { type: "string", enum: PILLARS, description: "Which operations area it belongs to, if clear." },
    },
    required: ["title", "steps"],
  },
  plan: async (args) => {
    const title = str(args.title, 160);
    const steps = Array.isArray(args.steps) ? args.steps.map((s) => str(s, 600)).filter(Boolean).slice(0, 40) : [];
    if (!title) return { error: "What is the process called?" };
    if (!steps.length) return { error: "I need the steps for it." };
    return { preview: { title: `Add the SOP "${title}" as a draft`, lines: [...steps.slice(0, 6).map((s, i) => `${i + 1}. ${s}`), ...(steps.length > 6 ? [`…and ${steps.length - 6} more steps`] : [])] } };
  },
  run: async (args, ctx) => {
    const steps = Array.isArray(args.steps) ? args.steps.map((s) => str(s, 600)).filter(Boolean).slice(0, 40) : [];
    const pillar = PILLARS.includes(String(args.pillar_key)) ? String(args.pillar_key) : null;
    const { data, error } = await ctx.db
      .from("sops")
      .insert({ master_plan_id: ctx.planId, title: str(args.title, 160), purpose: str(args.purpose, 1000) || null, steps, owner: str(args.owner, 120) || null, tools: str(args.tools, 300) || null, pillar_key: pillar, status: "draft" })
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

// ---------------------------------------------------------------- businesses and segments (read only)
export const listSegments: ActionTool = {
  name: "list_segments",
  kind: "read",
  apiPath: "/api/segments",
  description: "List the client's businesses and the segments inside each, with their health. Read only; businesses and segments are created in Settings.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const { data } = await ctx.db
      .from("businesses")
      .select("name, active, segments ( name, health )")
      .eq("master_plan_id", ctx.planId)
      .order("sort_order")
      .limit(30);
    const rows = (data ?? []) as unknown as { name: string; active: boolean | null; segments: { name: string; health: string | null }[] | null }[];
    if (!rows.length) return "The client has no businesses or segments set up yet.";
    return rows
      .filter((b) => b.active !== false)
      .map((b) => `${b.name}: ${(b.segments ?? []).map((s) => `${s.name}${s.health ? ` (${s.health})` : ""}`).join(", ") || "no segments"}`)
      .join("\n");
  },
};

export const BUILDER_TOOLS: ActionTool[] = [listForms, createForm, listBookingLinks, createBookingLink, listCustomFields, createCustomField, listSops, createSop, listSegments];
