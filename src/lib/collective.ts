// The LifeCharter Collective's own address (decided 2026-10-13): collective.lccommandsuite.com.
// Same Vercel project, same Supabase, same code as the Command Suite; only the address differs.
//
// Everything that builds a Collective link (emails, invites, Plus checkout returns, sitemap, canonical, the
// iPhone app) goes through COLLECTIVE_BASE_URL / collectiveUrl() so the address lives in exactly one place.
//
// COLLECTIVE_HOST_LIVE is the switch. While false, links are built exactly as before (lccommandsuite.com), the
// old addresses are NOT forwarded, and the new host (if someone opens it) is merely routed. Flip it to true in one
// commit once the domain is attached in Vercel, DNS resolves, and the new host has been checked end to end.
// This file is imported by client components, so keep it free of server-only code.

export const COLLECTIVE_HOST = "collective.lccommandsuite.com";
export const SUITE_HOST = "lccommandsuite.com";

export const COLLECTIVE_HOST_LIVE = true;

// 307 while we confirm everything works; switch to 308 (permanent) once it has been verified.
export const COLLECTIVE_FORWARD_STATUS: 307 | 308 = 308;

// When the old addresses started forwarding (ISO time). Web push subscriptions made before this belong to the old
// address: they are retired on a device when that same device re-subscribes here. Set when COLLECTIVE_HOST_LIVE flips.
export const COLLECTIVE_CUTOVER_ISO: string | null = "2026-10-14T06:00:21Z";

const LEGACY_BASE = (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || `https://${SUITE_HOST}`) as string;

export const COLLECTIVE_BASE_URL: string = COLLECTIVE_HOST_LIVE ? `https://${COLLECTIVE_HOST}` : LEGACY_BASE;

/** The public address search engines and share cards should use (fixed, never the request host or an env var). */
export const COLLECTIVE_CANONICAL_BASE = COLLECTIVE_HOST_LIVE ? `https://${COLLECTIVE_HOST}` : `https://${SUITE_HOST}`;
/** The landing page's own address: the host root once live (middleware shows /collective there), /collective before. */
export const COLLECTIVE_LANDING_URL = COLLECTIVE_HOST_LIVE ? `${COLLECTIVE_CANONICAL_BASE}/` : `${COLLECTIVE_CANONICAL_BASE}/collective`;

/** A full Collective address, e.g. collectiveUrl("/community/events"). */
export function collectiveUrl(path = ""): string {
  const p = path && !path.startsWith("/") ? `/${path}` : path;
  return `${COLLECTIVE_BASE_URL}${p}`;
}

/**
 * A link from inside the Command Suite to a Collective page. Relative until the Collective's own address is live
 * (so previews and local runs stay on their own host), then absolute so the browser leaves for the new host.
 */
export function collectiveHref(path = ""): string {
  const p = path && !path.startsWith("/") ? `/${path}` : path;
  return COLLECTIVE_HOST_LIVE ? `https://${COLLECTIVE_HOST}${p}` : p;
}

/** The Command Suite's own address (never the Collective's). */
export function suiteUrl(path = ""): string {
  const p = path && !path.startsWith("/") ? `/${path}` : path;
  return `https://${SUITE_HOST}${p}`;
}

/** For routes that answer a browser request: the Collective address once live, otherwise the host that was asked. */
export function collectiveBaseFor(req: Request): string {
  return COLLECTIVE_HOST_LIVE ? `https://${COLLECTIVE_HOST}` : new URL(req.url).origin;
}

function bareHost(host: string | null | undefined): string {
  return (host || "").split(":")[0].toLowerCase();
}

export function isCollectiveHost(host: string | null | undefined): boolean {
  return bareHost(host) === COLLECTIVE_HOST;
}

/** The Command Suite's production hosts (the ones whose old Collective addresses forward). */
export function isSuiteProductionHost(host: string | null | undefined): boolean {
  const h = bareHost(host);
  return h === SUITE_HOST || h === `www.${SUITE_HOST}`;
}

/** Short domain shown to people, e.g. "collective.lccommandsuite.com" (or the old one until the switch). */
export function collectiveDisplayHost(): string {
  return COLLECTIVE_BASE_URL.replace(/^https?:\/\//, "");
}

/** Paths a request to the Collective host may use. Everything else on that host is Command Suite and is sent there. */
const COLLECTIVE_HOST_PAGES = [
  "/community",
  "/join",
  "/collective",
  "/legal",
  "/auth",
  "/reset-password",
  "/forgot-password",
  "/logout",
  "/login", // only so a 2FA code step started on this host can finish here
  "/.well-known",
  "/robots.txt",
  "/sitemap.xml",
  "/community-sw.js",
  "/community.webmanifest",
  "/community-icons",
  "/collective-logo.png",
  "/collective-emblem.png",
  "/collective-motifs",
  "/lifecharter-collective-mark.png",
  "/_next",
  "/favicon.ico",
];
const COLLECTIVE_HOST_APIS = [
  "/api/community",
  "/api/collective",
  "/api/auth", // password-reset request
  "/auth", // /auth/callback, /auth/confirm
  "/api/cron", // each cron route checks its own secret; harmless here, and it keeps the schedule safe if hit by host
];

const under = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(p + "/"));

/** Is this path part of the Collective (and so allowed on the Collective host)? "/" is handled separately. */
export function collectiveHostAllows(path: string): boolean {
  return under(path, COLLECTIVE_HOST_PAGES) || under(path, COLLECTIVE_HOST_APIS);
}

/** Old Collective addresses on lccommandsuite.com that forward to the same path on the Collective host. */
export function isLegacyCollectivePath(path: string): boolean {
  return under(path, ["/community", "/join", "/collective"]);
}
