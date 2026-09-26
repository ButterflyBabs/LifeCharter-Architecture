import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveActor } from "@/lib/authz";
import type { PlannedPost, PostStatus } from "./planner";
import { STATUSES } from "./planner";

// Who can see the Social Planner.
//
// It is included in every Command Suite subscription, but rolls out to the
// owner's account first (decided by Babs, 2026-09-25). Opening it to every
// account is one environment switch:
//   SOCIAL_PLANNER_FOR_ALL=1          → every account
//   SOCIAL_PLANNER_EMAILS=a@x,b@y     → these sign-ins too (test accounts)
// The owner (super admin, or single-user mode) always has it.
export async function socialPlannerEnabled(): Promise<boolean> {
  if (process.env.SOCIAL_PLANNER_FOR_ALL === "1") return true;
  const actor = await resolveActor();
  if (actor.kind === "owner") return true;
  const allow = (process.env.SOCIAL_PLANNER_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(actor.email && allow.includes(actor.email.toLowerCase()));
}

export type SocialDb = ReturnType<typeof createServerClient>;

// Shared preamble for /api/social/* routes: gate + account scope.
export async function socialContext(): Promise<
  { ok: true; masterPlanId: string; supabase: SocialDb } | { ok: false; res: NextResponse }
> {
  if (!(await socialPlannerEnabled())) {
    return { ok: false, res: NextResponse.json({ error: "The Social Planner isn't turned on for this account yet." }, { status: 403 }) };
  }
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return { ok: false, res: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };
  return { ok: true, masterPlanId, supabase: createServerClient() };
}

export const isYmd = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
export const str = (v: unknown, max = 20000) => (typeof v === "string" ? v.slice(0, max) : "");
export const isStatus = (v: unknown): v is PostStatus => typeof v === "string" && (STATUSES as string[]).includes(v);

export interface PostRow {
  id: string;
  planned_date: string;
  platform: string;
  format: string;
  status: string;
  title: string;
  notes: string;
  image_prompt: string;
  link: string;
  series: string;
  invite_level: string | null;
  offer_key: string | null;
}

export const POST_COLUMNS =
  "id, planned_date, platform, format, status, title, notes, image_prompt, link, series, invite_level, offer_key";

export function shapePost(r: PostRow): PlannedPost {
  return {
    id: r.id,
    date: r.planned_date,
    platform: r.platform,
    format: r.format,
    status: (isStatus(r.status) ? r.status : "draft") as PostStatus,
    title: r.title || "",
    notes: r.notes || "",
    imagePrompt: r.image_prompt || "",
    link: r.link || "",
    series: r.series || "",
    inviteLevel: (r.invite_level as PlannedPost["inviteLevel"]) ?? null,
    offerKey: r.offer_key ?? null,
  };
}
