import { Metadata } from "next";
import ProgressView from "@/components/progress/ProgressView";

export const metadata: Metadata = {
  title: "Progress | LifeCharter Architecture",
  description: "Your trajectory since baseline — score movement per dimension and plan execution.",
};

export default function ProgressPage() {
  return <ProgressView />;
}
