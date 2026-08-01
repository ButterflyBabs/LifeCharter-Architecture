import { Metadata } from "next";
import PlanView from "@/components/plans/PlanView";

export const metadata: Metadata = {
  title: "Marketing Plan | LifeCharter Architecture",
  description: "Your AI-generated, living marketing plan — built from your assessments.",
};

export default function MarketingPlanPage() {
  return <PlanView planType="marketing" />;
}
