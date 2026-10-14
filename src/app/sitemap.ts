import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { COLLECTIVE_HOST, COLLECTIVE_HOST_LIVE, isCollectiveHost } from "@/lib/collective";

// Each host lists only its own pages: the Collective host its landing (at "/") and the shared legal pages; the
// Suite host the legal pages, plus the landing only until the old /collective address starts forwarding.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const onCollective = isCollectiveHost(headers().get("host"));
  const base = onCollective ? `https://${COLLECTIVE_HOST}` : "https://lccommandsuite.com";
  const pages: MetadataRoute.Sitemap = [];
  if (onCollective) pages.push({ url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 });
  else if (!COLLECTIVE_HOST_LIVE) pages.push({ url: `${base}/collective`, lastModified: now, changeFrequency: "weekly", priority: 1 });
  pages.push(
    { url: `${base}/legal/community-guidelines`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/privacy-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 }
  );
  return pages;
}
