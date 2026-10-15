"use client";

import AssistantActionCards from "@/components/assistant/ActionCards";
import { askAssistant } from "@/lib/assistantPopout";

// Everything the assistant has prepared and is waiting on you for, in one place with Approve, Edit and Cancel.
// This is the link the assistant gives when something needs your go-ahead.
export default function AssistantApprovalsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#c9a227]">Your assistant</p>
      <h1 className="font-serif text-3xl text-[#1a2b4a] dark:text-[#F8F5F0]">Waiting for your approval</h1>
      <p className="mt-1 text-sm text-[#5d6b7a] dark:text-[#b8c2cf]">
        Nothing your assistant prepares happens until you press Approve here. Edit lets you say what to change, and it prepares a corrected one. Cancel throws it away.
      </p>
      <div className="mt-5">
        <AssistantActionCards
          fresh={[]}
          hideLink
          emptyNote="Nothing is waiting for you right now."
          onRevise={async (card, instruction) => {
            askAssistant(
              `Please change what you prepared for me: "${card.title}". What to change: ${instruction}\n\nThe details you had prepared (JSON, for your reference): ${JSON.stringify(card.args ?? {}).slice(0, 8000)}\n\nThat earlier preview has been cancelled and nothing was created, so do not look for it or update anything in my account. Call the ${card.tool} tool again now with the full corrected details to prepare a NEW preview for my approval.`,
              `Change "${card.title}": ${instruction}`
            );
          }}
        />
      </div>
    </div>
  );
}
