import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import CalendarsManager from "./CalendarsManager";

export const dynamic = "force-dynamic";

// Booking links: calendars, hosts and their connected calendars, and bookings.
export default async function CalendarsPage() {
  if (!(await isAlignmentArchitect())) notFound();
  return <CalendarsManager />;
}
