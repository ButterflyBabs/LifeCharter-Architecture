import type { ActionTool, ActionCtx } from "./types";
import { senderProfile } from "@/lib/email/accountSender";
import { accountTimezone } from "@/lib/broadcasts/engine";
import { OWNER_TZ } from "@/lib/broadcasts/shared";
import { isHousePlan } from "@/lib/housePlan";

// Email the assistant prepares is ALWAYS a draft. It never schedules, activates or sends anything:
// the client reviews it in Campaigns & Broadcasts and schedules or turns it on themselves.
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const tagList = (v: unknown) => Array.from(new Set((Array.isArray(v) ? v : []).map((t) => str(t, 60).toLowerCase()).filter(Boolean))).slice(0, 20);
const urlOk = (u: string) => /^https?:\/\//i.test(u);
const firstLine = (s: string) => s.replace(/\{\{[^}]+\}\}/g, "").split(/\n+/).map((l) => l.trim()).find(Boolean)?.slice(0, 110) ?? "";

async function audienceCount(tags: string[], match: "any" | "all", ctx: ActionCtx): Promise<number> {
  if (!tags.length) return 0;
  let q = ctx.db.from("seq_contacts").select("id", { count: "exact", head: true }).eq("master_plan_id", ctx.planId).is("unsubscribed_at", null);
  q = match === "all" ? q.contains("tags", tags) : q.overlaps("tags", tags);
  const { count } = await q;
  return count ?? 0;
}

export const draftBroadcast: ActionTool = {
  name: "draft_broadcast",
  kind: "write",
  apiPath: "/api/crm/broadcasts",
  description:
    "Write a one-time broadcast email as a DRAFT in the client's Campaigns & Broadcasts. It is never sent or scheduled by you: the client reviews, edits and schedules it themselves. The audience is picked by tags. Write the full email in the body in the client's voice, starting with {{greeting}} on its own line.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Internal name." },
      subject: { type: "string" },
      preview: { type: "string", description: "Short preview line shown in the inbox." },
      body: { type: "string", description: "The email text. Paragraphs separated by blank lines. Begin with {{greeting}}." },
      button_label: { type: "string" },
      button_url: { type: "string", description: "https link for the button." },
      audience_tags: { type: "array", items: { type: "string" }, description: "Send to contacts with these tags." },
      audience_match: { type: "string", enum: ["any", "all"] },
    },
    required: ["name", "subject", "body"],
  },
  plan: async (args, ctx) => {
    if (!str(args.name, 120) || !str(args.subject, 200) || !str(args.body, 20000)) return { error: "I need a name, a subject and the email text." };
    if (str(args.button_url, 600) && !urlOk(str(args.button_url, 600))) return { error: "The button link needs to start with https://" };
    const tags = tagList(args.audience_tags);
    const n = tags.length ? await audienceCount(tags, args.audience_match === "all" ? "all" : "any", ctx) : null;
    return {
      preview: {
        title: `Save a broadcast DRAFT: "${str(args.subject, 200)}"`,
        lines: [
          `Starts: ${firstLine(str(args.body, 20000))}`,
          tags.length ? `Audience: contacts tagged ${tags.join(args.audience_match === "all" ? " AND " : " or ")} (${n} people right now)` : "Audience: not chosen yet (you pick it before scheduling)",
          "Saved as a draft. Nothing is sent or scheduled. You review it in Campaigns & Broadcasts.",
        ],
      },
    };
  },
  run: async (args, ctx) => {
    const house = await isHousePlan(ctx.planId);
    const p = await senderProfile(ctx.planId, ctx.db);
    const tz = house ? OWNER_TZ : await accountTimezone(ctx.db, ctx.planId, false);
    const body = str(args.body, 20000);
    const row: Record<string, unknown> = {
      master_plan_id: ctx.planId,
      name: str(args.name, 120),
      subject: str(args.subject, 200),
      preview: str(args.preview, 200) || null,
      body: /^\s*\{\{\s*greeting\s*\}\}/i.test(body) ? body : `{{greeting}}\n\n${body}`,
      button_label: str(args.button_label, 60) || null,
      button_url: urlOk(str(args.button_url, 600)) ? str(args.button_url, 600) : null,
      tags: tagList(args.audience_tags),
      tag_match: args.audience_match === "all" ? "all" : "any",
      timezone: tz,
      ...(house ? {} : { brand: p.senderName, from_name: p.senderName, from_email: p.fromEmail ?? "", reply_to: p.replyTo }),
    };
    const { data, error } = await ctx.db.from("crm_broadcasts").insert(row).select("id").single();
    if (error || !data) throw new Error("The draft didn't save.");
    return { summary: `Saved the broadcast draft "${row.subject}". Open Campaigns & Broadcasts to review it and schedule it when you are ready.`, result: { id: data.id }, undo: { id: data.id } };
  },
  undo: async (u, ctx) => {
    const { data: b } = await ctx.db.from("crm_broadcasts").select("status").eq("id", u.id as string).eq("master_plan_id", ctx.planId).maybeSingle();
    if (!b) return "It was already gone.";
    if (b.status !== "draft") return "Kept it: it has moved past draft, so use Campaigns & Broadcasts to cancel it.";
    await ctx.db.from("crm_broadcasts").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Deleted the draft.";
  },
};

interface Step { day: number; subject: string; preview: string | null; body: string; label: string | null; url: string | null }
const stepsOf = (v: unknown): Step[] =>
  (Array.isArray(v) ? (v as Record<string, unknown>[]) : [])
    .map((s) => ({
      day: Math.max(0, Math.min(365, Math.round(Number(s.day_offset) || 0))),
      subject: str(s.subject, 200),
      preview: str(s.preview, 200) || null,
      body: str(s.body, 20000),
      label: str(s.button_label, 60) || null,
      url: urlOk(str(s.button_url, 600)) ? str(s.button_url, 600) : null,
    }))
    .filter((s) => s.subject && s.body)
    .slice(0, 12);

export const draftSequence: ActionTool = {
  name: "draft_email_sequence",
  kind: "write",
  apiPath: "/api/sequences",
  description:
    "Write an email campaign (a series of emails sent automatically a set number of days after someone joins) as a DRAFT in Campaigns & Broadcasts. It is created PAUSED with nobody enrolled; the client reviews it and turns it on themselves. Write every email in full in the client's voice.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      emails: {
        type: "array",
        description: "2 to 12 emails in order.",
        items: {
          type: "object",
          properties: {
            day_offset: { type: "integer", description: "Days after joining (0 = right away)." },
            subject: { type: "string" },
            preview: { type: "string" },
            body: { type: "string", description: "Full email text; start with {{greeting}}." },
            button_label: { type: "string" },
            button_url: { type: "string" },
          },
          required: ["day_offset", "subject", "body"],
        },
      },
    },
    required: ["name", "emails"],
  },
  plan: async (args) => {
    const name = str(args.name, 120);
    const steps = stepsOf(args.emails);
    if (!name) return { error: "What should the campaign be called?" };
    if (steps.length < 1) return { error: "I need at least one email with a subject and text." };
    return {
      preview: {
        title: `Save the email campaign DRAFT "${name}" (${steps.length} email${steps.length === 1 ? "" : "s"})`,
        lines: [
          ...steps.map((s) => `Day ${s.day}: ${s.subject}`),
          "Saved paused with nobody in it. Nothing is sent. You review it and turn it on in Campaigns & Broadcasts.",
        ],
      },
    };
  },
  run: async (args, ctx) => {
    const name = str(args.name, 120);
    const steps = stepsOf(args.emails);
    const house = await isHousePlan(ctx.planId);
    const p = await senderProfile(ctx.planId, ctx.db);
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "campaign";
    let key = base;
    for (let i = 2; i < 20; i++) {
      const { data: hit } = await ctx.db.from("sequences").select("id").eq("master_plan_id", ctx.planId).eq("key", key).maybeSingle();
      if (!hit) break;
      key = `${base}-${i}`;
    }
    const row: Record<string, unknown> = house
      ? { master_plan_id: ctx.planId, key, name, description: str(args.description, 500) || null, from_email: "hello@lifecharter.life", brand: name }
      : { master_plan_id: ctx.planId, key, name, description: str(args.description, 500) || null, brand: name, from_name: p.senderName, from_email: p.fromEmail ?? "", reply_to: p.replyTo };
    const { data: seq, error } = await ctx.db.from("sequences").insert({ ...row, active: false }).select("id").single();
    if (error || !seq) throw new Error("The campaign didn't save.");
    const { error: e2 } = await ctx.db.from("sequence_steps").insert(
      steps.map((s, i) => ({
        sequence_id: seq.id,
        position: i,
        day_offset: s.day,
        subject: s.subject,
        preview: s.preview,
        body: /^\s*\{\{\s*greeting\s*\}\}/i.test(s.body) ? s.body : `{{greeting}}\n\n${s.body}`,
        button_label: s.label,
        button_url: s.url,
      }))
    );
    if (e2) {
      await ctx.db.from("sequences").delete().eq("id", seq.id);
      throw new Error("The emails didn't save.");
    }
    return { summary: `Saved the campaign draft "${name}" with ${steps.length} email${steps.length === 1 ? "" : "s"}, paused. Open Campaigns & Broadcasts to review it and turn it on when you are ready.`, result: { id: seq.id }, undo: { id: seq.id } };
  },
  undo: async (u, ctx) => {
    const { count } = await ctx.db.from("sequence_enrollments").select("id", { count: "exact", head: true }).eq("sequence_id", u.id as string);
    if (count) return "Kept it: people have been added to it since.";
    await ctx.db.from("sequence_steps").delete().eq("sequence_id", u.id as string);
    await ctx.db.from("sequences").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Deleted the draft campaign.";
  },
};

export const EMAIL_TOOLS: ActionTool[] = [draftBroadcast, draftSequence];
