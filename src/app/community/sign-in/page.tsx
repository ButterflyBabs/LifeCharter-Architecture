import type { Metadata } from "next";
import { JoinView } from "@/components/community/JoinView";

export const metadata: Metadata = {
  title: "Sign in — The LifeCharter Collective",
  manifest: "/community.webmanifest",
  icons: { apple: "/community-icons/apple-touch-icon.png" },
};

export default function CommunitySignInPage() {
  return <JoinView space={null} mode="signin" />;
}
