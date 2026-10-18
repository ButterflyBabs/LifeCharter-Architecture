import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "@/app/api/crm/guard";
import { cleanContent } from "@/lib/landingPages";
import { PAGE_COLUMNS, publicPage, type PageRow } from "@/lib/landingServer";
import LandingView from "@/components/landing/LandingView";

export const dynamic = "force-dynamic";

// A landing page (task 1153): lccommandsuite.com/go/<slug>, and <their own domain>/<slug> (middleware rewrites it
// here). Published pages only; the owner sees a draft with ?preview=1 while signed in.
async function load(slug: string, preview: boolean): Promise<{ row: PageRow; preview: boolean } | null> {
  const db = createServerClient();
  const { data } = await db.from("landing_pages").select(PAGE_COLUMNS).eq("slug", slug.toLowerCase()).maybeSingle();
  const row = data as PageRow | null;
  if (!row) return null;
  if (row.status === "published" && !preview) return { row, preview: false };
  if (!preview || row.status === "archived") return row.status === "published" ? { row, preview: false } : null;
  const a = await crmAccount().catch(() => null);
  if (!a || "denied" in a || a.planId !== row.master_plan_id) return row.status === "published" ? { row, preview: false } : null;
  return { row, preview: true };
}

export async function generateMetadata({ params, searchParams }: { params: { slug: string }; searchParams: { preview?: string } }): Promise<Metadata> {
  const got = await load(params.slug, searchParams.preview === "1");
  if (!got) return { title: "Not found", robots: { index: false } };
  const c = cleanContent(got.row.content, got.row.template);
  return { title: c.headline || got.row.name, description: c.subheadline || undefined, robots: got.preview ? { index: false, follow: false } : undefined, openGraph: { title: c.headline, description: c.subheadline || undefined } };
}

export default async function Page({ params, searchParams }: { params: { slug: string }; searchParams: { preview?: string } }) {
  const got = await load(params.slug, searchParams.preview === "1");
  if (!got) notFound();
  const page = await publicPage(createServerClient(), got.row);
  return (
    <>
      {got.preview && (
        <div className="sticky top-0 z-10 bg-[#1F2B3A] px-4 py-2 text-center text-sm text-white">
          Preview{got.row.status !== "published" ? " (not published yet)" : ""}. Visits and sign-ups aren&apos;t counted here.{page.missing ? ` Still to do: ${page.missing}` : ""}
        </div>
      )}
      <LandingView page={page} preview={got.preview} />
    </>
  );
}
