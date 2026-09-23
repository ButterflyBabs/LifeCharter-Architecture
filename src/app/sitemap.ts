import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://lccommandsuite.com";
  const now = new Date();
  return [
    { url: `${base}/collective`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/legal/community-guidelines`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/privacy-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
