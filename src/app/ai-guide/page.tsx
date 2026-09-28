import { redirect } from "next/navigation";

// The old "AI Guide Configuration" page was a mock (keys typed there were never saved). The real
// setting is Settings > AI Assistant, so every old link and bookmark lands there (Babs, 2026-09-28).
export default function AiGuidePage() {
  redirect("/settings?tab=ai");
}
