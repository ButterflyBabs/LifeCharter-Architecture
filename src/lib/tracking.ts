// Conversion events for the public pages (see components/PublicTracking.tsx). Sends to the shared
// Meta Pixel and Google Analytics. Quietly does nothing where tracking isn't loaded (every page
// behind a login) or is blocked. The server sends the same Meta events through the Conversions API
// (lib/metaCapi.ts); pass the same eventID on both sides so Meta counts them once.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

// One shared pixel for every site (Babs, 2026-09-27): "AmiLynne Carroll Websites", Sacred Kaleidoscope Community.
export const SHARED_META_PIXEL_ID = "1084205054362982";

// Meta standard event -> GA4 recommended event.
const GA_EVENT: Record<string, string> = {
  Lead: "generate_lead",
  CompleteRegistration: "sign_up",
  Purchase: "purchase",
  Schedule: "schedule",
};

export function trackEvent(name: string, params?: Record<string, unknown>, opts?: { eventID?: string }) {
  if (typeof window === "undefined") return;
  if (opts?.eventID) window.fbq?.("track", name, params ?? {}, { eventID: opts.eventID });
  else window.fbq?.("track", name, params);
  window.gtag?.("event", GA_EVENT[name] ?? name, params ?? {});
}
