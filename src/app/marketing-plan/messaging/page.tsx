"use client";

import { MessageSquare } from "lucide-react";
import { GuidedQuestionnaire } from "@/components/marketing/GuidedQuestionnaire";

export default function MessagingPage() {
  return (
    <GuidedQuestionnaire
      page="messaging"
      subtitle="Taglines, talking points, and your brand story"
      icon={<MessageSquare className="w-6 h-6 text-[#c9a227]" />}
      iconBg="bg-[#c9a227]/20"
      completeTitle="Core Messaging Complete!"
      completeText="Your brand voice and key messages are now defined."
      saveLabel="Save Messaging"
    />
  );
}
