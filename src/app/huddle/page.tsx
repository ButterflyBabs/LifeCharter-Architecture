import { notFound } from "next/navigation";
import { huddleAccess } from "@/lib/teamHuddleServer";
import TeamHuddle from "../team-huddle/TeamHuddle";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team Huddle | LifeCharter" };

// The same Team Huddle on its own, without the app menu: this is the link for Marcello, Sumbal and anyone
// else Babs shares it with. They must be signed in with the email she added.
export default async function HuddleSharePage() {
  if (!(await huddleAccess())) notFound();
  return <TeamHuddle bare />;
}
