import { Metadata } from "next";
import PlanWorkspace from "@/components/plans/PlanWorkspace";

export const metadata: Metadata = {
  title: "Sales Plan | LifeCharter Command Suite",
  description: "Your living sales plan — built from your assessments with AI.",
};

export default function SalesPlanPage() {
  return <PlanWorkspace planType="sales" />;
}
