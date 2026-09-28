import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import SupportDesk from "./SupportDesk";

export const dynamic = "force-dynamic";

// Alignment Architect only: every client support request, in one inbox.
export default async function SupportDeskPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <SupportDesk />;
}
