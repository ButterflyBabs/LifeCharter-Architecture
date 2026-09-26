"use client";

import { Target } from "lucide-react";
import { GuidedQuestionnaire } from "@/components/marketing/GuidedQuestionnaire";

export default function PositioningPage() {
  return (
    <GuidedQuestionnaire
      page="positioning"
      subtitle="Define what makes you different and why clients choose you"
      icon={<Target className="w-6 h-6 text-[#7b6b8d]" />}
      iconBg="bg-[#7b6b8d]/20"
      completeTitle="Positioning Complete!"
      completeText="Your unique value proposition is now defined. Here’s what we captured:"
      saveLabel="Save Positioning"
      showRunningSummary
    />
  );
}
