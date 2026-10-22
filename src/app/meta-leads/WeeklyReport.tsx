import type { AdReport, Guidance, Report, Verdict } from "@/lib/metaAdsReport";
import { addDays } from "@/lib/metaAdsCycles";

const money = (n: number | null | undefined) => (n == null ? "–" : `$${n.toFixed(2)}`);
const num = (n: number | null | undefined) => (n == null ? "–" : n.toLocaleString("en-US"));
const nice = (s: string) => new Date(`${s}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const hourLabel = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Denver" });
const when = (s: string) => new Date(`${s}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const BADGE: Record<Verdict, { label: string; cls: string }> = {
  scale: { label: "Give it more", cls: "bg-emerald-100 text-emerald-900" },
  continue: { label: "Keep going", cls: "bg-emerald-100 text-emerald-900" },
  watch: { label: "Watch", cls: "bg-amber-100 text-amber-900" },
  pause: { label: "Pause", cls: "bg-orange-100 text-orange-900" },
  stop: { label: "Stop", cls: "bg-red-100 text-red-900" },
};

function Badge({ v, text }: { v: Verdict; text?: string }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${BADGE[v].cls}`}>{text ?? BADGE[v].label}</span>;
}

const card = "rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/40";
const mute = "text-[#5a6472] dark:text-[#b8c2cf]";
const head = "text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]";

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={card}>
      <div className="text-xs text-[#7a8a99]">{label}</div>
      <div className="mt-1 text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{value}</div>
      {note && <div className={`mt-1 text-xs ${mute}`}>{note}</div>}
    </div>
  );
}

export default function WeeklyReport({ report, guidance, ageDays }: { report: Report; guidance: Guidance[]; ageDays: number }) {
  const r = report;
  const cur = r.cycles.find((c) => c.current);
  const prior = r.prior;
  const cplNote = prior?.cpl != null && r.totals.cpl != null ? `${prior.cpl >= r.totals.cpl ? "Down" : "Up"} from ${money(prior.cpl)} before` : undefined;
  const targetNote = r.target.cpl == null ? "Not set yet" : r.target.source === "yours" ? "Your target" : r.target.source === "break-even" ? "Your break-even" : "The campaign's own average";
  return (
    <div className="mt-3 space-y-6">
      {ageDays > 6 && (
        <p className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900">
          These figures end {when(r.periodEnd)}, {ageDays} days ago. Add this week&apos;s export below so the report is current.
        </p>
      )}

      <div className={card}>
        <div className="flex flex-wrap items-center gap-3">
          <Badge v={r.campaign.verdict} />
          <h3 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{r.campaign.headline}</h3>
        </div>
        <p className={`mt-1 text-xs ${mute}`}>{when(r.periodStart)} to {when(r.periodEnd)} ({r.days} days)</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
          {r.campaign.why.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      </div>

      {cur && (
        <div className={card}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Sign-ups for the {nice(cur.eventDate)} event</h3>
            <span className="text-sm text-[#7a8a99]">Day {cur.dayNumber} of {cur.daysTotal} · {cur.daysLeft} day{cur.daysLeft === 1 ? "" : "s"} left</span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">
            {cur.signups}{cur.goal ? <span className="text-xl font-semibold text-[#7a8a99]"> of {cur.goal}</span> : null}
          </p>
          {cur.goal ? (
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1a2b4a]/10" role="progressbar" aria-valuemin={0} aria-valuemax={cur.goal} aria-valuenow={Math.min(cur.signups, cur.goal)} aria-label="Sign-ups against the goal for this event">
              <div className="h-full bg-[#c9a227]" style={{ width: `${Math.min(100, (cur.signups / cur.goal) * 100)}%` }} />
            </div>
          ) : null}
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
            <li>The count closes at {hourLabel(cur.end)} Mountain on {nice(cur.eventDate)}. The count for the {nice(addDays(cur.eventDate, cur.daysTotal))} event starts again at 0 at that moment.</li>
            {cur.projected != null && cur.signups > 0 && <li>At the pace so far you would have about {Math.round(cur.projected)} by the time it closes{cur.goal ? (cur.projected >= cur.goal ? ", enough to reach your goal." : `, ${Math.round(cur.goal - cur.projected)} short of your goal.`) : "."}</li>}
            {cur.costPer != null && <li>Ad spend so far for this event: {money(cur.spend)}, which is {money(cur.costPer)} per sign-up.</li>}
          </ul>
        </div>
      )}

      {r.cycles.length > 0 && (
        <div>
          <h3 className={head}>Every event, counted on its own</h3>
          <p className={`mt-1 text-sm ${mute}`}>Each count runs from the end of the last event to the end of the next, so it starts again at zero. Sign-ups are counted by the minute they arrived; spend is Meta&apos;s, split by day.</p>
          <div className="mt-2 overflow-x-auto rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="text-left text-xs text-[#7a8a99]"><th className="p-3">Event</th><th className="p-3 text-right">Sign-ups</th><th className="p-3 text-right">Goal</th><th className="p-3 text-right">Of goal</th><th className="p-3 text-right">Ad spend</th><th className="p-3 text-right">Per sign-up</th><th className="p-3">Status</th></tr></thead>
              <tbody>
                {r.cycles.map((c) => (
                  <tr key={c.eventDate} className="border-t border-[#1a2b4a]/10">
                    <td className="p-3 font-medium">{nice(c.eventDate)}</td>
                    <td className="p-3 text-right tabular-nums">{c.signups}</td>
                    <td className="p-3 text-right tabular-nums">{c.goal ?? "–"}</td>
                    <td className="p-3 text-right tabular-nums">{c.goal ? `${Math.round((c.signups / c.goal) * 100)}%` : "–"}</td>
                    <td className="p-3 text-right tabular-nums">{money(c.spend)}</td>
                    <td className="p-3 text-right tabular-nums">{money(c.costPer)}</td>
                    <td className="p-3">{c.current ? "Open now" : "Closed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {r.months.length > 0 && (
        <div>
          <h3 className={head}>Each month, added up</h3>
          <div className="mt-2 overflow-x-auto rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="text-left text-xs text-[#7a8a99]"><th className="p-3">Month</th><th className="p-3">Events</th><th className="p-3 text-right">Sign-ups</th><th className="p-3 text-right">Goal for the month</th><th className="p-3 text-right">Ad spend</th><th className="p-3 text-right">Per sign-up</th></tr></thead>
              <tbody>
                {r.months.map((m) => (
                  <tr key={m.month} className="border-t border-[#1a2b4a]/10">
                    <td className="p-3 font-medium">{m.label}{m.current ? " (so far)" : ""}</td>
                    <td className="p-3">{m.events.length ? m.events.map(nice).join(", ") : "–"}</td>
                    <td className="p-3 text-right tabular-nums">{m.signups}</td>
                    <td className="p-3 text-right tabular-nums">{m.goal ?? "–"}</td>
                    <td className="p-3 text-right tabular-nums">{money(m.spend)}</td>
                    <td className="p-3 text-right tabular-nums">{money(m.costPer)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Spent" value={money(r.totals.spend)} note={prior ? `${money(prior.spend)} the period before` : undefined} />
        <Tile label="Leads (Meta's count)" value={num(r.totals.leads)} note={prior ? `${num(prior.leads)} the period before` : undefined} />
        <Tile label="Cost per lead" value={money(r.totals.cpl)} note={cplNote} />
        <Tile label="Your yardstick per lead" value={money(r.target.cpl)} note={targetNote} />
      </div>

      <div>
        <h3 className={head}>Each ad</h3>
        <div className="mt-2 overflow-x-auto rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-xs text-[#7a8a99]">
                <th className="p-3">Ad</th><th className="p-3 text-right">Spent</th><th className="p-3 text-right">Seen</th><th className="p-3 text-right">Link clicks</th>
                <th className="p-3 text-right">Click rate</th><th className="p-3 text-right">Leads</th><th className="p-3 text-right">Cost per lead</th><th className="p-3 text-right">Share of leads</th><th className="p-3">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {r.ads.map((a) => (
                <tr key={a.adName} className="border-t border-[#1a2b4a]/10">
                  <td className="p-3 font-medium">{a.adName}</td>
                  <td className="p-3 text-right tabular-nums">{money(a.spend)}</td>
                  <td className="p-3 text-right tabular-nums">{num(a.impressions)}</td>
                  <td className="p-3 text-right tabular-nums">{num(a.linkClicks)}</td>
                  <td className="p-3 text-right tabular-nums">{a.ctr == null ? "–" : `${a.ctr}%`}</td>
                  <td className="p-3 text-right tabular-nums">{num(a.leads)}</td>
                  <td className="p-3 text-right tabular-nums">{money(a.cpl)}</td>
                  <td className="p-3 text-right tabular-nums">{a.shareOfLeads}%</td>
                  <td className="p-3"><Badge v={a.verdict} /></td>
                </tr>
              ))}
              <tr className="border-t border-[#1a2b4a]/20 font-semibold">
                <td className="p-3">All ads</td>
                <td className="p-3 text-right tabular-nums">{money(r.totals.spend)}</td>
                <td className="p-3 text-right tabular-nums">{num(r.totals.impressions)}</td>
                <td className="p-3 text-right tabular-nums">{num(r.totals.linkClicks)}</td>
                <td className="p-3 text-right tabular-nums">{r.totals.ctr == null ? "–" : `${r.totals.ctr}%`}</td>
                <td className="p-3 text-right tabular-nums">{num(r.totals.leads)}</td>
                <td className="p-3 text-right tabular-nums">{money(r.totals.cpl)}</td>
                <td className="p-3 text-right">100%</td>
                <td className="p-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className={head}>What to do with each ad, and why</h3>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {r.ads.map((a: AdReport) => (
            <div key={a.adName} className={card}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge v={a.verdict} />
                <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{a.adName}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{a.headline}</p>
              <ul className={`mt-1 list-disc space-y-1 pl-5 text-sm ${mute}`}>{a.why.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className={head}>If cost per lead stays the same</h3>
        <p className={`mt-1 text-sm ${mute}`}>You are spending about {money(r.projections.dailySpend)} a day at {money(r.projections.cpl)} per lead.</p>
        <div className="mt-2 overflow-x-auto rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40">
          <table className="w-full min-w-[420px] text-sm">
            <thead><tr className="text-left text-xs text-[#7a8a99]"><th className="p-3">Looking ahead</th><th className="p-3 text-right">You would spend</th><th className="p-3 text-right">You would get about</th></tr></thead>
            <tbody>
              {r.projections.rows.map((p) => (
                <tr key={p.label} className="border-t border-[#1a2b4a]/10">
                  <td className="p-3">A {p.label.toLowerCase()} ({p.days} days)</td>
                  <td className="p-3 text-right tabular-nums">{money(p.spend)}</td>
                  <td className="p-3 text-right tabular-nums">{p.leads == null ? "–" : `${p.leads} leads`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {r.projections.limitNote && <p className="mt-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{r.projections.limitNote}</p>}
      </div>

      {r.funnel && (
        <div>
          <h3 className={head}>Where the money goes after the click</h3>
          <p className={`mt-1 text-sm ${mute}`}>Counted from your own contacts in the Suite. A lead is worth more when they show up and book.</p>
          <div className="mt-2 overflow-x-auto rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40">
            <table className="w-full min-w-[420px] text-sm">
              <thead><tr className="text-left text-xs text-[#7a8a99]"><th className="p-3">Step</th><th className="p-3 text-right">People</th><th className="p-3 text-right">Ad spend for each</th></tr></thead>
              <tbody>
                {r.funnel.map((f) => (
                  <tr key={f.stage} className="border-t border-[#1a2b4a]/10">
                    <td className="p-3">{f.stage}</td>
                    <td className="p-3 text-right tabular-nums">{f.count}</td>
                    <td className="p-3 text-right tabular-nums">{money(f.costEach)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {r.checks.length > 0 && (
        <div>
          <h3 className={head}>Also worth a look</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{r.checks.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
      )}

      {guidance.length > 0 && (
        <div>
          <h3 className={head}>What your answers say</h3>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {guidance.map((g) => (
              <div key={g.title} className={card}>
                <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{g.title}</p>
                <p className={`mt-1 text-sm ${mute}`}>{g.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className={`text-xs ${mute}`}>Figures are Meta&apos;s own, as of the file you added. Meta can still adjust the last few days, so judge trends over a week or more, not a single day.</p>
    </div>
  );
}
