import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";

export const dynamic = "force-dynamic";

// Command Center is Babs's alone (Alignment Architect section, 2026-09-28): it would show her
// internal audit findings, never a client's own data.
export default async function CommandCenterLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAlignmentArchitect())) notFound();
  return <>{children}</>;
}
