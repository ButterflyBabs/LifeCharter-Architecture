import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/authz";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// "Delete my account" (App Store Guideline 5.1.1(v)). For a Collective member
// this permanently deletes their login and everything tied to it — profile,
// posts, replies, messages, journal, uploads — and cancels any Plus
// subscription. Accounts that also run a Command Suite business (or admins)
// can't be removed with one tap: the request goes to the LifeCharter team.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { confirm } = await request.json().catch(() => ({}));
  if (confirm !== "DELETE") return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });

  const supabase = createServerClient();
  const [{ data: admin }, { data: suite }, { data: owns }] = await Promise.all([
    supabase.from("cm_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("id").eq("id", user.id).maybeSingle(),
    supabase.from("workspaces").select("id").eq("owner_id", user.id).limit(1),
  ]);

  if (admin || suite || (owns && owns.length)) {
    // Hand it to the team (business records, invoices and client data need care).
    const { data: me } = await supabase.from("cm_profiles").select("display_name").eq("user_id", user.id).maybeSingle();
    const { data: admins } = await supabase.from("cm_admins").select("user_id");
    await supabase.from("cm_notifications").insert(
      ((admins as { user_id: string }[]) ?? [])
        .filter((a) => a.user_id !== user.id)
        .map((a) => ({
          user_id: a.user_id,
          kind: "account_deletion",
          title: "Account deletion requested",
          body: `${me?.display_name ?? user.email} (${user.email}) asked to delete their LifeCharter account, which includes Command Suite.`,
          href: `/community/members/${user.id}`,
        }))
    );
    return NextResponse.json({ requested: true });
  }

  // Cancel Plus now so they're never billed again.
  const { data: plus } = await supabase.from("cm_plus_subscriptions").select("stripe_subscription_id, status").eq("user_id", user.id).maybeSingle();
  if (plus?.stripe_subscription_id && stripe && ["active", "trialing", "past_due"].includes(String(plus.status))) {
    try {
      await stripe.subscriptions.cancel(plus.stripe_subscription_id as string);
    } catch (e) {
      console.error("account delete: cancel plus", e);
      return NextResponse.json({ error: "We couldn't cancel your Plus subscription — please try again, or contact us." }, { status: 502 });
    }
  }

  // Their uploads (photos, attachments) live in their own storage folder.
  try {
    const bucket = supabase.storage.from("community");
    for (let page = 0; page < 20; page++) {
      const { data: files } = await bucket.list(user.id, { limit: 100 });
      if (!files?.length) break;
      await bucket.remove(files.map((f) => `${user.id}/${f.name}`));
      if (files.length < 100) break;
    }
  } catch (e) {
    console.error("account delete: storage", e);
  }

  if (user.email) await supabase.from("cm_invite_requests").delete().eq("email", user.email.toLowerCase());

  // Deleting the login removes everything linked to it (profile, posts,
  // replies, reactions, messages, journal, notifications…).
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("account delete:", error.message);
    return NextResponse.json({ error: "We couldn't delete your account — please try again, or contact us." }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
