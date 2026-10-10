import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

// "View as client": the Alignment Architect opens a client's account read-only for support.
// The cookie is signed on the server, so only a real start (which also writes the access log)
// can produce one. It names the plan to show, who opened it, and when it stops working.
// The middleware makes every write fail while it is present; masterPlan.ts honours it for reads.

export const VIEW_AS_COOKIE = "lc_view_as";
// Display-only companion the banner reads. Not trusted for anything.
export const VIEW_AS_NAME_COOKIE = "lc_view_as_name";
export const VIEW_AS_MAX_SECONDS = 2 * 60 * 60;

export interface ViewAsClaim {
  planId: string; // the client's master plan
  userId: string; // who opened it (must be the signed-in user)
  logId: string; // the client_view_log row
  expires: number; // epoch ms
}

function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPER_ADMIN_EMAILS || "";
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(`view-as:${body}`).digest("base64url");
}

export function makeViewAsValue(claim: ViewAsClaim): string {
  const body = Buffer.from(JSON.stringify({ p: claim.planId, u: claim.userId, l: claim.logId, e: claim.expires })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function parseViewAsValue(value: string | undefined | null): ViewAsClaim | null {
  if (!value || !secret()) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const body = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const j = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { p?: string; u?: string; l?: string; e?: number };
    if (!j.p || !j.u || !j.l || typeof j.e !== "number") return null;
    if (Date.now() > j.e) return null;
    return { planId: j.p, userId: j.u, logId: j.l, expires: j.e };
  } catch {
    return null;
  }
}

// The verified claim from this request's cookie, or null.
export function readViewAs(): ViewAsClaim | null {
  try {
    return parseViewAsValue(cookies().get(VIEW_AS_COOKIE)?.value);
  } catch {
    return null; // outside a request scope
  }
}
