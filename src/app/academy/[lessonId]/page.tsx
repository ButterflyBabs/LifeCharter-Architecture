import { notFound } from "next/navigation";
import { academyLearner } from "@/lib/academy/server";
import AcademyLesson from "./AcademyLesson";

export const dynamic = "force-dynamic";

export default async function AcademyLessonPage({ params, searchParams }: { params: { lessonId: string }; searchParams: { track?: string } }) {
  if (!(await academyLearner(searchParams.track))) notFound();
  return <AcademyLesson id={params.lessonId} track={searchParams.track ?? "client"} />;
}
