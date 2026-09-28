import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Command Shift participants" };
export const dynamic = "force-dynamic";

type Participant = { user_id: string; first_name: string | null; last_name: string | null; email: string | null; start_date: string | null; created_at: string };

// Owner-only: every Command Shift (21-Day Challenge) participant, with progress, so Babs can coach
// them. Babs decided 2026-09-27 to see ALL of their entries (open a participant for the detail).
export default async function ChallengeParticipantsPage() {
  if (!(await isAlignmentArchitect())) notFound();
  const supabase = createServerClient();
  const [{ data: people }, { data: progress }, { data: journal }, { data: outputs }] = await Promise.all([
    supabase.from("cs_participants").select("user_id, first_name, last_name, email, start_date, created_at").order("created_at", { ascending: false }),
    supabase.from("cs_day_progress").select("user_id, day_number, completed_at, updated_at"),
    supabase.from("cs_journal_entries").select("user_id, updated_at"),
    supabase.from("cs_outputs").select("user_id, updated_at"),
  ]);

  const stats = new Map<string, { done: number; entries: number; last: string | null }>();
  const bump = (id: string, at: string | null) => {
    const s = stats.get(id) ?? { done: 0, entries: 0, last: null };
    if (at && (!s.last || at > s.last)) s.last = at;
    stats.set(id, s);
    return s;
  };
  for (const p of (progress ?? []) as { user_id: string; completed_at: string | null; updated_at: string | null }[]) {
    const s = bump(p.user_id, p.updated_at);
    if (p.completed_at) s.done += 1;
  }
  for (const j of [...((journal ?? []) as { user_id: string; updated_at: string }[]), ...((outputs ?? []) as { user_id: string; updated_at: string }[])]) {
    bump(j.user_id, j.updated_at).entries += 1;
  }

  const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");
  const list = (people ?? []) as Participant[];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Private · only you can see this</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Command Shift participants</h1>
        <p className="mt-2 text-[15px] text-[#5b5f73] dark:text-[#b8a898]">Everyone in the 21-Day Challenge, newest first. Open a participant to read everything they&rsquo;ve written.</p>
      </header>
      {list.length === 0 ? (
        <p className="text-[#5b5f73] dark:text-[#b8a898]">No participants yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#1a2b4a]/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
          <table className="w-full min-w-[640px] text-left text-sm tabular-nums">
            <thead className="text-[11px] uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898]">
              <tr>
                <th className="px-4 py-3">Participant</th>
                <th className="pr-4">Started</th>
                <th className="pr-4">Days completed</th>
                <th className="pr-4">Entries</th>
                <th className="pr-4">Last active</th>
              </tr>
            </thead>
            <tbody className="text-[#1a2b4a] dark:text-[#F8F5F0]">
              {list.map((p) => {
                const s = stats.get(p.user_id);
                const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "Participant";
                return (
                  <tr key={p.user_id} className="border-t border-[#1a2b4a]/10 dark:border-white/10">
                    <td className="px-4 py-3">
                      <Link href={`/challenge-participants/${p.user_id}`} className="font-medium text-[#2E7C83] hover:underline">{name}</Link>
                      {p.email && name !== p.email && <div className="text-xs text-[#7b6b8d]">{p.email}</div>}
                    </td>
                    <td className="pr-4">{day(p.start_date || p.created_at)}</td>
                    <td className="pr-4">{s?.done ?? 0} of 21</td>
                    <td className="pr-4">{s?.entries ?? 0}</td>
                    <td className="pr-4">{day(s?.last ?? null)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
