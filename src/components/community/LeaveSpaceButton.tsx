"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCommunity } from "@/lib/community/context";
import { Button } from "./ui";

// "Leave channel" for members of a non-default channel. Asks once, inline (no browser dialog),
// then removes their membership (the cm_space_members_leave policy allows a member to delete
// their own row) and sends them back to Community home.
export function LeaveSpaceButton({ spaceId, name, isPrivate }: { spaceId: string; name: string; isPrivate: boolean }) {
  const { supabase, userId, refresh } = useCommunity();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[13px] font-semibold text-[var(--cm-muted)] underline-offset-2 hover:text-[var(--cm-ink)] hover:underline"
      >
        Leave channel
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--cm-line)] bg-[var(--cm-fill-2)] p-3 text-[14px] text-[var(--cm-ink)] sm:flex-row sm:items-center">
      <p className="flex-1">
        Leave <strong>{name}</strong>? You&rsquo;ll stop getting its updates.
        {isPrivate && " To come back later you'll need its invite code again."}
      </p>
      <div className="flex gap-2">
        <Button variant="gold" size="sm" disabled={busy} onClick={() => { setConfirming(false); setError(""); }}>
          Stay
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={busy || !userId}
          onClick={async () => {
            setBusy(true);
            setError("");
            const { error: err } = await supabase.from("cm_space_members").delete().match({ space_id: spaceId, user_id: userId });
            if (err) {
              setError("That didn't work. Please try again, or message an admin.");
              setBusy(false);
              return;
            }
            await refresh();
            router.push("/community");
          }}
        >
          {busy ? "Leaving…" : "Leave"}
        </Button>
      </div>
      {error && <p className="text-[13px] text-[#B3392B]">{error}</p>}
    </div>
  );
}
