// Conversion events for the public pages (see components/PublicTracking.tsx). Sends to the shared
// Meta Pixel and Google Analytics. Quietly does nothing where tracking isn't loaded (every page
// behind a login) or is blocked.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

// Meta standard event -> GA4 recommended event.
const GA_EVENT: Record<string, string> = {
  Lead: "generate_lead",
  CompleteRegistration: "sign_up",
  Purchase: "purchase",
  Schedule: "schedule",
};

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", name, params);
  window.gtag?.("event", GA_EVENT[name] ?? name, params ?? {});
}
