"use client";

import { useState } from "react";

const FIELD_CLASS =
  "w-full rounded-lg border border-[#F3EEE4]/20 bg-[#141826] px-3 py-2.5 text-sm text-[#F8F5F0] placeholder:text-[#b8a898]/60 focus:outline-none focus:border-[#c9a227]";
const LABEL_CLASS = "block text-xs font-medium text-[#b8a898] mb-1.5";

const REVENUE_OPTIONS = ["Under $100k", "$100k–$500k", "$500k–$1M", "$1M+"];
const TOOL_OPTIONS = ["Notion", "Asana", "HubSpot", "Slack", "QuickBooks", "Other"];
const TIMELINE_OPTIONS = ["Immediately", "Within 30 days", "Just exploring"];

interface Props {
  source: "masterclass" | "website";
  bookingUrl: string;
  defaultFullName?: string;
  defaultEmail?: string;
}

export function ScheduleQuestionnaireForm({
  source,
  bookingUrl,
  defaultFullName = "",
  defaultEmail = "",
}: Props) {
  const [fullName, setFullName] = useState(defaultFullName);
  const [email, setEmail] = useState(defaultEmail);
  const [revenueRange, setRevenueRange] = useState("");
  const [bottleneck, setBottleneck] = useState("");
  const [isDecisionMaker, setIsDecisionMaker] = useState<"yes" | "no" | "">("");
  const [tools, setTools] = useState<string[]>([]);
  const [implementationTimeline, setImplementationTimeline] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function toggleTool(tool: string) {
    setTools((prev) => (prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    if (isDecisionMaker === "") {
      setState("error");
      setErrorMsg("Please answer every question.");
      return;
    }
    if (source === "website" && (!tools.length || !implementationTimeline)) {
      setState("error");
      setErrorMsg("Please answer every question.");
      return;
    }
    setState("busy");
    setErrorMsg("");
    try {
      const res = await fetch("/api/consultation/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          fullName,
          email,
          revenueRange,
          bottleneck,
          isDecisionMaker: isDecisionMaker === "yes",
          ...(source === "website" ? { tools, implementationTimeline } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      window.location.href = bookingUrl;
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Full name *</label>
          <input required className={FIELD_CLASS} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Email *</label>
          <input required type="email" className={FIELD_CLASS} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>What is your current team size / annual revenue range? *</label>
        <select required className={FIELD_CLASS} value={revenueRange} onChange={(e) => setRevenueRange(e.target.value)}>
          <option value="" disabled>Select one&#8230;</option>
          {REVENUE_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS}>What is the #1 operational bottleneck in your business right now? *</label>
        <textarea required rows={3} className={FIELD_CLASS} value={bottleneck} onChange={(e) => setBottleneck(e.target.value)} />
      </div>

      <div>
        <label className={LABEL_CLASS}>Are you the founder or primary decision-maker? *</label>
        <div className="flex gap-3">
          {(["yes", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setIsDecisionMaker(v)}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                isDecisionMaker === v
                  ? "border-[#c9a227] bg-[#c9a227]/15 text-[#F8F5F0]"
                  : "border-[#F3EEE4]/20 text-[#b8a898] hover:border-[#c9a227]/50"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {source === "website" && (
        <>
          <div>
            <label className={LABEL_CLASS}>Which core tools are you currently running? *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TOOL_OPTIONS.map((tool) => (
                <label
                  key={tool}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                    tools.includes(tool)
                      ? "border-[#c9a227] bg-[#c9a227]/15 text-[#F8F5F0]"
                      : "border-[#F3EEE4]/20 text-[#b8a898] hover:border-[#c9a227]/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-[#c9a227]"
                    checked={tools.includes(tool)}
                    onChange={() => toggleTool(tool)}
                  />
                  {tool}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>
              If we map out a fit during our call, how soon are you looking to implement your Command Suite? *
            </label>
            <select
              required
              className={FIELD_CLASS}
              value={implementationTimeline}
              onChange={(e) => setImplementationTimeline(e.target.value)}
            >
              <option value="" disabled>Select one&#8230;</option>
              {TIMELINE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {state === "error" && <p className="text-sm text-red-300">{errorMsg}</p>}

      <button
        type="submit"
        disabled={state === "busy"}
        className="w-full rounded-lg bg-gradient-to-r from-[#D4AF63] to-[#c9a227] text-[#1a2b4a] font-semibold px-6 py-3 text-sm disabled:opacity-60"
      >
        {state === "busy" ? "Submitting…" : "Continue to scheduling"}
      </button>
    </form>
  );
}
