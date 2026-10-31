"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// A team member's last day of access, for a contractor, advisor or anyone who should only be in for a while. After that
// day their login stops working everywhere; the owner can choose a new day to turn it back on, or remove the end date.

const today = () => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
export const prettyDay = (ymd: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${ymd}T12:00:00Z`));
const daysFromToday = (ymd: string) => Math.round((new Date(`${ymd}T12:00:00Z`).getTime() - new Date(`${today()}T12:00:00Z`).getTime()) / 86_400_000);

interface Props {
  endsOn: string | null;
  ended: boolean;
  busy: boolean;
  onSave: (day: string | null) => void;
}

export default function MemberAccessEnd({ endsOn, ended, busy, onSave }: Props) {
  const [day, setDay] = useState(endsOn ?? "");
  const left = endsOn ? daysFromToday(endsOn) : null;
  const status = !endsOn
    ? "No end date. Their access continues until you remove them."
    : ended
      ? `Their access ended after ${prettyDay(endsOn)}. They can no longer sign in. Choose a new last day to turn it back on.`
      : left === 0
        ? `Their last day is today (${prettyDay(endsOn)}).`
        : `Their last day is ${prettyDay(endsOn)} (${left} day${left === 1 ? "" : "s"} from now). After that, their login stops working.`;
  return (
    <div className={`mt-3 rounded-lg border p-3 ${ended ? "border-red-500/30 bg-red-500/5" : "border-[#1a2b4a]/10 bg-[#F8F5F0]/60 dark:bg-white/5"}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
        <CalendarClock className="h-4 w-4 text-[#c9a227]" aria-hidden />
        Access ends
      </div>
      <p className="mt-1 text-xs text-[#5c5348] dark:text-[#b8c2cf]">{status}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Input type="date" aria-label="Last day of access" min={today()} value={day} onChange={(e) => setDay(e.target.value)} className="h-8 w-44 py-1" />
        <Button size="sm" variant="outline" disabled={busy || !day || day === endsOn} onClick={() => onSave(day)}>
          {endsOn ? "Change last day" : "Set last day"}
        </Button>
        {endsOn && (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setDay("");
              onSave(null);
            }}
          >
            No end date
          </Button>
        )}
      </div>
    </div>
  );
}
