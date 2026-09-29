import { notFound } from "next/navigation";
import { canUseSpark } from "@/lib/spark/guard";
import LcSparkManager from "./LcSparkManager";

export const dynamic = "force-dynamic";

// LC Spark: the AI assistant that answers leads on the account's websites and Instagram.
// Alignment Architect only for now (see src/lib/spark/guard.ts).
export default async function LcSparkPage() {
  if (!(await canUseSpark())) notFound();
  return <LcSparkManager />;
}
