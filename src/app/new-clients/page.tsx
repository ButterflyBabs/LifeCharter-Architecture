import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// New Client Accounts now lives in Campaigns & Broadcasts (tab "New Client Accounts"). This keeps old
// bookmarks and links working.
export default function NewClientsPage() {
  redirect("/sequences-manager?tab=clients");
}
