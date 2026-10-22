import type { ActionTool } from "./types";
import { fillPlaceholders, newToken, placeholders } from "@/lib/esign";
import { brandFor } from "@/lib/esignServer";

// The assistant and LC Plume (task 1072): it can report who has signed and draft a document with its
// signers. It never sends one: the client reads it and presses Send for signature themselves.
const clean = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const STATUS: Record<string, string> = { draft: "draft", sent: "out for signature", completed: "signed by everyone", declined: "declined", voided: "voided", expired: "expired" };

export const listAgreements: ActionTool = {
  name: "list_agreements",
  kind: "read",
  apiPath: "/api/agreements",
  description: "List the client's agreements and proposals (LC Plume) with status and who has or hasn't signed yet, and the starter and saved templates. To resend one or sign it themselves, point them to its Resend / Sign now buttons on the LC Plume list (you cannot send or sign for them). Use for 'has Ann signed?', 'what's waiting for signatures', and before drafting one.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const [{ data: docs }, { data: tpls }] = await Promise.all([
      ctx.db.from("sign_documents").select("id, title, kind, status, sent_at, completed_at").eq("master_plan_id", ctx.planId).order("updated_at", { ascending: false }).limit(50),
      ctx.db.from("sign_templates").select("name, kind, master_plan_id").or(`master_plan_id.is.null,master_plan_id.eq.${ctx.planId}`).order("name"),
    ]);
    const list = (docs || []) as { id: string; title: string; kind: string; status: string }[];
    const { data: signers } = list.length ? await ctx.db.from("sign_signers").select("document_id, name, status").in("document_id", list.map((d) => d.id)).order("order_no") : { data: [] };
    const lines = list.map((d) => {
      const s = ((signers || []) as { document_id: string; name: string; status: string }[]).filter((x) => x.document_id === d.id);
      const signed = s.filter((x) => x.status === "signed").map((x) => x.name);
      const waiting = s.filter((x) => x.status !== "signed").map((x) => `${x.name} (${x.status === "viewed" ? "opened it" : x.status === "sent" ? "emailed" : x.status === "declined" ? "declined" : "waiting their turn"})`);
      return `- ${d.title} (${d.kind}, ${STATUS[d.status] ?? d.status})${signed.length ? `; signed: ${signed.join(", ")}` : ""}${waiting.length && d.status === "sent" ? `; not yet: ${waiting.join(", ")}` : ""}`;
    });
    const t = ((tpls || []) as { name: string; kind: string; master_plan_id: string | null }[]).map((x) => `${x.name} (${x.kind}${x.master_plan_id ? ", theirs" : ", starter: their attorney should review it"})`);
    return (lines.length ? lines.join("\n") : "No agreements or proposals yet.") + `\nTemplates: ${t.join("; ")}. Open them at /agreements.`;
  },
};

export const draftAgreement: ActionTool = {
  name: "draft_agreement",
  kind: "write",
  apiPath: "/api/agreements",
  description:
    "Draft an agreement or proposal in LC Plume, saved as a DRAFT with its signers; it is never sent by you (the client reads it and presses Send for signature). Either name a template (part of its name, from list_agreements) or write the body yourself in plain words with '## ' headings, in the client's voice, using only facts you know; leave anything unknown as a {{Blank}} for them to fill. For a proposal you may give amount in US dollars. Starter templates are not legal advice: say their attorney should review. The client approves first.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string" },
      kind: { type: "string", enum: ["agreement", "proposal"] },
      template: { type: "string", description: "Part of a template's name, or leave out to write the body." },
      body: { type: "string" },
      fills: { type: "object", description: "Values for {{Blanks}}, by blank name.", additionalProperties: { type: "string" } },
      signers: { type: "array", items: { type: "object", properties: { name: { type: "string" }, email: { type: "string" } }, required: ["name", "email"] } },
      owner_signs: { type: "boolean", description: "The client signs too, last." },
      amount: { type: "number" },
    },
    required: ["title"],
  },
  plan: async (args, ctx) => {
    const r = await build(args, ctx);
    if ("error" in r) return r;
    const left = placeholders(r.body);
    return {
      preview: {
        title: `Draft ${r.kind === "proposal" ? "a proposal" : "an agreement"}: "${r.title}"`,
        lines: [
          r.from ? `From the ${r.from} template${r.starter ? " (a starter: have your attorney review it)" : ""}.` : "Written from what you told me.",
          r.signers.length ? `Signers, in order: ${r.signers.map((s) => `${s.name} (${s.email})`).join(", ")}${args.owner_signs ? ", then you" : ""}` : "No signers yet: add them before sending.",
          left.length ? `Blanks still to fill: ${left.slice(0, 8).join(", ")}${left.length > 8 ? "…" : ""}` : "Every blank is filled.",
          "Saved as a draft. Nothing is emailed until you press Send for signature.",
        ],
        links: [{ label: "Open LC Plume", href: "/agreements" }],
      },
    };
  },
  run: async (args, ctx) => {
    const r = await build(args, ctx);
    if ("error" in r) throw new Error(r.error);
    const amount = Number(args.amount);
    const { data, error } = await ctx.db.from("sign_documents").insert({ master_plan_id: ctx.planId, title: r.title, kind: r.kind, body: r.body, amount: r.kind === "proposal" && amount > 0 ? Math.round(amount * 100) / 100 : null, owner_signs: Boolean(args.owner_signs), created_by: "assistant" }).select("id").single();
    if (error || !data) throw new Error("Couldn't save the draft.");
    const rows = r.signers.map((s, i) => ({ document_id: data.id, name: s.name, email: s.email, order_no: i + 1, is_owner: false, token_hash: newToken().hash }));
    if (args.owner_signs) {
      const { data: plan } = await ctx.db.from("client_master_plans").select("client_email, client_name").eq("id", ctx.planId).maybeSingle();
      const email = String(ctx.userEmail || plan?.client_email || "").toLowerCase();
      if (EMAIL.test(email)) rows.push({ document_id: data.id, name: String(plan?.client_name || "Me"), email, order_no: rows.length + 1, token_hash: newToken().hash, is_owner: true } as (typeof rows)[number]);
    }
    if (rows.length) await ctx.db.from("sign_signers").insert(rows);
    await ctx.db.from("sign_events").insert({ document_id: data.id, event: "Created", detail: "drafted by the assistant" });
    return { summary: `Saved "${r.title}" as a draft. Open LC Plume to read it, fill any blanks and press Send for signature.`, result: { documentId: data.id }, undo: { documentId: data.id } };
  },
  undo: async (u, ctx) => {
    await ctx.db.from("sign_documents").delete().eq("master_plan_id", ctx.planId).eq("id", u.documentId as string).eq("status", "draft");
    return "Removed the draft.";
  },
};

async function build(args: Record<string, unknown>, ctx: Parameters<NonNullable<ActionTool["plan"]>>[1]): Promise<{ title: string; kind: "agreement" | "proposal"; body: string; signers: { name: string; email: string }[]; from: string | null; starter: boolean } | { error: string }> {
  const title = clean(args.title, 160);
  if (!title) return { error: "What should it be called?" };
  let kind: "agreement" | "proposal" = args.kind === "proposal" ? "proposal" : "agreement";
  let body = clean(args.body, 60000);
  let from: string | null = null;
  let starter = false;
  const ref = clean(args.template, 120).toLowerCase();
  if (ref) {
    const { data } = await ctx.db.from("sign_templates").select("name, kind, body, master_plan_id").or(`master_plan_id.is.null,master_plan_id.eq.${ctx.planId}`);
    const rows = (data || []) as { name: string; kind: string; body: string; master_plan_id: string | null }[];
    const t = rows.find((x) => x.name.toLowerCase() === ref) || rows.find((x) => x.name.toLowerCase().includes(ref));
    if (!t) return { error: "I couldn't find that template. Which one do you mean?" };
    body = t.body;
    kind = t.kind === "proposal" ? "proposal" : "agreement";
    from = t.name;
    starter = !t.master_plan_id;
  }
  if (!body) return { error: "Should I start from a template, or write it from what you tell me?" };
  const brand = await brandFor(ctx.db, ctx.planId);
  const fills = (args.fills && typeof args.fills === "object" ? (args.fills as Record<string, unknown>) : {}) as Record<string, unknown>;
  const values: Record<string, string> = { "Business name": brand.name, "Your business": brand.name, Date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) };
  for (const [k, v] of Object.entries(fills)) if (typeof v === "string" && v.trim()) values[k] = v.trim().slice(0, 500);
  body = fillPlaceholders(body, values);
  const signers = (Array.isArray(args.signers) ? args.signers : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x) => ({ name: clean(x.name, 120), email: clean(x.email, 160).toLowerCase() }))
    .filter((x) => x.name && EMAIL.test(x.email))
    .slice(0, 10);
  return { title, kind, body, signers, from, starter };
}

export const AGREEMENT_TOOLS: ActionTool[] = [listAgreements, draftAgreement];
