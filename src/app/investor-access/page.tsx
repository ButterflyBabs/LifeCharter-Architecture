import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import Requests from "./Requests";

export const dynamic = "force-dynamic";

// Alignment Architect only: review each request for the investor documents and approve or decline it.
export default async function InvestorAccessPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <Requests />;
}
