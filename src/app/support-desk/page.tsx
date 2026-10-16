import { notFound } from "next/navigation";
import { houseFeatureLevel } from "@/lib/authz";
import SupportDesk from "./SupportDesk";

export const dynamic = "force-dynamic";

// Babs, plus any team member she gives the Support Desk feature: every client support request, in one inbox.
export default async function SupportDeskPage() {
  if ((await houseFeatureLevel("support_desk")) === "none") notFound();
  return <SupportDesk />;
}
