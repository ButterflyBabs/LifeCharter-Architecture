import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";
import { COMMAND_SHIFT_DAYS } from "@/lib/commandShiftDays";
import { COMMAND_SHIFT_OUTPUTS } from "@/lib/commandShift";

export const metadata: Metadata = { title: "Command Shift participant" };
export const dynamic = "force-dynamic";

const ENTRY_LABEL: Record<string, string> = { reflection: "Reflection", evening: "Evening reflection", command_move: "Command move" };

// Owner-only: everything one participant has written in The Command Shift, day by day.
export default async function ChallengeParticipantPage({ params }: { params: { id: string } }) {
  if (!(await isSuperAdmin())) notFound();
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const supabase = createServerClient();
  const [{ data: person }, { data: progress }, { data: journal }, { data: outputs }] = await Promise.all([
    supabase.from("cs_participants").select("first_name, last_name, email, phone, start_date, timezone, created_at").eq("user_id", params.id).maybeSingle(),
    supabase.from("cs_day_progress").select("day_number, completed_at").eq("user_id", params.id),
    supabase.from("cs_journal_entries").select("day_number, entry_type, content, updated_at").eq("user_id", params.id),
    supabase.from("cs_outputs").select("key, value_text, value_json, day_number, updated_at").eq("user_id", params.id),
  ]);
  if (!person) notFound();

  const completed = new Map(((progress ?? []) as { day_number: number; completed_at: string | null }[]).map((p) => [p.day_number, p.completed_at]));
  const entries = (journal ?? []) as { day_number: number; entry_type: string; content: string; updated_at: string }[];
  const outs = (outputs ?? []) as { key: string; value_text: string | null; value_json: unknown; day_number: number | null }[];
  const outText = (o: (typeof outs)[number]) =>
    o.value_text?.trim() ||
    (o.value_json && typeof o.value_json === "object" ? Object.values(o.value_json as Record<string, unknown>).map((v) => (Array.isArray(v) ? v.join(", ") : String(v ?? ""))).filter(Boolean).join(" · ") : "");

  const name = [person.first_name, person.last_name].filter(Boolean).join(" ") || person.email || "Participant";
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  const promptFor = (d: (typeof COMMAND_SHIFT_DAYS)[number], type: string) => (type === "reflection" ? d.reflection : type === "evening" ? d.evening : d.commandMove);

  const days = COMMAND_SHIFT_DAYS.filter((d) => completed.has(d.n) || entries.some((e) => e.day_number === d.n) || outs.some((o) => o.day_number === d.n));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <Link href="/challenge-participants" className="text-sm text-[#2E7C83] hover:underline">← All participants</Link>
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Command Shift participant · private</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{name}</h1>
        <p className="mt-1 text-sm text-[#5b5f73] dark:text-[#b8a898]">
          {[person.email, person.phone, person.start_date ? `started ${fmt(person.start_date)}` : null].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-2 text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
          {Array.from(completed.values()).filter(Boolean).length} of 21 days completed
        </p>
      </header>

      {days.length === 0 ? (
        <p className="text-[#5b5f73] dark:text-[#b8a898]">Nothing written yet.</p>
      ) : (
        days.map((d) => {
          const dayEntries = entries.filter((e) => e.day_number === d.n && e.content?.trim());
          const dayOuts = outs.filter((o) => o.day_number === d.n && outText(o));
          const done = completed.get(d.n);
          return (
            <section key={d.n} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Day {d.n} · {d.focus}</h2>
                <span className={`text-xs font-semibold ${done ? "text-[#2f7d55]" : "text-[#7b6b8d]"}`}>{done ? `Completed ${fmt(done)}` : "Not marked complete"}</span>
              </div>
              {dayOuts.map((o) => (
                <div key={o.key} className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#c9a227]">{COMMAND_SHIFT_OUTPUTS.find((x) => x.key === o.key)?.label ?? o.key}</p>
                  <p className="mt-1 whitespace-pre-wrap text-[15px] text-[#1a2b4a] dark:text-[#F8F5F0]">{outText(o)}</p>
                </div>
              ))}
              {dayEntries.map((e) => (
                <div key={e.entry_type} className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d]">{ENTRY_LABEL[e.entry_type] ?? e.entry_type}</p>
                  <p className="text-xs italic text-[#7b6b8d]">{promptFor(d, e.entry_type)}</p>
                  <p className="mt-1 whitespace-pre-wrap text-[15px] text-[#1a2b4a] dark:text-[#F8F5F0]">{e.content}</p>
                </div>
              ))}
              {!dayOuts.length && !dayEntries.length && <p className="mt-2 text-sm text-[#7b6b8d]">No writing saved for this day.</p>}
            </section>
          );
        })
      )}
    </div>
  );
}
