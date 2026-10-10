import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import ClientJourney from "./ClientJourney";

export const dynamic = "force-dynamic";

// Alignment Architect only: where each new client is between joining and their Next Chapter Call.
export default async function ClientJourneyPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <ClientJourney />;
}
