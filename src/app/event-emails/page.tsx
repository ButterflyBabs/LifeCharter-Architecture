import { redirect } from "next/navigation";

// The event emails moved into Campaigns & Broadcasts (2026-10-05). Old links land on their tab there.
export default function EventEmailsPage() {
  redirect("/sequences-manager?tab=events");
}
