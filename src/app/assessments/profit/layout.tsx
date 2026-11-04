import { redirect } from "next/navigation";
import { resolveAiConfig } from "@/lib/ai/config";
import { startHereForCurrentAccount } from "@/lib/startHereServer";

export const dynamic = "force-dynamic";

// New accounts (the one-page Getting Started): the AI key comes BEFORE the assessments, so their assistant can help
// them complete them. Existing clients are not affected.
export default async function AssessmentLayout({ children }: { children: React.ReactNode }) {
  if (await startHereForCurrentAccount()) {
    const hasKey = await resolveAiConfig().then((c) => Boolean(c.key)).catch(() => true);
    if (!hasKey) redirect("/getting-started?need=ai");
  }
  return <>{children}</>;
}
