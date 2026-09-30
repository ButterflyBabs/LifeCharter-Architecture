import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { isHousePlan } from "@/lib/housePlan";
import { affiliateReport } from "@/lib/affiliates";
import ReportView, { monthLabel } from "@/components/affiliates/ReportView";
import CopyLink from "./CopyLink";

export const dynamic = "force-dynamic";
export const metadata = { title: "Affiliate dashboard", robots: { index: false, follow: false } };

// An affiliate's private dashboard (for affiliates without a Suite login; those with
// one see the same report inside the app under Affiliates → My partnerships). The
// unguessable token in the address is the key. Month by month, with a CSV download.
const shift = (m: string, by: number) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + by, 1));
  return d.toISOString().slice(0, 7);
};

export default async function AffiliatePortal({ params, searchParams }: { params: { token: string }; searchParams: { month?: string } }) {
  if (!/^[0-9a-f]{20,64}$/i.test(params.token)) notFound();
  const db = createServerClient();
  const { data: aff } = await db.from("affiliates").select("id, master_plan_id, name, code, status").eq("portal_token", params.token).maybeSingle();
  if (!aff) notFound();
  const house = await isHousePlan(aff.master_plan_id as string);
  const { data: ws } = house ? { data: null } : await db.from("workspaces").select("name").eq("master_plan_id", aff.master_plan_id).order("is_default", { ascending: false }).limit(1).maybeSingle();
  const business = house ? "LifeCharter" : (ws?.name as string) || "Your partner";
  const thisMonth = new Date().toISOString().slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(searchParams.month || "") && (searchParams.month as string) <= thisMonth ? (searchParams.month as string) : thisMonth;
  const r = await affiliateReport(db, aff.id as string, month);
  if (!r) notFound();
  const link = `https://lccommandsuite.com/r/${aff.code}`;
  const btn = "rounded-full border border-[#EADFCF] bg-white px-3 py-1.5 text-sm text-[#1F3A3D] hover:bg-[#FBF8F1]";

  return (
    <main className="min-h-screen bg-[#FBF8F1] px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C76F56]">{business} affiliate</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#1F3A3D]">Welcome, {(aff.name as string).split(/\s+/)[0]}</h1>
          {aff.status !== "active" && <p className="mt-2 rounded-lg bg-[#c9a227]/15 px-3 py-2 text-sm text-[#6b5410]">Your link is paused right now.</p>}
        </header>

        <section className="rounded-2xl border border-[#EADFCF] bg-white p-5">
          <p className="text-sm font-semibold text-[#1F3A3D]">Your link</p>
          <CopyLink link={link} />
          <p className="mt-2 text-xs text-[#7a8a99]">Share it anywhere. Anyone who signs up or books within 60 days of clicking is credited to you.</p>
        </section>

        <section className="rounded-2xl border border-[#EADFCF] bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[#1F3A3D]">{monthLabel(month)} report</h2>
            <div className="flex flex-wrap gap-2">
              <a className={btn} href={`/a/${params.token}?month=${shift(month, -1)}`}>← {monthLabel(shift(month, -1)).split(" ")[0]}</a>
              {month < thisMonth && <a className={btn} href={`/a/${params.token}?month=${shift(month, 1)}`}>{monthLabel(shift(month, 1)).split(" ")[0]} →</a>}
              <a className="rounded-full bg-[#2E7C83] px-4 py-1.5 text-sm font-semibold text-white" href={`/a/${params.token}/report?month=${month}`}>Download report (CSV)</a>
            </div>
          </div>
          <ReportView r={r} />
        </section>
        <p className="text-center text-xs text-[#7a8a99]">This page is private to you. Please don&rsquo;t share its address.</p>
      </div>
    </main>
  );
}
