"use client";

// Report a post, comment, message or profile. Admins see it in Admin → Reports
// and are notified right away; the member can also block the person here.
import { useState } from "react";
import { Flag } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { Button, ErrorNote, Label, Modal, TextArea } from "./ui";

export type ReportTarget = { type: "post" | "comment" | "message" | "profile"; id: string; userId: string; userName?: string | null };

const REASONS = [
  "Harassment or bullying",
  "Hate or discrimination",
  "Spam, scam or unwanted selling",
  "Sexual or explicit content",
  "Violence or threats",
  "Someone may be at risk of self-harm",
  "False or misleading information",
  "Something else",
];

const NOUN = { post: "post", comment: "reply", message: "message", profile: "profile" } as const;

export function ReportDialog({ target, onClose }: { target: ReportTarget; onClose: () => void }) {
  const { supabase, userId, blockedIds, block } = useCommunity();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [blocked, setBlocked] = useState(blockedIds.has(target.userId));

  async function submit() {
    if (!reason) return setError("Choose what's wrong.");
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("cm_reports")
      .insert({ reporter_id: userId, target_type: target.type, target_id: target.id, reason, details: details.trim() || null });
    setBusy(false);
    if (error) return setError("We couldn't send that report — please try again.");
    setDone(true);
  }

  return (
    <Modal open onClose={onClose} title={done ? "Thank you for telling us" : `Report this ${NOUN[target.type]}`}>
      {done ? (
        <div className="space-y-3 text-[14.5px] text-[var(--cm-body)]">
          <p>An admin will review it within 24 hours. The person you reported isn&rsquo;t told who reported them.</p>
          {reason.startsWith("Someone may be at risk") && (
            <p className="rounded-xl bg-[var(--cm-gold-soft)] px-3 py-2 text-[13.5px] text-[var(--cm-gold-ink)]">
              If someone is in immediate danger, call your local emergency number. In the US you can call or text 988 to reach the Suicide &amp; Crisis Lifeline.
            </p>
          )}
          {target.userId !== userId && !blocked && (
            <div className="rounded-xl border border-[var(--cm-line)] p-3">
              <p className="text-[13.5px]">You can also block {target.userName || "this person"} so you no longer see each other&rsquo;s posts or messages.</p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={async () => {
                  await block(target.userId);
                  setBlocked(true);
                }}
              >
                Block {target.userName || "them"}
              </Button>
            </div>
          )}
          {blocked && <p className="text-[13px] text-[var(--cm-muted-2)]">Blocked.</p>}
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div role="radiogroup" aria-label="What's wrong?" className="space-y-1.5">
            {REASONS.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--cm-line)] px-3 py-2.5 text-[14.5px] text-[var(--cm-ink)] hover:border-[#D4AF63]">
                <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
                {r}
              </label>
            ))}
          </div>
          <div>
            <Label htmlFor="report-details">Anything else we should know? (optional)</Label>
            <TextArea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} className="min-h-[70px]" maxLength={1000} />
          </div>
          <ErrorNote>{error}</ErrorNote>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submit} disabled={busy}>
              <Flag className="h-4 w-4" /> {busy ? "Sending…" : "Send report"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
