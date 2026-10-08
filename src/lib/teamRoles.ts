// What each invited team-member role may reach inside the account they were invited to.
// Decided with Babs 2026-09-27. Account owners (and the super admin) are never limited by this.
//
//   admin  — runs the account day to day, including inviting and removing team members.
//            No billing or plan changes, no connecting/disconnecting email, calendar or AI keys,
//            no deleting the account.
//   editor — works on the business (tasks, plans, content, finance, sales activity).
//            No team, settings, billing, connections, and no access to the owner's inbox/calendar.
//   viewer — sees what an editor sees; cannot change anything.
//   sales  — only the sales page (/sales-reference), with its Contacts tab.
//
// Imported by the edge middleware, so it must stay dependency-free.

export type TeamRole = "admin" | "editor" | "viewer" | "sales";

export const SALES_PAGES = ["/sales-reference"];
export const SALES_APIS = [
  "/api/sales/onboard-client",
  "/api/sales/lookup-contact",
  "/api/sales/search-contacts",
  "/api/sales/checkout-session",
  "/api/sales/contacts",
  "/api/sales/save-call",
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
  return null; // other roles see pages; what they can do there is enforced on the API above
}

/** Settings tabs to hide for a role (the UI mirror of the rules above). */
export function hiddenSettingsTabs(role: string | null): string[] {
  if (!role) return []; // owners and clients see everything
  if (role === "admin") return ["ai", "integrations", "billing", "data"];
  return ["workspace", "ai", "integrations", "billing", "data"]; // editor, viewer, and Sales outside the owner's workspace
}

// ── Per-feature access (cs183) ───────────────────────────────────────────────
// An owner can narrow a member to chosen features, each No access / View / Edit,
// starting from a preset. Stored on workspace_members.permissions as
// { preset, features: { <feature>: "none" | "view" | "edit" } }. A member with no
// features map keeps their role's defaults above. Billing, keys, connected
// accounts and other members' details stay closed whatever the features say.

export type FeatureKey =
  | "tasks" | "projects" | "daily_compass" | "content" | "scripts" | "sales_activities" | "pipeline" | "finance"
  | "planning" | "operations" | "testimonials" | "alignment" | "compliance" | "website_review" | "inbox_calendar" | "crm";
export type AccessLevel = "none" | "view" | "edit";
export type FeatureMap = Partial<Record<FeatureKey, AccessLevel>>;

export const FEATURES: { key: FeatureKey; label: string; pages: string[]; apis: string[] }[] = [
  { key: "tasks", label: "Tasks", pages: ["/tasks"], apis: ["/api/tasks", "/api/recurring-tasks", "/api/quick-wins", "/api/next-moves"] },
  { key: "projects", label: "Projects", pages: ["/projects"], apis: ["/api/projects"] },
  { key: "daily_compass", label: "Daily Compass", pages: ["/daily-compass", "/capture", "/morning-brief"], apis: ["/api/compass-weekly", "/api/compass-insights", "/api/compass-activity"] },
  { key: "content", label: "Content Calendar & Studio", pages: ["/daily-compass/calendar", "/daily-compass/content-studio"], apis: ["/api/content", "/api/social"] },
  { key: "scripts", label: "Scripts", pages: ["/daily-compass/scripts"], apis: ["/api/scripts"] },
  { key: "sales_activities", label: "Sales Activities", pages: ["/daily-compass/sales-activities"], apis: ["/api/sales-activities"] },
  { key: "pipeline", label: "Pipeline, Offers & Sales Plan", pages: ["/sales"], apis: ["/api/pipeline", "/api/offers"] },
  { key: "finance", label: "Finance", pages: ["/finance", "/revenue"], apis: ["/api/finance", "/api/financial-pulse", "/api/revenue-by-segment", "/api/revenue-snapshot"] },
  { key: "planning", label: "Planning & Goals", pages: ["/planning", "/business-plan", "/marketing-plan"], apis: ["/api/planning", "/api/goals", "/api/plans", "/api/review"] },
  { key: "operations", label: "Operations & SOPs", pages: ["/operations"], apis: ["/api/operations", "/api/operational", "/api/sops", "/api/operating-rhythm"] },
  { key: "testimonials", label: "Testimonials", pages: ["/reviews"], apis: ["/api/reviews"] },
  { key: "alignment", label: "Assessments & Alignment", pages: ["/assessments", "/progress", "/business-alignment", "/segments", "/dimensions"], apis: ["/api/assessments", "/api/checkins", "/api/scoring", "/api/command-shift", "/api/segments", "/api/alignment", "/api/progress"] },
  { key: "compliance", label: "Legal & Compliance", pages: ["/compliance"], apis: ["/api/legal-checklist"] },
  { key: "website_review", label: "Website Review", pages: ["/website-review"], apis: ["/api/website-review"] },
  { key: "inbox_calendar", label: "Inbox & Calendar", pages: [], apis: ["/api/inbox", "/api/mail", "/api/schedule", "/api/calendar"] },
  { key: "crm", label: "Contacts, calendars, campaigns & broadcasts", pages: ["/contacts", "/tags", "/calendars", "/sequences-manager", "/invites", "/dm-pipeline", "/dm-send", "/qualifier", "/affiliates", "/short-links"], apis: ["/api/crm", "/api/calendars", "/api/sequences", "/api/dm-pipeline", "/api/qualifier", "/api/affiliates", "/api/short-links"] },
];

const ALL_VIEW = Object.fromEntries(FEATURES.map((f) => [f.key, "view"])) as FeatureMap;
const ONLY = (keys: FeatureKey[], extra: FeatureMap = {}) =>
  ({ ...Object.fromEntries(FEATURES.map((f) => [f.key, keys.includes(f.key) ? "edit" : "none"])), ...extra }) as FeatureMap;

export const PRESETS: { key: string; label: string; blurb: string; features: FeatureMap }[] = [
  { key: "va", label: "Virtual assistant", blurb: "Tasks, Daily Compass, content and scripts. Inbox and calendar are off unless you turn them on.", features: ONLY(["tasks", "projects", "daily_compass", "content", "scripts"]) },
  { key: "bookkeeper", label: "Bookkeeper", blurb: "Finance only.", features: ONLY(["finance"]) },
  { key: "sales", label: "Sales", blurb: "Sales activities, scripts, the pipeline, and contacts, calendars & sequences.", features: ONLY(["sales_activities", "scripts", "pipeline", "tasks", "crm"]) },
  { key: "content", label: "Content", blurb: "Content calendar and studio, testimonials and scripts.", features: ONLY(["content", "testimonials", "scripts", "tasks"]) },
  { key: "viewer", label: "Viewer", blurb: "Sees everything above, changes nothing.", features: ALL_VIEW },
];

const longestMatch = (path: string, pick: (f: (typeof FEATURES)[number]) => string[]) => {
  let best: { key: FeatureKey; len: number } | null = null;
  for (const f of FEATURES) for (const p of pick(f)) if ((path === p || path.startsWith(p + "/")) && (!best || p.length > best.len)) best = { key: f.key, len: p.length };
  return best?.key ?? null;
};
export const featureForApi = (path: string) => longestMatch(path, (f) => f.apis);
export const featureForPage = (path: string) => longestMatch(path, (f) => f.pages);

export function cleanFeatureMap(v: unknown): FeatureMap | null {
  if (!v || typeof v !== "object") return null;
  const out: FeatureMap = {};
  for (const f of FEATURES) {
    const l = (v as Record<string, unknown>)[f.key];
    out[f.key] = l === "edit" || l === "view" ? l : "none";
  }
  return out;
}

/** Extra gate for a member with a features map. Runs after memberApiAccess allowed the call. */
export function featureApiAccess(features: FeatureMap | null, path: string, method: string): Verdict {
  if (!features) return ok;
  const key = featureForApi(path);
  if (!key) return ok; // not a feature area (profile, notifications, etc.)
  const level = features[key] ?? "none";
  const label = FEATURES.find((f) => f.key === key)?.label ?? "this area";
  if (level === "none") return no(`You don't have access to ${label}.`);
  if (level === "view" && !(method === "GET" || method === "HEAD")) return no(`You can view ${label} but not change it.`);
  return ok;
}

/** Where to send a member who opens a page their features don't include (null = allow). */
export function featurePageRedirect(features: FeatureMap | null, path: string): string | null {
  if (!features) return null;
  const key = featureForPage(path);
  if (!key || (features[key] ?? "none") !== "none") return null;
  const first = FEATURES.find((f) => f.pages.length && (features[f.key] ?? "none") !== "none");
  return first ? first.pages[0] : "/settings?tab=profile";
}
