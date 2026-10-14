import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { COLLECTIVE_HOST, isCollectiveHost } from "@/lib/collective";

// Only the public pages are for search engines; the apps behind sign-in aren't.
// The Collective's own host serves its landing at "/" (allowed with "/$"); the Suite host keeps its legal pages.
export default function robots(): MetadataRoute.Robots {
  const onCollective = isCollectiveHost(headers().get("host"));
  const assets = ["/_next/", "/collective-logo.png", "/collective-emblem.png", "/collective-motifs/", "/community-icons/"];
  if (onCollective) {
    return {
      rules: [{ userAgent: "*", allow: ["/$", "/collective", "/legal/", ...assets], disallow: ["/api/", "/community/", "/join/", "/"] }],
      sitemap: `https://${COLLECTIVE_HOST}/sitemap.xml`,
    };
  }
  return {
    rules: [{ userAgent: "*", allow: ["/collective", "/legal/", ...assets], disallow: ["/api/", "/community/", "/join/", "/"] }],
    sitemap: `https://lccommandsuite.com/sitemap.xml`,
  };
}
