import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import EventEmailsManager from "./EventEmailsManager";

export const dynamic = "force-dynamic";

// Alignment Architect only: the Suite's MasterClass and Incubator confirmation + reminder emails.
export default async function EventEmailsPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <EventEmailsManager />;
}
