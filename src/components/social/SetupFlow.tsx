"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PLATFORMS, STARTER_GOALS, platformDef } from "@/lib/social/planner";
import type { PlannerSettings, SocialPlannerApi } from "./useSocialPlanner";
import { OffersEditor } from "./OffersEditor";
import { RulesEditor } from "./RulesEditor";
import { cx } from "./ui";

const STEPS = ["Platforms", "Weekly goals", "Offers & events", "Voice"];

// First-run setup for an account with no planner settings yet. Everything it
// collects can be changed later on the planner's tabs.
export function SetupFlow({ settings, api }: { settings: PlannerSettings; api: SocialPlannerApi }) {
  const [step, setStep] = useState(settings.platforms.length ? 1 : 0);
  const [chosen, setChosen] = useState<string[]>(settings.platforms);
  const [busy, setBusy] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <p className={cx.eyebrow}>Set up your Social Planner</p>
        <h2 className={cx.h2}>A few minutes now, a calmer week every week</h2>
        <p className={cx.body}>Tell the planner where you post, what a good week looks like, what you offer and how you sound. You can change all of it later.</p>
      </div>

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              onClick={() => (i <= step || settings.platforms.length) && setStep(i)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                i === step ? "border-[#D4AF63] bg-[#D4AF63]/15 text-[#0F1A38] dark:text-[#FAF8F3]" : i < step ? "border-[#2E7C83]/40 text-[#1f5f65]" : "border-[#0F1A38]/10 text-[#64748B]"
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${i < step ? "bg-[#2E7C83] text-white" : "bg-[#0F1A38]/10"}`}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s}
            </button>
          </li>
        ))}
      </ol>

      <div className={cx.card}>
        {step === 0 && (
          <div className="space-y-4">
            <h3 className={cx.h3}>Where do you post?</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PLATFORMS.map((p) => {
                const on = chosen.includes(p.id);
                return (
                  <button
                    key={p.id}
                    aria-pressed={on}
                    onClick={() => setChosen(on ? chosen.filter((x) => x !== p.id) : [...chosen, p.id])}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm ${on ? "border-[#D4AF63] bg-[#D4AF63]/10" : "border-[#0F1A38]/10 dark:border-[#334060]"}`}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="flex-1 text-[#0F1A38] dark:text-[#FAF8F3]">{p.name}</span>
                    {on && <Check className="h-4 w-4 text-[#8C6D24]" />}
                  </button>
                );
              })}
            </div>
            <button
              disabled={!chosen.length || busy}
              className={`${cx.btn} ${cx.primary}`}
              onClick={async () => {
                setBusy(true);
                await api.saveSettings({ platforms: chosen });
                setBusy(false);
                next();
              }}
            >
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className={cx.h3}>Your starting weekly goals</h3>
              <p className={cx.muted}>Modest targets to begin with. Adjust any number on the Goals tab once you&rsquo;ve had a week or two of real results.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {settings.platforms.map((pid) => (
                <div key={pid} className="rounded-xl border border-[#0F1A38]/10 p-3 dark:border-[#334060]">
                  <p className="mb-1 text-sm font-semibold" style={{ color: platformDef(pid).color }}>{platformDef(pid).name}</p>
                  <ul className="space-y-0.5 text-sm text-[#334155] dark:text-[#CBD5E1]">
                    {(settings.goals[pid] || STARTER_GOALS[pid] || []).map((m) => (
                      <li key={m.id} className="flex justify-between gap-2">
                        <span>{m.label}</span>
                        <span className="tabular-nums">{m.target}{m.kind === "habit" ? " days" : ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button className={`${cx.btn} ${cx.primary}`} onClick={next}>Looks good</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className={cx.h3}>What do your posts invite people to?</h3>
              <p className={cx.muted}>Add your programs, services, events and free resources. Skip this if you&rsquo;re not sure yet.</p>
            </div>
            <OffersEditor offers={settings.offers} events={settings.events} api={api} compact />
            <button className={`${cx.btn} ${cx.primary}`} onClick={next}>{settings.offers.length ? "Continue" : "Skip for now"}</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className={cx.h3}>How you sound</h3>
            <RulesEditor
              compact
              rules={settings.rules}
              onSave={async (rules) => {
                await api.saveSettings({ rules, completeSetup: true });
              }}
            />
            <button className={`${cx.btn} ${cx.ghost}`} onClick={() => api.saveSettings({ completeSetup: true })}>
              Finish without saving voice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
