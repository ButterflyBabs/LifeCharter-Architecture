// When a new client's account opens by itself (the two-minute job, or the New Client button) but no sign-in email went
// out, Babs is told on the day: the standard "account ready" email may still be a draft, the send may have failed, or
// the sign-in link could not be made. Found on 2026-10-21 in the Eloise Practice test of the Sales Reference path: the
// account opened but nothing was emailed, and nothing told anyone (task 1122). The text goes into a reminder, so it
// reaches her as a bell card and an email.
export function noSignInEmailReminder(who: { name: string; email: string }, why: "draft" | "failed" | "no-link", appUrl: string): { title: string; notes: string } {
  const reason =
    why === "draft"
      ? "The standard 'account ready' email is still a draft, so nothing was sent."
      : why === "failed"
        ? "The account-ready email did not send."
        : "The sign-in link could not be made, so no email was sent.";
  return {
    title: `${who.name} has an account but no sign-in email was sent`,
    notes:
      `${reason} Their Command Suite account (${who.email}) is open. ` +
      `Until they get a sign-in link they cannot log in. Fix it: approve the standard email at ${appUrl}/sequences-manager?tab=clients, ` +
      `and tell them to open ${appUrl}/forgot-password and enter ${who.email} for a fresh sign-in link (it works whenever the account exists).`,
  };
}
