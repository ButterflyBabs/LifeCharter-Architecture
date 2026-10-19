import { notFound } from "next/navigation";
import { isAlignmentArchitect } from "@/lib/authz";
import { BANK_FEEDS_OPEN_TO_ALL } from "@/lib/bankFeedsFlag";
import BankFeeds from "./BankFeeds";

export const dynamic = "force-dynamic";

// Finance › Bank & card feeds (task 1150 part 2): link a bank or card once; new transactions wait here for you to approve.
// Babs only until BANK_FEEDS_OPEN_TO_ALL is switched on.
export default async function Page() {
  if (!BANK_FEEDS_OPEN_TO_ALL && !(await isAlignmentArchitect())) notFound();
  return <BankFeeds />;
}
