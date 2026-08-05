import { Metadata } from "next";
import ProgressView from "@/components/progress/ProgressView";

export const metadata: Metadata = {
  title: "Progress | LifeCharter Command Suite",
  description: "Your trajectory since baseline — score movement per dimension and plan execution.",
};

export default function ProgressPage() {
  return <ProgressView />;
}
