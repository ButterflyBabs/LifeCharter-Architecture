import { Metadata } from "next";
import PlanView from "@/components/plans/PlanView";

export const metadata: Metadata = {
  title: "Business Plan | LifeCharter Architecture",
  description: "Your AI-generated, living business plan — built from your Brain, Soul, and Profit assessments.",
};

export default function BusinessPlanPage() {
  return <PlanView planType="business" />;
}
