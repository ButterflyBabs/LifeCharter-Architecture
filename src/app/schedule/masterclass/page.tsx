import type { Metadata } from "next";
import { Suspense } from "react";
import { MasterclassScheduleClient } from "./MasterclassScheduleClient";

export const metadata: Metadata = {
  title: "Schedule Your Executive Consultation — LifeCharter Command Suite",
  description: "Three quick questions, then pick a time with Marcello.",
};

// Wrapped in Suspense because MasterclassScheduleClient reads query params
// (?email=&name=, carried by the personalized follow-up email link) via
// useSearchParams() — force-dynamic alone does not satisfy Next's
// prerendering requirement for that hook, confirmed the hard way elsewhere
// in this app (see get-started/success/page.tsx).
export default function ScheduleMasterclassPage() {
  return (
    <Suspense fallback={null}>
      <MasterclassScheduleClient />
    </Suspense>
  );
}
