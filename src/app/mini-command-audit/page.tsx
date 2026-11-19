import type { Metadata } from "next";
import AuditApp from "./AuditApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "The Mini Command Audit: where should you start?",
  description: "A free 8-minute audit of 12 areas of your business, with your results the moment you finish. From AmiLynne 'Babs' Carroll, Alignment Architect.",
};

// The free lead magnet. Public: no sign-in. See src/lib/miniAudit.ts.
export default function MiniCommandAuditPage() {
  return <AuditApp />;
}
