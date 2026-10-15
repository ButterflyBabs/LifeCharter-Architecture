import { notFound } from "next/navigation";
import { huddleAccess } from "@/lib/teamHuddleServer";
import TeamHuddle from "./TeamHuddle";

export const dynamic = "force-dynamic";

// Team Huddle, inside the app (Alignment Architect). Babs, or anyone she shared the page with by email.
export default async function TeamHuddlePage() {
  if (!(await huddleAccess())) notFound();
  return <TeamHuddle />;
}
