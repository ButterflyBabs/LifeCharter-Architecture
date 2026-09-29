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
  Compass,
  Calendar,
  Share2,
} from "lucide-react";
import WebsiteQuestion from "@/components/website/WebsiteQuestion";

interface SetupStatus {
  assessments: { brain: boolean; soul: boolean; profit: boolean; complete: boolean };
  ai: { connected: boolean };
  integrations: { calendar: boolean; google: boolean; microsoft: boolean; poststream: boolean };
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
      key: "ai",
      n: 1,
      icon: <Sparkles className="w-5 h-5" />,
      title: "Connect your AI",
      desc: "Add your OpenAI key so your guide can draft plans, insights, reviews, captions, and proposals.",
      href: "/settings?tab=ai",
      required: true,
      done: Boolean(s?.ai.connected),
    },
    {
      key: "brain",
      n: 2,
      icon: <Brain className="w-5 h-5" />,
      title: "Brain Assessment",
      desc: "Map your business systems — marketing, sales, operations, finance, and more — in your own words.",
      href: "/assessments/brain",
      required: true,
      done: Boolean(s?.assessments.brain),
    },
    {
      key: "soul",
      n: 3,
      icon: <Heart className="w-5 h-5" />,
      title: "Soul Assessment",
      desc: "Capture your identity, values, calling, and story — the heart the AI writes from.",
      href: "/assessments/soul",
      required: true,
      done: Boolean(s?.assessments.soul),
    },
    {
      key: "profit",
      n: 4,
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Profit Assessment",
      desc: "Score your 12 business dimensions to establish your baseline and business-health starting point.",
      href: "/assessments/profit",
      required: true,
      done: Boolean(s?.assessments.profit),
    },
  ];

  const requiredDone = steps.filter((x) => x.required && x.done).length;
  const requiredTotal = steps.filter((x) => x.required).length;

  // "Connect your tools" is the fifth required step: it's met once at least one
  // tool (calendar & email or PostStream) is connected.
  const toolStates = [Boolean(s?.integrations.calendar), Boolean(s?.integrations.poststream)];
  const toolsConnected = toolStates.filter(Boolean).length;
  const toolsDone = toolsConnected > 0;
  const stepsDone = requiredDone + (toolsDone ? 1 : 0);
  const stepsTotal = requiredTotal + 1;
  const pct = Math.round((stepsDone / stepsTotal) * 100);

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
            Connect your AI first (about five minutes), so your insights are ready the moment you finish. Then your
            three assessments, the foundation everything else is built on, and at least one of your tools.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-[#7a8a99] dark:text-[#b8c2cf]">Setup progress</span>
            <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {stepsDone} of {stepsTotal}
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
            <div
              className={`mt-3 rounded-2xl border p-4 ${
                toolsDone ? "border-green-500/30 bg-green-500/5" : "border-[#1a2b4a]/12 bg-white dark:bg-[#1a2b4a]/20"
              }`}
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="flex-shrink-0">
                  {toolsDone ? (
                    <CheckCircle2 className="w-8 h-8 text-[#2c6b3f]" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#2E7C83]/10 text-[#2E7C83] flex items-center justify-center font-semibold">
                      {requiredTotal + 1}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Plug className="w-5 h-5 text-[#2E7C83]" />
                    <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Connect your tools</h3>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#c9a227]/15 text-[#8a6a15]">Required — any one</span>
                    <span className="text-[11px] text-[#7a8a99]">{toolsConnected} of 2 connected</span>
                  </div>
                  <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf] mt-0.5">
                    Hook up your calendar &amp; email, or your social accounts, so the Suite can act for you. Connecting any one of them completes this step.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <IntegrationChip icon={<Calendar className="w-4 h-4" />} label="Calendar & Email" done={toolStates[0]} />
                <IntegrationChip icon={<Share2 className="w-4 h-4" />} label="PostStream" done={toolStates[1]} />
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
              >
                {toolsDone ? "Manage integrations" : "Connect your tools"} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Website (optional): feeds the Website Alignment Review */}
            <div className="mt-3">
              <WebsiteQuestion />
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
                    Finish setup to continue
                  </button>
                  <p className="text-xs text-[#b8a898] mt-3">
                    Connect your AI, complete your three assessments, and connect at least one tool to unlock the Suite.{" "}
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
