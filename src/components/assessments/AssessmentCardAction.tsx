"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Status = { brain: boolean; soul: boolean; profit: boolean } | null;
let pending: Promise<Status> | null = null;

// One status request shared by the three cards on the Assessments page.
function loadStatus(): Promise<Status> {
  if (!pending) {
    pending = fetch("/api/setup/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => (s?.assessments ? { brain: !!s.assessments.brain, soul: !!s.assessments.soul, profit: !!s.assessments.profit } : null))
      .catch(() => null);
    // Forget the answer after a moment so coming back to the page shows fresh progress.
    setTimeout(() => {
      pending = null;
    }, 5000);
  }
  return pending;
}

// The button at the bottom of an assessment card: "Start Assessment" until it is done,
// then a Complete mark and "Review your answers".
export default function AssessmentCardAction({ id }: { id: "brain" | "soul" | "profit" }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    let live = true;
    void loadStatus().then((s) => {
      if (live && s) setDone(s[id]);
    });
    return () => {
      live = false;
    };
  }, [id]);

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
