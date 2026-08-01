import { Metadata } from "next";
import PlanView from "@/components/plans/PlanView";

export const metadata: Metadata = {
  title: "Sales Plan | LifeCharter Architecture",
  description: "Your AI-generated, living sales plan — built from your assessments.",
};

export default function SalesPlanPage() {
  return <PlanView planType="sales" />;
}
