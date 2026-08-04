import { Metadata } from "next";
import PlanWorkspace from "@/components/plans/PlanWorkspace";

export const metadata: Metadata = {
  title: "Business Plan | LifeCharter Architecture",
  description: "Your living business plan — built from your Brain, Soul, and Profit assessments with AI.",
};

export default function BusinessPlanPage() {
  return <PlanWorkspace planType="business" />;
}
