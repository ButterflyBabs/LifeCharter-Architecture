"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar as CalendarIcon, Compass } from "lucide-react";
import { activePlatforms, mondayOf, todayYmd } from "@/lib/social/planner";
import { useSocialPlanner } from "./useSocialPlanner";
import { GoalsEditor } from "./GoalsEditor";
import { WeekScorecard } from "./WeekScorecard";
import { MonthReview } from "./MonthReview";
import { AudienceView } from "./AudienceView";
import { OffersEditor } from "./OffersEditor";
import { RulesEditor } from "./RulesEditor";
import { SetupFlow } from "./SetupFlow";
import { Tabs, cx } from "./ui";

type Tab = "week" | "month" | "audience" | "goals" | "offers" | "voice";
const TABS: { id: Tab; label: string }[] = [
  { id: "week", label: "Week scorecard" },
  { id: "month", label: "Month" },
  { id: "audience", label: "Audience" },
  { id: "goals", label: "Goals" },
  { id: "offers", label: "Offers & events" },
  { id: "voice", label: "Voice & rules" },
];

export function SocialPlanner() {
  const api = useSocialPlanner();
  const { settings, posts, weeks, snapshots } = api;
  const [tab, setTab] = useState<Tab>("week");
  const [mon, setMon] = useState("");
  const [month, setMonth] = useState("");

  useEffect(() => {
    const t = todayYmd();
    const q = new URLSearchParams(window.location.search);
    const qt = q.get("tab") as Tab | null;
    const qw = q.get("week");
    setMon(qw && /^\d{4}-\d{2}-\d{2}$/.test(qw) ? mondayOf(qw) : mondayOf(t));
    setMonth(t.slice(0, 7));
    if (qt && TABS.some((x) => x.id === qt)) setTab(qt);
  }, []);

  const platforms = useMemo(() => (settings ? activePlatforms(settings.platforms, settings.goals, posts) : []), [settings, posts]);

  const choose = (t: Tab) => {
    setTab(t);
    const u = new URL(window.location.href);
    u.searchParams.set("tab", t);
    window.history.replaceState(null, "", u.toString());
  };

  return (
    <div className={cx.page}>
      <Link href="/marketing-plan" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#475569] hover:underline dark:text-[#CBD5E1]">
        <ArrowLeft className="h-4 w-4" /> Back to Marketing Plan
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F1A38]">
            <Compass className="h-6 w-6 text-[#D4AF63]" />
          </div>
          <div>
            <p className={cx.eyebrow}>Marketing Plan</p>
            <h1 className={cx.h1}>Social Planner</h1>
          </div>
        </div>
        <Link href="/daily-compass/calendar" className={`${cx.btn} ${cx.primary}`}>
          <CalendarIcon className="h-3.5 w-3.5" /> Content Calendar
        </Link>
      </div>

      {api.error && (
        <p className="mb-4 text-xs text-[#8a2f2f]">
          {api.error} <button className="underline" onClick={() => api.setError("")}>Dismiss</button>
        </p>
      )}

      {!api.loaded || !settings || !mon ? (
        <p className={cx.muted}>Loading…</p>
      ) : !settings.setupDone && posts.length === 0 ? (
        <SetupFlow settings={settings} api={api} />
      ) : (
        <>
          <Tabs tabs={TABS} value={tab} onChange={choose} />
          {tab === "week" && <WeekScorecard mon={mon} setMon={setMon} goals={settings.goals} posts={posts} weeks={weeks} platforms={platforms} api={api} />}
          {tab === "month" && (
            <MonthReview
              month={month}
              setMonth={setMonth}
              goals={settings.goals}
              posts={posts}
              weeks={weeks}
              platforms={platforms}
              onApplyTarget={(pid, mid, target) =>
                api.saveSettings({ goals: { ...settings.goals, [pid]: (settings.goals[pid] || []).map((m) => (m.id === mid ? { ...m, target } : m)) } })
              }
            />
          )}
          {tab === "audience" && <AudienceView snapshots={snapshots} platforms={platforms} api={api} />}
          {tab === "goals" && <GoalsEditor goals={settings.goals} platforms={settings.platforms} onSave={api.saveSettings} />}
          {tab === "offers" && <OffersEditor offers={settings.offers} events={settings.events} api={api} />}
          {tab === "voice" && <RulesEditor rules={settings.rules} onSave={(rules) => api.saveSettings({ rules })} />}
        </>
      )}
    </div>
  );
}
