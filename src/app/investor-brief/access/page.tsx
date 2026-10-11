import type { Metadata } from "next";
import AccessGate from "./AccessGate";

export const metadata: Metadata = {
  title: "Investor Brief | LifeCharter Command Suite",
  robots: { index: false, follow: false, nocache: true },
};

export default function InvestorAccessGatePage() {
  return <AccessGate />;
}
