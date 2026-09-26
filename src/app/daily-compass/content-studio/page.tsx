import { redirect } from "next/navigation";

// Create Content now lives on the Content Calendar — one place to plan, write,
// schedule and publish. Old links and bookmarks land there with the composer open.
export default function CreateContentRedirect() {
  redirect("/daily-compass/calendar?new=1");
}
