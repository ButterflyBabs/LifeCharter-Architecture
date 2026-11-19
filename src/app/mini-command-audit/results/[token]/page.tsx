import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { cleanAnswers, computeResult } from "@/lib/miniAudit";
import AuditApp from "../../AuditApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Mini Command Audit results", robots: { index: false, follow: false } };

// A person's saved results. The unguessable link in their email is the key.
export default async function ResultsPage({ params }: { params: { token: string } }) {
  const db = createServerClient();
  const { data } = await db.from("mini_audit_runs").select("first_name, answers, depth").eq("token", params.token.slice(0, 60)).maybeSingle();
  if (!data) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">We couldn&apos;t find those results</h1>
        <p className="mt-3 text-[#5a6472] dark:text-[#b8c2cf]">The link may be incomplete. Open it again from your email, or take the Mini Command Audit again.</p>
        <a href="/mini-command-audit" className="mt-6 inline-block rounded-xl bg-[#1a2b4a] px-6 py-3 font-semibold text-[#F8F5F0]">Take the Mini Command Audit</a>
      </main>
    );
  }
  const depth = data.depth === "full" ? "full" : "quick";
  const answers = cleanAnswers(data.answers);
  return <AuditApp saved={{ token: params.token.slice(0, 60), firstName: data.first_name as string, answers, depth, result: computeResult(answers, depth) }} />;
}
