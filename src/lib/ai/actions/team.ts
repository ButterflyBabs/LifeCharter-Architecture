import type { ActionCtx, ActionTool } from "./types";
import { accessEndOf, cleanExpiryDate, cleanFeatureMap, memberAccessExpired, PRESETS, todayInZone, withAccessEnd } from "@/lib/teamRoles";
import { ownerTimezone } from "@/lib/taskReminders";
import { withinStandingLimit } from "@/lib/capabilities";

// The assistant and the client's team (Settings > Team): it can say who is on the team and what they can reach, add a
// person, change their role or access, give them a last day of access, and remove them. Every change sits behind
// Approve with Undo. It never emails an invitation: the client presses Send invite on the person's card, so nobody
// is emailed on the assistant's word alone. Sales and Call to Close roles stay the owner's own screen.

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ROLES = ["admin", "editor", "viewer"];
const ROLE_WORDS: Record<string, string> = { admin: "Admin", editor: "Editor", viewer: "Viewer", sales: "Sales", consultant: "Call to Close" };
const PUBLIC_PRESETS = PRESETS.filter((p) => !p.houseOnly);
const SETTINGS_TEAM = { label: "Open Settings > Team", href: "/settings?tab=team" };

interface Member {
  id: string;
  workspace_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  permissions: Record<string, unknown> | null;
  user_id: string | null;
  joined_at: string | null;
}
const COLS = "id, workspace_id, name, email, role, status, permissions, user_id, joined_at";

const day = (ymd: string) => new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${ymd}T12:00:00Z`));

async function workspaces(ctx: ActionCtx): Promise<{ id: string; name: string; isDefault: boolean }[]> {
  const { data } = await ctx.db.from("workspaces").select("id, name, is_default, sort_order").eq("master_plan_id", ctx.planId).order("sort_order", { ascending: true });
  return ((data ?? []) as { id: string; name: string | null; is_default: boolean | null }[]).map((w) => ({ id: w.id, name: w.name || "Workspace", isDefault: Boolean(w.is_default) }));
}
async function members(ctx: ActionCtx): Promise<Member[]> {
  const spaces = await workspaces(ctx);
  if (!spaces.length) return [];
  const { data } = await ctx.db.from("workspace_members").select(COLS).in("workspace_id", spaces.map((w) => w.id)).order("created_at", { ascending: true });
  return (data ?? []) as Member[];
}

/** The one person a name or email points to, or what to ask. */
async function findMember(args: Record<string, unknown>, ctx: ActionCtx): Promise<{ member: Member } | { error: string }> {
  const ref = str(args.member, 160).toLowerCase();
  if (!ref) return { error: "Which team member? Give a name or an email." };
  const all = await members(ctx);
  const exact = all.filter((m) => (m.email || "").toLowerCase() === ref || (m.name || "").toLowerCase() === ref);
  const hits = exact.length ? exact : all.filter((m) => (m.email || "").toLowerCase().includes(ref) || (m.name || "").toLowerCase().includes(ref));
  if (!hits.length) return { error: `I don't see anyone on the team matching "${ref}". Ask me to list the team to check the spelling.` };
  if (hits.length > 1) return { error: `More than one person matches "${ref}": ${hits.map((m) => `${m.name || m.email} (${m.email})`).join("; ")}. Which one?` };
  return { member: hits[0] };
}

const who = (m: Member) => `${m.name || m.email}${m.name && m.email ? ` (${m.email})` : ""}`;

function areasOf(m: Member): string {
  const p = m.permissions as { preset?: string | null; features?: unknown; extras?: { restrict?: boolean; ownOnly?: boolean; noDelete?: boolean } } | null;
  const features = cleanFeatureMap(p?.features);
  if (!features) return `${ROLE_WORDS[m.role || ""] ?? m.role} role defaults`;
  const preset = PRESETS.find((x) => x.key === p?.preset);
  const edit = Object.entries(features).filter(([, l]) => l === "edit").length;
  const view = Object.entries(features).filter(([, l]) => l === "view").length;
  const flags = [p?.extras?.restrict && "only the areas listed", p?.extras?.ownOnly && "own tasks and reminders only", p?.extras?.noDelete && "cannot delete"].filter(Boolean);
  return `${preset ? preset.label : "custom access"}: ${edit} area${edit === 1 ? "" : "s"} to edit, ${view} to view${flags.length ? `; ${flags.join(", ")}` : ""}`;
}

function endLine(m: Member): string {
  const end = accessEndOf(m.permissions);
  if (!end) return "no end date";
  return memberAccessExpired(m.permissions) ? `access ended after ${day(end.on)}` : `last day ${day(end.on)}`;
}

export const listTeam: ActionTool = {
  name: "list_team",
  kind: "read",
  apiPath: "/api/workspaces/team/members",
  description:
    "List the people on the client's team (Settings > Team): name, email, role, whether their invitation has been accepted, what areas they can reach, and the last day of their access if one is set. Use for 'who's on my team?', 'when does Morgan's access end?', and before changing anyone.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const all = await members(ctx);
    if (!all.length) return "No one else is on the team yet. The client adds people under Settings > Team (or ask me to add someone).";
    const presets = PUBLIC_PRESETS.map((p) => `${p.key} (${p.label})`).join("; ");
    return (
      all.map((m) => `- ${who(m)} | ${ROLE_WORDS[m.role || ""] ?? m.role} | ${m.status === "pending" ? "invitation not accepted yet" : m.status} | ${areasOf(m)} | ${endLine(m)}`).join("\n") +
      `\nAccess presets I can apply: ${presets}.`
    );
  },
};

export const addTeamMember: ActionTool = {
  name: "add_team_member",
  kind: "write",
  apiPath: "/api/workspaces/team/members",
  description:
    "Add a person to the client's team as a pending member, with a role (admin, editor or viewer), optionally one of the access presets from list_team, and optionally a last day of access (for a contractor, advisor or reviewer). This does NOT email them: afterwards the client presses Send invite on the person's card in Settings > Team (you cannot send it). Each person counts as a seat on the plan. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string" },
      email: { type: "string" },
      role: { type: "string", enum: ROLES, description: "Default editor." },
      preset: { type: "string", description: "An access preset key from list_team (for example va, bookkeeper, viewer). Leave out for the role's defaults." },
      access_ends_on: { type: "string", description: "Last day of access, YYYY-MM-DD, in the client's own time zone. Leave out for no end date." },
    },
    required: ["name", "email"],
  },
  plan: async (args, ctx) => {
    const r = await prepareAdd(args, ctx);
    if ("error" in r) return r;
    return {
      preview: {
        title: `Add ${r.name} to your team`,
        lines: [
          `${r.email}, as ${ROLE_WORDS[r.role]}${r.preset ? ` with the ${r.preset.label} access preset` : ""}.`,
          r.endsOn ? `Their last day of access: ${day(r.endsOn)} (${r.tz}). After it they are signed out of everything.` : "No end date.",
          "They are added as pending and nothing is emailed. Open their card and press Send invite when you are ready.",
        ],
        links: [SETTINGS_TEAM],
      },
    };
  },
  run: async (args, ctx) => {
    const r = await prepareAdd(args, ctx);
    if ("error" in r) throw new Error(r.error);
    let permissions: Record<string, unknown> = {};
    if (r.preset) permissions = { preset: r.preset.key, features: r.preset.features, ...(r.preset.extras ? { extras: r.preset.extras } : {}) };
    if (r.endsOn) permissions = withAccessEnd(permissions, { on: r.endsOn, tz: r.tz });
    const { data, error } = await ctx.db
      .from("workspace_members")
      .insert({ workspace_id: r.workspaceId, name: r.name, email: r.email, role: r.role, status: "pending", ...(Object.keys(permissions).length ? { permissions } : {}) })
      .select("id")
      .single();
    if (error || !data) throw new Error("Couldn't add them.");
    return { summary: `Added ${r.name} (${r.email}) as ${ROLE_WORDS[r.role]}, pending. Open Settings > Team and press Send invite on their card to email the invitation.`, result: { memberId: data.id }, undo: { memberId: data.id } };
  },
  undo: async (u, ctx) => {
    const spaces = await workspaces(ctx);
    await ctx.db.from("workspace_members").delete().eq("id", u.memberId as string).eq("status", "pending").in("workspace_id", spaces.map((w) => w.id));
    return "Took them off the team again.";
  },
};

type Preset = (typeof PRESETS)[number];
interface AddOk { name: string; email: string; role: string; preset: Preset | undefined; endsOn: string | null; tz: string; workspaceId: string }
async function prepareAdd(args: Record<string, unknown>, ctx: ActionCtx): Promise<AddOk | { error: string }> {
  const name = str(args.name, 120);
  const email = str(args.email, 160).toLowerCase();
  if (!name) return { error: "What is their name?" };
  if (!EMAIL.test(email)) return { error: "That email doesn't look right. What is their email address?" };
  const role = ROLES.includes(str(args.role, 20)) ? str(args.role, 20) : "editor";
  const presetKey = str(args.preset, 40);
  const preset = presetKey ? PUBLIC_PRESETS.find((p) => p.key === presetKey) : undefined;
  if (presetKey && !preset) return { error: `I don't have an access preset called "${presetKey}". The ones I can apply: ${PUBLIC_PRESETS.map((p) => p.key).join(", ")}.` };
  const tz = await ownerTimezone(ctx.planId);
  let endsOn: string | null = null;
  if (str(args.access_ends_on, 10)) {
    endsOn = cleanExpiryDate(str(args.access_ends_on, 10));
    if (!endsOn) return { error: "The last day needs to be a real date like 2026-11-30." };
    if (endsOn < todayInZone(tz)) return { error: "The last day of access can't be in the past." };
  }
  const spaces = await workspaces(ctx);
  const space = spaces.find((w) => w.isDefault) ?? spaces[0];
  if (!space) return { error: "I can't find the account's workspace." };
  const all = await members(ctx);
  if (all.some((m) => (m.email || "").toLowerCase() === email)) return { error: `${email} is already on the team.` };
  const { allowed, limit } = await withinStandingLimit("seats", ctx.planId, all.length + 1);
  if (!allowed) return { error: `The plan includes ${limit} team seat${limit === 1 ? "" : "s"} (including you), and they are all used. Upgrading the plan adds more.` };
  return { name, email, role, preset, endsOn, tz, workspaceId: space.id };
}

export const changeMemberAccess: ActionTool = {
  name: "change_member_access",
  kind: "write",
  apiPath: "/api/workspaces/team/members",
  description:
    "Change a team member's role (admin, editor or viewer) and/or apply one of the access presets from list_team, which sets which areas they can reach. Their last day of access, if they have one, is kept. To change the last day use set_member_access_end. Name the member by name or email. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      member: { type: "string", description: "The member's name or email." },
      role: { type: "string", enum: ROLES },
      preset: { type: "string", description: "An access preset key from list_team." },
    },
    required: ["member"],
  },
  plan: async (args, ctx) => {
    const r = await prepareChange(args, ctx);
    if ("error" in r) return r;
    return {
      preview: {
        title: `Change ${r.member.name || r.member.email}'s access`,
        lines: [
          r.role ? `Role: ${ROLE_WORDS[r.member.role || ""] ?? r.member.role} → ${ROLE_WORDS[r.role]}` : "Role stays the same.",
          r.preset ? `Access: ${areasOf(r.member)} → the ${r.preset.label} preset (${r.preset.blurb})` : "Access areas stay the same.",
          "Takes effect the next time they open a page. Their last day of access, if any, is kept.",
        ],
        links: [SETTINGS_TEAM],
      },
    };
  },
  run: async (args, ctx) => {
    const r = await prepareChange(args, ctx);
    if ("error" in r) throw new Error(r.error);
    const update: Record<string, unknown> = {};
    if (r.role) update.role = r.role;
    if (r.preset) update.permissions = withAccessEnd({ preset: r.preset.key, features: r.preset.features, ...(r.preset.extras ? { extras: r.preset.extras } : {}) }, accessEndOf(r.member.permissions));
    const { error } = await ctx.db.from("workspace_members").update(update).eq("id", r.member.id);
    if (error) throw new Error("Couldn't save the change.");
    return { summary: `Updated ${r.member.name || r.member.email}${r.role ? `: role is now ${ROLE_WORDS[r.role]}` : ""}${r.preset ? `${r.role ? "," : ":"} access is now the ${r.preset.label} preset` : ""}.`, undo: { memberId: r.member.id, role: r.member.role, permissions: r.member.permissions ?? {} } };
  },
  undo: async (u, ctx) => {
    const spaces = await workspaces(ctx);
    await ctx.db.from("workspace_members").update({ role: u.role, permissions: u.permissions ?? {} }).eq("id", u.memberId as string).in("workspace_id", spaces.map((w) => w.id));
    return "Put their role and access back.";
  },
};

async function prepareChange(args: Record<string, unknown>, ctx: ActionCtx) {
  const found = await findMember(args, ctx);
  if ("error" in found) return found;
  const role = ROLES.includes(str(args.role, 20)) ? str(args.role, 20) : null;
  const presetKey = str(args.preset, 40);
  const preset = presetKey ? PUBLIC_PRESETS.find((p) => p.key === presetKey) : undefined;
  if (presetKey && !preset) return { error: `I don't have an access preset called "${presetKey}". The ones I can apply: ${PUBLIC_PRESETS.map((p) => p.key).join(", ")}.` };
  if (!role && !preset) return { error: "What should change: their role, or their access preset?" };
  if (role && (found.member.role === "sales" || found.member.role === "consultant")) return { error: "This person has a Sales or Call to Close role, which is changed in Settings > Team by the account owner." };
  return { member: found.member, role, preset };
}

export const setMemberAccessEnd: ActionTool = {
  name: "set_member_access_end",
  kind: "write",
  apiPath: "/api/workspaces/team/members",
  description:
    "Give a team member a last day of access (a contractor, advisor or reviewer who should only be in for a while), change it, or remove it. The login works through that whole day in the client's own time zone and is refused from the next day on; a new last day turns an ended login back on. The client is reminded in their bell and daily email two days before. Give last_day as YYYY-MM-DD, or clear true for no end date. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      member: { type: "string", description: "The member's name or email." },
      last_day: { type: "string", description: "YYYY-MM-DD, today or later." },
      clear: { type: "boolean", description: "Remove the end date." },
    },
    required: ["member"],
  },
  plan: async (args, ctx) => {
    const r = await prepareEnd(args, ctx);
    if ("error" in r) return r;
    const was = endLine(r.member);
    return {
      preview: {
        title: r.endsOn ? `Set ${r.member.name || r.member.email}'s last day of access` : `Remove ${r.member.name || r.member.email}'s end date`,
        lines: [
          r.endsOn ? `Last day: ${day(r.endsOn)} (${r.tz}). Their login works through that day, then they are signed out of everything.` : "Their access continues until you remove them.",
          `Now: ${was}.`,
          ...(r.endsOn ? ["You will see a reminder in your bell and daily email two days before."] : []),
        ],
        links: [SETTINGS_TEAM],
      },
    };
  },
  run: async (args, ctx) => {
    const r = await prepareEnd(args, ctx);
    if ("error" in r) throw new Error(r.error);
    const next = withAccessEnd(r.member.permissions ?? {}, r.endsOn ? { on: r.endsOn, tz: r.tz } : null);
    const { error } = await ctx.db.from("workspace_members").update({ permissions: next }).eq("id", r.member.id);
    if (error) throw new Error("Couldn't save the change.");
    return { summary: r.endsOn ? `${r.member.name || r.member.email}'s last day of access is ${day(r.endsOn)}.` : `${r.member.name || r.member.email} has no end date now.`, undo: { memberId: r.member.id, permissions: r.member.permissions ?? {} } };
  },
  undo: async (u, ctx) => {
    const spaces = await workspaces(ctx);
    await ctx.db.from("workspace_members").update({ permissions: u.permissions ?? {} }).eq("id", u.memberId as string).in("workspace_id", spaces.map((w) => w.id));
    return "Put their last day back the way it was.";
  },
};

async function prepareEnd(args: Record<string, unknown>, ctx: ActionCtx) {
  const found = await findMember(args, ctx);
  if ("error" in found) return found;
  const tz = accessEndOf(found.member.permissions)?.tz ?? (await ownerTimezone(ctx.planId));
  if (args.clear === true) return { member: found.member, endsOn: null as string | null, tz };
  const endsOn = cleanExpiryDate(str(args.last_day, 10));
  if (!endsOn) return { error: "What is the last day? I need a real date like 2026-11-30, or tell me to remove the end date." };
  if (endsOn < todayInZone(tz)) return { error: "The last day of access can't be in the past." };
  return { member: found.member, endsOn: endsOn as string | null, tz };
}

export const removeTeamMember: ActionTool = {
  name: "remove_team_member",
  kind: "write",
  apiPath: "/api/workspaces/team/members",
  description:
    "Remove a person from the client's team: they lose all access to the account at once. Use only when the client clearly asks to remove someone (for a person who should only be in for a while, set_member_access_end is gentler). Name the member by name or email. The client approves first, and Undo puts them back.",
  parameters: { type: "object", properties: { member: { type: "string", description: "The member's name or email." } }, required: ["member"] },
  plan: async (args, ctx) => {
    const found = await findMember(args, ctx);
    if ("error" in found) return found;
    const m = found.member;
    return {
      preview: {
        title: `Remove ${m.name || m.email} from your team`,
        lines: [`${who(m)}, ${ROLE_WORDS[m.role || ""] ?? m.role}.`, "They are signed out and lose all access to the account right away.", "Undo puts them back with the same role and access."],
        links: [SETTINGS_TEAM],
      },
    };
  },
  run: async (args, ctx) => {
    const found = await findMember(args, ctx);
    if ("error" in found) throw new Error(found.error);
    const m = found.member;
    const { error } = await ctx.db.from("workspace_members").delete().eq("id", m.id);
    if (error) throw new Error("Couldn't remove them.");
    return { summary: `Removed ${m.name || m.email} from the team.`, undo: { row: m as unknown as Record<string, unknown> } };
  },
  undo: async (u, ctx) => {
    const row = u.row as Member | undefined;
    const spaces = await workspaces(ctx);
    if (!row || !spaces.some((w) => w.id === row.workspace_id)) throw new Error("gone");
    const { error } = await ctx.db.from("workspace_members").insert({ id: row.id, workspace_id: row.workspace_id, name: row.name, email: row.email, role: row.role, status: row.status, permissions: row.permissions ?? {}, user_id: row.user_id, joined_at: row.joined_at });
    if (error) throw new Error("gone");
    return "Put them back on the team.";
  },
};

export const TEAM_TOOLS: ActionTool[] = [listTeam, addTeamMember, changeMemberAccess, setMemberAccessEnd, removeTeamMember];
