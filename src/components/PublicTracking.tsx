"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Meta Pixel + Google Analytics + the Google Ads tag on lccommandsuite.com's PUBLIC pages only (Babs, 2026-09-27: one
// shared pixel and one Analytics account for every site). Nothing loads inside anyone's account,
// the Collective's member area, or admin pages, so clients' and members' private activity is never
// tracked.
const SHARED_META_PIXEL_ID = "1084205054362982"; // "AmiLynne Carroll Websites", Sacred Kaleidoscope Community
const GA_MEASUREMENT_ID = "G-EK2T4YVFF4"; // shared GA4 property, account "Sacred Kaleidoscope Community LLC"
const GOOGLE_ADS_ID = "AW-10845925823"; // Google Ads tag "Sacred Kaleidoscope Community"
const PUBLIC_PREFIXES = ["/collective", "/get-started", "/schedule", "/executive_consultation", "/join"];

const isPublic = (path: string | null) => !!path && PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

export function PublicTracking() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);
  const on = isPublic(pathname);

  // Count later in-app navigations between public pages (the snippet counts the first).
  useEffect(() => {
    if (!on || !pathname) return;
    if (lastTracked.current && lastTracked.current !== pathname) window.fbq?.("track", "PageView");
    lastTracked.current = pathname;
  }, [on, pathname]);

  if (!on) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
gtag('config', '${GOOGLE_ADS_ID}');`}
      </Script>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${SHARED_META_PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
    </>
  );
}
