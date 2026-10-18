import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { yearReview } from "@/lib/yearReview";
import YearReviewView from "@/components/yearReview/YearReviewView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Year in review", robots: { index: false, follow: false } };

// A shared year in review (task 1155): the private link is the key; money only when the owner turned it on.
export default async function Page({ params }: { params: { token: string } }) {
  const db = createServerClient();
  const { data } = await db.from("year_review_links").select("master_plan_id, year, show_money").eq("token", params.token).maybeSingle();
  if (!data) notFound();
  const r = await yearReview(db, data.master_plan_id as string, Number(data.year), { money: Boolean(data.show_money) });
  return (
    <main className="min-h-screen bg-[#FBF8F2]">
      <div className="h-1.5 bg-[#2E7C83]" />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <YearReviewView r={r} />
        <footer className="pt-8 text-center text-xs text-[#9aa3ad]">Made with LifeCharter Command Suite.</footer>
      </div>
    </main>
  );
}
