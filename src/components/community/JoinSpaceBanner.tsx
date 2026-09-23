"use client";

import { useState } from "react";
import { useCommunity } from "@/lib/community/context";
import { Button, Card } from "./ui";

// Shown on public spaces the member hasn't joined yet — reading is open, posting needs a join.
export function JoinSpaceBanner({ spaceId, name }: { spaceId: string; name: string }) {
  const { supabase, refresh } = useCommunity();
  const [busy, setBusy] = useState(false);
  return (
    <Card className="mb-4 flex flex-col items-start justify-between gap-3 bg-[var(--cm-gold-soft)] p-4 sm:flex-row sm:items-center">
      <p className="text-[14.5px] text-[var(--cm-ink)]">
        You&rsquo;re viewing <strong>{name}</strong>. Join to post and get updates.
      </p>
      <Button
        variant="gold"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await supabase.rpc("cm_join_public_space", { p_space: spaceId });
          await refresh();
          setBusy(false);
        }}
      >
        {busy ? "Joining…" : "Join channel"}
      </Button>
    </Card>
  );
}
