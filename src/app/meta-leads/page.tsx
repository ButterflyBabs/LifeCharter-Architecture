import { notFound } from "next/navigation";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { isHousePlan } from "@/lib/housePlan";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { ensureBoards } from "@/lib/dmPipeline";
import CopyField from "./CopyField";
import UploadLeads from "./UploadLeads";
import PipelinePicker from "./PipelinePicker";

export const dynamic = "force-dynamic";

// Every account: the address its Meta lead ads are sent to (through Make or Zapier), where the leads go, and the leads that have arrived.
export default async function MetaLeadsPage() {
  const db = createServerClient();
  const plan = await resolveMasterPlanId();
  if (!plan) notFound();
  // The public demo only looks; it never creates an address.
  const demo = cookies().get("lc_demo")?.value === "1";
  const house = await isHousePlan(plan, db);
  let { data: set } = await db.from("meta_lead_settings").select("secret, board_id").eq("master_plan_id", plan).maybeSingle();
  if (!set && !demo) {
    const secret = randomBytes(24).toString("hex");
    await db.from("meta_lead_settings").upsert({ master_plan_id: plan, secret }, { onConflict: "master_plan_id" });
    set = { secret, board_id: null };
  }
  const boards = house || demo ? [] : await ensureBoards(db, plan, "outreach");
  const { data: leads } = await db.from("meta_leads").select("id, email, name, ad_name, status, detail, created_at").eq("master_plan_id", plan).order("created_at", { ascending: false }).limit(30);
  const url = `https://lccommandsuite.com/api/meta-leads?k=${(set?.secret as string) ?? "(your private address appears here once you sign in)"}`;
  const day = (s: string) => new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Denver" });
  return (
    <div className="py-8 px-4 sm:px-6 max-w-[1100px] mx-auto">
      <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Meta Lead Ads</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#5a6472] dark:text-[#b8c2cf]">
        Each person who fills in one of your Facebook or Instagram lead forms is sent to the private address below. The Suite saves them as a contact tagged lead-meta-ad and the ad&apos;s own tag{house ? ", registers them on the MasterClass Zoom meeting and puts a card in Registered on the MasterClass Pipeline" : ", and adds a card to the pipeline you choose"}. Keep the address private: anyone who has it can add contacts to your account.
      </p>
      <h2 className="mt-6 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Your address</h2>
      <CopyField value={url} />
      {!house && (
        <>
          <h2 className="mt-6 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Add new leads to this pipeline</h2>
          <PipelinePicker boards={boards} current={(set?.board_id as string) ?? null} />
        </>
      )}
      <h2 className="mt-8 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Set it up in Make (about 20 minutes, free)</h2>
      <p className="mt-1 max-w-2xl text-sm text-[#5a6472] dark:text-[#b8c2cf]">
        Make is a free tool that watches your lead form and passes each new lead to the Suite the moment it arrives. Use your own Make account. You need to be an admin of the Facebook Page the ads run from.
      </p>
      <ol className="mt-3 max-w-2xl list-decimal space-y-3 pl-5 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
        <li>Create a free account at <a className="underline" href="https://www.make.com" target="_blank" rel="noreferrer">make.com</a> and choose <b>Create a new scenario</b>.</li>
        <li>Click the big <b>+</b>, search <b>Facebook Lead Ads</b> and pick <b>New Lead</b> (the instant one). Click <b>Add</b> to connect your Facebook account, allow every permission it asks for, then choose your <b>Page</b> and your <b>lead form</b>. Click OK.</li>
        <li>Click the small <b>+</b> on the right of that circle, search <b>HTTP</b> and pick <b>Make a request</b>.</li>
        <li>In <b>URL</b>, paste your address from above. Set <b>Method</b> to <b>POST</b> and <b>Body type</b> to <b>Application/x-www-form-urlencoded</b>.</li>
        <li>Under <b>Fields</b> click <b>Add item</b> three times. Type each name exactly: <b>email</b>, <b>full_name</b> and <b>ad_name</b>. For each <b>Value</b>, click inside the box and choose the matching item from the list that opens: Email, Full name and Ad name. Each must appear as a small coloured tag, not plain typed words. Any other question on your form can be added the same way, with a name of your choice. It shows on the person&apos;s card.</li>
        <li>Click <b>Save</b>, then <b>Run once</b>. In Meta&apos;s <a className="underline" href="https://developers.facebook.com/tools/lead-ads-testing" target="_blank" rel="noreferrer">Lead Ads Testing Tool</a> choose your Page and form and click <b>Create lead</b> (delete an old test lead first). Make turns both circles green. Meta&apos;s test leads are logged below with the status <b>test</b> and are never added to your contacts, so you can test as often as you like.</li>
        <li>Turn the scenario on with the switch at the bottom left, so it reads <b>Active</b>. From then on every real lead appears in Latest leads below within seconds.</li>
      </ol>
      <p className="mt-3 max-w-2xl text-sm text-[#5a6472] dark:text-[#b8c2cf]">
        If Make is ever down, open Meta&apos;s Leads Center, download your leads as a file and use the box below. Zapier works the same way if you prefer it: Facebook Lead Ads trigger, then Webhooks by Zapier, POST, to the same address.
      </p>
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
