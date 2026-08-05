import ExecutiveHome from "@/components/executive/ExecutiveHome";
import SetupGate from "@/components/SetupGate";

// Phase 1 (exec-into-architecture merge): the Executive Dashboard is now the
// default landing experience. The former alignment dashboard lives at
// /business-alignment (and remains at /dashboard for backward-compatible links).
export default function Home() {
  return (
    <>
      <SetupGate />
      <ExecutiveHome />
    </>
  );
}
