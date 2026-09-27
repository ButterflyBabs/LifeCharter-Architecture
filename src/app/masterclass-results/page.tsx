import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/authz";
import { FIRST_YEAR_VALUE, masterclassResults, type SessionRow } from "@/lib/masterclass/results";

export const metadata: Metadata = { title: "MasterClass results" };
export const dynamic = "force-dynamic";

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n * 100)}%`);
const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const clientsLine = (c: SessionRow["newClients"]) => {
  const parts = [c.starter && `${c.starter} Starter`, c.growth && `${c.growth} Growth`, c.vip && `${c.vip} VIP`].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
};

// Owner-only: how each weekly MasterClass performs, and whether the series is compounding.
export default async function MasterclassResultsPage() {
  if (!(await isSuperAdmin())) notFound();
  const { sessions, totals } = await masterclassResults();
  const newClientCount = totals.newClients.starter + totals.newClients.growth + totals.newClients.vip;

  const tiles = [
    { label: "Sessions held", value: String(totals.sessions) },
    { label: "Registrations", value: String(totals.newRegistrations) },
    { label: "Show rate", value: pct(totals.showRate) },
    { label: "Consultation requests", value: String(totals.consultRequests) },
    { label: "New clients", value: String(newClientCount) },
    { label: "First-year revenue", value: usd(totals.firstYearRevenue) },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Private · only you can see this</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">MasterClass results</h1>
        <p className="mt-2 max-w-3xl text-[15px] text-[#5b5f73] dark:text-[#b8a898]">
          Every Thursday session from September 24. Bookings and sales are credited to the most recent session within 7 days. First-year revenue uses implementation plus 12 months: Starter {usd(FIRST_YEAR_VALUE.starter)}, Growth {usd(FIRST_YEAR_VALUE.growth)}, VIP {usd(FIRST_YEAR_VALUE.vip)}.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
            <p className="text-2xl font-semibold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{t.value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898]">{t.label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
        <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">By session</h2>
        {sessions.length === 0 ? (
          <p className="mt-3 text-[#5b5f73] dark:text-[#b8a898]">No sessions yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm tabular-nums">
              <thead className="text-[11px] uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898]">
                <tr>
                  <th className="py-2 pr-4">Session</th>
                  <th className="pr-4">New registrations</th>
                  <th className="pr-4">Attended</th>
                  <th className="pr-4">Show rate</th>
                  <th className="pr-4">Consultation requests</th>
                  <th className="pr-4">New clients</th>
                  <th>First-year revenue</th>
                </tr>
              </thead>
              <tbody className="text-[#1a2b4a] dark:text-[#F8F5F0]">
                {[...sessions].reverse().map((s) => (
                  <tr key={s.date} className="border-t border-[#1a2b4a]/10 dark:border-white/10">
                    <td className="py-2 pr-4 font-medium">{day(s.date)}</td>
                    <td className="pr-4">{s.newRegistrations}</td>
                    <td className="pr-4">{s.attended}{s.attended > s.attendedNew ? <span className="text-[#7b6b8d]"> ({s.attended - s.attendedNew} returning)</span> : null}</td>
                    <td className="pr-4">{pct(s.showRate)}</td>
                    <td className="pr-4">{s.consultRequests}</td>
                    <td className="pr-4">{clientsLine(s.newClients)}</td>
                    <td>{s.firstYearRevenue ? usd(s.firstYearRevenue) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {sessions.some((s) => s.noShows.length > 0) && (
          <div className="mt-6 space-y-2">
            <h3 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Registered but didn&rsquo;t come</h3>
            {[...sessions].reverse().filter((s) => s.noShows.length > 0).map((s) => (
              <details key={s.date} className="rounded-xl border border-[#1a2b4a]/10 px-4 py-2 dark:border-white/10">
                <summary className="cursor-pointer text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{day(s.date)} · {s.noShows.length} {s.noShows.length === 1 ? "person" : "people"}</summary>
                <p className="mt-2 select-all break-words text-sm text-[#5b5f73] dark:text-[#b8a898]">{s.noShows.join(", ")}</p>
              </details>
            ))}
          </div>
        )}
        <p className="mt-4 text-[12.5px] text-[#7b6b8d] dark:text-[#b8a898]">
          Show rate = people who registered for that session and attended it. &ldquo;Returning&rdquo; = attendees who registered for an earlier session. Attendance fills in the morning after each session.
        </p>
      </section>
    </div>
  );
}
