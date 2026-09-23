"use client";

// The 90-day focus (Collective Plus): one bigger goal that weekly intentions
// roll up into. Shown at the top of the journal.
import { useState } from "react";
import { Target } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { isoDate, parseDate, type JournalEntry, type JournalFocus } from "@/lib/community/journal";
import { Button, Card, ErrorNote, Input, Label, Modal, TextArea } from "./ui";
import { PlusInvite } from "./JournalAssist";

export function FocusCard({
  focus,
  entries,
  hasAccess,
  onChanged,
}: {
  focus: JournalFocus | null;
  entries: JournalEntry[];
  hasAccess: boolean;
  onChanged: () => void;
}) {
  const { supabase } = useCommunity();
  const [editing, setEditing] = useState(false);

  if (!hasAccess) return <PlusInvite title="Your 90-day focus" what="Name one bigger goal and let your weekly intentions roll up into it." />;

  if (!focus) {
    return (
      <>
        <Card className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-1.5 font-semibold text-[var(--cm-ink)]">
              <Target className="h-4 w-4 text-[var(--cm-gold-text)]" /> Your 90-day focus
            </p>
            <p className="text-[13px] text-[var(--cm-muted-2)]">Name one bigger goal for the next 90 days. Your weekly intentions will roll up into it.</p>
          </div>
          <Button variant="gold" size="sm" onClick={() => setEditing(true)}>
            Set my focus
          </Button>
        </Card>
        {editing && <FocusEditor onClose={() => setEditing(false)} onSaved={onChanged} />}
      </>
    );
  }

  const start = parseDate(focus.starts_on).getTime();
  const end = parseDate(focus.ends_on).getTime();
  const now = Date.now();
  const pct = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
  const tied = entries.filter((e) => e.focus_id === focus.id);
  const weeks = new Set(tied.filter((e) => e.kind === "intention").map((e) => e.week_start)).size;
  const wins = tied.filter((e) => e.kind === "win").length;

  async function setStatus(status: "done" | "released") {
    await supabase.from("cm_journal_focus").update({ status, updated_at: new Date().toISOString() }).eq("id", focus!.id);
    onChanged();
  }

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cm-gold-text)]">
            <Target className="mr-1 inline h-3.5 w-3.5" /> 90-day focus · {daysLeft} {daysLeft === 1 ? "day" : "days"} left
          </p>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {daysLeft === 0 ? (
              <Button size="sm" variant="gold" onClick={() => setStatus("done")}>
                Close it out
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setStatus("done")}>
                Achieved
              </Button>
            )}
          </div>
        </div>
        <p className="mt-1 font-display text-[22px] font-semibold text-[var(--cm-ink)]">{focus.title}</p>
        {focus.why && <p className="text-[14px] text-[var(--cm-muted-2)]">{focus.why}</p>}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--cm-fill)]">
          <div className="h-full rounded-full bg-[#D4AF63]" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-[12.5px] text-[var(--cm-muted)]">
          {weeks} {weeks === 1 ? "week" : "weeks"} of intentions toward it · {wins} {wins === 1 ? "win" : "wins"} ·{" "}
          <button className="underline" onClick={() => setStatus("released")}>
            let it go
          </button>
        </p>
      </Card>
      {editing && <FocusEditor focus={focus} onClose={() => setEditing(false)} onSaved={onChanged} />}
    </>
  );
}

function FocusEditor({ focus, onClose, onSaved }: { focus?: JournalFocus; onClose: () => void; onSaved: () => void }) {
  const { supabase, userId } = useCommunity();
  const today = isoDate(new Date());
  const [f, setF] = useState({ title: focus?.title ?? "", why: focus?.why ?? "", starts_on: focus?.starts_on ?? today });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!userId) return;
    if (!f.title.trim()) return setError("Name your focus — one line is plenty.");
    setBusy(true);
    const start = parseDate(f.starts_on);
    const end = new Date(start);
    end.setDate(end.getDate() + 90);
    const row = { title: f.title.trim(), why: f.why.trim() || null, starts_on: f.starts_on, ends_on: isoDate(end), updated_at: new Date().toISOString() };
    const { error } = focus
      ? await supabase.from("cm_journal_focus").update(row).eq("id", focus.id)
      : await supabase.from("cm_journal_focus").insert({ ...row, user_id: userId, status: "active" });
    setBusy(false);
    if (error) return setError(error.message);
    onSaved();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={focus ? "Edit your 90-day focus" : "Your 90-day focus"}>
      <div className="space-y-3">
        <div>
          <Label htmlFor="f-title">What will be true in 90 days?</Label>
          <Input id="f-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. My coaching practice is fully booked" maxLength={140} autoFocus />
        </div>
        <div>
          <Label htmlFor="f-why">Why it matters to you (private)</Label>
          <TextArea id="f-why" value={f.why} onChange={(e) => setF({ ...f, why: e.target.value })} className="min-h-[80px]" />
        </div>
        <div>
          <Label htmlFor="f-start">Starting</Label>
          <Input id="f-start" type="date" value={f.starts_on} onChange={(e) => setF({ ...f, starts_on: e.target.value })} />
        </div>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gold" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save focus"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
