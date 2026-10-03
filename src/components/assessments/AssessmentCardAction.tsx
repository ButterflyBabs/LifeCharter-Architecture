"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAssessmentStatus } from "@/lib/hooks/useAssessmentStatus";

// The button at the bottom of an assessment card: "Start Assessment" until it is done,
// then a Complete mark and "Review your answers".
export default function AssessmentCardAction({ id }: { id: "brain" | "soul" | "profit" }) {
  const status = useAssessmentStatus();
  const done = Boolean(status?.[id]);

  return (
    <div className="mt-auto pt-4">
      {done && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-green-600/10 px-3 py-1 text-sm font-semibold text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" /> Complete
        </p>
      )}
      <Link href={`/assessments/${id}`} className="block">
        <Button variant={done ? "secondary" : "primary"} className="w-full">
          {done ? "Review your answers" : "Start Assessment"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
}
