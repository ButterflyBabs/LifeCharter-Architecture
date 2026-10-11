import LinksDirectory from "./LinksDirectory";

export const dynamic = "force-dynamic";

// Every account: its own offers, forms, booking pages and short links in one place (Alignment & Systems).
// The data comes from /api/links-directory, which is scoped to the signed-in account.
export default function LinksDirectoryPage() {
  return <LinksDirectory />;
}
