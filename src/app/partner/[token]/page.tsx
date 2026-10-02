import { notFound } from "next/navigation";
import AccountabilityWorkspace from "@/components/accountability/AccountabilityWorkspace";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your accountability page", robots: { index: false, follow: false } };

// An outside accountability partner's private page (no login). The unguessable token
// in the address is the key; they see only what their partner shared in this one
// partnership, and can add their own commitments, notes and encouragement.
export default function PartnerPortal({ params }: { params: { token: string } }) {
  if (!/^[0-9a-f]{20,64}$/i.test(params.token)) notFound();
  return (
    <main className="min-h-screen bg-[#FBF8F1] px-4 py-10 dark:bg-[#12182b]">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8923F]">LifeCharter Command Suite</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Your accountability page</h1>
          <p className="mt-1 text-sm text-[#7a8a99]">Private to you. Bookmark this page: the link is the only way in.</p>
        </header>
        <AccountabilityWorkspace mode="portal" getUrl={`/api/partner/${params.token}`} postUrl={`/api/partner/${params.token}`} />
      </div>
    </main>
  );
}
