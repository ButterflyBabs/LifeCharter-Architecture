import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import NewClients from "./NewClients";

export const dynamic = "force-dynamic";

// Alignment Architect only: the "your account is ready" email for each new client, written, edited and approved
// here before their account is created and the email goes out.
export default async function NewClientsPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <NewClients />;
}
