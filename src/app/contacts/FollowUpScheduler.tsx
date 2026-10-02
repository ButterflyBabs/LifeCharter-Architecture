"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const box = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 py-2 text-sm";
const heading = "text-xs font-semibold uppercase tracking-wide text-[#7a8a99] mb-2";
const localDay = (addDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + addDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Schedules a follow-up with this contact as a task (it shows in Tasks and Daily
// Compass on its day). Optionally the AI assistant drafts the email; the draft
// travels with the task, ready to review and send from Daily Compass.
export default function FollowUpScheduler({ contact, setMsg }: { contact: { id: string; name: string; email: string | null }; setMsg: (m: string) => void }) {
  const [day, setDay] = useState(localDay(2));
  const [purpose, setPurpose] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState<"" | "draft" | "save">("");
  const [note, setNote] = useState("");

  const draft = async () => {
    setBusy("draft");
    setNote("");
    try {
      const me = await fetch("/api/profile", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      const r = await fetch("/api/followups/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactName: contact.name, guidance: purpose, senderName: me?.firstName || "" }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.needsKey) setNote("Add your AI key in Settings → AI Assistant to have emails drafted for you. You can still write it yourself below.");
      else if (!r.ok || !d.body) setNote(d.error || "Couldn't draft the email just now. You can write it yourself below.");
      else {
        setSubject(d.subject || "");
        setBody(d.body);
      }
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    setBusy("save");
    setNote("");
    try {
      const hasDraft = Boolean(body.trim());
      const r = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Follow up with ${contact.name}`,
          description: purpose.trim() || null,
          status: day <= localDay() ? "today" : "backlog",
          dueDay: day,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          followup: {
            channel: hasDraft ? "email" : "task",
            contactId: contact.id,
            contactName: contact.name,
            contactEmail: contact.email || "",
            ...(hasDraft ? { aiMode: "draft", aiSubject: subject.trim() || `Following up, ${contact.name}`, aiBody: body.trim() } : {}),
          },
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return setNote(d.error || "That didn't save. Please try again.");
      setMsg(hasDraft ? "Follow-up scheduled. The draft will be waiting in Daily Compass on that day." : "Follow-up scheduled. It's in your Tasks.");
      setPurpose("");
      setSubject("");
      setBody("");
    } finally {
      setBusy("");
    }
  };

  return (
    <div>
      <p className={heading}>Schedule a follow-up</p>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm" htmlFor={`fu-day-${contact.id}`}>On</label>
          <Input id={`fu-day-${contact.id}`} type="date" value={day} min={localDay()} onChange={(e) => setDay(e.target.value)} className="w-auto" />
        </div>
        <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={2} placeholder="What's it about? (for example: check in after the proposal)" className={box} aria-label="What the follow-up is about" />
        {(subject || body) && (
          <div className="space-y-2 rounded-lg border border-[#2E7C83]/30 bg-[#2E7C83]/5 p-3">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" aria-label="Email subject" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} className={box} aria-label="Email draft" />
            <p className="text-xs text-[#7a8a99]">Edit it however you like. Nothing is sent until you press Send in Daily Compass.{contact.email ? "" : " This contact has no email yet; add one before sending."}</p>
          </div>
        )}
        {note && <p role="status" className="text-sm text-[#C76F56]">{note}</p>}
        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={busy !== "" || !day}>{busy === "save" ? "Saving…" : "Schedule follow-up"}</Button>
          <Button variant="outline" onClick={draft} disabled={busy !== ""}>
            <Sparkles className="w-4 h-4 mr-1" /> {busy === "draft" ? "Drafting…" : body ? "Draft again" : "Draft the email with AI"}
          </Button>
        </div>
      </div>
    </div>
  );
}
