import { Metadata } from "next";
import PlanWorkspace from "@/components/plans/PlanWorkspace";

export const metadata: Metadata = {
  title: "Marketing Plan | LifeCharter Command Suite",
  description: "Your living marketing plan — built from your assessments with AI.",
};

export default function MarketingPlanPage() {
  return <PlanWorkspace planType="marketing" />;
}
