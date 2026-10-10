import type { ActionTool } from "./types";

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export const addFinanceEntry: ActionTool = {
  name: "add_finance_entry",
  kind: "write",
  apiPath: "/api/finance/entries",
  description: "Record one income or expense entry in the client's finance ledger (amount in US dollars, date YYYY-MM-DD, optional category and note). The client approves first.",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["income", "expense"] },
      amount: { type: "number", description: "US dollars, positive." },
      date: { type: "string", description: "YYYY-MM-DD (the day it happened)." },
      category: { type: "string" },
      description: { type: "string" },
    },
    required: ["type", "amount", "date"],
  },
  plan: async (args) => {
    const amount = Number(args.amount);
    if (!(args.type === "income" || args.type === "expense")) return { error: "Is it income or an expense?" };
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) return { error: "I need the amount as a positive number." };
    const date = str(args.date, 10);
    if (!isDay(date)) return { error: "I need the date as a real date." };
    return {
      preview: {
        title: `Record ${args.type === "income" ? "income" : "an expense"}: $${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
        lines: [`Date: ${date}`, ...(str(args.category, 80) ? [`Category: ${str(args.category, 80)}`] : []), ...(str(args.description, 200) ? [`Note: ${str(args.description, 200)}`] : [])],
      },
    };
  },
  run: async (args, ctx) => {
    const { data, error } = await ctx.db
      .from("finance_entries")
      .insert({
        master_plan_id: ctx.planId,
        type: args.type === "income" ? "income" : "expense",
        amount: Math.round(Number(args.amount) * 100) / 100,
        category: str(args.category, 80) || null,
        description: str(args.description, 200) || null,
        occurred_on: str(args.date, 10),
        source: "assistant",
      })
      .select("id")
      .single();
    if (error || !data) throw new Error("The entry didn't save.");
    return { summary: `Recorded ${args.type === "income" ? "income" : "an expense"} of $${Number(args.amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}.`, result: { id: data.id }, undo: { id: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("finance_entries").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    return "Removed the entry.";
  },
};

export const FINANCE_TOOLS: ActionTool[] = [addFinanceEntry];
