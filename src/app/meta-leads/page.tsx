import { notFound } from "next/navigation";
import { randomBytes } from "crypto";
import { isAlignmentArchitect } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";
import { ownerMasterPlanId } from "@/lib/housePlan";
import CopyField from "./CopyField";
import UploadLeads from "./UploadLeads";

export const dynamic = "force-dynamic";

// Alignment Architect only: the address Meta lead ads are sent to, and the leads that have arrived.
export default async function MetaLeadsPage() {
  if (!(await isAlignmentArchitect())) notFound();
  const db = createServerClient();
  const plan = await ownerMasterPlanId();
  if (!plan) notFound();
  let { data: set } = await db.from("meta_lead_settings").select("secret").eq("master_plan_id", plan).maybeSingle();
  if (!set) {
    const secret = randomBytes(24).toString("hex");
    await db.from("meta_lead_settings").upsert({ master_plan_id: plan, secret }, { onConflict: "master_plan_id" });
    set = { secret };
  }
  const { data: leads } = await db.from("meta_leads").select("id, email, name, ad_name, status, detail, created_at").eq("master_plan_id", plan).order("created_at", { ascending: false }).limit(30);
  const url = `https://lccommandsuite.com/api/meta-leads?k=${set.secret as string}`;
  const day = (s: string) => new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Denver" });
  return (
    <div className="py-8 px-4 sm:px-6 max-w-[1100px] mx-auto">
      <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Meta Lead Ads</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#5a6472] dark:text-[#b8c2cf]">
        Each person who fills in a Meta lead form is sent to the address below. The Suite registers them on the MasterClass Zoom meeting, saves them as a contact tagged lead-meta-ad, and puts a card in Registered on the MasterClass Pipeline. Keep the address private: anyone who has it can add registrants.
      </p>
      <h2 className="mt-6 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Address for Make or Zapier</h2>
      <CopyField value={url} />
      <h2 className="mt-8 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Upload leads from a file</h2>
      <UploadLeads address={url} />
      <h2 className="mt-8 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Latest leads</h2>
      {!leads?.length ? (
        <p className="mt-2 text-sm text-[#7a8a99]">None yet. They appear here as soon as a lead form is submitted.</p>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="text-left text-xs text-[#7a8a99]"><th className="p-3">When (Mountain)</th><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Ad</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id as string} className="border-t border-[#1a2b4a]/10">
                  <td className="p-3 whitespace-nowrap">{day(l.created_at as string)}</td>
                  <td className="p-3">{(l.name as string) || ""}</td>
                  <td className="p-3">{(l.email as string) || ""}</td>
                  <td className="p-3">{(l.ad_name as string) || ""}</td>
                  <td className={`p-3 ${l.status === "failed" ? "text-[#A4523C] font-medium" : ""}`}>{l.status as string}{l.detail ? `: ${l.detail as string}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
