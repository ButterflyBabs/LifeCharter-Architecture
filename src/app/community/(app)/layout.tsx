import type { Metadata, Viewport } from "next";
import { CommunityShell } from "@/components/community/CommunityShell";

export const metadata: Metadata = {
  title: "The LifeCharter Collective",
  description: "Your community for Purpose, Clarity and Aligned Action.",
  manifest: "/community.webmanifest",
  appleWebApp: { capable: true, title: "Collective", statusBarStyle: "default" },
  icons: { apple: "/community-icons/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1F2B3A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <CommunityShell>{children}</CommunityShell>;
}
