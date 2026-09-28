import { Metadata } from "next";
import PlanWorkspace from "@/components/plans/PlanWorkspace";
import { SalesTargetsAssist } from "@/components/planning/AssistantPanels";
import SalesNav from "@/components/sales/SalesNav";

export const metadata: Metadata = {
  title: "Sales Plan | LifeCharter Command Suite",
  description: "Your living sales plan — built from your assessments with AI.",
};

export default function SalesPlanPage() {
  return (
    <>
      <SalesNav className="mx-auto max-w-6xl px-4 pt-6 sm:px-6" />
      <PlanWorkspace planType="sales" extra={<SalesTargetsAssist />} />
    </>
  );
}
