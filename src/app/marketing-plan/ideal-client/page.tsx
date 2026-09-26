"use client";

import { Users } from "lucide-react";
import { GuidedQuestionnaire } from "@/components/marketing/GuidedQuestionnaire";

export default function IdealClientPage() {
  return (
    <GuidedQuestionnaire
      page="ideal-client"
      subtitle="Deep understanding of who you serve and their pain points"
      icon={<Users className="w-6 h-6 text-[#4a9b9b]" />}
      iconBg="bg-[#4a9b9b]/20"
      completeTitle="Ideal Client Profile Complete!"
      completeText="You now have a deep understanding of who you serve."
      saveLabel="Save Profile"
    />
  );
}
