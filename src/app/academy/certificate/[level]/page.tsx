import { notFound } from "next/navigation";
import { academyLearner } from "@/lib/academy/server";
import AcademyCertificate from "./AcademyCertificate";

export const dynamic = "force-dynamic";

export default async function AcademyCertificatePage({ params, searchParams }: { params: { level: string }; searchParams: { track?: string } }) {
  if (!(await academyLearner(searchParams.track))) notFound();
  return <AcademyCertificate level={params.level} track={searchParams.track ?? "client"} />;
}
