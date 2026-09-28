import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import ContactsCrm from "./ContactsCrm";

export const dynamic = "force-dynamic";

// The Suite's own CRM: contacts, their timeline, and the forms that feed them.
export default async function ContactsPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <ContactsCrm />;
}
