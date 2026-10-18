import Events from "./Events";

export const dynamic = "force-dynamic";

// Clients & Sales › Events (task 1149): live events and challenges with their own sign-up pages.
export default function Page({ searchParams }: { searchParams: { id?: string } }) {
  return <Events eventId={typeof searchParams.id === "string" ? searchParams.id : null} />;
}
