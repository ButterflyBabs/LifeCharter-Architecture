"use client";

import Link from "next/link";
import { ArrowRight, Brain, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAssessmentStatus } from "@/lib/hooks/useAssessmentStatus";

const ITEMS = [
  { id: "brain", label: "Brain", href: "/assessments/brain" },
  { id: "soul", label: "Soul", href: "/assessments/soul" },
  { id: "profit", label: "Profit", href: "/assessments/profit" },
] as const;

// The "full assessment" card at the foot of the Assessments page. It reflects what this
// account has already finished and what is still outstanding, and points at the next one.
export default function FullAssessmentCard() {
  const status = useAssessmentStatus();
  const left = status ? ITEMS.filter((i) => !status[i.id]) : ITEMS.slice();
  const done = status ? left.length === 0 : false;
  const next = left[0];
  const finished = status ? ITEMS.length - left.length : 0;

  const title = done ? "Your full assessment is complete" : status && finished > 0 ? `Finish your full assessment: ${left.length} ${left.length === 1 ? "assessment" : "assessments"} to go` : "Complete the Full Assessment";
  const text = done
    ? "All three assessments are in, so your Business Health Score, your three next moves, your Growth Roadmap and your Alignment Profile are built from your own answers. Review any assessment above, or take a Quick Pulse check-in to track your progress."
    : status && finished > 0
    ? "Each one you finish sharpens your Business Health Score, your next moves, your Growth Roadmap and your Alignment Profile. Here is where you stand."
    : "Take all three assessments to get your complete Business Health Score, your three next moves, a 90-day Growth Roadmap and a written portrait of you and your business.";

  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-[#4a9b9b]/30 bg-white p-8 dark:bg-[#1a2b4a]/40">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#4a9b9b]/20">
            {done ? <CheckCircle2 className="h-8 w-8 text-green-600" /> : <Brain className="h-8 w-8 text-[#4a9b9b]" />}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="mb-2 text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{title}</h2>
            <p className="text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70">{text}</p>
            {status && (
              <ul className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                {ITEMS.map((i) => (
                  <li key={i.id} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${status[i.id] ? "bg-green-600/10 text-green-700 dark:text-green-400" : "bg-[#1a2b4a]/8 text-[#5a6472] dark:text-[#b8c2cf]"}`}>
                    {status[i.id] ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />} {i.label}{status[i.id] ? " complete" : " to do"}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {done ? (
              <Link href="/business-alignment">
                <Button variant="primary" size="lg">
                  See your Growth Roadmap
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href={(next ?? ITEMS[0]).href}>
                <Button variant="primary" size="lg">
                  {status && finished > 0 ? `Continue with ${(next ?? ITEMS[0]).label}` : "Start with Brain"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
