import RemindersPage from "./RemindersPage";

export const dynamic = "force-dynamic";

// Reminders: one-off things the client types in (a trial that renews, a deadline), separate from Tasks.
export default function Page() {
  return <RemindersPage />;
}
