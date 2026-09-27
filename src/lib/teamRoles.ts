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
export function memberApiAccess(role: string | null, path: string, method: string): Verdict {
  const r = (role ?? "viewer") as TeamRole;
  const reading = method === "GET" || method === "HEAD";

  if (r === "sales") return under(path, SALES_APIS) ? ok : no("Your role only includes the sales page.");

  if (under(path, BILLING_APIS)) return no("Only the account owner can manage billing.");
  if (under(path, CONNECTION_APIS)) {
    // Reading whether something is connected is harmless; changing it is owner-only.
    return reading && path.startsWith("/api/integrations") ? ok : no("Only the account owner can connect or change outside accounts and keys.");
  }
  if (path.startsWith("/api/workspaces/") && method === "DELETE" && !path.includes("/members")) return no("Only the account owner can delete the account.");

  if (under(path, MAILBOX_APIS) && r !== "admin") return no("Your role doesn't include the account's inbox or calendar.");
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
