import type { ActionTool } from "./types";
import { resolveAiAccount } from "@/lib/ai/config";
import { MAX_ASSISTANT_NOTES } from "@/lib/ai/defaults";

const str = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");

// The assistant's long-term memory is the client's "Teach" notes (Settings → AI Assistant). When the client
// says something lasting about themselves, their team, their schedule or how they like to work, the assistant
// offers to save it there, so it never has to be told twice. The client approves each one and can edit or
// remove it in Settings any time.
export const rememberAboutMe: ActionTool = {
  name: "remember_about_me",
  kind: "write",
  apiPath: "/api/ai-settings",
  description:
    "Offer to save ONE lasting fact the client just told you to their Teach notes so you always remember it (for example 'Dana handles my bookings', 'I don't take calls on Fridays', 'my busy season is November to January'). Only for durable facts about them, their team, their schedule, their business or their preferences, never for one-off tasks or today's details. Write it as a short, clear sentence. The client approves it first.",
  parameters: { type: "object", properties: { fact: { type: "string", description: "One short sentence." } }, required: ["fact"] },
  plan: async (args) => {
    const fact = str(args.fact, 300);
    if (fact.length < 5) return { error: "What should I remember?" };
    const acct = await resolveAiAccount();
    if (!acct.profileId || !acct.canEdit) return { error: "Only the account owner can change what I remember. They can add it in Settings → AI Assistant." };
    const { data } = await (await import("@/lib/supabase/server")).createServerClient().from("profiles").select("assistant_notes").eq("id", acct.profileId).maybeSingle();
    const notes = ((data?.assistant_notes as string) || "").trim();
    if (notes.toLowerCase().includes(fact.toLowerCase())) return { error: "That is already in my notes." };
    if (notes.length + fact.length + 1 > MAX_ASSISTANT_NOTES) return { error: "My notes are full. Trim them in Settings → AI Assistant and I can add this." };
    return { preview: { title: `Remember this about you: "${fact}"`, lines: ["Saved to your Teach notes (Settings → AI Assistant), so I keep it in mind in every conversation.", "You can edit or remove it there any time."] } };
  },
  run: async (args, ctx) => {
    const fact = str(args.fact, 300);
    const acct = await resolveAiAccount();
    if (!acct.profileId || !acct.canEdit) throw new Error("Only the account owner can change what I remember.");
    const { data } = await ctx.db.from("profiles").select("assistant_notes").eq("id", acct.profileId).maybeSingle();
    const before = ((data?.assistant_notes as string) || "").trim();
    const next = before ? `${before}\n${fact}` : fact;
    if (next.length > MAX_ASSISTANT_NOTES) throw new Error("My notes are full.");
    const { error } = await ctx.db.from("profiles").update({ assistant_notes: next }).eq("id", acct.profileId);
    if (error) throw new Error("It didn't save.");
    return { summary: `I'll remember: ${fact}`, undo: { profileId: acct.profileId, fact } };
  },
  undo: async (u, ctx) => {
    const { data } = await ctx.db.from("profiles").select("assistant_notes").eq("id", u.profileId as string).maybeSingle();
    const lines = ((data?.assistant_notes as string) || "").split("\n");
    const i = lines.lastIndexOf(u.fact as string);
    if (i >= 0) lines.splice(i, 1);
    await ctx.db.from("profiles").update({ assistant_notes: lines.join("\n").trim() || null }).eq("id", u.profileId as string);
    return "Removed it from my notes.";
  },
};

export const MEMORY_TOOLS: ActionTool[] = [rememberAboutMe];
