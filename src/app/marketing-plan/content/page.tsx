"use client";

import { FileText } from "lucide-react";
import { GuidedQuestionnaire } from "@/components/marketing/GuidedQuestionnaire";

export default function ContentPage() {
  return (
    <GuidedQuestionnaire
      page="content"
      subtitle="What you’ll create and your content pillars"
      icon={<FileText className="w-6 h-6 text-[#4a9b9b]" />}
      iconBg="bg-[#4a9b9b]/20"
      completeTitle="Content Strategy Complete!"
      completeText="Your content pillars and creation plan are now defined."
      saveLabel="Save Strategy"
    />
  );
}
