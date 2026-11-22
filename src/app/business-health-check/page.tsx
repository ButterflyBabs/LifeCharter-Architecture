import type { Metadata } from "next";
import HealthCheckApp from "./HealthCheckApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "The Business Health Check: a free 5-minute scorecard",
  description: "25 questions across six areas of your business. Your personal scorecard, advisor notes and action plan the moment you finish. From AmiLynne 'Babs' Carroll, Alignment Architect.",
};

// The free lead magnet. Public: no sign-in. See src/lib/healthCheck.ts.
export default function BusinessHealthCheckPage() {
  return <HealthCheckApp />;
}
