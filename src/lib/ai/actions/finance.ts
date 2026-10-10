import type { ActionTool } from "./types";
import { nextAfter, type BillCadence } from "@/lib/finance/billDates";

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const FREQS: BillCadence[] = ["weekly", "biweekly", "monthly", "quarterly", "semiannual", "annual"];
const recurringOf = (args: Record<string, unknown>) => args.type === "expense" && args.payment_type === "recurring" && FREQS.includes(args.frequency as BillCadence);

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
      vendor: { type: "string", description: "Who was paid (expense) or who it came from (income)." },
      payment_type: { type: "string", enum: ["one_time", "recurring"], description: "Expenses only. Default one_time." },
      frequency: { type: "string", enum: ["weekly", "biweekly", "monthly", "quarterly", "semiannual", "annual"], description: "Only when recurring." },
      renewal: { type: "string", enum: ["auto", "manual"], description: "Only when recurring: auto-renews, or the client renews it by hand." },
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
        lines: [`Date: ${date}`, ...(str(args.category, 80) ? [`Category: ${str(args.category, 80)}`] : []), ...(str(args.description, 200) ? [`Note: ${str(args.description, 200)}`] : []), ...(str(args.vendor, 120) ? [`${args.type === "income" ? "From" : "Paid to"}: ${str(args.vendor, 120)}`] : []), ...(recurringOf(args) ? [`Recurring: ${args.frequency}${args.renewal === "manual" ? ", renewed manually" : ", auto-renews"}`] : [])],
      },
    };
  },
  run: async (args, ctx) => {
    const amount = Math.round(Number(args.amount) * 100) / 100;
    const recurring = recurringOf(args);
    const vendor = str(args.vendor, 120) || null;
    // A recurring expense also becomes a bill so its next renewal shows on the Bills & cash calendar.
    let billId: string | null = null;
    if (recurring) {
      const next = nextAfter(str(args.date, 10), args.frequency as BillCadence);
      if (next) {
        const { data: bill } = await ctx.db
          .from("finance_bills")
          .insert({
            master_plan_id: ctx.planId,
            name: (vendor || str(args.category, 80) || str(args.description, 120) || "Recurring expense").slice(0, 120),
            vendor,
            amount,
            category: str(args.category, 80) || null,
            cadence: args.frequency,
            next_due: next,
            autopay: args.renewal !== "manual",
            notes: str(args.description, 200) || null,
            last_paid_on: str(args.date, 10),
          })
          .select("id")
          .single();
        billId = (bill?.id as string) ?? null;
      }
    }
    const { data, error } = await ctx.db
      .from("finance_entries")
      .insert({
        master_plan_id: ctx.planId,
        type: args.type === "income" ? "income" : "expense",
        amount,
        category: str(args.category, 80) || null,
        description: str(args.description, 200) || null,
        occurred_on: str(args.date, 10),
        source: "assistant",
        vendor,
        payment_type: recurring ? "recurring" : "one_time",
        frequency: recurring ? (args.frequency as string) : null,
        renewal: recurring ? (args.renewal === "manual" ? "manual" : "auto") : null,
        bill_id: billId,
      })
      .select("id")
      .single();
    if (error || !data) {
      if (billId) await ctx.db.from("finance_bills").delete().eq("id", billId);
      throw new Error("The entry didn't save.");
    }
    return { summary: `Recorded ${args.type === "income" ? "income" : "an expense"} of $${Number(args.amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}${recurring ? " and added its next renewal to Bills" : ""}.`, result: { id: data.id }, undo: { id: data.id, billId } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("finance_entries").delete().eq("id", u.id as string).eq("master_plan_id", ctx.planId);
    if (u.billId) await ctx.db.from("finance_bills").delete().eq("id", u.billId as string).eq("master_plan_id", ctx.planId);
    return "Removed the entry.";
  },
};

export const FINANCE_TOOLS: ActionTool[] = [addFinanceEntry];
