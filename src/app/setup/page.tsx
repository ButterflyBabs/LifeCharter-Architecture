"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brain,
  Heart,
  BarChart3,
  Sparkles,
  Plug,
  CheckCircle2,
  Circle,
  ArrowRight,
  Loader2,
  Compass,
  Calendar,
  Users,
  Share2,
} from "lucide-react";

interface SetupStatus {
  assessments: { brain: boolean; soul: boolean; profit: boolean; complete: boolean };
  ai: { connected: boolean };
  integrations: { calendar: boolean; google: boolean; microsoft: boolean; globalControl: boolean; poststream: boolean };
  requiredComplete: boolean;
}

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/setup/status");
      const d = await res.json().catch(() => null);
      if (d) setStatus(d);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    // Refresh when returning from an assessment / settings tab.
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const s = status;
  const steps = [
    {
      key: "brain",
      n: 1,
      icon: <Brain className="w-5 h-5" />,
      title: "Brain Assessment",
      desc: "Map your business systems — marketing, sales, operations, finance, and more — in your own words.",
      href: "/assessments/brain",
      required: true,
      done: Boolean(s?.assessments.brain),
    },
    {
      key: "soul",
      n: 2,
      icon: <Heart className="w-5 h-5" />,
      title: "Soul Assessment",
      desc: "Capture your identity, values, calling, and story — the heart the AI writes from.",
      href: "/assessments/soul",
      required: true,
      done: Boolean(s?.assessments.soul),
    },
    {
      key: "profit",
      n: 3,
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Profit Assessment",
      desc: "Score your 12 business dimensions to establish your baseline and business-health starting point.",
      href: "/assessments/profit",
      required: true,
      done: Boolean(s?.assessments.profit),
    },
    {
      key: "ai",
      n: 4,
      icon: <Sparkles className="w-5 h-5" />,
      title: "Connect your AI",
      desc: "Add your OpenAI key so your guide can draft plans, insights, reviews, captions, and proposals.",
      href: "/settings?tab=ai",
      required: true,
      done: Boolean(s?.ai.connected),
    },
  ];

  const requiredDone = steps.filter((x) => x.required && x.done).length;
  const requiredTotal = steps.filter((x) => x.required).length;
  const pct = requiredTotal ? Math.round((requiredDone / requiredTotal) * 100) : 0;

  const enterSuite = () => {
    try {
      localStorage.setItem("lc_setup_entered", "1");
    } catch {
      /* ignore */
    }
    router.push("/");
  };

  const finishLater = () => {
    try {
      localStorage.setItem("lc_setup_skip", "1");
    } catch {
      /* ignore */
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf7f2] to-[#f0ece4] dark:from-[#0e1830] dark:to-[#0a1120] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] flex items-center justify-center mx-auto mb-3">
            <Compass className="w-7 h-7 text-[#c9a227]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Set up your Command Suite</h1>
          <p className="text-[#7a8a99] dark:text-[#b8c2cf] mt-2 max-w-md mx-auto">
            We start with your assessments — they&apos;re the foundation everything else is built on. Then connect your
            AI and, if you like, your tools.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-[#7a8a99] dark:text-[#b8c2cf]">Foundation</span>
            <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {requiredDone} of {requiredTotal}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[#1a2b4a]/8 overflow-hidden">
            <div className="h-2.5 rounded-full bg-gradient-to-r from-[#4a9b9b] to-[#c9a227] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {!loaded ? (
          <p className="text-center text-sm text-[#b8a898]">Loading your setup…</p>
        ) : (
          <>
            {/* Required steps */}
            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.key}
                  className={`rounded-2xl border p-4 flex items-center gap-4 ${
                    step.done ? "border-green-500/30 bg-green-500/5" : "border-[#1a2b4a]/12 bg-white dark:bg-[#1a2b4a]/20"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {step.done ? (
                      <CheckCircle2 className="w-8 h-8 text-[#2c6b3f]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#2E7C83]/10 text-[#2E7C83] flex items-center justify-center font-semibold">
                        {step.n}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#2E7C83]">{step.icon}</span>
                      <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{step.title}</h3>
                    </div>
                    <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf] mt-0.5">{step.desc}</p>
                  </div>
                  <Link
                    href={step.href}
                    className={`flex-shrink-0 text-sm font-medium px-4 py-2 rounded-lg ${
                      step.done
                        ? "border border-[#1a2b4a]/20 text-[#7a8a99] hover:bg-[#1a2b4a]/5"
                        : "bg-[#2E7C83] text-white hover:bg-[#256b71]"
                    }`}
                  >
                    {step.done ? "Review" : "Start"}
                  </Link>
                </div>
              ))}
            </div>

            {/* Integrations (optional) */}
            <div className="mt-4 rounded-2xl border border-[#1a2b4a]/12 bg-white dark:bg-[#1a2b4a]/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Plug className="w-5 h-5 text-[#7b6b8d]" />
                <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Connect your tools</h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#1a2b4a]/8 text-[#7a8a99]">Optional</span>
              </div>
              <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf] mb-3">
                Hook up your calendar, contacts, and social so the Suite can act for you. You can always do this later.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <IntegrationChip icon={<Calendar className="w-4 h-4" />} label="Calendar & Email" done={Boolean(s?.integrations.calendar)} />
                <IntegrationChip icon={<Users className="w-4 h-4" />} label="Global Control" done={Boolean(s?.integrations.globalControl)} />
                <IntegrationChip icon={<Share2 className="w-4 h-4" />} label="PostStream" done={Boolean(s?.integrations.poststream)} />
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
              >
                Open Integrations <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Finish */}
            <div className="mt-8 text-center">
              {s?.requiredComplete ? (
                <button
                  onClick={enterSuite}
                  className="inline-flex items-center gap-2 text-base font-semibold px-8 py-3 rounded-xl bg-gradient-to-r from-[#1a2b4a] to-[#7b6b8d] text-white hover:opacity-95 shadow-md"
                >
                  Enter your Command Suite <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <>
                  <button
                    disabled
                    className="inline-flex items-center gap-2 text-base font-semibold px-8 py-3 rounded-xl bg-[#1a2b4a]/20 text-[#1a2b4a]/50 dark:text-[#F8F5F0]/40 cursor-not-allowed"
                  >
                    <Loader2 className={requiredDone < requiredTotal ? "hidden" : "w-5 h-5"} />
                    Finish the foundation to continue
                  </button>
                  <p className="text-xs text-[#b8a898] mt-3">
                    Complete your three assessments and connect your AI to unlock the Suite.{" "}
                    <button onClick={finishLater} className="text-[#2E7C83] hover:underline">
                      I&apos;ll finish later
                    </button>
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function IntegrationChip({ icon, label, done }: { icon: React.ReactNode; label: string; done: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
        done ? "border-green-500/30 bg-green-500/5 text-[#2c6b3f]" : "border-[#1a2b4a]/12 text-[#7a8a99]"
      }`}
    >
      {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
      <span className="flex items-center gap-1.5 text-[#1a2b4a] dark:text-[#F8F5F0]">{icon} {label}</span>
    </div>
  );
}
