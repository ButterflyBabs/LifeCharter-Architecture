import type { MetadataRoute } from "next";

// Only the public pages are for search engines; the apps behind sign-in aren't.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/collective", "/legal/", "/_next/", "/lifecharter-collective-mark.png", "/community-icons/"], disallow: ["/api/", "/community/", "/join/", "/"] }],
    sitemap: "https://lccommandsuite.com/sitemap.xml",
  };
}
