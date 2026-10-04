import type { ActionTool, ActionCtx } from "./types";
import { upsertContact, logEvent, EMAIL_RE } from "@/lib/crm";

const MAX_CONTACTS = 2000; // one approval never touches more than this

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const tagOf = (v: unknown) => str(v, 60).toLowerCase();
const strList = (v: unknown, n = 60) => (Array.isArray(v) ? v.map((x) => str(x, n)).filter(Boolean) : []);

// Who the assistant is talking about: the same few filters for every contact action.
const WHO_SCHEMA = {
  type: "object",
  description: "Which contacts. Give at least one filter, or set everyone=true to mean every contact.",
  properties: {
    everyone: { type: "boolean", description: "True only when the client clearly means all of their contacts." },
    with_any_tag: { type: "array", items: { type: "string" }, description: "Contacts that have at least one of these tags." },
    without_tag: { type: "string", description: "Contacts that do NOT have this tag." },
    search: { type: "string", description: "Name, email, company or phone contains this text." },
    source: { type: "string", description: "Where the contact came from (for example a form or manual)." },
    emails: { type: "array", items: { type: "string" }, description: "Specific email addresses." },
    created_after: { type: "string", description: "YYYY-MM-DD" },
    created_before: { type: "string", description: "YYYY-MM-DD" },
  },
};

interface Row { id: string; email: string; first_name: string | null; last_name: string | null; tags: string[] | null }
const nameOf = (c: Row) => [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;

async function selectContacts(who: Record<string, unknown>, ctx: ActionCtx): Promise<{ rows: Row[]; capped: boolean } | { error: string }> {
  const withAny = strList(who.with_any_tag).map(tagOf).filter(Boolean);
  const without = tagOf(who.without_tag);
  const search = str(who.search, 100).replace(/[%,()]/g, "");
  const source = str(who.source, 60);
  const emails = strList(who.emails, 200).map((e) => e.toLowerCase());
  const after = str(who.created_after, 10);
  const before = str(who.created_before, 10);
  const hasFilter = withAny.length || without || search || source || emails.length || after || before;
  if (!who.everyone && !hasFilter) return { error: "Tell me which contacts (for example a tag, a name, or 'everyone')." };

  let q = ctx.db.from("seq_contacts").select("id, email, first_name, last_name, tags").eq("master_plan_id", ctx.planId).limit(MAX_CONTACTS + 1);
  if (withAny.length) q = q.overlaps("tags", withAny);
  if (source) q = q.eq("source", source);
  if (emails.length) q = q.in("email", emails);
  if (after) q = q.gte("created_at", after);
  if (before) q = q.lte("created_at", before + "T23:59:59Z");
  if (search) {
    const [first, ...rest] = search.split(/\s+/);
    const last = rest.join(" ");
    const both = last ? `,and(first_name.ilike.%${first}%,last_name.ilike.%${last}%)` : "";
    q = q.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%${both}`);
  }
  const { data, error } = await q;
  if (error) return { error: "I couldn't look up your contacts just now." };
  let rows = (data ?? []) as Row[];
  if (without) rows = rows.filter((r) => !(r.tags ?? []).includes(without));
  const capped = rows.length > MAX_CONTACTS;
  return { rows: rows.slice(0, MAX_CONTACTS), capped };
}

const sample = (rows: Row[], n = 6) => rows.slice(0, n).map((r) => `${nameOf(r)} <${r.email}>`);

export const findContacts: ActionTool = {
  name: "find_contacts",
  kind: "read",
  apiPath: "/api/crm/contacts",
  description: "Look up the client's contacts: how many match, and a few examples. Use this before proposing a change to a group, or to answer 'how many contacts have...'.",
  parameters: { type: "object", properties: { who: WHO_SCHEMA }, required: ["who"] },
  read: async (args, ctx) => {
    const r = await selectContacts((args.who as Record<string, unknown>) ?? {}, ctx);
    if ("error" in r) return r.error;
    return `${r.rows.length}${r.capped ? "+" : ""} contacts match. Examples: ${sample(r.rows, 8).join("; ") || "none"}.`;
  },
};

function tagAction(kind: "add" | "remove"): ActionTool {
  const verb = kind === "add" ? "Add" : "Remove";
  return {
    name: kind === "add" ? "add_tag_to_contacts" : "remove_tag_from_contacts",
    kind: "write",
    apiPath: "/api/crm/contacts",
    description:
      kind === "add"
        ? "Add a tag to a group of the client's contacts. Creates the tag if it is new (a tag is just a label). The client approves first."
        : "Remove a tag from a group of the client's contacts. The client approves first.",
    parameters: {
      type: "object",
      properties: { tag: { type: "string", description: "The tag, short and lowercase-friendly, e.g. masterclass-attended" }, who: WHO_SCHEMA },
      required: ["tag", "who"],
    },
    plan: async (args, ctx) => {
      const tag = tagOf(args.tag);
      if (!tag) return { error: "What should the tag be called?" };
      const r = await selectContacts((args.who as Record<string, unknown>) ?? {}, ctx);
      if ("error" in r) return { error: r.error };
      const affected = r.rows.filter((c) => (kind === "add" ? !(c.tags ?? []).includes(tag) : (c.tags ?? []).includes(tag)));
      if (!affected.length) return { error: kind === "add" ? `Nobody in that group is missing "${tag}", so there is nothing to do.` : `Nobody in that group has the tag "${tag}".` };
      return {
        preview: {
          title: `${verb} the tag "${tag}" ${kind === "add" ? "to" : "from"} ${affected.length} contact${affected.length === 1 ? "" : "s"}`,
          lines: [
            ...sample(affected),
            ...(affected.length > 6 ? [`…and ${affected.length - 6} more`] : []),
            ...(r.capped ? [`Only the first ${MAX_CONTACTS} will be changed; ask again for the rest.`] : []),
          ],
        },
      };
    },
    run: async (args, ctx) => {
      const tag = tagOf(args.tag);
      const r = await selectContacts((args.who as Record<string, unknown>) ?? {}, ctx);
      if ("error" in r) throw new Error(r.error);
      const affected = r.rows.filter((c) => (kind === "add" ? !(c.tags ?? []).includes(tag) : (c.tags ?? []).includes(tag)));
      const changed: string[] = [];
      for (const c of affected) {
        const next = kind === "add" ? Array.from(new Set([...(c.tags ?? []), tag])) : (c.tags ?? []).filter((t) => t !== tag);
        const { error } = await ctx.db.from("seq_contacts").update({ tags: next, tag_source: `assistant:${ctx.userEmail ?? "you"}`, updated_at: new Date().toISOString() }).eq("id", c.id).eq("master_plan_id", ctx.planId);
        if (!error) {
          changed.push(c.id);
          await logEvent(ctx.planId, c.id, "tag", kind === "add" ? `Tagged ${tag} (by your assistant)` : `Removed ${tag} (by your assistant)`).catch(() => {});
        }
      }
      return {
        summary: `${kind === "add" ? "Added" : "Removed"} the tag "${tag}" ${kind === "add" ? "to" : "from"} ${changed.length} contact${changed.length === 1 ? "" : "s"}.`,
        result: { count: changed.length },
        undo: { tag, kind, ids: changed },
      };
    },
    undo: async (u, ctx) => {
      const tag = String(u.tag);
      const ids = (u.ids as string[]) ?? [];
      let n = 0;
      for (const id of ids) {
        const { data: c } = await ctx.db.from("seq_contacts").select("tags").eq("id", id).eq("master_plan_id", ctx.planId).maybeSingle();
        if (!c) continue;
        const cur = (c.tags as string[]) ?? [];
        const next = u.kind === "add" ? cur.filter((t) => t !== tag) : Array.from(new Set([...cur, tag]));
        const { error } = await ctx.db.from("seq_contacts").update({ tags: next, tag_source: `assistant:${ctx.userEmail ?? "you"}`, updated_at: new Date().toISOString() }).eq("id", id).eq("master_plan_id", ctx.planId);
        if (!error) n++;
      }
      return `Undone for ${n} contact${n === 1 ? "" : "s"}.`;
    },
  };
}

export const addTag = tagAction("add");
export const removeTag = tagAction("remove");

export const addContact: ActionTool = {
  name: "add_contact",
  kind: "write",
  apiPath: "/api/crm/contacts",
  description: "Add one person to the client's contacts (or update them if the email already exists), optionally with tags. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      email: { type: "string" },
      first_name: { type: "string" },
      last_name: { type: "string" },
      phone: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["email"],
  },
  plan: async (args) => {
    const email = str(args.email, 200).toLowerCase();
    if (!EMAIL_RE.test(email)) return { error: "I need a valid email address for that contact." };
    const name = [str(args.first_name, 80), str(args.last_name, 80)].filter(Boolean).join(" ");
    const tags = strList(args.tags).map(tagOf).filter(Boolean);
    return { preview: { title: `Add ${name || email} to your contacts`, lines: [email, ...(str(args.phone, 40) ? [str(args.phone, 40)] : []), ...(tags.length ? [`Tags: ${tags.join(", ")}`] : [])] } };
  },
  run: async (args, ctx) => {
    const email = str(args.email, 200).toLowerCase();
    const c = await upsertContact({
      masterPlanId: ctx.planId,
      email,
      firstName: str(args.first_name, 80) || null,
      lastName: str(args.last_name, 80) || null,
      phone: str(args.phone, 40) || null,
      source: "assistant",
      tags: strList(args.tags).map(tagOf).filter(Boolean),
    });
    if (!c) throw new Error("That email address didn't work.");
    await logEvent(ctx.planId, c.id, "manual", c.created ? "Added by your assistant" : "Updated by your assistant").catch(() => {});
    return { summary: c.created ? `Added ${email} to your contacts.` : `${email} was already a contact, so I updated them.`, result: { id: c.id } };
  },
};

export const CRM_TOOLS: ActionTool[] = [findContacts, addTag, removeTag, addContact];
