import type { createServerClient } from "@/lib/supabase/server";

// The Suite's AI assistant can DO things for a client, not just answer. Each thing it can do is a tool.
// A "write" tool never runs when the assistant asks for it: the client sees a preview and presses Approve.
// A "read" tool only looks things up and runs straight away.
export type Db = ReturnType<typeof createServerClient>;

export interface ActionCtx {
  planId: string; // the ONE account this request belongs to; every query must filter by it
  userEmail: string | null;
  db: Db;
}

export interface Preview {
  title: string;
  lines: string[];
}

export type PlanResult = { preview: Preview } | { error: string };
export type RunResult = { summary: string; result?: Record<string, unknown>; undo?: Record<string, unknown> };

export interface ActionTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON schema
  kind: "read" | "write";
  // A representative API path, so an invited team member's role and feature limits are applied.
  apiPath: string;
  read?: (args: Record<string, unknown>, ctx: ActionCtx) => Promise<string>;
  plan?: (args: Record<string, unknown>, ctx: ActionCtx) => Promise<PlanResult>;
  run?: (args: Record<string, unknown>, ctx: ActionCtx) => Promise<RunResult>;
  undo?: (undo: Record<string, unknown>, ctx: ActionCtx) => Promise<string>;
}
