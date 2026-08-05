// Lightweight cross-site guard for state-changing / cost-incurring API routes.
//
// NOTE: this is a mitigation, NOT authentication. It blocks the cross-site
// browser attack vector (another website POSTing to send email as the user or
// burn OpenAI credits) by requiring the browser Origin to match the app's host.
// It does NOT protect against direct requests with no Origin header — the real
// fix for that is application-level auth (Supabase Auth + middleware), which is
// still required before exposing these routes on a public production domain.
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser client; can't enforce here
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export function crossOriginBlocked(request: Request): boolean {
  return !isSameOrigin(request);
}
