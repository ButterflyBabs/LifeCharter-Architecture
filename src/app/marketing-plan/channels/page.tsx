"use client";

import { TrendingUp } from "lucide-react";
import { GuidedQuestionnaire } from "@/components/marketing/GuidedQuestionnaire";

export default function ChannelsPage() {
  return (
    <GuidedQuestionnaire
      page="channels"
      subtitle="Where you’ll show up and how often"
      icon={<TrendingUp className="w-6 h-6 text-[#1a2b4a]" />}
      iconBg="bg-[#1a2b4a]/20"
      completeTitle="Channel Strategy Complete!"
      completeText="Your channel strategy and content plan are now defined."
      saveLabel="Save Strategy"
    />
  );
}
