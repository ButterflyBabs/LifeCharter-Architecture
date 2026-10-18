import type { YearReview } from "@/lib/yearReview";

// The year-in-review page itself, shared by the owner's page and the public share link.
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const num = (n: number) => n.toLocaleString("en-US");

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-[#E5DDCF] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2E7C83]">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-[#2E3A46]">{value}</p>
      {sub && <p className="mt-1 text-sm text-[#56616E]">{sub}</p>}
    </div>
  );
}

export default function YearReviewView({ r }: { r: YearReview }) {
  const m = r.money;
  const peak = m ? Math.max(1, ...m.byMonth.map((x) => Math.max(x.income, x.expenses))) : 1;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        {r.business.logo && <img src={r.business.logo} alt="" className="h-14 w-14 rounded-full bg-white object-contain" />}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C76F56]">{r.business.name}</p>
          <h1 className="text-3xl font-semibold text-[#2E3A46]">{r.year} in review</h1>
        </div>
      </header>

      {m && (
        <section className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Income" value={usd(m.income)} sub={m.bestMonth ? `Best month: ${m.bestMonth.month} (${usd(m.bestMonth.income)})` : undefined} />
            <Stat label="Expenses" value={usd(m.expenses)} />
            <Stat label="Net" value={usd(m.net)} />
          </div>
          <div className="rounded-2xl border border-[#E5DDCF] bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-[#2E3A46]">Month by month</p>
            <div className="flex h-40 items-end gap-2">
              {m.byMonth.map((x) => (
                <div key={x.month} className="flex flex-1 flex-col items-center gap-1" title={`${x.month}: income ${usd(x.income)}, expenses ${usd(x.expenses)}`}>
                  <div className="flex h-32 w-full items-end justify-center gap-0.5">
                    <div className="w-1/2 rounded-t bg-[#2E7C83]" style={{ height: `${(x.income / peak) * 100}%` }} />
                    <div className="w-1/2 rounded-t bg-[#E3B9A8]" style={{ height: `${(x.expenses / peak) * 100}%` }} />
                  </div>
                  <span className="text-[11px] text-[#56616E]">{x.month}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#56616E]"><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#2E7C83]" />Income <span className="ml-3 mr-1 inline-block h-2 w-2 rounded-sm bg-[#E3B9A8]" />Expenses</p>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="New customers" value={num(r.people.newCustomers)} sub={`${num(r.people.newContacts)} new contacts in all`} />
        <Stat label="Sessions held" value={num(r.sessions.completed)} sub={r.sessions.hours ? `${num(r.sessions.hours)} hours with clients and projects` : undefined} />
        <Stat label="Events" value={num(r.events.held)} sub={`${num(r.events.registrations)} sign-ups`} />
        <Stat label="Program members" value={num(r.programs.members)} />
        <Stat label="Tasks finished" value={num(r.tasksDone)} sub={r.goalsDone ? `${num(r.goalsDone)} goals reached` : undefined} />
        {r.score ? <Stat label="Business score" value={`${r.score.from} → ${r.score.to}`} sub={r.score.to >= r.score.from ? `Up ${r.score.to - r.score.from} points` : `Down ${r.score.from - r.score.to} points`} /> : <Stat label="Testimonials" value={num(r.testimonials.count)} />}
      </section>

      {r.testimonials.quotes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#2E3A46]">In their words</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {r.testimonials.quotes.map((q, i) => (
              <blockquote key={i} className="rounded-2xl bg-[#F4F1EA] p-5 text-[15px] text-[#2E3A46]">
                {q.headline && <p className="mb-1 font-semibold">{q.headline}</p>}
                <p className="whitespace-pre-wrap">“{q.content}”</p>
                <footer className="mt-2 text-sm text-[#56616E]">{q.name}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
