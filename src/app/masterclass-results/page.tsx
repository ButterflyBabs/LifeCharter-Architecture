import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import { ADS_START, FIRST_YEAR_VALUE, REGISTRATION_GOAL, masterclassResults, type SessionRow } from "@/lib/masterclass/results";
import ReplayRelease from "./ReplayRelease";

export const metadata: Metadata = { title: "MasterClass results" };
export const dynamic = "force-dynamic";

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n * 100)}%`);
const ratio = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");
const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const longDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const clientsLine = (c: SessionRow["newClients"]) => {
  const parts = [c.starter && `${c.starter} Starter`, c.growth && `${c.growth} Growth`, c.vip && `${c.vip} VIP`].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
};
const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40";
const ink = "text-[#1a2b4a] dark:text-[#F8F5F0]";
const faint = "text-[#5b5f73] dark:text-[#b8a898]";
const label = "text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898]";

function Step({ name, value, from, cost, note }: { name: string; value: number; from: number | null; cost: number | null; note?: string }) {
  return (
    <li className="flex items-baseline gap-3 py-1.5">
      <span className={`w-40 shrink-0 text-sm ${faint}`}>{name}</span>
      <span className={`w-12 shrink-0 text-right text-lg font-semibold tabular-nums ${ink}`}>{value}</span>
      <span className={`flex-1 text-xs tabular-nums ${faint}`}>
        {from !== null ? `${ratio(value, from)} of the step before` : note || ""}
        {cost !== null ? ` · ${usd2(cost)} each` : ""}
      </span>
    </li>
  );
}

// Owner-only: how each MasterClass performs as a funnel, and whether the series is compounding event to event.
export default async function MasterclassResultsPage() {
  if (!(await isAlignmentArchitect())) notFound();
  const { sessions, totals } = await masterclassResults();
  const filling = sessions.filter((s) => s.state !== "held");
  const heldRows = sessions.filter((s) => s.state === "held");
  const newClientCount = totals.newClients.starter + totals.newClients.growth + totals.newClients.vip;

  const tiles = [
    { label: "Sessions held", value: String(totals.sessions) },
    { label: "Registrations", value: String(totals.newRegistrations) },
    { label: "Show rate", value: pct(totals.showRate) },
    { label: "Consultations booked", value: String(totals.consultBooked) },
    { label: "Closes (new clients)", value: String(newClientCount) },
    { label: "Ad spend", value: totals.adSpend ? usd(totals.adSpend) : "—" },
    { label: "Cost per close", value: usd2(totals.costPerClose) },
    { label: "First-year revenue", value: usd(totals.firstYearRevenue) },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Private · only you can see this</p>
        <h1 className={`mt-2 text-3xl font-semibold ${ink}`}>MasterClass results</h1>
        <p className={`mt-2 max-w-3xl text-[15px] ${faint}`}>
          Every other Thursday from October 8. One funnel for each session, from the first click to the close, with the series totals underneath. Bookings and sales are credited to the most recent session for the two weeks until the next one.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40">
            <p className={`text-2xl font-semibold tabular-nums ${ink}`}>{t.value}</p>
            <p className={`mt-1 ${label}`}>{t.label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className={`text-xl font-semibold ${ink}`}>Filling now</h2>
        <p className={`mt-1 text-sm ${faint}`}>New registrations for the next sessions, against your goal of {REGISTRATION_GOAL} each.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {filling.map((s) => {
            const pctDone = Math.min(100, Math.round((s.newRegistrations / s.goal) * 100));
            const need = Math.max(0, s.goal - s.newRegistrations);
            const perDay = s.daysToGo && s.daysToGo > 0 ? Math.ceil(need / s.daysToGo) : need;
            return (
              <div key={s.date} className={card}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className={`font-semibold ${ink}`}>{longDay(s.date)}</p>
                  <p className={`text-sm ${faint}`}>{s.daysToGo === 0 ? "Today" : `${s.daysToGo} days to go`}</p>
                </div>
                <p className={`mt-2 text-3xl font-semibold tabular-nums ${ink}`}>
                  {s.newRegistrations} <span className={`text-base font-medium ${faint}`}>of {s.goal} registered</span>
                </p>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#1a2b4a]/10" role="progressbar" aria-valuenow={s.newRegistrations} aria-valuemin={0} aria-valuemax={s.goal} aria-label={`Registrations for ${day(s.date)}`}>
                  <div className="h-full rounded-full bg-[#c9a227]" style={{ width: `${pctDone}%` }} />
                </div>
                <p className={`mt-2 text-sm ${faint}`}>
                  {need === 0 ? "Goal reached." : `${need} to go, about ${perDay} a day to get there.`} {s.clicks} link {s.clicks === 1 ? "click" : "clicks"} so far.
                  {s.adSpend > 0 ? ` Ad spend so far ${usd(s.adSpend)}${s.costPerRegistration ? `, ${usd2(s.costPerRegistration)} a registration` : ""}.` : ""}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <ReplayRelease />

      <section>
        <h2 className={`text-xl font-semibold ${ink}`}>Funnel by session</h2>
        {heldRows.length === 0 ? (
          <p className={`mt-3 ${faint}`}>No sessions held yet.</p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {[...heldRows].reverse().map((s) => (
              <div key={s.date} className={card}>
                <p className={`font-semibold ${ink}`}>{longDay(s.date)}</p>
                <ul className="mt-2 divide-y divide-[#1a2b4a]/10 dark:divide-white/10">
                  <Step name="Link clicks" value={s.clicks} from={null} cost={null} note="tracking links, before the session" />
                  <Step name="Registered" value={s.newRegistrations} from={s.clicks || null} cost={s.costPerRegistration} />
                  <Step name="Attended" value={s.attendedNew} from={s.newRegistrations || null} cost={s.costPerAttendee} />
                  <Step name="Consultations booked" value={s.consultBooked} from={s.attendedNew || null} cost={s.costPerBooking} note={s.consultRequests ? `${s.consultRequests} requested` : ""} />
                  <Step name="Closes" value={s.closes} from={s.consultBooked || null} cost={s.costPerClose} note={clientsLine(s.newClients)} />
                </ul>
                <p className={`mt-3 text-sm ${faint}`}>
                  Ad spend {s.adSpend ? usd(s.adSpend) : "none"} · First-year revenue {s.firstYearRevenue ? usd(s.firstYearRevenue) : "—"}
                  {s.websiteBuilds ? ` · ${s.websiteBuilds} Website ${s.websiteBuilds === 1 ? "Build" : "Builds"}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className={`text-xl font-semibold ${ink}`}>Event to event</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm tabular-nums">
            <thead className={label}>
              <tr>
                <th className="py-2 pr-4">Session</th>
                <th className="pr-4">Clicks</th>
                <th className="pr-4">Registered</th>
                <th className="pr-4">vs last</th>
                <th className="pr-4">Attended</th>
                <th className="pr-4">Show rate</th>
                <th className="pr-4">Booked</th>
                <th className="pr-4">Closes</th>
                <th className="pr-4">Ad spend</th>
                <th className="pr-4">Per registration</th>
                <th className="pr-4">Per close</th>
                <th>First-year revenue</th>
              </tr>
            </thead>
            <tbody className={ink}>
              {sessions.map((s, i) => {
                const prev = i > 0 ? sessions[i - 1] : null;
                const diff = prev ? s.newRegistrations - prev.newRegistrations : null;
                const upcoming = s.state !== "held";
                return (
                  <tr key={s.date} className="border-t border-[#1a2b4a]/10 dark:border-white/10">
                    <td className="py-2 pr-4 font-medium">
                      {day(s.date)}
                      {upcoming && <span className="ml-2 rounded-full bg-[#c9a227]/20 px-2 py-0.5 text-[11px] font-semibold text-[#7a5a0e] dark:text-[#e0c35a]">{s.state === "next" ? "Next" : "Upcoming"}</span>}
                    </td>
                    <td className="pr-4">{s.clicks}</td>
                    <td className="pr-4">{s.newRegistrations}</td>
                    <td className={`pr-4 ${diff === null ? faint : diff >= 0 ? "text-[#2c6b3f]" : "text-[#b3422f]"}`}>{diff === null ? "—" : diff > 0 ? `+${diff}` : String(diff)}</td>
                    <td className="pr-4">{upcoming ? "—" : s.attended}{!upcoming && s.attended > s.attendedNew ? <span className="text-[#7b6b8d]"> ({s.attended - s.attendedNew} returning)</span> : null}</td>
                    <td className="pr-4">{pct(s.showRate)}</td>
                    <td className="pr-4">{upcoming ? "—" : s.consultBooked}</td>
                    <td className="pr-4">{upcoming ? "—" : s.closes}</td>
                    <td className="pr-4">{s.adSpend ? usd(s.adSpend) : "—"}</td>
                    <td className="pr-4">{usd2(s.costPerRegistration)}</td>
                    <td className="pr-4">{usd2(s.costPerClose)}</td>
                    <td>{s.firstYearRevenue ? usd(s.firstYearRevenue) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sessions.some((s) => s.noShows.length > 0) && (
          <div className="mt-6 space-y-2">
            <h3 className={`text-base font-semibold ${ink}`}>Registered but didn&rsquo;t come</h3>
            {[...sessions].reverse().filter((s) => s.noShows.length > 0).map((s) => (
              <details key={s.date} className="rounded-xl border border-[#1a2b4a]/10 px-4 py-2 dark:border-white/10">
                <summary className={`cursor-pointer text-sm font-medium ${ink}`}>{day(s.date)} · {s.noShows.length} {s.noShows.length === 1 ? "person" : "people"}</summary>
                <p className={`mt-2 select-all break-words text-sm ${faint}`}>{s.noShows.join(", ")}</p>
              </details>
            ))}
          </div>
        )}
        <div className={`mt-4 space-y-1 text-[12.5px] ${faint}`}>
          <p>
            <strong>Registered</strong> = people who registered on Zoom since the previous session started, up to this one (test addresses are left out). <strong>Show rate</strong> = those who then attended. &ldquo;Returning&rdquo; = attendees who registered for an earlier session. Attendance fills in the morning after each session.
          </p>
          <p>
            <strong>Link clicks</strong> are clicks on the mc- tracking links in the same window. <strong>Booked</strong> = Executive Consultation bookings, <strong>closes</strong> = new paying clients (Starter, Growth or VIP), both credited to the most recent session for two weeks. First-year revenue uses implementation plus 12 months: Starter {usd(FIRST_YEAR_VALUE.starter)}, Growth {usd(FIRST_YEAR_VALUE.growth)}, VIP {usd(FIRST_YEAR_VALUE.vip)}.
          </p>
          <p>
            <strong>Ad spend</strong> is read from Finance: expenses filed under the category <em>Ads</em> (or Advertising, Paid ads) dated {day(ADS_START)} or later, counted for the session they promoted (after the previous session, up to this one). Cost per registration and per close appear once there is spend and a result to divide it by. Oct 8 had no ads, so it shows no cost.
          </p>
        </div>
      </section>
    </div>
  );
}
