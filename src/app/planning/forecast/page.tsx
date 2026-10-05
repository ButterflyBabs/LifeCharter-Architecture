"use client";

import { ForecastRead } from "@/components/planning/AssistantPanels";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, LineChart, Loader2, RefreshCw, Sliders, TrendingUp } from "lucide-react";
import PlanBuilder from "@/components/plans/PlanBuilder";
import ReviewsPanel from "@/components/plans/ReviewsPanel";
import PlanExport from "@/components/plans/PlanExport";

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

interface MonthProjection {
  monthIndex: number;
  revenue: number;
  expenses: number;
  net: number;
  cumulativeNet: number;
}
interface Scenario {
  key: "conservative" | "expected" | "optimistic";
  label: string;
  months: MonthProjection[];
  totalRevenue: number;
  totalExpenses: number;
  totalNet: number;
}
interface RevenuePlan {
  note: string;
  scenarios: { key: "conservative" | "expected" | "optimistic"; label: string; totalRevenue: number; months: { label: string; revenue: number; cumulativeRevenue: number }[] }[];
}
interface Forecast {
  revenuePlan?: RevenuePlan;
  baseMonthlyRevenue: number;
  derivedExpenseRatio: number;
  assumptions: { horizonMonths: number; monthlyGrowthPct: number; pipelineClosePct: number; expenseRatioPct: number };
  scenarios: Scenario[];
  pipeline?: { source: "pipeline" | "sales_activities"; openValue: number; weightedValue: number | null; deals: number | null; closePct: number };
}

const SCENARIO_COLOR: Record<string, string> = {
  conservative: "#8a6a15",
  expected: "#2E7C83",
  optimistic: "#2c6b3f",
};

export default function ForecastPage() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<"conservative" | "expected" | "optimistic">("expected");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ horizonMonths: 6, monthlyGrowthPct: 3, pipelineClosePct: 20, expenseRatioPct: 0 });

  const applyForecast = (f: Forecast) => {
    setForecast(f);
    setForm({
      horizonMonths: f.assumptions.horizonMonths,
      monthlyGrowthPct: f.assumptions.monthlyGrowthPct,
      pipelineClosePct: f.assumptions.pipelineClosePct,
      expenseRatioPct: f.assumptions.expenseRatioPct,
    });
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/planning/forecast");
      const d = await res.json().catch(() => ({}));
      if (d.forecast) applyForecast(d.forecast);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/planning/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      if (d.forecast) applyForecast(d.forecast);
    } finally {
      setSaving(false);
    }
  };

  const scenario = forecast?.scenarios.find((s) => s.key === active) || null;
  const maxCum = scenario ? Math.max(1, ...scenario.months.map((m) => Math.abs(m.cumulativeNet))) : 1;

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <Link href="/planning" className="inline-flex items-center gap-1.5 text-sm text-[#2E7C83] hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Planning Hub
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7b6b8d] to-[#2E7C83] flex items-center justify-center">
          <LineChart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Financial Forecasting</h1>
          <p className="text-[#b8a898]">Revenue projections from your ledger trend + open pipeline.</p>
        </div>
      </div>

      <ForecastRead />

      {!loaded ? (
        <p className="text-sm text-[#b8a898]">Loading…</p>
      ) : !forecast ? (
        <p className="text-sm text-[#b8a898]">Couldn&apos;t build a forecast. Add some income to your Finance ledger first.</p>
      ) : (
        <>
          {/* Assumptions */}
          <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-[#2E7C83]" />
              <h2 className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Assumptions</h2>
              <span className="text-xs text-[#b8a898]">
                {forecast.revenuePlan ? "No income recorded yet" : `Base revenue ${usd(forecast.baseMonthlyRevenue)}/mo · expense ratio ${forecast.derivedExpenseRatio}%`}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Horizon (months)" value={form.horizonMonths} min={1} max={24}
                onChange={(v) => setForm({ ...form, horizonMonths: v })} />
              <Field label="Growth %/mo" value={form.monthlyGrowthPct} min={-50} max={100}
                onChange={(v) => setForm({ ...form, monthlyGrowthPct: v })} />
              {forecast.pipeline?.source === "pipeline" ? (
                <div className="text-xs">
                  <p className="font-medium text-[#7a8a99] mb-1">Pipeline close %</p>
                  <p className="text-[#1a2b4a] dark:text-[#F8F5F0] text-sm font-semibold">{forecast.pipeline.closePct}%</p>
                  <p className="text-[#b8a898]">from your deals&rsquo; probabilities</p>
                </div>
              ) : (
                <Field label="Pipeline close %" value={form.pipelineClosePct} min={0} max={100}
                  onChange={(v) => setForm({ ...form, pipelineClosePct: v })} />
              )}
              <Field label="Expense % (0=auto)" value={form.expenseRatioPct} min={0} max={150}
                onChange={(v) => setForm({ ...form, expenseRatioPct: v })} />
            </div>
            {forecast.pipeline && (
              <p className="mt-3 text-xs text-[#7a8a99]">
                {forecast.pipeline.source === "pipeline" ? (
                  <>
                    Pipeline: {forecast.pipeline.deals} open deal{forecast.pipeline.deals === 1 ? "" : "s"} expected to close within {forecast.assumptions.horizonMonths} months, {usd(forecast.pipeline.openValue)} open, {usd(forecast.pipeline.weightedValue ?? 0)} weighted by each deal&rsquo;s probability, from your{" "}
                    <a href="/sales/pipeline" className="underline text-[#2E7C83]">Pipeline</a>. Conservative and Optimistic scale that up and down.
                  </>
                ) : (
                  <>
                    Pipeline: {usd(forecast.pipeline.openValue)} open, from Sales Activities. Add your deals to the{" "}
                    <a href="/sales/pipeline" className="underline text-[#2E7C83]">Pipeline</a> and the forecast will use each deal&rsquo;s own value and probability.
                  </>
                )}
              </p>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Recalculate
            </button>
          </div>

          {forecast.revenuePlan && <RevenuePlanView plan={forecast.revenuePlan} active={active} setActive={setActive} />}

          {!forecast.revenuePlan && (
          <>
          {/* Scenario totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {forecast.scenarios.map((s) => (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={`text-left rounded-2xl border p-4 transition ${
                  active === s.key ? "border-[#2E7C83] shadow-md" : "border-[#1a2b4a]/10 hover:border-[#2E7C83]/40"
                } bg-white dark:bg-[#1a2b4a]/20`}
              >
                <div className="flex items-center gap-1.5 mb-1" style={{ color: SCENARIO_COLOR[s.key] }}>
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(s.totalNet)}</p>
                <p className="text-xs text-[#b8a898]">net over {forecast.assumptions.horizonMonths} mo · {usd(s.totalRevenue)} revenue</p>
              </button>
            ))}
          </div>

          {/* Monthly projection for the active scenario */}
          {scenario && (
            <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-5">
              <h2 className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-3">
                {scenario.label} scenario — month by month
              </h2>
              <div className="space-y-2 mb-4">
                {scenario.months.map((m) => {
                  const pct = Math.round((Math.abs(m.cumulativeNet) / maxCum) * 100);
                  return (
                    <div key={m.monthIndex} className="flex items-center gap-3">
                      <span className="w-12 text-xs text-[#b8a898] flex-shrink-0">Mo {m.monthIndex}</span>
                      <div className="flex-1 h-6 rounded-md bg-[#1a2b4a]/6 overflow-hidden">
                        <div
                          className="h-6 rounded-md flex items-center justify-end px-2"
                          style={{ width: `${Math.max(6, pct)}%`, backgroundColor: `${SCENARIO_COLOR[scenario.key]}22` }}
                        >
                          <span className="text-[11px] font-medium" style={{ color: SCENARIO_COLOR[scenario.key] }}>
                            {usd(m.cumulativeNet)}
                          </span>
                        </div>
                      </div>
                      <span className="w-20 text-right text-xs text-[#7a8a99] flex-shrink-0">{usd(m.net)}/mo</span>
                    </div>
                  );
                })}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[#b8a898] border-b border-[#1a2b4a]/10">
                      <th className="py-2 pr-3 font-medium">Month</th>
                      <th className="py-2 pr-3 font-medium text-right">Revenue</th>
                      <th className="py-2 pr-3 font-medium text-right">Expenses</th>
                      <th className="py-2 pr-3 font-medium text-right">Net</th>
                      <th className="py-2 font-medium text-right">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenario.months.map((m) => (
                      <tr key={m.monthIndex} className="border-b border-[#1a2b4a]/6">
                        <td className="py-1.5 pr-3 text-[#1a2b4a] dark:text-[#F8F5F0]">Month {m.monthIndex}</td>
                        <td className="py-1.5 pr-3 text-right text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(m.revenue)}</td>
                        <td className="py-1.5 pr-3 text-right text-[#8a2f2f]">{usd(m.expenses)}</td>
                        <td className="py-1.5 pr-3 text-right font-medium text-[#2c6b3f]">{usd(m.net)}</td>
                        <td className="py-1.5 text-right text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(m.cumulativeNet)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-[#b8a898] mt-3">
                Projections combine your trailing revenue run-rate (grown monthly) with expected pipeline closings, minus an
                expense ratio. Adjust the assumptions above and recalculate.
              </p>
            </div>
          )}
          </>
          )}
        </>
      )}

      {/* The forecast narrative — assumptions, drivers, targets, and risks */}
      <div id="forecast-plan" className="mt-10 pt-6 border-t border-[#1a2b4a]/10">
        <h2 className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Forecast Plan</h2>
        <p className="text-sm text-[#b8a898] mb-5">
          The reasoning behind the numbers — revenue drivers, assumptions, targets, and the levers you&apos;ll pull.
        </p>
        <PlanBuilder planType="forecasting" />
      </div>

      <div className="mt-10 pt-6 border-t border-[#1a2b4a]/10">
        <h2 className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Print / Share</h2>
        <p className="text-sm text-[#b8a898] mb-5">Build a branded PDF or Word copy of your Forecast Plan, with the forecast figures, to share with a funder, partner or advisor.</p>
        <PlanExport planType="forecasting" onOpenBuild={() => document.getElementById("forecast-plan")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
      </div>

      <div className="mt-8">
        <ReviewsPanel planType="forecasting" />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-[#7a8a99] mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-10 px-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
      />
    </div>
  );
}

// No income is recorded yet: the client's own income goals shown as a revenue plan (revenue only, no net).
function RevenuePlanView({ plan, active, setActive }: { plan: RevenuePlan; active: "conservative" | "expected" | "optimistic"; setActive: (k: "conservative" | "expected" | "optimistic") => void }) {
  const sc = plan.scenarios.find((x) => x.key === active) || plan.scenarios[1];
  const maxCum = Math.max(1, ...sc.months.map((m) => m.cumulativeRevenue));
  return (
    <>
      <div className="rounded-2xl border border-[#c9a227]/40 bg-[#FBF7EC] dark:bg-[#2a2415] p-4 mb-4 text-sm text-[#3F4654] dark:text-[#e8e4f0]">
        <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Showing your revenue plan</p>
        <p className="text-xs">{plan.note}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {plan.scenarios.map((s) => (
          <button key={s.key} onClick={() => setActive(s.key)} className={`text-left rounded-2xl border p-4 transition ${active === s.key ? "border-[#2E7C83] shadow-md" : "border-[#1a2b4a]/10 hover:border-[#2E7C83]/40"} bg-white dark:bg-[#1a2b4a]/20`}>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: SCENARIO_COLOR[s.key] }}>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(s.totalRevenue)}</p>
            <p className="text-xs text-[#b8a898]">planned revenue over {s.months.length} mo</p>
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-5 mb-2">
        <h2 className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-3">{sc.label} plan: month by month</h2>
        <div className="space-y-2 mb-4">
          {sc.months.map((m) => (
            <div key={m.label} className="flex items-center gap-3">
              <span className="w-20 text-xs text-[#b8a898] flex-shrink-0">{m.label}</span>
              <div className="flex-1 h-6 rounded-md bg-[#1a2b4a]/6 overflow-hidden">
                <div className="h-6 rounded-md flex items-center justify-end px-2" style={{ width: `${Math.max(6, Math.round((m.cumulativeRevenue / maxCum) * 100))}%`, backgroundColor: `${SCENARIO_COLOR[sc.key]}22` }}>
                  <span className="text-[11px] font-medium" style={{ color: SCENARIO_COLOR[sc.key] }}>{usd(m.cumulativeRevenue)}</span>
                </div>
              </div>
              <span className="w-24 text-right text-xs text-[#7a8a99] flex-shrink-0">{usd(m.revenue)}/mo</span>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#b8a898] border-b border-[#1a2b4a]/10">
                <th className="py-2 pr-3 font-medium">Month</th>
                <th className="py-2 pr-3 font-medium text-right">Planned revenue</th>
                <th className="py-2 font-medium text-right">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {sc.months.map((m) => (
                <tr key={m.label} className="border-b border-[#1a2b4a]/6">
                  <td className="py-1.5 pr-3 text-[#1a2b4a] dark:text-[#F8F5F0]">{m.label}</td>
                  <td className="py-1.5 pr-3 text-right text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(m.revenue)}</td>
                  <td className="py-1.5 text-right text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(m.cumulativeRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[#b8a898] mt-3">Change the horizon in Assumptions above (up to 24 months) to see more of the plan.</p>
      </div>
    </>
  );
}
