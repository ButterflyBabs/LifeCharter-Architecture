// What each invited team-member role may reach inside the account they were invited to.
// Decided with Babs 2026-09-27. Account owners (and the super admin) are never limited by this.
//
//   admin  — runs the account day to day, including inviting and removing team members.
//            No billing or plan changes, no connecting/disconnecting email, calendar or AI keys,
//            no deleting the account.
//   editor — works on the business (tasks, plans, content, finance, sales activity).
//            No team, settings, billing, connections, and no access to the owner's inbox/calendar.
//   viewer — sees what an editor sees; cannot change anything.
//   sales  — only the sales page (/sales-reference), with its Contacts tab, the shared Team Huddle, and the tasks assigned to them.
//
// Imported by the edge middleware, so it must stay dependency-free.

import { VOLANT_OPEN_TO_ALL } from "@/lib/volant";

//   consultant — a Call to Close consultant: ONE page, /call-to-close (their own pipeline, calendar, contacts and
//            sales resources) and the few APIs behind it. Nothing else in the Suite opens, by default.
export type TeamRole = "admin" | "editor" | "viewer" | "sales" | "consultant";

export const CONSULTANT_PAGES = ["/call-to-close", "/settings"]; // their workspace, and Settings (profile, appearance and security only)
export const CONSULTANT_APIS = [
  "/api/c2c", // their own pipeline board, cards and contacts (the route only ever reaches the board that carries their email)
  "/api/sales/my-calendar", // their own calls and hours
  "/api/sales/checkout-session", // the Stripe checkout for the plan a prospect chooses (credited to them)
  "/api/sales/send-agreement", // the Year-1 agreement for signature (LC Plume)
  "/api/account/switch",
  "/api/me", // who they are, so the menu can show only what they have
  "/api/profile", // their own profile in Settings
  "/api/uploads/image", // their own profile photo
];

export const SALES_PAGES = ["/sales-reference", "/huddle", "/tasks"]; // /tasks: only the tasks assigned to them (the API enforces it) // /huddle: the shared Team Huddle (page-level check: only people Babs added by email)
export const SALES_APIS = [
  "/api/sales/onboard-client",
  "/api/sales/lookup-contact",
  "/api/sales/search-contacts",
  "/api/sales/checkout-session",
  "/api/sales/website-build-checkout", // the Website Alignment Build buttons on the sales page
  "/api/sales/contacts",
  "/api/sales/save-call",
  "/api/sales/send-agreement", // sends the Year-1 Operating Agreement for e-signature (LC Plume)
  "/api/sales/my-calendar", // a booking host sees their own calls and sets their own hours
  "/api/tasks", // their own assigned tasks only (each route narrows a Sales member to tasks assigned to them)
  "/api/team-huddle", // the Team Huddle page for people Babs shared it with (the route itself checks the email list)
  "/api/account/switch", // the account switcher: a Sales member who also has their own account can go back to it
];

const under = (path: string, prefixes: string[]) => prefixes.some((p) => path === p || path.startsWith(p + "/"));

// Billing and plan changes: the account owner only.
const BILLING_APIS = ["/api/billing", "/api/stripe/checkout"];
// Connecting or disconnecting outside accounts and keys: the account owner only.
const CONNECTION_APIS = ["/api/google/auth", "/api/google/callback", "/api/microsoft/auth", "/api/microsoft/callback", "/api/ai-settings", "/api/integrations"];
// The owner's connected mailbox and calendar: owner and admin.
const MAILBOX_APIS = ["/api/inbox", "/api/mail", "/api/schedule", "/api/calendar"];
// Team management: owner and admin.
const TEAM_APIS = ["/api/workspaces"];
// A viewer may still change their own profile and sign in/out.
const VIEWER_WRITABLE_APIS = ["/api/profile", "/api/auth", "/api/logout"];

export type Verdict = { allow: true } | { allow: false; status: 403; reason: string };
const ok: Verdict = { allow: true };
const no = (reason: string): Verdict => ({ allow: false, status: 403, reason });

/** Server-side check for an API call made by an invited team member. */
export function memberApiAccess(role: string | null, path: string, method: string, features?: FeatureMap | null): Verdict {
  const r = (role ?? "viewer") as TeamRole;
  const reading = method === "GET" || method === "HEAD";

  if (r === "sales") return under(path, SALES_APIS) ? ok : no("Your role only includes the sales page.");
  if (r === "consultant") return under(path, CONSULTANT_APIS) ? ok : no("Your role only includes your Call to Close page.");

  if (under(path, BILLING_APIS)) return no("Only the account owner can manage billing.");
  if (under(path, CONNECTION_APIS)) {
    // Reading whether something is connected is harmless; changing it is owner-only.
    return reading && path.startsWith("/api/integrations") ? ok : no("Only the account owner can connect or change outside accounts and keys.");
  }
  if (path.startsWith("/api/workspaces/") && method === "DELETE" && !path.includes("/members")) return no("Only the account owner can delete the account.");

  // The account's inbox/calendar: admins, or a member whose features include it.
  if (under(path, MAILBOX_APIS) && r !== "admin" && !(features && (features.inbox_calendar ?? "none") !== "none")) return no("Your role doesn't include the account's inbox or calendar.");
  // Team members list and invites; also creating/renaming workspaces. Listing workspaces stays open.
  const teamPath = under(path, TEAM_APIS) && (path.includes("/members") || !reading);
  if (teamPath && r !== "admin") return no("Only the owner or an admin can manage the team.");

  if (r === "viewer" && !reading && !under(path, VIEWER_WRITABLE_APIS)) return no("Your role is view-only.");

  return ok;
}

/** Page check for an invited team member. Returns where to send them instead, or null to allow. */
export function memberPageRedirect(role: string | null, path: string): string | null {
  if (role === "sales") return under(path, SALES_PAGES) ? null : "/sales-reference";
  if (role === "consultant") return under(path, CONSULTANT_PAGES) ? null : "/call-to-close";
  return null; // other roles see pages; what they can do there is enforced on the API above
}

/** Settings tabs to hide for a role (the UI mirror of the rules above). */
export function hiddenSettingsTabs(role: string | null): string[] {
  if (!role) return []; // owners and clients see everything
  if (role === "consultant") return ["workspace", "notifications", "away", "texts", "ai", "integrations", "billing", "data"]; // profile, appearance and security only
  if (role === "admin") return ["ai", "integrations", "billing", "data", "texts"];
  return ["workspace", "away", "texts", "ai", "integrations", "billing", "data"]; // editor, viewer, and Sales outside the owner's workspace
}

// ── Per-feature access (cs183) ───────────────────────────────────────────────
// An owner can narrow a member to chosen features, each No access / View / Edit,
// starting from a preset. Stored on workspace_members.permissions as
// { preset, features: { <feature>: "none" | "view" | "edit" } }. A member with no
// features map keeps their role's defaults above. Billing, keys, connected
// accounts and other members' details stay closed whatever the features say.

export type FeatureKey =
  | "tasks" | "projects" | "daily_compass" | "content" | "scripts" | "sales_activities" | "pipeline" | "finance"
  | "planning" | "operations" | "testimonials" | "alignment" | "compliance" | "website_review" | "inbox_calendar" | "crm"
  | "team_huddle" | "volant" | "support_desk" | "calendars" | "campaigns" | "outreach" | "masterclass_results" | "sales_reference" | "executive_home" | "assistant" | "accountability" | "custom_pages";
export type AccessLevel = "none" | "view" | "edit";
export type FeatureMap = Partial<Record<FeatureKey, AccessLevel>>;

// houseOnly: only meaningful in Babs's own account (the Support Desk shows every client's requests),
// so the access screen offers it only there.
export const FEATURES: { key: FeatureKey; label: string; pages: string[]; apis: string[]; houseOnly?: boolean }[] = [
  { key: "executive_home", label: "Executive Home & notifications", pages: ["/", "/dashboard"], apis: ["/api/notifications", "/api/command-center"] },
  { key: "assistant", label: "AI assistant (acts only within the areas they have)", pages: ["/assistant-approvals"], apis: ["/api/assistant", "/api/mariposa"] },
  { key: "accountability", label: "Accountability Partner", pages: ["/accountability"], apis: ["/api/accountability", "/api/coaching-calls"] },
  { key: "custom_pages", label: "My Pages (custom pages)", pages: ["/my-pages"], apis: ["/api/custom-pages"] },
  { key: "tasks", label: "Tasks", pages: ["/tasks", "/reminders"], apis: ["/api/tasks", "/api/reminders", "/api/recurring-tasks", "/api/quick-wins", "/api/next-moves"] },
  { key: "projects", label: "Projects and Time", pages: ["/projects", "/time"], apis: ["/api/projects", "/api/time"] },
  { key: "daily_compass", label: "Daily Compass", pages: ["/daily-compass", "/capture", "/morning-brief"], apis: ["/api/compass-weekly", "/api/compass-insights", "/api/compass-activity"] },
  { key: "content", label: "Content Calendar & Studio", pages: ["/daily-compass/calendar", "/daily-compass/content-studio"], apis: ["/api/content", "/api/social"] },
  { key: "scripts", label: "Scripts", pages: ["/daily-compass/scripts"], apis: ["/api/scripts"] },
  { key: "sales_activities", label: "Sales Activities", pages: ["/daily-compass/sales-activities"], apis: ["/api/sales-activities"] },
  { key: "pipeline", label: "Pipeline, Offers & Sales Plan", pages: ["/sales"], apis: ["/api/pipeline", "/api/offers"] },
  { key: "finance", label: "Finance", pages: ["/finance", "/revenue", "/payments", "/year-in-review"], apis: ["/api/finance", "/api/payments", "/api/year-review", "/api/financial-pulse", "/api/revenue-by-segment", "/api/revenue-snapshot"] },
  { key: "planning", label: "Planning & Goals", pages: ["/planning", "/business-plan", "/marketing-plan"], apis: ["/api/planning", "/api/goals", "/api/plans", "/api/review"] },
  { key: "operations", label: "Operations & SOPs", pages: ["/operations"], apis: ["/api/operations", "/api/operational", "/api/sops", "/api/operating-rhythm"] },
  { key: "testimonials", label: "Testimonials", pages: ["/reviews"], apis: ["/api/reviews"] },
  { key: "alignment", label: "Assessments & Alignment", pages: ["/assessments", "/progress", "/business-alignment", "/segments", "/dimensions"], apis: ["/api/assessments", "/api/checkins", "/api/scoring", "/api/command-shift", "/api/segments", "/api/alignment", "/api/progress"] },
  { key: "compliance", label: "Legal & Compliance", pages: ["/compliance"], apis: ["/api/legal-checklist"] },
  { key: "website_review", label: "Website Review", pages: ["/website-review"], apis: ["/api/website-review"] },
  { key: "inbox_calendar", label: "Inbox & Calendar", pages: [], apis: ["/api/inbox", "/api/mail", "/api/schedule", "/api/calendar"] },
  { key: "team_huddle", label: "Team Huddle", pages: ["/team-huddle", "/huddle"], apis: ["/api/team-huddle"] },
  { key: "volant", label: "LC Volant (transcripts into reports)", pages: ["/volant"], apis: ["/api/volant"], houseOnly: !VOLANT_OPEN_TO_ALL },
  { key: "support_desk", label: "Support Desk (every client's support requests)", pages: ["/support-desk"], apis: ["/api/support/desk"], houseOnly: true },
  { key: "crm", label: "Contacts, tags, invites, short links & affiliates", pages: ["/contacts", "/tags", "/invites", "/affiliates", "/short-links", "/links-directory", "/client-care", "/client-portals", "/programs", "/events", "/landing-pages", "/course-bridge", "/agreements"], apis: ["/api/crm", "/api/affiliates", "/api/short-links", "/api/links-directory", "/api/client-care", "/api/client-portal", "/api/programs", "/api/events", "/api/landing-pages", "/api/bridge-settings", "/api/agreements"] },
  { key: "calendars", label: "Calendars (booking pages)", pages: ["/calendars"], apis: ["/api/calendars"] },
  { key: "campaigns", label: "Campaigns & Broadcasts", pages: ["/sequences-manager"], apis: ["/api/sequences", "/api/crm/broadcasts"] },
  { key: "outreach", label: "Outreach Pipelines, Prospect Qualifier & Meta leads", pages: ["/dm-pipeline", "/dm-send", "/meta-leads", "/qualifier"], apis: ["/api/dm-pipeline", "/api/meta-lead-settings", "/api/qualifier"] },
  { key: "sales_reference", label: "Sales Reference (call script, lookup, New Client form, checkout)", pages: ["/sales-reference"], apis: ["/api/sales"], houseOnly: true },
  { key: "masterclass_results", label: "MasterClass Results (funnel and registrations)", pages: ["/masterclass-results"], apis: ["/api/masterclass"], houseOnly: true },
];

const ALL_VIEW = Object.fromEntries(FEATURES.map((f) => [f.key, "view"])) as FeatureMap;
const ONLY = (keys: FeatureKey[], extra: FeatureMap = {}) =>
  ({ ...Object.fromEntries(FEATURES.map((f) => [f.key, keys.includes(f.key) ? "edit" : "none"])), ...extra }) as FeatureMap;

export const PRESETS: { key: string; label: string; blurb: string; features: FeatureMap; extras?: AccessExtras; houseOnly?: boolean }[] = [
  { key: "va", label: "Virtual assistant", blurb: "Tasks, Daily Compass, content and scripts. Inbox and calendar are off unless you turn them on.", features: ONLY(["executive_home", "tasks", "projects", "daily_compass", "content", "scripts", "custom_pages"]) },
  { key: "bookkeeper", label: "Bookkeeper", blurb: "Finance only.", features: ONLY(["finance"]) },
  { key: "sales", label: "Sales", blurb: "Sales activities, scripts, the pipeline, and contacts, calendars & sequences.", features: ONLY(["executive_home", "sales_activities", "scripts", "pipeline", "tasks", "crm", "calendars", "campaigns", "outreach"]) },
  { key: "content", label: "Content", blurb: "Content calendar and studio, testimonials and scripts.", features: ONLY(["executive_home", "content", "testimonials", "scripts", "tasks"]) },
  { key: "viewer", label: "Viewer", blurb: "Sees everything above, changes nothing.", features: ALL_VIEW },
  {
    key: "team_ops",
    label: "Team member: sales, content and support",
    blurb: "Only her own tasks and reminders, Team Huddle, contacts, pipelines, outreach, qualifier, content calendar, testimonials, calendars, campaigns, offers, projects and the Support Desk. Can add, edit and update but not delete without permission. Nothing else shows.",
    features: ONLY(["tasks", "projects", "content", "testimonials", "pipeline", "crm", "calendars", "campaigns", "outreach", "team_huddle", "support_desk"]),
    extras: { restrict: true, ownOnly: true, noDelete: true },
    houseOnly: true,
  },
  {
    key: "support",
    label: "Support & client care",
    blurb: "Their own tasks, contacts, projects and Team Huddle only. Everything else stays closed, and they cannot delete anything without your permission.",
    features: ONLY(["tasks", "projects", "crm", "team_huddle"]),
    extras: { restrict: true, ownOnly: true, noDelete: true },
  },
];

const longestMatch = (path: string, pick: (f: (typeof FEATURES)[number]) => string[]) => {
  let best: { key: FeatureKey; len: number } | null = null;
  for (const f of FEATURES) for (const p of pick(f)) if ((path === p || path.startsWith(p + "/")) && (!best || p.length > best.len)) best = { key: f.key, len: p.length };
  return best?.key ?? null;
};
export const featureForApi = (path: string) => longestMatch(path, (f) => f.apis);
export const featureForPage = (path: string) => longestMatch(path, (f) => f.pages);

// Areas added after members were first set up. A member saved before an area existed keeps what they always had
// (these were open to every member), so a key missing from a stored map means "as before" for these, "none" for the rest.
const SPLIT_FROM_CRM: FeatureKey[] = ["calendars", "campaigns", "outreach"];
const OPEN_BEFORE_MAPPED: FeatureKey[] = ["executive_home", "assistant", "accountability", "custom_pages"];

export function cleanFeatureMap(v: unknown): FeatureMap | null {
  if (!v || typeof v !== "object") return null;
  const out: FeatureMap = {};
  for (const f of FEATURES) {
    const l = (v as Record<string, unknown>)[f.key];
    out[f.key] = l === "edit" || l === "view" ? l : l === undefined && OPEN_BEFORE_MAPPED.includes(f.key) ? "edit" : "none";
  }
  // "Contacts, calendars, campaigns & outreach" used to be one area (crm). A member saved before it was split keeps
  // all four at the level they had.
  for (const k of SPLIT_FROM_CRM) if ((v as Record<string, unknown>)[k] === undefined) out[k] = out.crm;
  return out;
}

/** Extra gate for a member with a features map. Runs after memberApiAccess allowed the call. */
export function featureApiAccess(features: FeatureMap | null, path: string, method: string, extras?: AccessExtras | null): Verdict {
  if (!features) return ok;
  const key = featureForApi(path);
  if (!key) return ok; // not a feature area (profile, notifications, etc.)
  // Custom pages given one by one: the route itself decides which pages and what level.
  if (key === "custom_pages" && extras?.pages) return ok;
  const level = features[key] ?? "none";
  const label = FEATURES.find((f) => f.key === key)?.label ?? "this area";
  if (level === "none") return no(`You don't have access to ${label}.`);
  if (level === "view" && !(method === "GET" || method === "HEAD")) return no(`You can view ${label} but not change it.`);
  return ok;
}

/** Where to send a member who opens a page their features don't include (null = allow). */
export function featurePageRedirect(features: FeatureMap | null, path: string, extras?: AccessExtras | null): string | null {
  if (!features) return null;
  const mine = MY_PAGE.exec(path);
  if (mine && customPageLevel(features, extras ?? null, mine[1]) !== "none") return null;
  const key = featureForPage(path);
  if (!key || (features[key] ?? "none") !== "none") return null;
  const first = FEATURES.find((f) => f.pages.length && (features[f.key] ?? "none") !== "none");
  return first ? first.pages[0] : "/settings?tab=profile";
}

// ── Extra limits that sit beside the per-area levels ─────────────────────────
// Stored on workspace_members.permissions.extras:
//   restrict — default-deny the pages: only the areas set above (and Settings, Help) open; Executive Home and every
//              other page send the person to their first area. The assistant and other powerful tools stay closed.
//   ownOnly  — Tasks and Reminders show only what is assigned to / made by that person.
//   noDelete — nothing can be deleted without the owner's permission (add, edit and update still work).
//   demo     — may turn on the Demo Account for live demos (sample data; Babs's own team only).
//   pages    — My Pages (custom pages) given one at a time: { "<page slug>": "view" | "edit" }. A page listed here opens
//              even when "My Pages" as a whole is off, so an admin never has to hand over all of them.
export interface AccessExtras {
  restrict?: boolean;
  ownOnly?: boolean;
  noDelete?: boolean;
  pages?: Record<string, "view" | "edit">;
  demo?: boolean; // may present the Demo Account (sample data) — only meaningful in Babs's own team
  expiresOn?: string; // YYYY-MM-DD: the last day this person's access works; the day after, they are signed out of everything
  expiresTz?: string; // the time zone that day is counted in (the owner's, when they set it); Mountain time when absent
}
const EXPIRY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_EXPIRY_TZ = "America/Denver";
/** A usable IANA time zone name, or null. */
export function cleanTimeZone(v: unknown): string | null {
  if (typeof v !== "string" || !v || v.length > 64) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: v });
    return v;
  } catch {
    return null;
  }
}
/** Today's date (YYYY-MM-DD) in a time zone. */
export function todayInZone(tz: string = DEFAULT_EXPIRY_TZ, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: cleanTimeZone(tz) ?? DEFAULT_EXPIRY_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
/** A real calendar day written YYYY-MM-DD, or null. */
export function cleanExpiryDate(v: unknown): string | null {
  if (typeof v !== "string" || !EXPIRY_RE.test(v)) return null;
  const d = new Date(`${v}T12:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : v;
}
export function cleanExtras(v: unknown): AccessExtras | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const out: AccessExtras = {};
  const expiresOn = cleanExpiryDate(o.expiresOn);
  if (expiresOn) {
    out.expiresOn = expiresOn;
    const tz = cleanTimeZone(o.expiresTz);
    if (tz) out.expiresTz = tz;
  }
  if (o.restrict === true) out.restrict = true;
  if (o.ownOnly === true) out.ownOnly = true;
  if (o.noDelete === true) out.noDelete = true;
  if (o.demo === true) out.demo = true;
  if (o.pages && typeof o.pages === "object") {
    const pages: Record<string, "view" | "edit"> = {};
    for (const [slug, l] of Object.entries(o.pages as Record<string, unknown>).slice(0, 80)) {
      if (/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug) && (l === "view" || l === "edit")) pages[slug] = l;
    }
    if (Object.keys(pages).length) out.pages = pages;
  }
  return Object.keys(out).length ? out : null;
}

/** The last day of a member's access, if one is set. */
export function accessEndOf(permissions: unknown): { on: string; tz: string } | null {
  const extras = (permissions as { extras?: { expiresOn?: unknown; expiresTz?: unknown } } | null | undefined)?.extras;
  const on = cleanExpiryDate(extras?.expiresOn);
  return on ? { on, tz: cleanTimeZone(extras?.expiresTz) ?? DEFAULT_EXPIRY_TZ } : null;
}
/** The permissions with the last day of access set (or removed when null), everything else kept as it was. */
export function withAccessEnd(permissions: unknown, end: { on: string; tz?: string | null } | null): Record<string, unknown> {
  const base: Record<string, unknown> = permissions && typeof permissions === "object" && !Array.isArray(permissions) ? { ...(permissions as Record<string, unknown>) } : {};
  const extras: Record<string, unknown> = base.extras && typeof base.extras === "object" ? { ...(base.extras as Record<string, unknown>) } : {};
  delete extras.expiresOn;
  delete extras.expiresTz;
  if (end) {
    extras.expiresOn = end.on;
    extras.expiresTz = cleanTimeZone(end.tz) ?? DEFAULT_EXPIRY_TZ;
  }
  if (Object.keys(extras).length) base.extras = extras;
  else delete base.extras;
  return base;
}

/** True once the day after a member's last day has begun (in the time zone it was set in; Mountain time if none). No expiry never expires. */
export function memberAccessExpired(permissions: unknown, now: Date = new Date()): boolean {
  const extras = (permissions as { extras?: { expiresOn?: unknown; expiresTz?: unknown } } | null | undefined)?.extras;
  const last = cleanExpiryDate(extras?.expiresOn);
  if (!last) return false;
  return todayInZone(cleanTimeZone(extras?.expiresTz) ?? DEFAULT_EXPIRY_TZ, now) > last;
}

export const NO_DELETE_MESSAGE ="Deleting needs the account owner's permission. Ask them and they will remove it for you.";

// Always open to a restricted member: their own profile, Help, sign-in pages.
const RESTRICTED_OPEN_PAGES = ["/demo", "/settings", "/help", "/user-guide", "/logout", "/login", "/reset-password", "/forgot-password", "/accept-invite", "/legal", "/api"];
// APIs open to a restricted member beyond the ones their areas map to (profile, menu order, the small helpers the
// allowed pages call). Everything else that belongs to no area stays closed to them.
const RESTRICTED_OPEN_APIS = [
  "/api/me", "/api/profile", "/api/auth", "/api/logout", "/api/nav-order", "/api/version", "/api/feedback", "/api/book",
  "/api/account", "/api/setup", "/api/uploads", "/api/followups", "/api/event-emails", "/api/lbd-summit-emails", "/api/scripts",
  "/api/support", "/api/workspaces", "/api/integrations", "/api/user-guide",
];

/** Where a restricted member lands: their first open area (Tasks first). */
export function restrictedLanding(features: FeatureMap | null): string {
  const order = [FEATURES.find((f) => f.key === "tasks"), ...FEATURES.filter((f) => f.key !== "tasks")];
  const first = order.find((f) => f && f.pages.length && (features?.[f.key] ?? "none") !== "none");
  return first ? first.pages[0] : "/settings?tab=profile";
}

/** A restricted member opening a page outside their areas: where to send them (null = allowed or not restricted). */
export function restrictedPageRedirect(features: FeatureMap | null, extras: AccessExtras | null, path: string): string | null {
  if (!extras?.restrict) return null;
  if (under(path, RESTRICTED_OPEN_PAGES)) return null;
  const mine = MY_PAGE.exec(path);
  if (mine && customPageLevel(features, extras, mine[1]) !== "none") return null;
  const key = featureForPage(path);
  if (key && (features?.[key] ?? "none") !== "none") return null;
  return restrictedLanding(features);
}

/** Extra API rules: no deleting without permission, and the powerful unmapped tools closed to a restricted member. */
export function extrasApiAccess(extras: AccessExtras | null, path: string, method: string): Verdict {
  if (!extras) return ok;
  if (extras.noDelete && method === "DELETE") return no(NO_DELETE_MESSAGE);
  if (extras.restrict && !featureForApi(path) && !under(path, RESTRICTED_OPEN_APIS)) return no("That isn't part of your access.");
  return ok;
}

/** A POST/PATCH whose JSON body asks to delete or remove something ({ action: "delete" | "stage-delete" | "share-remove" ... }). */
export function bodyDeleteVerdict(extras: AccessExtras | null, body: unknown): Verdict {
  if (!extras?.noDelete || !body || typeof body !== "object") return ok;
  const b = body as Record<string, unknown>;
  const acts = [b.action, b.op, b.intent].filter((v): v is string => typeof v === "string");
  if (acts.some((a) => /(^|[-_ ])(delete|remove|destroy|purge)($|[-_ ])/i.test(a)) || b.delete === true) return no(NO_DELETE_MESSAGE);
  return ok;
}

/** One custom page's level for a member: its own grant, else whatever "My Pages" as a whole allows. */
export function customPageLevel(features: FeatureMap | null, extras: AccessExtras | null, slug: string): AccessLevel {
  const own = extras?.pages?.[slug];
  if (own) return own;
  if (!features) return "edit"; // no feature limits: their role decides
  return features.custom_pages ?? "none";
}
const MY_PAGE = /^\/my-pages\/([^/]+)/;
