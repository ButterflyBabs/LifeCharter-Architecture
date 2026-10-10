// The account switcher (own account vs a team account) is limited to these logins for now.
// Babs, 2026-10-10: "only live for Marcello right now". To open it to everyone who has both kinds
// of account, empty this list's use in switcherAllowed (return true). Edge-safe: no imports.
export const ACCOUNT_SWITCHER_EMAILS = ["marcello@amilynnecarroll.com"];

export function switcherAllowed(email: string | null | undefined): boolean {
  return Boolean(email && ACCOUNT_SWITCHER_EMAILS.includes(email.toLowerCase()));
}
