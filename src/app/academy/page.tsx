import { notFound } from "next/navigation";
import { academyLearner } from "@/lib/academy/server";
import AcademyHome from "./AcademyHome";

export const dynamic = "force-dynamic";

// Getting Started › LCCS Academy: training from zero to expert, for team members and clients.
export default async function AcademyPage() {
  if (!(await academyLearner())) notFound();
  return <AcademyHome />;
}
