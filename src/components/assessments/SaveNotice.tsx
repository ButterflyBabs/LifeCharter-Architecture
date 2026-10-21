"use client";

import type { AssessmentSyncState } from "@/lib/hooks/useAssessmentSync";

// The small status words next to the save icon on every assessment page. The account's confirmation is what counts:
// "Saved on this device" alone means the answers have not reached the account yet.
export function saveLabel(sync: AssessmentSyncState, savingOnDevice: boolean, savedOnDevice: boolean): string {
  if (sync.status === "error") return "Not saved to your account yet";
  if (sync.status === "saving" || savingOnDevice) return "Saving...";
  if (sync.status === "saved") return "Saved to your account";
  return savedOnDevice ? "Saved on this device" : "Not saved";
}

// Shown only when a save to the account has failed. Plain words, and what to do.
export function SaveNotice({ sync }: { sync: AssessmentSyncState }) {
  if (sync.status !== "error") return null;
  return (
    <div role="alert" className="mt-2 rounded-lg border border-[#C76F56]/50 bg-[#C76F56]/10 px-3 py-2 text-sm text-[#8f3b24] dark:text-[#f2b3a1]">
      We couldn&rsquo;t save your latest answers to your account{sync.unsaved ? ` (${sync.unsaved} not saved yet)` : ""}. They are still on this device, so keep this page open and we&rsquo;ll keep trying.
      {sync.failures >= 3 ? " If this stays, sign out and sign back in, then come back here, and tell your coach if it still does not clear." : " Please check your internet connection."}
    </div>
  );
}
