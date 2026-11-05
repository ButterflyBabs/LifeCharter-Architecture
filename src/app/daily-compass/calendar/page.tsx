import { redirect } from "next/navigation";
import { fledgeForMe, FLEDGE_URL } from "@/lib/fledge";
import PlannerCalendar from "./PlannerCalendar";

export const dynamic = "force-dynamic";

// The Content Calendar. For Babs alone it is now LC Fledge: this page sends her there (the calendar, or the
// composer when she came in through "Create content"). Every other account sees the Suite's own Content
// Calendar exactly as before. ?planner=1 opens the old Suite planner for her (her plan, goals and the posts
// planned there are untouched).
export default async function ContentCalendarRoute({ searchParams }: { searchParams: { new?: string; planner?: string } }) {
  if (searchParams.planner !== "1" && (await fledgeForMe())) {
    redirect(searchParams.new ? `${FLEDGE_URL}/create` : `${FLEDGE_URL}/calendar`);
  }
  return <PlannerCalendar />;
}
