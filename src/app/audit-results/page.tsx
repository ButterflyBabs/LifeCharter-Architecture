import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import AuditResults from "./AuditResults";

export const metadata: Metadata = { title: "Audit Results" };
export const dynamic = "force-dynamic";

// Alignment Architect only: everyone who has finished the Mini Command Audit or the Business Health Check, with contact details.
export default async function AuditResultsPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <AuditResults />;
}
